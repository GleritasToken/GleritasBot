import { 
  users, type User, type InsertUser,
  userTasks, type UserTask, type InsertUserTask,
  referrals, type Referral, type InsertReferral,
  tasks, type Task, type InsertTask,
  withdrawals, type Withdrawal, type InsertWithdrawal,
  type UserWithTasks, type TaskName
} from "@shared/schema";
import crypto from 'crypto';

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
  
  // Task operations
  getAllTasks(): Promise<Task[]>;
  getTask(name: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  getUserTasks(userId: number): Promise<UserTask[]>;
  getCompletedTasks(userId: number): Promise<UserTask[]>;
  completeUserTask(userTask: InsertUserTask): Promise<UserTask>;
  checkTaskCompletion(userId: number, taskName: string): Promise<boolean>;
  
  // Referral operations
  createReferral(referral: InsertReferral): Promise<Referral>;
  getReferralsByReferrer(referrerId: number): Promise<Referral[]>;
  countReferrals(referrerId: number): Promise<number>;
  
  // Withdrawal operations
  createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal>;
  getWithdrawalsByUser(userId: number): Promise<Withdrawal[]>;
  updateWithdrawalStatus(id: number, status: string, txHash?: string): Promise<Withdrawal | undefined>;
  
  // Init data
  initializeDefaultTasks(): Promise<void>;
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
    // Generate a unique referral code if not provided
    const referralCode = insertUser.referralCode || this.generateReferralCode();
    
    const user: User = { 
      ...insertUser, 
      id, 
      referralCode,
      totalTokens: 0,
      referralTokens: 0,
      referralCount: 0,
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
      ...insertTask, 
      id,
      createdAt: new Date()
    };
    
    this.tasks.set(id, task);
    return task;
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
      ...insertUserTask, 
      id,
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

  // Referral Operations
  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const id = this.currentReferralId++;
    const referral: Referral = { 
      ...insertReferral, 
      id,
      createdAt: new Date()
    };
    
    this.referrals.set(id, referral);
    
    // Update referrer's stats
    const referrer = await this.getUser(insertReferral.referrerUserId);
    if (referrer) {
      const newReferralCount = referrer.referralCount + 1;
      const newReferralTokens = referrer.referralTokens + insertReferral.tokenAmount;
      const newTotalTokens = referrer.totalTokens + insertReferral.tokenAmount;
      
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
      transactionHash: null,
      createdAt: new Date()
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
      ...(txHash && { transactionHash: txHash })
    };
    
    this.withdrawals.set(id, updatedWithdrawal);
    return updatedWithdrawal;
  }

  // Helper methods
  private generateReferralCode(): string {
    return crypto.randomBytes(4).toString('hex');
  }

  // Initialize default tasks
  async initializeDefaultTasks(): Promise<void> {
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

    for (const task of defaultTasks) {
      const existingTask = await this.getTask(task.name);
      if (!existingTask) {
        await this.createTask(task);
      }
    }
  }
}

// Create and export storage instance
export const storage = new MemStorage();

// Initialize default tasks
storage.initializeDefaultTasks();
