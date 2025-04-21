// Database migration script to add requiresVerification column to tasks table
require('dotenv').config();
const { Pool } = require('pg');

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Starting migration to add requiresVerification column to tasks table...');
    
    // First check if the column already exists
    const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='tasks' AND column_name='requires_verification';
    `);
    
    if (res.rows.length === 0) {
      // Add the requires_verification column to the tasks table
      await pool.query(`
        ALTER TABLE tasks 
        ADD COLUMN requires_verification BOOLEAN NOT NULL DEFAULT false;
      `);
      
      // Update existing tasks to set requiresVerification based on task type
      await pool.query(`
        UPDATE tasks
        SET requires_verification = true
        WHERE name IN ('twitter_follow', 'twitter_retweet', 'telegram_group', 'telegram_channel', 'wallet_submit', 'discord_join');
      `);
      
      console.log('Added requiresVerification column and updated existing tasks.');
    } else {
      console.log('requiresVerification column already exists, skipping migration.');
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();