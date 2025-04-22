// Migration script to rename token_amount columns to point_amount
// and total_tokens to total_points in all tables

import { db } from "./db";
import { sql } from "drizzle-orm";

async function runMigration() {
  try {
    console.log("Starting migration from tokens to points...");

    // Rename column token_amount to point_amount in user_tasks table
    await db.execute(sql`
      ALTER TABLE IF EXISTS user_tasks 
      RENAME COLUMN token_amount TO point_amount;
    `);
    console.log("Renamed token_amount to point_amount in user_tasks table");

    // Rename column token_amount to point_amount in referrals table
    await db.execute(sql`
      ALTER TABLE IF EXISTS referrals 
      RENAME COLUMN token_amount TO point_amount;
    `);
    console.log("Renamed token_amount to point_amount in referrals table");

    // Rename column token_amount to point_amount in tasks table
    await db.execute(sql`
      ALTER TABLE IF EXISTS tasks 
      RENAME COLUMN token_amount TO point_amount;
    `);
    console.log("Renamed token_amount to point_amount in tasks table");

    // Rename column total_tokens to total_points in users table
    await db.execute(sql`
      ALTER TABLE IF EXISTS users 
      RENAME COLUMN total_tokens TO total_points;
    `);
    console.log("Renamed total_tokens to total_points in users table");

    // Rename column referral_tokens to referral_points in users table
    await db.execute(sql`
      ALTER TABLE IF EXISTS users 
      RENAME COLUMN referral_tokens TO referral_points;
    `);
    console.log("Renamed referral_tokens to referral_points in users table");

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

// Execute the migration
runMigration();