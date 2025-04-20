import { db } from './db';
import { eq, and, or, not, isNull } from 'drizzle-orm';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import crypto from 'crypto';
import {
  InsertUser, User,
  InsertUserTask, UserTask,
  InsertReferral, Referral,
  InsertTask, Task,
  InsertWithdrawal, Withdrawal,
  users, userTasks, referrals, tasks, withdrawals,
  UserWithTasks
} from "@shared/schema";
import pg from 'pg';
import { IStorage } from './storage';

const { Pool } = pg;

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  private pool: pg.Pool;
  
  constructor() {
    // Create PostgreSQL connection pool for session store
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Create session store
    this.sessionStore = new PostgresSessionStore({
      pool: this.pool,
      tableName: 'session',
      createTableIfMissing: true // Automatically create session table
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results[0];
  }
  
  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return results[0];
  }
  
  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.referralCode, referralCode));
    return results[0];
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    // Use the username as the referral code (Telegram username)
    const referralCode = insertUser.username;
    
    // Create user with proper default values for nullable fields
    const userData = {
      username: insertUser.username,
      walletAddress: insertUser.walletAddress || null,
      referralCode,
      referredBy: insertUser.referredBy || null,
      ipAddress: insertUser.ipAddress || null,
      fingerprint: insertUser.fingerprint || null,
      totalTokens: 0,
      referralTokens: 0,
      referralCount: 0,
      createdAt: new Date()
    };
    
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    return result[0];
  }
  
  async getUserWithTasks(userId: number): Promise<UserWithTasks | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const userTasksList = await this.getUserTasks(userId);
    return { ...user, tasks: userTasksList };
  }
  
  async checkDuplicateRegistration(ipAddress: string, fingerprint: string): Promise<boolean> {
    // For Telegram users, we should never prevent registration
    if (fingerprint && fingerprint.startsWith('telegram_')) {
      return false; // Allow Telegram users to register
    }
    
    // For fingerprints that are simple demo values, also allow registration
    if (fingerprint === 'demo-fingerprint') {
      return false;
    }
    
    // Only check for true IP address and fingerprint duplicates
    // (only for web users, not for Telegram users)
    const results = await db.select()
      .from(users)
      .where(
        and(
          // Make sure we're only checking non-null values
          not(isNull(users.ipAddress)),
          not(isNull(users.fingerprint)),
          // And that they match exactly
          or(
            eq(users.ipAddress, ipAddress),
            eq(users.fingerprint, fingerprint)
          )
        )
      );
    
    // Only consider it a duplicate if we found an exact match
    return results.length > 0;
  }
  
  // Task operations
  async getAllTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }
  
  async getTask(name: string): Promise<Task | undefined> {
    const results = await db.select().from(tasks).where(eq(tasks.name, name));
    return results[0];
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const taskData = {
      name: insertTask.name,
      description: insertTask.description,
      tokenAmount: insertTask.tokenAmount,
      isRequired: insertTask.isRequired ?? true, // Default to true if not specified
      iconClass: insertTask.iconClass,
      createdAt: new Date()
    };
    
    const result = await db.insert(tasks).values(taskData).returning();
    return result[0];
  }
  
  async getUserTasks(userId: number): Promise<UserTask[]> {
    return await db.select()
      .from(userTasks)
      .where(eq(userTasks.userId, userId));
  }
  
  async getCompletedTasks(userId: number): Promise<UserTask[]> {
    return await db.select()
      .from(userTasks)
      .where(
        and(
          eq(userTasks.userId, userId),
          eq(userTasks.completed, true)
        )
      );
  }
  
  async completeUserTask(insertUserTask: InsertUserTask): Promise<UserTask> {
    // Get the task to determine token amount
    const task = await this.getTask(insertUserTask.taskName);
    const tokenAmount = task ? task.tokenAmount : 0;
    
    const userTaskData = {
      userId: insertUserTask.userId,
      taskName: insertUserTask.taskName,
      verificationData: insertUserTask.verificationData || null,
      tokenAmount,
      completed: true,
      completedAt: new Date()
    };
    
    // Insert the task completion record
    const result = await db.insert(userTasks).values(userTaskData).returning();
    
    // Update user's total tokens
    const user = await this.getUser(insertUserTask.userId);
    if (user) {
      const updatedTotalTokens = user.totalTokens + tokenAmount;
      await this.updateUser(user.id, { totalTokens: updatedTotalTokens });
    }
    
    return result[0];
  }
  
  async checkTaskCompletion(userId: number, taskName: string): Promise<boolean> {
    const results = await db.select()
      .from(userTasks)
      .where(
        and(
          eq(userTasks.userId, userId),
          eq(userTasks.taskName, taskName),
          eq(userTasks.completed, true)
        )
      );
    
    return results.length > 0;
  }
  
  // Referral operations
  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    // Default token amount is 5 if not provided
    const tokenAmount = insertReferral.tokenAmount ?? 5;
    
    const referralData = {
      referrerUserId: insertReferral.referrerUserId,
      referredUserId: insertReferral.referredUserId,
      tokenAmount,
      createdAt: new Date()
    };
    
    // Insert the referral record
    const result = await db.insert(referrals).values(referralData).returning();
    
    // Update referrer's stats
    const referrer = await this.getUser(insertReferral.referrerUserId);
    if (referrer) {
      const newReferralCount = referrer.referralCount + 1;
      const newReferralTokens = referrer.referralTokens + tokenAmount;
      const newTotalTokens = referrer.totalTokens + tokenAmount;
      
      await this.updateUser(referrer.id, { 
        referralCount: newReferralCount,
        referralTokens: newReferralTokens,
        totalTokens: newTotalTokens
      });
    }
    
    return result[0];
  }
  
  async getReferralsByReferrer(referrerId: number): Promise<Referral[]> {
    return await db.select()
      .from(referrals)
      .where(eq(referrals.referrerUserId, referrerId));
  }
  
  async countReferrals(referrerId: number): Promise<number> {
    const referrals = await this.getReferralsByReferrer(referrerId);
    return referrals.length;
  }
  
  // Withdrawal operations
  async createWithdrawal(insertWithdrawal: InsertWithdrawal): Promise<Withdrawal> {
    const withdrawalData = {
      userId: insertWithdrawal.userId,
      amount: insertWithdrawal.amount,
      status: insertWithdrawal.status,
      walletAddress: insertWithdrawal.walletAddress,
      transactionHash: null,
      createdAt: new Date()
    };
    
    const result = await db.insert(withdrawals).values(withdrawalData).returning();
    return result[0];
  }
  
  async getWithdrawalsByUser(userId: number): Promise<Withdrawal[]> {
    return await db.select()
      .from(withdrawals)
      .where(eq(withdrawals.userId, userId));
  }
  
  async updateWithdrawalStatus(id: number, status: string, txHash?: string): Promise<Withdrawal | undefined> {
    const updateData: Partial<Withdrawal> = { 
      status,
      ...(txHash && { transactionHash: txHash })
    };
    
    const result = await db.update(withdrawals)
      .set(updateData)
      .where(eq(withdrawals.id, id))
      .returning();
    
    return result[0];
  }
  
  // No longer needed as we use the username directly as the referral code
  
  // Initialize default tasks
  async initializeDefaultTasks(): Promise<void> {
    try {
      // First check if there are any tasks already
      const existingTasks = await db.select().from(tasks);
      
      // If tasks already exist, don't try to create default ones
      if (existingTasks.length > 0) {
        console.log(`Found ${existingTasks.length} existing tasks. Skipping initialization.`);
        return;
      }
      
      console.log("No existing tasks found. Creating default tasks...");
      
      const defaultTasks: InsertTask[] = [
        {
          name: "telegram_group",
          description: "Join our official Telegram group",
          tokenAmount: 10,
          isRequired: true,
          iconClass: "fab fa-telegram-plane text-blue-500"
        },
        {
          name: "telegram_channel",
          description: "Subscribe to our announcement channel",
          tokenAmount: 5,
          isRequired: true,
          iconClass: "fab fa-telegram-plane text-blue-500"
        },
        {
          name: "twitter_follow",
          description: "Follow @GleritasToken on Twitter",
          tokenAmount: 10,
          isRequired: true,
          iconClass: "fab fa-twitter text-blue-500"
        },
        {
          name: "twitter_engage",
          description: "Like, retweet, and comment on our pinned tweet",
          tokenAmount: 10,
          isRequired: true,
          iconClass: "fab fa-twitter text-blue-500"
        },
        {
          name: "youtube",
          description: "Watch and like our intro video (Optional)",
          tokenAmount: 10,
          isRequired: false,
          iconClass: "fab fa-youtube text-red-500"
        },
        {
          name: "wallet_submit",
          description: "Provide a valid wallet address for token distribution",
          tokenAmount: 0,
          isRequired: true,
          iconClass: "fas fa-wallet text-yellow-500"
        }
      ];

      // Insert all tasks in a single batch operation if possible
      await db.insert(tasks).values(defaultTasks);
      console.log("Default tasks created successfully.");
    } catch (error) {
      console.error("Error initializing default tasks:", error);
      // Don't throw the error here to allow the application to start
      // even if task initialization fails
    }
  }
}