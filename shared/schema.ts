import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define the task names as a union type for typesafety
export const taskNames = [
  "telegram_group",
  "telegram_channel",
  "twitter_follow",
  "twitter_engage",
  "youtube",
  "wallet_submit"
] as const;
export type TaskName = typeof taskNames[number];

// User table schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  walletAddress: text("wallet_address"),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: text("referred_by"),
  totalTokens: integer("total_tokens").notNull().default(0),
  referralTokens: integer("referral_tokens").notNull().default(0),
  referralCount: integer("referral_count").notNull().default(0),
  ipAddress: text("ip_address"),
  fingerprint: text("fingerprint"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  totalTokens: true,
  referralTokens: true, 
  referralCount: true
});

// Tasks completed by users
export const userTasks = pgTable("user_tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  taskName: text("task_name").notNull(),
  completed: boolean("completed").notNull().default(false),
  tokenAmount: integer("token_amount").notNull().default(0),
  verificationData: text("verification_data"),
  completedAt: timestamp("completed_at"),
});

export const insertUserTaskSchema = createInsertSchema(userTasks).omit({
  id: true,
  completedAt: true
});

// Referrals 
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerUserId: integer("referrer_user_id").notNull(),
  referredUserId: integer("referred_user_id").notNull(),
  tokenAmount: integer("token_amount").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true
});

// Task definitions (token rewards and requirements)
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  tokenAmount: integer("token_amount").notNull(),
  isRequired: boolean("is_required").notNull().default(true),
  iconClass: text("icon_class").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true
});

// Withdrawals
export const withdrawals = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  walletAddress: text("wallet_address").notNull(),
  txHash: text("tx_hash"), // Transaction hash for BNB fee payment
  status: text("status").notNull(), // pending, processing, completed, failed
  bnbFeeCollected: boolean("bnb_fee_collected").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWithdrawalSchema = createInsertSchema(withdrawals).omit({
  id: true,
  createdAt: true,
  txHash: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertUserTask = z.infer<typeof insertUserTaskSchema>;
export type UserTask = typeof userTasks.$inferSelect;

export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;
export type Withdrawal = typeof withdrawals.$inferSelect;

// User with tasks combined (for frontend use)
export type UserWithTasks = User & {
  tasks: UserTask[];
};

// Create API schemas
export const registerUserSchema = z.object({
  username: z.string().min(3).max(50),
  walletAddress: z.string().optional(),
  referredBy: z.string().optional(),
  ipAddress: z.string().optional(),
  fingerprint: z.string().optional(),
  captchaToken: z.string(),
});

export const completeTaskSchema = z.object({
  taskName: z.enum(taskNames),
  verificationData: z.string().optional(),
});

export const walletSubmissionSchema = z.object({
  walletAddress: z.string().min(42).max(42),
  captchaToken: z.string(),
});
