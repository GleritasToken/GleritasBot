import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  registerUserSchema, 
  completeTaskSchema, 
  walletSubmissionSchema,
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
    const userId = req.session?.userId;
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
          await storage.createReferral({
            referrerUserId: referrer.id,
            referredUserId: newUser.id,
            tokenAmount: 5 // 5 GLRS tokens per referral
          });
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
      const user = req.user;
      
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
      
      // In a real app, we would verify task completion with social media APIs
      // For this prototype, we'll simulate verification based on the task type
      
      let isVerified = true; // Simplified for the prototype
      
      // For wallet submission, we need to update the user record
      if (taskName === "wallet_submit" && verificationData) {
        await storage.updateUser(user.id, { walletAddress: verificationData });
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
        res.status(400).json({ message: "Task verification failed. Please try again." });
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
      const user = req.user;
      
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
      const user = req.user;
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
      const user = req.user;
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

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
