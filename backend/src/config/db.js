const { Pool } = require('pg');
const env = require('../config/env');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: env.db.connectionString,
  ssl: env.db.ssl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error('Unexpected PG pool error', { error: err.message });
});

/**
 * Run a plain query against the pool.
 */
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 200) {
    logger.warn('Slow query', { text, duration, rows: res.rowCount });
  }
  return res;
}

/**
 * Run a callback inside a single transaction.
 * The callback receives a `client` with the same query(text, params) signature.
 * Automatically commits on success and rolls back on any thrown error.
 *
 * This is the backbone of cross-module synchronization (Production Entry ->
 * Inventory -> Machine Log -> Fabric Roll -> Dashboard, etc.) so that a
 * partial failure never leaves modules out of sync.
 */
async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const wrappedClient = {
      query: (text, params) => client.query(text, params),
      raw: client,
    };
    const result = await callback(wrappedClient);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };
