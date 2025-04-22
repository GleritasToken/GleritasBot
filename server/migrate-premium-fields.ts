// Migration script to add premium fields to users table

import { db } from "./db";
import { sql } from "drizzle-orm";

async function runMigration() {
  try {
    console.log("Starting migration to add premium fields...");

    // Check if is_premium column exists
    try {
      await db.execute(sql`
        SELECT is_premium FROM users LIMIT 1;
      `);
      console.log("is_premium column already exists, skipping creation");
    } catch (error) {
      console.log("Adding is_premium column to users table");
      await db.execute(sql`
        ALTER TABLE users ADD COLUMN is_premium BOOLEAN NOT NULL DEFAULT false;
      `);
    }

    // Check if premium_option_chosen column exists
    try {
      await db.execute(sql`
        SELECT premium_option_chosen FROM users LIMIT 1;
      `);
      console.log("premium_option_chosen column already exists, skipping creation");
    } catch (error) {
      console.log("Adding premium_option_chosen column to users table");
      await db.execute(sql`
        ALTER TABLE users ADD COLUMN premium_option_chosen TEXT;
      `);
    }

    // Check if premium_tx_hash column exists
    try {
      await db.execute(sql`
        SELECT premium_tx_hash FROM users LIMIT 1;
      `);
      console.log("premium_tx_hash column already exists, skipping creation");
    } catch (error) {
      console.log("Adding premium_tx_hash column to users table");
      await db.execute(sql`
        ALTER TABLE users ADD COLUMN premium_tx_hash TEXT;
      `);
    }

    // Check if points_multiplier column exists
    try {
      await db.execute(sql`
        SELECT points_multiplier FROM users LIMIT 1;
      `);
      console.log("points_multiplier column already exists, skipping creation");
    } catch (error) {
      console.log("Adding points_multiplier column to users table");
      await db.execute(sql`
        ALTER TABLE users ADD COLUMN points_multiplier INTEGER NOT NULL DEFAULT 1;
      `);
    }

    // Check if can_withdraw column exists
    try {
      await db.execute(sql`
        SELECT can_withdraw FROM users LIMIT 1;
      `);
      console.log("can_withdraw column already exists, skipping creation");
    } catch (error) {
      console.log("Adding can_withdraw column to users table");
      await db.execute(sql`
        ALTER TABLE users ADD COLUMN can_withdraw BOOLEAN NOT NULL DEFAULT false;
      `);
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

// Execute the migration
runMigration();