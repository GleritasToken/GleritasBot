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
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async getAllUserTasks(): Promise<UserTask[]> {
    return await db.select().from(userTasks);
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
  
  async updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined> {
    const result = await db.update(tasks)
      .set(taskData)
      .where(eq(tasks.id, id))
      .returning();
      
    return result[0];
  }
  
  async deleteTask(id: number): Promise<boolean> {
    try {
      // First, get the task to get its name
      const taskResult = await db.select()
        .from(tasks)
        .where(eq(tasks.id, id));
      
      if (taskResult.length === 0) {
        return false; // Task not found
      }
      
      const taskName = taskResult[0].name;
      
      // Delete associated user task completions
      await db.delete(userTasks)
        .where(eq(userTasks.taskName, taskName));
      
      // Delete the task itself
      const deleteResult = await db.delete(tasks)
        .where(eq(tasks.id, id))
        .returning();
      
      return deleteResult.length > 0;
    } catch (error) {
      console.error("Error deleting task:", error);
      return false;
    }
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
    
    // Update user's total points
    const user = await this.getUser(insertUserTask.userId);
    if (user) {
      const updatedTotalPoints = user.totalPoints + tokenAmount;
      await this.updateUser(user.id, { totalPoints: updatedTotalPoints });
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
      const newReferralPoints = referrer.referralPoints + tokenAmount;
      const newTotalPoints = referrer.totalPoints + tokenAmount;
      
      await this.updateUser(referrer.id, { 
        referralCount: newReferralCount,
        referralPoints: newReferralPoints,
        totalPoints: newTotalPoints
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
      txHash: null,
      bnbFeeCollected: insertWithdrawal.bnbFeeCollected || false,
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
      ...(txHash && { txHash: txHash })
    };
    
    const result = await db.update(withdrawals)
      .set(updateData)
      .where(eq(withdrawals.id, id))
      .returning();
    
    return result[0];
  }

  async getWithdrawalById(id: number): Promise<Withdrawal | undefined> {
    const results = await db.select().from(withdrawals).where(eq(withdrawals.id, id));
    return results[0];
  }
  
  async getAllWithdrawals(): Promise<Withdrawal[]> {
    return await db.select().from(withdrawals);
  }
  
  async updateWithdrawalWithAdminAction(
    id: number, 
    status: string, 
    adminId: number, 
    notes?: string, 
    rejectionReason?: string,
    txHash?: string
  ): Promise<Withdrawal | undefined> {
    const updateData: Partial<Withdrawal> = { 
      status,
      adminNotes: notes || null,
      rejectionReason: status === 'rejected' ? (rejectionReason || 'Rejected by admin') : null,
      approvedBy: ['completed', 'processing'].includes(status) ? adminId : null,
      approvedAt: ['completed', 'processing'].includes(status) ? new Date() : null,
      ...(txHash && { txHash })
    };
    
    const result = await db.update(withdrawals)
      .set(updateData)
      .where(eq(withdrawals.id, id))
      .returning();
    
    return result[0];
  }
  
  // Admin Operations
  async banUser(userId: number, banReason: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({
        isBanned: true,
        banReason
      })
      .where(eq(users.id, userId))
      .returning();
    
    return result[0];
  }
  
  async unbanUser(userId: number): Promise<User | undefined> {
    const result = await db.update(users)
      .set({
        isBanned: false,
        banReason: null
      })
      .where(eq(users.id, userId))
      .returning();
    
    return result[0];
  }
  
  // Reset only points, keep other data
  async resetUserTokens(userId: number): Promise<User | undefined> {
    try {
      const result = await db.update(users)
        .set({
          totalPoints: 0,
          referralPoints: 0
        })
        .where(eq(users.id, userId))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error(`Error resetting user ${userId} points:`, error);
      return undefined;
    }
  }

  // Reset user tasks only
  async resetUserTasks(userId: number): Promise<User | undefined> {
    try {
      // Delete all user tasks
      await db.delete(userTasks)
        .where(eq(userTasks.userId, userId));
      
      // Return the updated user
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      return user;
    } catch (error) {
      console.error(`Error resetting user ${userId} tasks:`, error);
      return undefined;
    }
  }

  // Full reset of user data (tasks, points, connections)
  async resetUserData(userId: number): Promise<User | undefined> {
    try {
      // First, delete all user tasks
      await db.delete(userTasks)
        .where(eq(userTasks.userId, userId));
      
      // Then reset user data
      const result = await db.update(users)
        .set({
          totalPoints: 0,
          referralPoints: 0,
          telegramId: null,
          walletAddress: null,
          isPremium: false,
          premiumOptionChosen: null,
          premiumTxHash: null,
          pointsMultiplier: 1,
          canWithdraw: false
        })
        .where(eq(users.id, userId))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error(`Error resetting user ${userId} data:`, error);
      return undefined;
    }
  }
  
  async resetAllUserTasks(): Promise<boolean> {
    try {
      // Begin a transaction
      await db.transaction(async (tx) => {
        // Get all users
        const allUsers = await this.getAllUsers();
        
        // Delete all user tasks
        await tx.delete(userTasks);
        
        // Reset user data for all users
        for (const user of allUsers) {
          await tx.update(users)
            .set({
              // Keep only username and referral-related data
              telegramId: null,
              walletAddress: null,
              totalPoints: user.referralPoints, // Keep only referral points
              ipAddress: null,
              fingerprint: null,
              isBanned: false,
              banReason: null,
              isPremium: false,
              premiumOptionChosen: null,
              premiumTxHash: null,
              pointsMultiplier: 1,
              canWithdraw: false
            })
            .where(eq(users.id, user.id));
        }
      });
      
      return true;
    } catch (error) {
      console.error("Error resetting all user tasks:", error);
      return false;
    }
  }
  
  async getTaskCompletionStats(): Promise<any> {
    const allTasks = await this.getAllTasks();
    const allUserTasks = await this.getAllUserTasks();
    
    return allTasks.map(task => {
      const completions = allUserTasks.filter(ut => 
        ut.taskName === task.name && ut.completed);
      const completionCount = completions.length;
      const totalTokensAwarded = completions.reduce((sum, ut) => 
        sum + ut.tokenAmount, 0);
      
      return {
        id: task.id,
        name: task.name,
        description: task.description,
        tokenAmount: task.tokenAmount,
        isRequired: task.isRequired,
        iconClass: task.iconClass,
        createdAt: task.createdAt,
        completionCount,
        totalTokensAwarded
      };
    });
  }
  
  async getUserActivityStats(): Promise<any> {
    const [allUsers, allUserTasks, allWithdrawals] = await Promise.all([
      this.getAllUsers(),
      this.getAllUserTasks(),
      this.getAllWithdrawals()
    ]);
    
    // Basic metrics
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter(user => 
      allUserTasks.some(task => task.userId === user.id && task.completed)
    ).length;
    
    const totalCompletedTasks = allUserTasks.filter(task => task.completed).length;
    const totalPointsClaimed = allWithdrawals
      .filter(w => w.status === 'completed')
      .reduce((sum, w) => sum + w.amount, 0);
    
    // Calculate daily activity
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    // Daily registrations
    const dailyRegistrations = allUsers
      .filter(user => user.createdAt >= thirtyDaysAgo)
      .reduce((acc, user) => {
        const dateStr = user.createdAt.toISOString().split('T')[0];
        acc[dateStr] = (acc[dateStr] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    // Daily task completions
    const dailyTaskCompletions = allUserTasks
      .filter(task => task.completedAt && task.completedAt >= thirtyDaysAgo)
      .reduce((acc, task) => {
        const dateStr = task.completedAt!.toISOString().split('T')[0];
        acc[dateStr] = (acc[dateStr] || 0) + 1;
        return acc; 
      }, {} as Record<string, number>);
    
    // Task type breakdown
    const taskCounts: Record<string, number> = {};
    allUserTasks
      .filter(task => task.completed)
      .forEach(task => {
        taskCounts[task.taskName] = (taskCounts[task.taskName] || 0) + 1;
      });
    
    // Format the data
    const taskTypeBreakdown = Object.entries(taskCounts).map(([name, count]) => ({
      name,
      count
    }));
    
    // Format daily stats for charts
    const days = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (29 - i));
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        registrations: dailyRegistrations[dateStr] || 0,
        taskCompletions: dailyTaskCompletions[dateStr] || 0
      });
    }
    
    return {
      totalUsers,
      activeUsers,
      totalCompletedTasks,
      totalPointsClaimed,
      dailyStats: days,
      taskTypeBreakdown
    };
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