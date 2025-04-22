import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define the task names as a union type for typesafety
export const taskNames = [
  "telegram_connect",
  "telegram_group",
  "telegram_channel",
  "twitter_follow",
  "twitter_retweet",
  "twitter_engage",
  "website_visit",
  "discord_join",
  "youtube",
  "wallet_submit"
] as const;
export type TaskName = typeof taskNames[number];

// User table schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  walletAddress: text("wallet_address"),
  telegramId: integer("telegram_id"),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: text("referred_by"),
  // Changed totalTokens to totalPoints for GLRS Points system
  totalPoints: integer("total_points").notNull().default(0),
  referralPoints: integer("referral_points").notNull().default(0),
  referralCount: integer("referral_count").notNull().default(0),
  // Premium status fields for the fee options
  isPremium: boolean("is_premium").notNull().default(false),
  premiumOptionChosen: text("premium_option_chosen"),
  premiumTxHash: text("premium_tx_hash"),
  pointsMultiplier: integer("points_multiplier").notNull().default(1),
  canWithdraw: boolean("can_withdraw").notNull().default(false),
  ipAddress: text("ip_address"),
  fingerprint: text("fingerprint"),
  isBanned: boolean("is_banned").notNull().default(false),
  banReason: text("ban_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  totalPoints: true,
  referralPoints: true, 
  referralCount: true,
  isPremium: true,
  premiumOptionChosen: true,
  premiumTxHash: true,
  pointsMultiplier: true,
  canWithdraw: true
});

// Tasks completed by users
export const userTasks = pgTable("user_tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  taskName: text("task_name").notNull(),
  completed: boolean("completed").notNull().default(false),
  pointAmount: integer("point_amount").notNull().default(0),
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
  pointAmount: integer("token_amount").notNull().default(0),
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
  pointAmount: integer("token_amount").notNull(),
  isRequired: boolean("is_required").notNull().default(true),
  iconClass: text("icon_class").notNull(),
  link: text("link"),
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
  status: text("status").notNull(), // pending, processing, completed, failed, rejected
  bnbFeeCollected: boolean("bnb_fee_collected").notNull().default(false),
  adminNotes: text("admin_notes"),
  rejectionReason: text("rejection_reason"),
  approvedBy: integer("approved_by"),
  approvedAt: timestamp("approved_at"),
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
}).superRefine((data, ctx) => {
  // For specific tasks, we require verification data
  const requiresVerification = [
    "telegram_group", 
    "telegram_channel", 
    "twitter_follow", 
    "twitter_retweet",
    "twitter_engage", 
    "discord_join",
    "wallet_submit"
  ];
  
  if (requiresVerification.includes(data.taskName) && (!data.verificationData || !data.verificationData.trim())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Verification data is required for ${data.taskName} task`,
      path: ["verificationData"]
    });
  }
  
  // Specific validation for wallet addresses
  if (data.taskName === "wallet_submit" && data.verificationData) {
    const isValidBscAddress = /^0x[a-fA-F0-9]{40}$/.test(data.verificationData);
    if (!isValidBscAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid BSC wallet address format",
        path: ["verificationData"]
      });
    }
  }
});

export const walletSubmissionSchema = z.object({
  walletAddress: z.string().min(42).max(42),
  captchaToken: z.string(),
});

export const createTaskSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().min(3),
  pointAmount: z.number().min(1),
  isRequired: z.boolean().default(false),
  iconClass: z.string(),
  link: z.union([
    z.string().url("Please enter a valid URL"),
    z.string().length(0),
    z.null(),
    z.undefined()
  ]).optional()
});

// Admin action schemas
export const banUserSchema = z.object({
  userId: z.number().positive(),
  banReason: z.string().min(3).max(255)
});

export const resetPointsSchema = z.object({
  userId: z.number().positive(),
  reason: z.string().min(3).max(255).optional()
});

export const withdrawalActionSchema = z.object({
  withdrawalId: z.number().positive(),
  action: z.enum(['approve', 'reject']),
  notes: z.string().optional(),
  rejectionReason: z.string().optional()
});

export const withdrawalStatusUpdateSchema = z.object({
  id: z.number().positive(),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'rejected']),
  adminNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
  txHash: z.string().optional()
});

// Premium options enum
export const premiumOptionTypes = ['earnings_boost', 'premium_tasks', 'priority_withdrawals'] as const;
export type PremiumOptionType = typeof premiumOptionTypes[number];

// Fee payment schema for premium features
export const premiumFeePaymentSchema = z.object({
  userId: z.number().positive(),
  optionType: z.enum(premiumOptionTypes),
  txHash: z.string().min(10).max(100),
  captchaToken: z.string()
});
