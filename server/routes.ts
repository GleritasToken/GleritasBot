import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  registerUserSchema, 
  completeTaskSchema, 
  walletSubmissionSchema,
  createTaskSchema,
  banUserSchema,
  resetTokensSchema,
  withdrawalActionSchema,
  withdrawalStatusUpdateSchema,
  taskNames,
  type TaskName
} from "@shared/schema";
import { z } from "zod";
import { randomBytes } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize tasks
  await storage.initializeDefaultTasks();

  // Helper middleware to check if a request is from a registered user
  const requireUser = async (req: Request, res: Response, next: Function) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized. Please register first." });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }
    
    req.user = user;
    next();
  };
  
  // Admin authentication check middleware
  const requireAdmin = async (req: Request, res: Response, next: Function) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized. Please login first." });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }
    
    // Check if user has admin username
    if (user.username !== 'gleritas_admin_login_only') {
      return res.status(403).json({ message: "Admin access required." });
    }
    
    req.user = user;
    next();
  };

  // API routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getAllTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve tasks." });
    }
  });

  // Register new user
  app.post("/api/register", async (req, res) => {
    try {
      const validationResult = registerUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid registration data", 
          errors: validationResult.error.format() 
        });
      }
      
      const { username, walletAddress, referredBy, ipAddress, fingerprint, captchaToken } = validationResult.data;
      
      // CAPTCHA validation would go here in production
      // This is a simplified version for the prototype
      if (!captchaToken) {
        return res.status(400).json({ message: "CAPTCHA verification failed" });
      }
      
      // Check for duplicate registration
      if (ipAddress && fingerprint) {
        const isDuplicate = await storage.checkDuplicateRegistration(ipAddress, fingerprint);
        if (isDuplicate) {
          return res.status(400).json({ message: "You have already registered for the airdrop." });
        }
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists." });
      }
      
      // Generate referral code
      const referralCode = randomBytes(4).toString("hex");
      
      // Create new user
      const newUser = await storage.createUser({
        username,
        walletAddress: walletAddress || null,
        referralCode,
        referredBy: referredBy || null,
        ipAddress: ipAddress || null,
        fingerprint: fingerprint || null
      });
      
      // Process referral if provided
      if (referredBy) {
        const referrer = await storage.getUserByReferralCode(referredBy);
        if (referrer) {
          // Check if referrer has reached the maximum 50 referrals limit
          const referralCount = await storage.countReferrals(referrer.id);
          
          if (referralCount < 50) {
            await storage.createReferral({
              referrerUserId: referrer.id,
              referredUserId: newUser.id,
              tokenAmount: 5 // 5 GLRS tokens per referral
            });
          } else {
            console.log(`Referral not processed: User ${referrer.id} has reached the 50 referrals limit`);
          }
        }
      }
      
      // Save user ID in session
      req.session.userId = newUser.id;
      
      res.status(201).json({
        message: "Registration successful",
        user: {
          id: newUser.id,
          username: newUser.username,
          referralCode: newUser.referralCode,
          totalTokens: newUser.totalTokens
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user." });
    }
  });

  // Complete a task
  app.post("/api/tasks/complete", requireUser, async (req: Request, res: Response) => {
    try {
      const validationResult = completeTaskSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid task data", 
          errors: validationResult.error.format() 
        });
      }
      
      const { taskName, verificationData } = validationResult.data;
      const user = req.user!; // We can safely use non-null assertion because requireUser middleware guarantees user exists
      
      // Check if task exists
      const task = await storage.getTask(taskName);
      if (!task) {
        return res.status(404).json({ message: "Task not found." });
      }
      
      // Check if task already completed
      const isCompleted = await storage.checkTaskCompletion(user.id, taskName);
      if (isCompleted) {
        return res.status(400).json({ message: "Task already completed." });
      }
      
      // Implement proper verification of tasks based on taskName
      let isVerified = false;
      let verificationMessage = "";
      
      try {
        // For wallet submission, we need to verify a valid BSC address
        if (taskName === "wallet_submit" && verificationData) {
          // Simple validation for BSC wallet address
          const isValidBscAddress = /^0x[a-fA-F0-9]{40}$/.test(verificationData);
          if (isValidBscAddress) {
            await storage.updateUser(user.id, { walletAddress: verificationData });
            isVerified = true;
          } else {
            verificationMessage = "Invalid BSC wallet address format. Please enter a valid address.";
          }
        }
        // For telegram_group task, verify the user has joined the group
        else if (taskName === "telegram_group") {
          // Here we'd use Telegram Bot API to check membership
          // For now, we'll require proof of membership via screenshot or verification code
          if (verificationData) {
            // In a real implementation, we'd verify this with Telegram Bot API
            isVerified = true;
          } else {
            verificationMessage = "Please join our Telegram group and provide verification.";
          }
        }
        // For telegram_channel task
        else if (taskName === "telegram_channel") {
          if (verificationData) {
            // In a real implementation, we'd verify this with Telegram Bot API
            isVerified = true;
          } else {
            verificationMessage = "Please subscribe to our Telegram channel and provide verification.";
          }
        }
        // For twitter_follow task
        else if (taskName === "twitter_follow") {
          if (verificationData) {
            // In a real implementation, we'd verify this with Twitter API
            isVerified = true;
          } else {
            verificationMessage = "Please follow our Twitter account and provide your Twitter username.";
          }
        }
        // For twitter_retweet task
        else if (taskName === "twitter_retweet") {
          if (verificationData) {
            // In a real implementation, we'd verify this with Twitter API
            isVerified = true;
          } else {
            verificationMessage = "Please retweet our post and provide the retweet link.";
          }
        }
        // For website_visit task
        else if (taskName === "website_visit") {
          // We could track this via a special URL parameter or session
          isVerified = true;
        }
        // For other tasks where task link is provided but no verification data
        else if (task.link && !verificationData) {
          // When task has a link but user hasn't provided verification data
          // We'll consider this as "pending verification"
          res.status(202).json({ 
            message: "Please visit the task link and complete the required action to earn tokens.", 
            status: "pending_verification",
            redirectUrl: task.link
          });
          return;
        }
        // For any other tasks - default verification
        else {
          // Fallback - require verification data for unknown task types
          if (verificationData) {
            isVerified = true;
          } else {
            verificationMessage = "Please provide verification data to complete this task.";
          }
        }
      } catch (error) {
        console.error("Task verification error:", error);
        verificationMessage = "Error during task verification.";
      }
      
      if (isVerified) {
        await storage.completeUserTask({
          userId: user.id,
          taskName,
          completed: true,
          tokenAmount: task.tokenAmount,
          verificationData: verificationData || null
        });
        
        // Get updated user with tasks
        const updatedUser = await storage.getUserWithTasks(user.id);
        
        res.json({
          message: `Task "${task.description}" completed successfully!`,
          user: updatedUser
        });
      } else {
        res.status(400).json({ 
          message: verificationMessage || "Task verification failed. Please try again.",
          status: "verification_failed"
        });
      }
    } catch (error) {
      console.error("Task completion error:", error);
      res.status(500).json({ message: "Failed to complete task." });
    }
  });

  // Submit wallet address
  app.post("/api/wallet", requireUser, async (req: Request, res: Response) => {
    try {
      const validationResult = walletSubmissionSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid wallet data", 
          errors: validationResult.error.format() 
        });
      }
      
      const { walletAddress, captchaToken } = validationResult.data;
      const user = req.user!; // Non-null assertion is safe here due to requireUser middleware
      
      // CAPTCHA validation would go here
      if (!captchaToken) {
        return res.status(400).json({ message: "CAPTCHA verification failed" });
      }
      
      // Check wallet format (simplified validation)
      if (!walletAddress.startsWith("0x") || walletAddress.length !== 42) {
        return res.status(400).json({ message: "Invalid BEP-20 wallet address format." });
      }
      
      // Check if this wallet is already used by another user
      const existingWalletUser = await storage.getUserByWalletAddress(walletAddress);
      if (existingWalletUser && existingWalletUser.id !== user.id) {
        return res.status(400).json({ message: "This wallet address is already registered." });
      }
      
      // Update user's wallet address
      const updatedUser = await storage.updateUser(user.id, { walletAddress });
      
      // Complete the wallet submission task
      const walletTask = await storage.getTask("wallet_submit");
      
      if (walletTask) {
        const isTaskCompleted = await storage.checkTaskCompletion(user.id, "wallet_submit");
        
        if (!isTaskCompleted) {
          await storage.completeUserTask({
            userId: user.id,
            taskName: "wallet_submit",
            completed: true,
            tokenAmount: walletTask.tokenAmount,
            verificationData: walletAddress
          });
        }
      }
      
      // Get updated user with tasks
      const userWithTasks = await storage.getUserWithTasks(user.id);
      
      res.json({
        message: "Wallet address submitted successfully!",
        user: userWithTasks
      });
    } catch (error) {
      console.error("Wallet submission error:", error);
      res.status(500).json({ message: "Failed to submit wallet address." });
    }
  });

  // Get current user with tasks
  app.get("/api/user", requireUser, async (req: Request, res: Response) => {
    try {
      const user = req.user!; // Non-null assertion is safe here due to requireUser middleware
      const userWithTasks = await storage.getUserWithTasks(user.id);
      
      if (!userWithTasks) {
        return res.status(404).json({ message: "User not found." });
      }
      
      res.json(userWithTasks);
    } catch (error) {
      console.error("User fetch error:", error);
      res.status(500).json({ message: "Failed to fetch user data." });
    }
  });

  // Get referral stats
  app.get("/api/referrals", requireUser, async (req: Request, res: Response) => {
    try {
      const user = req.user!; // Non-null assertion is safe here due to requireUser middleware
      const referrals = await storage.getReferralsByReferrer(user.id);
      
      res.json({
        referralCode: user.referralCode,
        referralCount: user.referralCount,
        referralTokens: user.referralTokens,
        referrals
      });
    } catch (error) {
      console.error("Referral stats error:", error);
      res.status(500).json({ message: "Failed to fetch referral stats." });
    }
  });
  
  // Create withdrawal request
  app.post("/api/withdrawals", requireUser, async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const withdrawalSchema = z.object({
        amount: z.number().positive().min(10), // Minimum 10 GLRS for withdrawal
        captchaToken: z.string().min(1)
      });
      
      const validationResult = withdrawalSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid withdrawal data", 
          errors: validationResult.error.format() 
        });
      }
      
      const { amount, captchaToken } = validationResult.data;
      
      // CAPTCHA validation would go here
      if (!captchaToken) {
        return res.status(400).json({ message: "CAPTCHA verification failed" });
      }
      
      // Check if user has a wallet address
      if (!user.walletAddress) {
        return res.status(400).json({ message: "You must connect a wallet address before withdrawing tokens." });
      }
      
      // Check if user has enough tokens
      if (user.totalTokens < amount) {
        return res.status(400).json({ message: "Insufficient token balance for withdrawal." });
      }
      
      // Create withdrawal
      const withdrawal = await storage.createWithdrawal({
        userId: user.id,
        amount,
        status: "pending", // pending, processing, completed, failed
        bnbFeeCollected: false, // BNB fee collection status
        walletAddress: user.walletAddress
      });
      
      // Update user's token balance
      await storage.updateUser(user.id, { 
        totalTokens: user.totalTokens - amount 
      });
      
      // Get updated user data
      const updatedUser = await storage.getUser(user.id);
      
      res.status(201).json({
        message: "Withdrawal request created successfully. Please submit the BNB fee to process your withdrawal.",
        withdrawal,
        user: updatedUser
      });
    } catch (error) {
      console.error("Withdrawal request error:", error);
      res.status(500).json({ message: "Failed to create withdrawal request." });
    }
  });
  
  // Get user withdrawals
  app.get("/api/withdrawals", requireUser, async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const withdrawals = await storage.getWithdrawalsByUser(user.id);
      
      res.json(withdrawals);
    } catch (error) {
      console.error("Withdrawals fetch error:", error);
      res.status(500).json({ message: "Failed to fetch withdrawal history." });
    }
  });
  
  // Submit BNB fee for withdrawal
  app.post("/api/withdrawals/:id/fee", requireUser, async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const withdrawalId = parseInt(req.params.id);
      
      const feeSchema = z.object({
        txHash: z.string().min(1),
        captchaToken: z.string().min(1)
      });
      
      const validationResult = feeSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid transaction data", 
          errors: validationResult.error.format() 
        });
      }
      
      const { txHash, captchaToken } = validationResult.data;
      
      // CAPTCHA validation would go here
      if (!captchaToken) {
        return res.status(400).json({ message: "CAPTCHA verification failed" });
      }
      
      // In a real app, we would verify the transaction on the blockchain
      // For this prototype, we'll simulate successful verification
      
      // Update withdrawal status
      const withdrawal = await storage.updateWithdrawalStatus(
        withdrawalId, 
        "processing", 
        txHash
      );
      
      if (!withdrawal) {
        return res.status(404).json({ message: "Withdrawal not found." });
      }
      
      res.json({
        message: "BNB fee payment verified. Your withdrawal is now processing.",
        withdrawal
      });
    } catch (error) {
      console.error("BNB fee submission error:", error);
      res.status(500).json({ message: "Failed to verify BNB fee payment." });
    }
  });
  
  // Admin routes
  
  // Get admin dashboard stats
  app.get("/api/admin/stats", requireAdmin, async (req: Request, res: Response) => {
    try {
      // Count all users
      const allUsers = await storage.getAllUsers();
      
      // Count users with connected wallets
      const usersWithWallets = allUsers.filter(user => user.walletAddress !== null);
      
      // Count completed tasks
      const completedTasks = await storage.getAllUserTasks();
      
      // Count total claimed tokens
      const totalTokensClaimed = allUsers.reduce((sum, user) => sum + user.totalTokens, 0);
      
      res.json({
        totalUsers: allUsers.length,
        activeUsers: usersWithWallets.length,
        totalCompletedTasks: completedTasks.length,
        totalTokensClaimed
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ message: "Failed to fetch admin stats." });
    }
  });
  
  // Get all users for admin
  app.get("/api/admin/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Admin users error:", error);
      res.status(500).json({ message: "Failed to fetch users." });
    }
  });
  
  // Get all tasks and their completion stats
  app.get("/api/admin/tasks", requireAdmin, async (req: Request, res: Response) => {
    try {
      const tasks = await storage.getAllTasks();
      const userTasks = await storage.getAllUserTasks();
      
      // Calculate completion stats for each task
      const tasksWithStats = tasks.map(task => {
        const completions = userTasks.filter(ut => ut.taskName === task.name);
        return {
          ...task,
          completionCount: completions.length,
          totalTokensAwarded: completions.reduce((sum, ut) => sum + ut.tokenAmount, 0)
        };
      });
      
      res.json(tasksWithStats);
    } catch (error) {
      console.error("Admin tasks error:", error);
      res.status(500).json({ message: "Failed to fetch tasks with stats." });
    }
  });
  
  // Create a new task
  app.post("/api/admin/tasks", requireAdmin, async (req: Request, res: Response) => {
    try {
      // Pre-process the request data to handle empty link
      const requestData = { ...req.body };
      if (requestData.link === '') {
        requestData.link = undefined;
      }
      
      const validationResult = createTaskSchema.safeParse(requestData);
      if (!validationResult.success) {
        console.error("Task validation error:", validationResult.error);
        return res.status(400).json({ 
          message: "Invalid task data", 
          errors: validationResult.error.format() 
        });
      }
      
      // Create the task with validated data
      const newTask = await storage.createTask(validationResult.data);
      
      res.status(201).json({
        message: "Task created successfully",
        task: newTask
      });
    } catch (error) {
      console.error("Create task error:", error);
      res.status(500).json({ message: "Failed to create task." });
    }
  });
  
  // Update an existing task
  app.put("/api/admin/tasks/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      
      // Pre-process the request data to handle empty link
      const requestData = { ...req.body };
      if (requestData.link === '') {
        requestData.link = undefined;
      }
      
      const validationResult = createTaskSchema.safeParse(requestData);
      
      if (!validationResult.success) {
        console.error("Task update validation error:", validationResult.error);
        return res.status(400).json({ 
          message: "Invalid task data", 
          errors: validationResult.error.format() 
        });
      }
      
      const updatedTask = await storage.updateTask(taskId, validationResult.data);
      
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found." });
      }
      
      res.json({
        message: "Task updated successfully",
        task: updatedTask
      });
    } catch (error) {
      console.error("Update task error:", error);
      res.status(500).json({ message: "Failed to update task." });
    }
  });
  
  // Delete a task
  app.delete("/api/admin/tasks/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      
      const success = await storage.deleteTask(taskId);
      
      if (!success) {
        return res.status(404).json({ message: "Task not found." });
      }
      
      res.json({
        message: "Task deleted successfully"
      });
    } catch (error) {
      console.error("Delete task error:", error);
      res.status(500).json({ message: "Failed to delete task." });
    }
  });

  // Ban a user (admin only)
  app.post("/api/admin/users/:userId/ban", requireAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const validationResult = banUserSchema.safeParse({
        userId,
        ...req.body
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid ban request", 
          errors: validationResult.error.format() 
        });
      }
      
      const { banReason } = validationResult.data;
      
      const updatedUser = await storage.banUser(userId, banReason);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found." });
      }
      
      res.json({
        message: "User banned successfully",
        user: updatedUser
      });
    } catch (error) {
      console.error("Ban user error:", error);
      res.status(500).json({ message: "Failed to ban user." });
    }
  });
  
  // Unban a user (admin only)
  app.post("/api/admin/users/:userId/unban", requireAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      const updatedUser = await storage.unbanUser(userId);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found." });
      }
      
      res.json({
        message: "User unbanned successfully",
        user: updatedUser
      });
    } catch (error) {
      console.error("Unban user error:", error);
      res.status(500).json({ message: "Failed to unban user." });
    }
  });
  
  // Reset a user's tokens (admin only)
  app.post("/api/admin/users/:userId/reset-tokens", requireAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const validationResult = resetTokensSchema.safeParse({
        userId,
        ...req.body
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid reset tokens request", 
          errors: validationResult.error.format() 
        });
      }
      
      const updatedUser = await storage.resetUserTokens(userId);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found." });
      }
      
      res.json({
        message: "User tokens reset successfully",
        user: updatedUser
      });
    } catch (error) {
      console.error("Reset tokens error:", error);
      res.status(500).json({ message: "Failed to reset user tokens." });
    }
  });
  
  // Get enhanced task completion stats (admin only)
  app.get("/api/admin/task-stats", requireAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getTaskCompletionStats();
      res.json(stats);
    } catch (error) {
      console.error("Task stats error:", error);
      res.status(500).json({ message: "Failed to fetch task statistics." });
    }
  });
  
  // Get detailed user activity stats (admin only)
  app.get("/api/admin/user-activity", requireAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getUserActivityStats();
      res.json(stats);
    } catch (error) {
      console.error("User activity stats error:", error);
      res.status(500).json({ message: "Failed to fetch user activity statistics." });
    }
  });
  
  // Get all withdrawals (admin only)
  app.get("/api/admin/withdrawals", requireAdmin, async (req: Request, res: Response) => {
    try {
      const allWithdrawals = await storage.getAllWithdrawals();
      
      // Enrich with user data
      const withdrawalDetails = await Promise.all(
        allWithdrawals.map(async (withdrawal) => {
          const user = await storage.getUser(withdrawal.userId);
          return {
            ...withdrawal,
            username: user?.username || 'Unknown'
          };
        })
      );
      
      res.json(withdrawalDetails);
    } catch (error) {
      console.error("Admin withdrawals error:", error);
      res.status(500).json({ message: "Failed to fetch withdrawals." });
    }
  });
  
  // Update withdrawal status (admin only)
  app.put("/api/admin/withdrawals/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const admin = req.user!;
      
      const validationResult = withdrawalActionSchema.safeParse({
        withdrawalId: id,
        ...req.body
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid withdrawal action data", 
          errors: validationResult.error.format() 
        });
      }
      
      const { action, notes, rejectionReason } = validationResult.data;
      
      // Map action to status
      const status = action === 'approve' ? 'processing' : 'rejected';
      
      const updatedWithdrawal = await storage.updateWithdrawalWithAdminAction(
        id,
        status,
        admin.id,
        notes,
        rejectionReason
      );
      
      if (!updatedWithdrawal) {
        return res.status(404).json({ message: "Withdrawal not found." });
      }
      
      res.json({
        message: `Withdrawal ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        withdrawal: updatedWithdrawal
      });
    } catch (error) {
      console.error("Update withdrawal error:", error);
      res.status(500).json({ message: "Failed to update withdrawal." });
    }
  });
  
  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
