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

// Add the new column
async function runMigration() {
  try {
    // First check if the column already exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'link';
    `);

    if (checkResult.rowCount === 0) {
      console.log('Adding link column to tasks table...');
      // Add the new column
      await pool.query(`
        ALTER TABLE tasks
        ADD COLUMN link TEXT;
      `);
      console.log('Migration complete: Added link column to tasks table');
    } else {
      console.log('Column link already exists in tasks table. Skipping migration.');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close the pool after migration
    await pool.end();
  }
}

runMigration();