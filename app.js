/**
 * Wanderlust — Express + MongoDB application entry point.
 *
 * Deployment notes
 *  - Configuration is read from the real process environment first and then from a
 *    local .env file. The .env file is loaded in EVERY environment (production
 *    included) so a stale NODE_ENV can never leave the app without credentials.
 *  - The HTTP server only starts once MongoDB is reachable, so a broken database
 *    connection fails the deploy instead of booting a server that answers 500s.
 *  - The listening port comes from process.env.PORT (injected by Render, Railway,
 *    Heroku, Fly, ...) and falls back to 8080 only for local development.
 */

const path = require('path');

// The .env path is resolved from this file (not the cwd) so the app finds its
// configuration no matter which directory the host starts it from.
require('dotenv').config({
    quiet: true,
    path: process.env.DOTENV_CONFIG_PATH || path.join(__dirname, '.env')
});

const express = require('express');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const { MongoClient } = require('mongodb');
const MongoStore = require('connect-mongo').default;
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');

const ExpressError = require('./utils/ExpressError');
const User = require('./models/user.js');

const listingRouter = require('./routes/listing.js');
const reviewRouter = require('./routes/review.js');
const userRouter = require('./routes/user.js');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

/* -------------------------------------------------------------------------- *
 * Configuration
 * -------------------------------------------------------------------------- */

const REQUIRED_ENV = ['ATLASDB_URL', 'SECRET'];

// ATLASDB_URL is the documented name; MONGODB_URI is accepted as an alias.
const dbUrl = process.env.ATLASDB_URL || process.env.MONGODB_URI;
const sessionSecret = process.env.SECRET;
const PORT = Number.parseInt(process.env.PORT, 10) || 8080;

function validateConfig() {
    if (dbUrl) {
        process.env.ATLASDB_URL = dbUrl;
    }

    const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
    if (missing.length) {
        throw new Error(
            `Missing required environment variable(s): ${missing.join(', ')}.\n` +
            '  Add them to your hosting provider\'s environment/dashboard (or a local .env file).\n' +
            '  Required: ATLASDB_URL (MongoDB connection string), SECRET (session secret).\n' +
            '  See .env.example for the full list.'
        );
    }

    if (/<password>|\[[^\]]*\]/.test(dbUrl)) {
        throw new Error(
            'ATLASDB_URL still contains a placeholder (e.g. <password> or [user]). ' +
            'Replace it with the real MongoDB connection string.'
        );
    }

    // Cloudinary is validated (with a warning) in cloudConfig.js.
}

try {
    validateConfig();
} catch (err) {
    console.error(`\n[configuration error] ${err.message}\n`);
    process.exit(1);
}

/* -------------------------------------------------------------------------- *
 * View engine & middleware
 * -------------------------------------------------------------------------- */

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', ejsMate);

// Behind Render/Railway/Heroku the app sits behind a TLS proxy. Trusting the
// first proxy hop makes secure cookies and req.protocol work correctly.
if (isProduction) {
    app.set('trust proxy', 1);
}

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

/* -------------------------------------------------------------------------- *
 * Sessions
 * -------------------------------------------------------------------------- */

// connect-mongo is given an explicit, owned MongoClient instead of a bare URL.
// When it opens its own client and the connection fails, the rejection is
// unhandled and takes the whole process down with a raw driver stack trace;
// owning the client lets us surface a single readable error instead.
const sessionClient = new MongoClient(dbUrl, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000
});
const sessionClientPromise = sessionClient.connect();
// The rejection is handled in start() where it is turned into a readable error;
// this no-op keeps Node from reporting it as an unhandled rejection first.
sessionClientPromise.catch(() => {});

const store = MongoStore.create({
    clientPromise: sessionClientPromise,
    dbName: sessionClient.options?.dbName || 'wanderlust',
    crypto: {
        secret: sessionSecret
    },
    touchAfter: 24 * 3600,
    autoRemove: 'native'
});

store.on('error', (err) => {
    console.error('[session store error]', err.message || err);
});

// connect-mongo derives an internal collection promise from that client and
// leaves its rejection unattended until the first session write, which Node
// reports as an unhandled rejection. Attach a handler so start() stays in
// control of reporting the failure.
if (store.collectionP && typeof store.collectionP.catch === 'function') {
    store.collectionP.catch(() => {});
}

