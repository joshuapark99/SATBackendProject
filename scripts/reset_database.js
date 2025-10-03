#!/usr/bin/env node
/**
 * Reset Database Script
 * 
 * This script drops all database tables and recreates them by running migrations.
 * WARNING: This will delete ALL data in the database!
 * 
 * Usage:
 *   node scripts/reset_database.js
 *   npm run reset:db
 */

const pool = require('../config/db');
const { execSync } = require('child_process');
const readline = require('readline');

/**
 * Prompt user for confirmation
 */
function confirmReset() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('WARNING: This will delete ALL data in your database!\nAre you sure you want to continue? (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Drop all tables in the correct order
 */
async function dropAllTables() {
  const client = await pool.connect();
  
  try {
    console.log('Dropping all tables...');
    
    // Drop tables in reverse order of creation (to respect foreign key constraints)
    await client.query('DROP TABLE IF EXISTS module_questions CASCADE;');
    console.log('Dropped module_questions table');
    
    await client.query('DROP TABLE IF EXISTS test_modules CASCADE;');
    console.log('Dropped test_modules table');
    
    await client.query('DROP TABLE IF EXISTS questions CASCADE;');
    console.log('Dropped questions table');
    
    await client.query('DROP TABLE IF EXISTS modules CASCADE;');
    console.log('Dropped modules table');
    
    await client.query('DROP TABLE IF EXISTS tests CASCADE;');
    console.log('Dropped tests table');
    
    await client.query('DROP TABLE IF EXISTS schema_migrations CASCADE;');
    console.log('Dropped schema_migrations table');
    
    console.log('All tables dropped successfully!');
    
  } catch (error) {
    console.error('Error dropping tables:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Run migrations to recreate tables
 */
function runMigrations() {
  console.log('\nRunning migrations to recreate tables...');
  
  try {
    execSync('node scripts/migrate.js', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('\nDatabase reset completed successfully! ✓');
  } catch (error) {
    console.error('Error running migrations:', error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('=================================');
    console.log('   DATABASE RESET SCRIPT');
    console.log('=================================\n');
    
    // Check if running in non-interactive mode (e.g., CI/CD)
    const isNonInteractive = process.argv.includes('--force') || process.argv.includes('-f');
    
    if (!isNonInteractive) {
      const confirmed = await confirmReset();
      
      if (!confirmed) {
        console.log('\nDatabase reset cancelled.');
        process.exit(0);
      }
    } else {
      console.log('Running in force mode - skipping confirmation');
    }
    
    console.log('\nConnecting to database...');
    
    // Test database connection
    const client = await pool.connect();
    console.log('Connected to database\n');
    client.release();
    
    // Drop all tables
    await dropAllTables();
    
    // Close the pool before running migrations
    await pool.end();
    
    // Run migrations to recreate tables
    runMigrations();
    
  } catch (error) {
    console.error('\nError resetting database:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  dropAllTables,
  runMigrations
};

