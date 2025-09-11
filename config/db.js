// db.js
const { Pool } = require("pg");
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL, // e.g. "postgresql://user:pass@host:5432/dbname"
  ssl: { rejectUnauthorized: false },
  // Add connection pool settings to prevent premature termination
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  // Handle pool errors gracefully
  allowExitOnIdle: true, // Allow the pool to close when all clients are idle
});

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
