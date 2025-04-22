import { db } from "./db";
import { sql } from "drizzle-orm";

async function runMigration() {
  try {
    console.log('Starting migration to convert telegram_id from integer to text...');

    // Create a temporary column
    console.log('Creating temporary text column...');
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN telegram_id_text text
    `);

    // Copy existing data to the new column, converting integers to text
    console.log('Copying data from old integer column to new text column...');
    await db.execute(sql`
      UPDATE users
      SET telegram_id_text = telegram_id::text
      WHERE telegram_id IS NOT NULL
    `);

    // Drop old column
    console.log('Dropping old integer column...');
    await db.execute(sql`
      ALTER TABLE users
      DROP COLUMN telegram_id
    `);

    // Rename new column to use the original name
    console.log('Renaming temporary column to original name...');
    await db.execute(sql`
      ALTER TABLE users
      RENAME COLUMN telegram_id_text TO telegram_id
    `);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

runMigration();