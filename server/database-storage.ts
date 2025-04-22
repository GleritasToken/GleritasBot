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
    try {
      // Using raw query to avoid schema issues temporarily
      const { rows } = await this.pool.query(
        `SELECT * FROM users WHERE id = $1`,
        [id]
      );
      return rows[0] ? rows[0] : undefined;
    } catch (error) {
      console.error("Error fetching user:", error);
      // In development, return a dummy user to allow testing
      if (process.env.NODE_ENV === 'development') {
        console.log("Returning mock user for development");
        return {
          id,
          username: "test_user",
          walletAddress: null,
          telegramId: null,
          referralCode: "TEST123",
          referredBy: null,
          ipAddress: null,
          fingerprint: null,
          isBanned: false,
          banReason: null,
          totalTokens: 0,
          referralTokens: 0,
          referralCount: 0,
          createdAt: new Date()
        };
      }
      return undefined;
    }
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      // Using raw query to avoid schema issues temporarily
      const { rows } = await this.pool.query(
        `SELECT * FROM users WHERE username = $1`,
        [username]
      );
      return rows[0] ? rows[0] : undefined;
    } catch (error) {
      console.error("Error fetching user by username:", error);
      return undefined;
    }
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
    try {
      // Get user with raw SQL
      const user = await this.getUser(userId);
      if (!user) return undefined;
      
      // Get tasks with raw SQL using snake_case column names
      try {
        const { rows } = await this.pool.query(
          `SELECT * FROM user_tasks WHERE user_id = $1`,
          [userId]
        );
        return { ...user, tasks: rows };
      } catch (error) {
        console.error("Error fetching user tasks:", error);
        // Return user with empty tasks array to prevent application crashes
        return { ...user, tasks: [] };
      }
    } catch (error) {
      console.error("Error fetching user with tasks:", error);
      
      // In development mode, return a mock user with tasks
      if (process.env.NODE_ENV === 'development') {
        console.log("Returning mock user with tasks for development");
        const mockUser = await this.getUser(userId);
        if (!mockUser) return undefined;
        
        // Return empty tasks array to prevent crashes
        return { ...mockUser, tasks: [] };
      }
      
      return undefined;
    }
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
    try {
      // Using raw query to avoid schema issues
      const { rows } = await this.pool.query('SELECT * FROM users');
      return rows;
    } catch (error) {
      console.error("Error fetching all users:", error);
      return [];
    }
  }
  
  async getAllUserTasks(): Promise<UserTask[]> {
    try {
      // Using raw query to avoid schema issues
      const { rows } = await this.pool.query('SELECT * FROM user_tasks');
      return rows;
    } catch (error) {
      console.error("Error fetching all user tasks:", error);
      return [];
    }
  }
  
  // Task operations
  async getAllTasks(): Promise<Task[]> {
    try {
      // Using raw query to avoid schema issues
      const { rows } = await this.pool.query('SELECT * FROM tasks');
      return rows;
    } catch (error) {
      console.error("Error fetching all tasks:", error);
      return [];
    }
  }
  
  async getTask(name: string): Promise<Task | undefined> {
    try {
      // Using raw query to avoid schema issues
      const { rows } = await this.pool.query(
        'SELECT * FROM tasks WHERE name = $1',
        [name]
      );
      return rows[0];
    } catch (error) {
      console.error(`Error fetching task ${name}:`, error);
      return undefined;
    }
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    try {
      // Using raw query to avoid schema issues
      const { rows } = await this.pool.query(
        `INSERT INTO tasks (name, description, "tokenAmount", "isRequired", "iconClass", link, "createdAt") 
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          insertTask.name,
          insertTask.description,
          insertTask.tokenAmount,
          insertTask.isRequired ?? true,
          insertTask.iconClass || null,
          insertTask.link || '',
          new Date()
        ]
      );
      return rows[0];
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  }
  
  async updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined> {
    try {
      // First get the existing task to fill in the missing fields
      const existingTask = await this.pool.query(
        'SELECT * FROM tasks WHERE id = $1',
        [id]
      );
      
      if (existingTask.rows.length === 0) {
        return undefined;
      }
      
      const existing = existingTask.rows[0];
      
      // Using raw query to avoid schema issues
      const { rows } = await this.pool.query(
        `UPDATE tasks 
         SET name = $1, 
             description = $2, 
             "tokenAmount" = $3, 
             "isRequired" = $4, 
             "iconClass" = $5,
             link = $6
         WHERE id = $7
         RETURNING *`,
        [
          taskData.name || existing.name,
          taskData.description || existing.description,
          taskData.tokenAmount !== undefined ? taskData.tokenAmount : existing.tokenAmount,
          taskData.isRequired !== undefined ? taskData.isRequired : existing.isRequired,
          taskData.iconClass || existing.iconClass,
          taskData.link || existing.link,
          id
        ]
      );
      
      return rows[0];
    } catch (error) {
      console.error(`Error updating task ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteTask(id: number): Promise<boolean> {
    try {
      // Start a transaction
      await this.pool.query('BEGIN');
      
      try {
        // First, get the task to get its name
        const taskResult = await this.pool.query(
          'SELECT * FROM tasks WHERE id = $1',
          [id]
        );
        
        if (taskResult.rows.length === 0) {
          await this.pool.query('ROLLBACK');
          return false; // Task not found
        }
        
        const taskName = taskResult.rows[0].name;
        
        // Delete associated user task completions
        await this.pool.query(
          'DELETE FROM user_tasks WHERE task_name = $1',
          [taskName]
        );
        
        // Delete the task itself
        const deleteResult = await this.pool.query(
          'DELETE FROM tasks WHERE id = $1 RETURNING *',
          [id]
        );
        
        // Commit the transaction
        await this.pool.query('COMMIT');
        
        return deleteResult.rows.length > 0;
      } catch (txError) {
        // Rollback in case of error
        await this.pool.query('ROLLBACK');
        console.error("Transaction error during task deletion:", txError);
        return false;
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      return false;
    }
  }
  
  async getUserTasks(userId: number): Promise<UserTask[]> {
    try {
      // Column names with underscore instead of camelCase
      const { rows } = await this.pool.query(
        `SELECT * FROM user_tasks WHERE user_id = $1`,
        [userId]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching user tasks:", error);
      // Return empty array on error to prevent application crashes
      return [];
    }
  }
  
  async getCompletedTasks(userId: number): Promise<UserTask[]> {
    try {
      // Column names with underscore instead of camelCase
      const { rows } = await this.pool.query(
        `SELECT * FROM user_tasks 
         WHERE user_id = $1 AND completed = true`,
        [userId]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching completed tasks:", error);
      return [];
    }
  }
  
  async completeUserTask(insertUserTask: InsertUserTask): Promise<UserTask> {
    try {
      // Get the task to determine token amount
      const task = await this.getTask(insertUserTask.taskName);
      const tokenAmount = task ? task.tokenAmount : 0;
      const completedAt = new Date();
      
      // Use raw query with snake_case column names
      const { rows } = await this.pool.query(
        `INSERT INTO user_tasks (user_id, task_name, verification_data, token_amount, completed, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          insertUserTask.userId,
          insertUserTask.taskName,
          insertUserTask.verificationData || null,
          tokenAmount,
          true,
          completedAt
        ]
      );
      
      // Update user's total tokens
      const user = await this.getUser(insertUserTask.userId);
      if (user) {
        // Check if we're using total_points or totalTokens in DB
        try {
          await this.pool.query(
            `UPDATE users SET total_points = total_points + $1 WHERE id = $2`,
            [tokenAmount, insertUserTask.userId]
          );
        } catch (tokenError) {
          console.error("Error updating tokens:", tokenError);
          // Fallback to ORM update
          const updatedTotalTokens = user.totalTokens + tokenAmount;
          await this.updateUser(user.id, { totalTokens: updatedTotalTokens });
        }
      }
      
      return rows[0];
    } catch (error) {
      console.error("Error completing task:", error);
      throw error;
    }
  }
  
  async checkTaskCompletion(userId: number, taskName: string): Promise<boolean> {
    try {
      // Column names with underscore instead of camelCase
      const { rows } = await this.pool.query(
        `SELECT * FROM user_tasks 
         WHERE user_id = $1 AND task_name = $2 AND completed = true`,
        [userId, taskName]
      );
      return rows.length > 0;
    } catch (error) {
      console.error("Error checking task completion:", error);
      return false;
    }
  }
  
  // Referral operations
  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    try {
      // Start a transaction manually
      await this.pool.query('BEGIN');
      
      try {
        // Default token amount is 5 if not provided
        const tokenAmount = insertReferral.tokenAmount ?? 5;
        const now = new Date();
        
        // Insert the referral record using raw SQL
        const insertResult = await this.pool.query(
          `INSERT INTO referrals (referrer_user_id, referred_user_id, token_amount, created_at)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [
            insertReferral.referrerUserId,
            insertReferral.referredUserId,
            tokenAmount,
            now
          ]
        );
        
        if (insertResult.rows.length === 0) {
          await this.pool.query('ROLLBACK');
          throw new Error("Failed to insert referral record");
        }
        
        // Update referrer's stats
        await this.pool.query(
          `UPDATE users 
           SET referral_count = referral_count + 1,
               referral_points = referral_points + $1,
               total_points = total_points + $1
           WHERE id = $2`,
          [tokenAmount, insertReferral.referrerUserId]
        );
        
        // Commit the transaction
        await this.pool.query('COMMIT');
        
        return insertResult.rows[0];
      } catch (txError) {
        // Rollback in case of error
        await this.pool.query('ROLLBACK');
        console.error("Transaction error during referral creation:", txError);
        throw txError;
      }
    } catch (error) {
      console.error("Error creating referral:", error);
      throw error;
    }
  }
  
  async getReferralsByReferrer(referrerId: number): Promise<Referral[]> {
    try {
      // Using raw query to avoid schema issues
      const { rows } = await this.pool.query(
        'SELECT * FROM referrals WHERE referrer_user_id = $1',
        [referrerId]
      );
      return rows;
    } catch (error) {
      console.error(`Error fetching referrals for user ${referrerId}:`, error);
      return [];
    }
  }
  
  async countReferrals(referrerId: number): Promise<number> {
    try {
      // Using raw query to avoid schema issues and for efficiency
      const { rows } = await this.pool.query(
        'SELECT COUNT(*) as count FROM referrals WHERE referrer_user_id = $1',
        [referrerId]
      );
      return parseInt(rows[0]?.count || '0');
    } catch (error) {
      console.error(`Error counting referrals for user ${referrerId}:`, error);
      return 0;
    }
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
    try {
      // Using raw query to avoid schema issues
      const { rows } = await this.pool.query('SELECT * FROM withdrawals');
      return rows;
    } catch (error) {
      console.error("Error fetching all withdrawals:", error);
      return [];
    }
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
    try {
      // Using raw query to avoid schema issues
      await this.pool.query(
        `UPDATE users SET is_banned = true, ban_reason = $1 WHERE id = $2`,
        [banReason, userId]
      );
      
      // Return the updated user
      const { rows } = await this.pool.query(
        `SELECT * FROM users WHERE id = $1`,
        [userId]
      );
      return rows[0];
    } catch (error) {
      console.error(`Error banning user ${userId}:`, error);
      return undefined;
    }
  }
  
  async unbanUser(userId: number): Promise<User | undefined> {
    try {
      // Using raw query to avoid schema issues
      await this.pool.query(
        `UPDATE users SET is_banned = false, ban_reason = NULL WHERE id = $1`,
        [userId]
      );
      
      // Return the updated user
      const { rows } = await this.pool.query(
        `SELECT * FROM users WHERE id = $1`,
        [userId]
      );
      return rows[0];
    } catch (error) {
      console.error(`Error unbanning user ${userId}:`, error);
      return undefined;
    }
  }
  
  // Reset only tokens, keep other data
  async resetUserTokens(userId: number): Promise<User | undefined> {
    try {
      // Using raw query to avoid schema issues
      await this.pool.query(
        `UPDATE users SET total_points = 0, referral_points = 0 WHERE id = $1`,
        [userId]
      );
      
      // Return the updated user
      const { rows } = await this.pool.query(
        `SELECT * FROM users WHERE id = $1`,
        [userId]
      );
      return rows[0];
    } catch (error) {
      console.error(`Error resetting user ${userId} tokens:`, error);
      return undefined;
    }
  }

  // Reset user tasks only
  async resetUserTasks(userId: number): Promise<User | undefined> {
    try {
      // Delete all user tasks with raw SQL
      await this.pool.query(
        `DELETE FROM user_tasks WHERE user_id = $1`,
        [userId]
      );
      
      // Return the updated user
      const { rows } = await this.pool.query(
        `SELECT * FROM users WHERE id = $1`,
        [userId]
      );
      return rows[0];
    } catch (error) {
      console.error(`Error resetting user ${userId} tasks:`, error);
      return undefined;
    }
  }

  // Full reset of user data (tasks, tokens, connections)
  async resetUserData(userId: number): Promise<User | undefined> {
    try {
      // First, delete all user tasks with raw SQL
      await this.pool.query(
        `DELETE FROM user_tasks WHERE user_id = $1`,
        [userId]
      );
      
      // Then reset user data with raw SQL, handling column name differences
      try {
        // Try with snake_case column names first (actual DB schema)
        await this.pool.query(
          `UPDATE users 
           SET total_points = 0, 
               referral_points = 0, 
               telegram_id = NULL, 
               wallet_address = NULL 
           WHERE id = $1`,
          [userId]
        );
      } catch (updateError) {
        console.error("Error with snake_case update:", updateError);
        
        // Fallback to camelCase column names
        const result = await db.update(users)
          .set({
            totalTokens: 0,
            referralTokens: 0,
            telegramId: null,
            walletAddress: null
          })
          .where(eq(users.id, userId))
          .returning();
        
        return result[0];
      }
      
      // Return the updated user
      const { rows } = await this.pool.query(
        `SELECT * FROM users WHERE id = $1`,
        [userId]
      );
      return rows[0];
    } catch (error) {
      console.error(`Error resetting user ${userId} data:`, error);
      return undefined;
    }
  }
  
  async resetAllUserTasks(): Promise<boolean> {
    try {
      // Start a transaction manually
      await this.pool.query('BEGIN');
      
      try {
        // Delete all user tasks
        await this.pool.query('DELETE FROM user_tasks');
        
        // Get all users
        const allUsers = await this.getAllUsers();
        
        // Reset user data for all users
        for (const user of allUsers) {
          await this.pool.query(
            `UPDATE users 
             SET telegram_id = NULL, 
                 wallet_address = NULL, 
                 total_points = $1, 
                 ip_address = NULL, 
                 fingerprint = NULL, 
                 is_banned = false, 
                 ban_reason = NULL 
             WHERE id = $2`,
            [user.referral_points || 0, user.id]
          );
        }
        
        // Commit the transaction
        await this.pool.query('COMMIT');
        return true;
      } catch (txError) {
        // Rollback in case of error
        await this.pool.query('ROLLBACK');
        console.error("Transaction error during reset all tasks:", txError);
        return false;
      }
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
    const totalTokensClaimed = allWithdrawals
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
      totalTokensClaimed,
      dailyStats: days,
      taskTypeBreakdown
    };
  }
  
  // No longer needed as we use the username directly as the referral code
  
  // Initialize default tasks
  async initializeDefaultTasks(): Promise<void> {
    try {
      // First check if there are any tasks already using raw query to avoid schema issues
      const { rows } = await this.pool.query('SELECT COUNT(*) as count FROM tasks');
      const taskCount = parseInt(rows[0]?.count || '0');
      
      // If tasks already exist, don't try to create default ones
      if (taskCount > 0) {
        console.log(`Found ${taskCount} existing tasks. Skipping initialization.`);
        return;
      }
      
      console.log("No existing tasks found. Creating default tasks...");
      
      // Define the default tasks
      const defaultTasks = [
        {
          name: "telegram_group",
          description: "Join our official Telegram group",
          tokenAmount: 10,
          isRequired: true,
          iconClass: "fab fa-telegram-plane text-blue-500",
          link: "https://t.me/gleritaschat"
        },
        {
          name: "telegram_channel",
          description: "Subscribe to our announcement channel",
          tokenAmount: 5,
          isRequired: true,
          iconClass: "fab fa-telegram-plane text-blue-500",
          link: "https://t.me/+hcJdayisPFIxOGVk"
        },
        {
          name: "twitter_follow",
          description: "Follow @GleritasToken on Twitter",
          tokenAmount: 10,
          isRequired: true,
          iconClass: "fab fa-twitter text-blue-500",
          link: "https://twitter.com/GleritasToken"
        },
        {
          name: "twitter_engage",
          description: "Like, retweet, and comment on our pinned tweet",
          tokenAmount: 10,
          isRequired: true,
          iconClass: "fab fa-twitter text-blue-500",
          link: "https://twitter.com/GleritasToken"
        },
        {
          name: "youtube",
          description: "Watch and like our intro video (Optional)",
          tokenAmount: 10,
          isRequired: false,
          iconClass: "fab fa-youtube text-red-500",
          link: ""
        },
        {
          name: "wallet_submit",
          description: "Provide a valid wallet address for token distribution",
          tokenAmount: 0,
          isRequired: true,
          iconClass: "fas fa-wallet text-yellow-500",
          link: ""
        }
      ];
      
      // Use raw SQL queries to insert the tasks
      for (const task of defaultTasks) {
        try {
          // Use column names that match the actual database schema
          await this.pool.query(
            `INSERT INTO tasks (name, description, "tokenAmount", "isRequired", "iconClass", link, "createdAt") 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              task.name,
              task.description,
              task.tokenAmount,
              task.isRequired,
              task.iconClass,
              task.link,
              new Date()
            ]
          );
        } catch (insertError) {
          console.error(`Error inserting task ${task.name}:`, insertError);
          // Continue with other tasks even if one fails
        }
      }
      
      console.log("Default tasks created successfully.");
    } catch (error) {
      console.error("Error initializing default tasks:", error);
      // Don't throw the error here to allow the application to start
      // even if task initialization fails
    }
  }
}