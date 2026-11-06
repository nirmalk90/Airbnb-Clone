/**
 * Route/render smoke test. Boots the Express app on a fixed port without
 * waiting for MongoDB, so it can run anywhere (CI, no mongod required).
 * The health endpoint is expected to report "degraded" while the DB is down.
 */
const test = require('node:test');
const assert = require('node:assert');

process.env.NODE_ENV = 'test';
process.env.PORT = '18099';
process.env.ATLASDB_URL = 'mongodb://127.0.0.1:1/wanderlust';
process.env.SECRET = 'smoke-secret';
process.env.DOTENV_CONFIG_PATH = '.env.does-not-exist';

const Listing = require('../models/listing.js');
// Keep the index route off the network.
Listing.find = () => Promise.resolve([]);

const { app } = require('../app.js');

const base = () => `http://127.0.0.1:${process.env.PORT}`;

test('serves public pages, health check and a rendered 404', async (t) => {
    const server = await new Promise((resolve) => {
        const srv = app.listen(0, '127.0.0.1', () => resolve(srv));
    });
    t.after(() => server.close());

    const port = server.address().port;
    const url = (p) => `http://127.0.0.1:${port}${p}`;

    for (const [route, expected] of [
        ['/', 200],
        ['/login', 200],
        ['/signup', 200],
        ['/healthz', 503],
        ['/this-page-does-not-exist', 404],
        ['/definitely/not/a/real/page', 404],
        ['/css/style.css', 200]
    ]) {
        const res = await fetch(url(route), { redirect: 'manual' });
        assert.strictEqual(res.status, expected, `GET ${route} should return ${expected}`);
    }

    const index = await (await fetch(url('/'))).text();
    assert.ok(index.includes('filter'), 'index should render the category filter bar');
    assert.ok(index.includes('Wanderlust') || index.includes('Airbnb'), 'index should render the layout');

    const health = await (await fetch(url('/healthz'))).json();
    assert.strictEqual(health.status, 'degraded');
    assert.notStrictEqual(health.db, 'connected');

    // Single-segment paths land on /:id (invalid ObjectId -> "Listing not found");
    // deeper paths fall through to the catch-all handler.
    assert.match(
        await (await fetch(url('/this-page-does-not-exist'))).text(),
        /Listing not found/,
        'invalid listing id should render the error page with a 404'
    );
    assert.match(
        await (await fetch(url('/definitely/not/a/real/page'))).text(),
        /Page Not Found/,
        'unmatched routes should render the catch-all 404 page'
    );
});
