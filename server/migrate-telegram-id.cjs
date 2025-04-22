const pg = require('pg');
const Pool = pg.Pool;

// Get the database connection string from the environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Create a PostgreSQL pool
const pool = new Pool({
  connectionString,
});

// Add the telegramId column to users table
async function runMigration() {
  try {
    // First check if the column already exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'telegram_id';
    `);

    if (checkResult.rowCount === 0) {
      console.log('Adding telegram_id column to users table...');
      // Add the new column
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN telegram_id INTEGER;
      `);
      console.log('Migration complete: Added telegram_id column to users table');
    } else {
      console.log('Column telegram_id already exists in users table. Skipping migration.');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close the pool after migration
    await pool.end();
  }
}

runMigration();