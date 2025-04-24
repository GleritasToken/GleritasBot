import { 
  users, type User, type InsertUser,
  userTasks, type UserTask, type InsertUserTask,
  referrals, type Referral, type InsertReferral,
  tasks, type Task, type InsertTask,
  withdrawals, type Withdrawal, type InsertWithdrawal,
  type UserWithTasks, type TaskName
} from "@shared/schema";
import crypto from 'crypto';
import session from "express-session";
import createMemoryStore from "memorystore";

// Storage interface for all CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  getUserByReferralCode(referralCode: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  getUserWithTasks(userId: number): Promise<UserWithTasks | undefined>;
  checkDuplicateRegistration(ipAddress: string, fingerprint: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  deleteAllUsers(): Promise<boolean>;
  
  // Task operations
  getAllTasks(): Promise<Task[]>;
  getTask(name: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  getUserTasks(userId: number): Promise<UserTask[]>;
  getCompletedTasks(userId: number): Promise<UserTask[]>;
  completeUserTask(userTask: InsertUserTask): Promise<UserTask>;
  checkTaskCompletion(userId: number, taskName: string): Promise<boolean>;
  getAllUserTasks(): Promise<UserTask[]>;
  resetAllUserTasks(): Promise<boolean>;
  
  // Referral operations
  createReferral(referral: InsertReferral): Promise<Referral>;
  getReferralsByReferrer(referrerId: number): Promise<Referral[]>;
  countReferrals(referrerId: number): Promise<number>;
  
  // Withdrawal operations
  createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal>;
  getWithdrawalsByUser(userId: number): Promise<Withdrawal[]>;
  updateWithdrawalStatus(id: number, status: string, txHash?: string): Promise<Withdrawal | undefined>;
  getWithdrawalById(id: number): Promise<Withdrawal | undefined>;
  getAllWithdrawals(): Promise<Withdrawal[]>;
  updateWithdrawalWithAdminAction(id: number, status: string, adminId: number, notes?: string, rejectionReason?: string, txHash?: string): Promise<Withdrawal | undefined>;

  // Admin operations
  banUser(userId: number, banReason: string): Promise<User | undefined>;
  unbanUser(userId: number): Promise<User | undefined>;
  resetUserTokens(userId: number): Promise<User | undefined>;
  getTaskCompletionStats(): Promise<any>;
  getUserActivityStats(): Promise<any>;
  getTokenAllocationStats(): Promise<{ totalTokensClaimed: number, totalAllocation: number }>;
  
  // Init data
  initializeDefaultTasks(): Promise<void>;
  
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private userTasks: Map<number, UserTask>;
  private referrals: Map<number, Referral>;
  private tasks: Map<number, Task>;
  private withdrawals: Map<number, Withdrawal>;
  
  private currentUserId: number;
  private currentUserTaskId: number;
  private currentReferralId: number;
  private currentTaskId: number;
  private currentWithdrawalId: number;
  
  // Session store for Express
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.userTasks = new Map();
    this.referrals = new Map();
    this.tasks = new Map();
    this.withdrawals = new Map();
    
    this.currentUserId = 1;
    this.currentUserTaskId = 1;
    this.currentReferralId = 1;
    this.currentTaskId = 1;
    this.currentWithdrawalId = 1;
    
    // Create memory store for sessions
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // User Operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.walletAddress === walletAddress
    );
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.referralCode === referralCode
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    // Use the username as the referral code (Telegram username)
    const referralCode = insertUser.username;
    
    // Ensure proper null values for nullable fields
    const user: User = { 
      id,
      username: insertUser.username,
      walletAddress: insertUser.walletAddress || null,
      telegramId: null,
      referralCode,
      referredBy: insertUser.referredBy || null,
      ipAddress: insertUser.ipAddress || null,
      fingerprint: insertUser.fingerprint || null,
      totalTokens: 0,
      referralTokens: 0,
      referralCount: 0,
      isBanned: false,
      banReason: null,
      createdAt: new Date()
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUserWithTasks(userId: number): Promise<UserWithTasks | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const userTasksList = await this.getUserTasks(userId);
    return { ...user, tasks: userTasksList };
  }

  async checkDuplicateRegistration(ipAddress: string, fingerprint: string): Promise<boolean> {
    return Array.from(this.users.values()).some(
      (user) => user.ipAddress === ipAddress || user.fingerprint === fingerprint
    );
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async deleteAllUsers(): Promise<boolean> {
    try {
      // Clear all users
      this.users.clear();
      this.currentUserId = 1;
      
      // Clear all user tasks
      this.userTasks.clear();
      this.currentUserTaskId = 1;
      
      // Clear all referrals
      this.referrals.clear();
      this.currentReferralId = 1;
      
      // Clear all withdrawals
      this.withdrawals.clear();
      this.currentWithdrawalId = 1;
      
      return true;
    } catch (error) {
      console.error("Error deleting all users:", error);
      return false;
    }
  }

  // Task Operations
  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTask(name: string): Promise<Task | undefined> {
    return Array.from(this.tasks.values()).find(
      (task) => task.name === name
    );
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const task: Task = { 
      id,
      name: insertTask.name,
      description: insertTask.description,
      tokenAmount: insertTask.tokenAmount,
      isRequired: insertTask.isRequired ?? true, // Default to true if not specified
      iconClass: insertTask.iconClass,
      link: insertTask.link || null,
      createdAt: new Date()
    };
    
    this.tasks.set(id, task);
    return task;
  }
  
  async updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...taskData };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  async deleteTask(id: number): Promise<boolean> {
    const task = this.tasks.get(id);
    if (!task) return false;
    
    // Delete the task
    this.tasks.delete(id);
    
    // Also find and delete any user completions of this task
    const taskName = task.name;
    const userTasksToDelete = Array.from(this.userTasks.entries())
      .filter(([_, userTask]) => userTask.taskName === taskName);
      
    for (const [userTaskId, _] of userTasksToDelete) {
      this.userTasks.delete(userTaskId);
    }
    
    return true;
  }

  async getUserTasks(userId: number): Promise<UserTask[]> {
    return Array.from(this.userTasks.values()).filter(
      (userTask) => userTask.userId === userId
    );
  }

  async getCompletedTasks(userId: number): Promise<UserTask[]> {
    return Array.from(this.userTasks.values()).filter(
      (userTask) => userTask.userId === userId && userTask.completed
    );
  }

  async completeUserTask(insertUserTask: InsertUserTask): Promise<UserTask> {
    // Get the task to determine token amount
    const task = await this.getTask(insertUserTask.taskName);
    const tokenAmount = task ? task.tokenAmount : 0;
    
    const id = this.currentUserTaskId++;
    const userTask: UserTask = { 
      id,
      userId: insertUserTask.userId,
      taskName: insertUserTask.taskName,
      verificationData: insertUserTask.verificationData || null,
      tokenAmount,
      completed: true,
      completedAt: new Date()
    };
    
    this.userTasks.set(id, userTask);
    
    // Update user's total tokens
    const user = await this.getUser(insertUserTask.userId);
    if (user) {
      const updatedTotalTokens = user.totalTokens + tokenAmount;
      await this.updateUser(user.id, { totalTokens: updatedTotalTokens });
    }
    
    return userTask;
  }

  async checkTaskCompletion(userId: number, taskName: string): Promise<boolean> {
    return Array.from(this.userTasks.values()).some(
      (userTask) => userTask.userId === userId && 
                    userTask.taskName === taskName && 
                    userTask.completed
    );
  }
  
  async getAllUserTasks(): Promise<UserTask[]> {
    return Array.from(this.userTasks.values());
  }
  
  async resetAllUserTasks(): Promise<boolean> {
    try {
      // Get all users
      const users = await this.getAllUsers();
      
      // Clear all user tasks
      this.userTasks.clear();
      this.currentUserTaskId = 1;
      
      // Reset totalTokens for all users (but keep referral tokens)
      for (const user of users) {
        // Only subtract task-earned tokens (not referral tokens)
        const taskTokens = user.totalTokens - user.referralTokens;
        await this.updateUser(user.id, { 
          totalTokens: user.referralTokens // Keep only referral tokens
        });
      }
      
      return true;
    } catch (error) {
      console.error("Error resetting all user tasks:", error);
      return false;
    }
  }

  // Referral Operations
  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const id = this.currentReferralId++;
    // Default token amount is 5 if not provided
    const tokenAmount = insertReferral.tokenAmount ?? 5;
    
    const referral: Referral = { 
      id,
      referrerUserId: insertReferral.referrerUserId,
      referredUserId: insertReferral.referredUserId,
      tokenAmount,
      createdAt: new Date()
    };
    
    this.referrals.set(id, referral);
    
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
    
    return referral;
  }

  async getReferralsByReferrer(referrerId: number): Promise<Referral[]> {
    return Array.from(this.referrals.values()).filter(
      (referral) => referral.referrerUserId === referrerId
    );
  }

  async countReferrals(referrerId: number): Promise<number> {
    const referrals = await this.getReferralsByReferrer(referrerId);
    return referrals.length;
  }

  // Withdrawal Operations
  async createWithdrawal(insertWithdrawal: InsertWithdrawal): Promise<Withdrawal> {
    const id = this.currentWithdrawalId++;
    const withdrawal: Withdrawal = { 
      ...insertWithdrawal, 
      id,
      txHash: null,
      createdAt: new Date(),
      bnbFeeCollected: insertWithdrawal.bnbFeeCollected || false,
      adminNotes: null,
      rejectionReason: null,
      approvedBy: null,
      approvedAt: null
    };
    
    this.withdrawals.set(id, withdrawal);
    return withdrawal;
  }

  async getWithdrawalsByUser(userId: number): Promise<Withdrawal[]> {
    return Array.from(this.withdrawals.values()).filter(
      (withdrawal) => withdrawal.userId === userId
    );
  }

  async updateWithdrawalStatus(id: number, status: string, txHash?: string): Promise<Withdrawal | undefined> {
    const withdrawal = this.withdrawals.get(id);
    if (!withdrawal) return undefined;

    const updatedWithdrawal: Withdrawal = { 
      ...withdrawal, 
      status,
      ...(txHash && { txHash: txHash })
    };
    
    this.withdrawals.set(id, updatedWithdrawal);
    return updatedWithdrawal;
  }
  
  async getWithdrawalById(id: number): Promise<Withdrawal | undefined> {
    return this.withdrawals.get(id);
  }
  
  async getAllWithdrawals(): Promise<Withdrawal[]> {
    return Array.from(this.withdrawals.values());
  }
  
  async updateWithdrawalWithAdminAction(
    id: number, 
    status: string, 
    adminId: number, 
    notes?: string, 
    rejectionReason?: string,
    txHash?: string
  ): Promise<Withdrawal | undefined> {
    const withdrawal = this.withdrawals.get(id);
    if (!withdrawal) return undefined;

    const updatedWithdrawal: Withdrawal = { 
      ...withdrawal, 
      status,
      adminNotes: notes || null,
      rejectionReason: status === 'rejected' ? (rejectionReason || 'Rejected by admin') : null,
      approvedBy: ['completed', 'processing'].includes(status) ? adminId : null,
      approvedAt: ['completed', 'processing'].includes(status) ? new Date() : null,
      ...(txHash && { txHash })
    };
    
    this.withdrawals.set(id, updatedWithdrawal);
    return updatedWithdrawal;
  }
  
  // Admin Operations
  async banUser(userId: number, banReason: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user,
      isBanned: true,
      banReason
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async unbanUser(userId: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user,
      isBanned: false,
      banReason: null
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async resetUserTokens(userId: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    // Delete all user tasks
    for (const [id, task] of this.userTasks.entries()) {
      if (task.userId === userId) {
        this.userTasks.delete(id);
      }
    }
    
    // Reset user data completely
    const updatedUser = { 
      ...user,
      totalTokens: 0,
      referralTokens: 0,
      telegramId: null,
      walletAddress: null
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async getTaskCompletionStats(): Promise<any> {
    const allTasks = await this.getAllTasks();
    const allUserTasks = await this.getAllUserTasks();
    
    const stats = allTasks.map(task => {
      const completions = allUserTasks.filter(ut => ut.taskName === task.name && ut.completed);
      const completionCount = completions.length;
      const totalTokensAwarded = completions.reduce((sum, ut) => sum + ut.tokenAmount, 0);
      
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
    
    return stats;
  }
  
  async getUserActivityStats(): Promise<any> {
    const users = await this.getAllUsers();
    const userTasks = await this.getAllUserTasks();
    const withdrawals = await this.getAllWithdrawals();
    
    const totalUsers = users.length;
    const activeUsers = users.filter(user => {
      return userTasks.some(task => task.userId === user.id && task.completed);
    }).length;
    
    const totalCompletedTasks = userTasks.filter(task => task.completed).length;
    const totalTokensClaimed = withdrawals
      .filter(w => w.status === 'completed')
      .reduce((sum, w) => sum + w.amount, 0);
    
    const dailyStats = this._calculateDailyStats(users, userTasks);
    const taskTypeBreakdown = this._calculateTaskTypeBreakdown(userTasks);
    
    return {
      totalUsers,
      activeUsers,
      totalCompletedTasks,
      totalTokensClaimed,
      dailyStats,
      taskTypeBreakdown
    };
  }
  
  async getTokenAllocationStats(): Promise<{ totalTokensClaimed: number, totalAllocation: number }> {
    // Sum up all tokens earned by users (both from tasks and referrals)
    const users = await this.getAllUsers();
    const totalTokensClaimed = users.reduce((sum, user) => sum + user.totalTokens, 0);
    
    // Total allocation is 500,000 GLRS tokens
    const totalAllocation = 500000;
    
    return {
      totalTokensClaimed,
      totalAllocation
    };
  }
  
  // Helper methods for statistics
  private _calculateDailyStats(users: User[], userTasks: UserTask[]): any {
    const now = new Date();
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    });
    
    const registrations = last30Days.map(date => {
      const count = users.filter(user => {
        const userDate = user.createdAt.toISOString().split('T')[0];
        return userDate === date;
      }).length;
      
      return { date, count };
    });
    
    const taskCompletions = last30Days.map(date => {
      const count = userTasks.filter(task => {
        if (!task.completedAt) return false;
        const taskDate = task.completedAt.toISOString().split('T')[0];
        return taskDate === date;
      }).length;
      
      return { date, count };
    });
    
    return { registrations, taskCompletions };
  }
  
  private _calculateTaskTypeBreakdown(userTasks: UserTask[]): any {
    // Get unique task names without using Set spread
    const taskNamesSet = new Set<string>();
    userTasks.forEach(task => taskNamesSet.add(task.taskName));
    const taskNames = Array.from(taskNamesSet);
    
    return taskNames.map(name => {
      const count = userTasks.filter(task => task.taskName === name && task.completed).length;
      return { name, count };
    });
  }

  // No longer needed as we use the username directly as the referral code

  // Initialize default tasks
  async initializeDefaultTasks(): Promise<void> {
    const defaultTasks: InsertTask[] = [
      {
        name: "telegram_connect",
        description: "Connect your Telegram account",
        tokenAmount: 30,
        isRequired: true,
        iconClass: "fab fa-telegram-plane text-blue-500",
        link: null
      },
      {
        name: "telegram_group",
        description: "Join our official Telegram group",
        tokenAmount: 10,
        isRequired: true,
        iconClass: "fab fa-telegram-plane text-blue-500",
        link: "https://t.me/+hcJdayisPFIxOGVk"
      },
      {
        name: "telegram_channel",
        description: "Subscribe to our announcement channel",
        tokenAmount: 5,
        isRequired: true,
        iconClass: "fab fa-telegram-plane text-blue-500",
        link: "https://t.me/gleritaschat"
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
        link: "https://www.youtube.com"
      },
      {
        name: "wallet_submit",
        description: "Provide a valid wallet address for token distribution",
        tokenAmount: 0,
        isRequired: true,
        iconClass: "fas fa-wallet text-yellow-500",
        link: null
      }
    ];

    for (const task of defaultTasks) {
      const existingTask = await this.getTask(task.name);
      if (!existingTask) {
        await this.createTask(task);
      }
    }
  }
}

// Import database storage implementation
import { DatabaseStorage } from './database-storage';

// Use database storage instead of memory storage
export const storage = new DatabaseStorage();

// Initialize default tasks
storage.initializeDefaultTasks();
