/**
 * Configuration/startup guards: a misconfigured deploy must exit non-zero with a
 * readable message instead of crashing with an opaque assertion or booting a
 * server that cannot talk to MongoDB.
 */
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');

const run = (env, timeout = 60000) =>
    spawnSync(process.execPath, ['app.js'], {
        cwd: root,
        timeout,
        encoding: 'utf8',
        env: {
            PATH: process.env.PATH,
            NODE_ENV: 'production',
            // Keep the test hermetic: never pick up a developer's local .env
            DOTENV_CONFIG_PATH: path.join(root, '.env.does-not-exist'),
            ...env
        }
    });

test('exits with a clear error when required variables are missing', () => {
    const res = run({});
    assert.strictEqual(res.status, 1);
    assert.match(res.stderr, /Missing required environment variable/i);
    assert.ok(!res.stdout.includes('Server is running'), 'must not start a server without a database');
});

test('exits with a clear error when SECRET is missing', () => {
    const res = run({ ATLASDB_URL: 'mongodb://127.0.0.1:27017/x' });
    assert.strictEqual(res.status, 1);
    assert.match(res.stderr, /SECRET/);
});

test('rejects placeholder connection strings', () => {
    const res = run({ ATLASDB_URL: 'mongodb+srv://user:<password>@cluster0.mongodb.net/x', SECRET: 's' });
    assert.strictEqual(res.status, 1);
    assert.match(res.stderr, /placeholder/i);
});

test('fails the start instead of listening when the database is unreachable', () => {
    const res = run({ ATLASDB_URL: 'mongodb://127.0.0.1:1/wanderlust', SECRET: 's' });
    assert.strictEqual(res.status, 1);
    assert.ok(!res.stdout.includes('Server is running'), 'must not listen when the DB connection failed');
    assert.match(res.stderr, /Failed to start/i);
});
