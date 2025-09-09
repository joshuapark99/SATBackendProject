// db.js
const { Pool } = require("pg");
require('dotenv').config();


const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL, // e.g. "postgresql://user:pass@host:5432/dbname"
  ssl: { rejectUnauthorized: false },
});

module.exports = pool;
