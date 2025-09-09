/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const pool = require('../config/db');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function getAppliedMigrations() {
  const { rows } = await pool.query('SELECT filename FROM schema_migrations ORDER BY filename');
  return new Set(rows.map(r => r.filename));
}

function getLocalMigrations() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();
}

async function applyMigration(filename) {
  const fullPath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(fullPath, 'utf8');
  console.log(`\nApplying migration: ${filename}`);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations(filename) VALUES ($1)', [filename]);
    await client.query('COMMIT');
    console.log(`✓ Applied ${filename}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`✗ Failed ${filename}:`, err.message);
    throw err;
  } finally {
    client.release();
  }
}

(async function run() {
  try {
    console.log('Ensuring migrations table...');
    await ensureMigrationsTable();
    console.log('Loading local migrations...');
    const local = getLocalMigrations();
    const applied = await getAppliedMigrations();

    const pending = local.filter(f => !applied.has(f));
    if (pending.length === 0) {
      console.log('No pending migrations.');
      process.exit(0);
    }

    console.log(`Pending migrations (${pending.length}):`);
    pending.forEach(f => console.log('-', f));

    for (const filename of pending) {
      await applyMigration(filename);
    }

    console.log('All pending migrations applied.');
    process.exit(0);
  } catch (err) {
    console.error('Migration run failed:', err);
    process.exit(1);
  }
})(); 