const sessionOptions = {
    name: 'wanderlust.sid',
    store,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    proxy: isProduction,
    cookie: {
        // maxAge is enough: "expires" would be fixed at boot time and every
        // session created later would inherit that stale absolute timestamp.
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction
    }
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currUser = req.user;
    next();
});

/* -------------------------------------------------------------------------- *
 * Health check (used by hosting platforms and uptime monitors)
 * -------------------------------------------------------------------------- */

const DB_STATES = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

app.get('/healthz', (req, res) => {
    const state = mongoose.connection.readyState;
    const healthy = state === 1;
    res.status(healthy ? 200 : 503).json({
        status: healthy ? 'ok' : 'degraded',
        db: DB_STATES[state] || String(state),
        uptime: Math.round(process.uptime())
    });
});

/* -------------------------------------------------------------------------- *
 * Routes
 * -------------------------------------------------------------------------- */

app.use('/', userRouter);
app.use('/:id/reviews', reviewRouter);
app.use('/', listingRouter);

app.all('/*splat', (req, res, next) => {
    next(new ExpressError(404, 'Page Not Found'));
});

app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    let statusCode = err.statusCode || (err.name === 'MulterError' ? 400 : 500);
    if (!Number.isInteger(statusCode) || statusCode < 400 || statusCode > 599) {
        statusCode = 500;
    }

    // Never leak internals (stack traces, credentials in error messages) to
    // visitors in production; log the full error server-side instead.
    let message = err.message || 'Something went wrong';
    if (statusCode >= 500) {
        console.error('[request error]', err);
        if (isProduction) {
            message = 'Something went wrong!';
        }
    }

    res.locals.currUser = req.user || null;
    res.locals.success = typeof req.flash === 'function' ? req.flash('success') : [];
    res.locals.error = typeof req.flash === 'function' ? req.flash('error') : [];

    res.status(statusCode).render('error.ejs', { message }, (renderErr, html) => {
        if (renderErr) {
            console.error('[render error]', renderErr);
            return res.type('text/plain').send(`${statusCode} - ${message}`);
        }
        res.send(html);
    });
});

/* -------------------------------------------------------------------------- *
 * Startup / shutdown
 * -------------------------------------------------------------------------- */

async function connectDB() {
    mongoose.set('strictQuery', true);
    // TLS certificates are validated normally. (No tlsAllowInvalidCertificates:
    // MongoDB Atlas serves valid certificates and disabling verification is a
    // security risk.)
    await mongoose.connect(dbUrl, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000
    });
    console.log('Connected to MongoDB (mongoose)');

    // The session store owns a separate client; make sure it is connected too
    // before accepting traffic, otherwise logins would silently fail.
    await sessionClientPromise;
    console.log('Connected to MongoDB (session store)');
}

let server;

function registerShutdownHandlers() {
    const shutdown = (signal) => {
        console.log(`${signal} received — shutting down gracefully...`);
        if (!server) {
            process.exit(0);
        }
        server.close(async () => {
            try {
                await mongoose.connection.close(false);
            } catch (err) {
                // already closed / never connected — nothing to do
            }
            try {
                // Close the session-store client only if it ever connected.
                if (sessionClient.topology && sessionClient.topology.isConnected()) {
                    await sessionClient.close();
                }
            } catch (err) {
                // ignore
            }
            process.exit(0);
        });
        // Don't hang forever on stuck connections.
        setTimeout(() => process.exit(0), 10000).unref();
    };

    ['SIGTERM', 'SIGINT'].forEach((signal) => process.once(signal, () => shutdown(signal)));
}

async function start() {
    await connectDB();

    server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on port ${PORT} (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
    });

    server.on('error', (err) => {
        console.error('[server error]', err);
        process.exit(1);
    });

    registerShutdownHandlers();
    return server;
}

if (require.main === module) {
    start().catch((err) => {
        console.error('\n[fatal] Failed to start the application:', err.message || err);
        console.error('  Check that ATLASDB_URL points at a reachable MongoDB instance and');
        console.error('  that your current IP is allowed in MongoDB Atlas "Network Access".\n');
        process.exit(1);
    });
}

module.exports = { app, start, connectDB };
