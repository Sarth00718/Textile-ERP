/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const env = require('../config/env');

const pool = new Pool({ connectionString: env.db.connectionString, ssl: env.db.ssl });
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

function getMigrationFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

async function up() {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const { rows } = await client.query('SELECT name FROM schema_migrations');
    const applied = new Set(rows.map((r) => r.name));
    const files = getMigrationFiles().filter((f) => f.endsWith('.up.sql'));

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`SKIP  ${file} (already applied)`);
        continue;
      }
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      console.log(`APPLY ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`FAILED ${file}:`, err.message);
        throw err;
      }
    }
    console.log('All migrations applied.');
  } finally {
    client.release();
    await pool.end();
  }
}

async function down() {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const { rows } = await client.query(
      'SELECT name FROM schema_migrations ORDER BY id DESC LIMIT 1'
    );
    if (!rows.length) {
      console.log('No migrations to roll back.');
      return;
    }
    const lastUp = rows[0].name;
    const downFile = lastUp.replace('.up.sql', '.down.sql');
    const downPath = path.join(MIGRATIONS_DIR, downFile);
    if (!fs.existsSync(downPath)) {
      console.error(`No down migration found for ${lastUp}`);
      return;
    }
    const sql = fs.readFileSync(downPath, 'utf8');
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('DELETE FROM schema_migrations WHERE name = $1', [lastUp]);
      await client.query('COMMIT');
      console.log(`Rolled back ${lastUp}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

async function redo() {
  await down();
  await up();
}

const cmd = process.argv[2];
if (cmd === 'up') up().catch((e) => { console.error(e); process.exit(1); });
else if (cmd === 'down') down().catch((e) => { console.error(e); process.exit(1); });
else if (cmd === 'redo') redo().catch((e) => { console.error(e); process.exit(1); });
else {
  console.log('Usage: node migrate.js [up|down|redo]');
  process.exit(1);
}
