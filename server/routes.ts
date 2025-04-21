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
      let asyncVerificationInProgress = false;
      
      try {
        // For wallet submission, we need to verify a valid BSC address
        if (taskName === "wallet_submit" && verificationData) {
          // Strict validation for BSC wallet address
          const isValidBscAddress = /^0x[a-fA-F0-9]{40}$/.test(verificationData);
          if (isValidBscAddress) {
            // Check if this is a real BSC address with balance
            try {
              // In a production environment, we'd call the BSC API to verify the address exists
              // For example, using ethers.js:
              // const provider = new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
              // const balance = await provider.getBalance(verificationData);
              // isVerified = balance.gte(0); // Address exists on BSC

              // For now, we'll do a stricter regex check until real API integration
              isVerified = /^0x[1-9a-fA-F][0-9a-fA-F]{39}$/.test(verificationData);
              
              if (isVerified) {
                await storage.updateUser(user.id, { walletAddress: verificationData });
              } else {
                verificationMessage = "The BSC address appears to be invalid. Please ensure it's a valid BSC wallet address.";
              }
            } catch (error) {
              console.error("BSC verification error:", error);
              verificationMessage = "Could not verify BSC address. Please try again later.";
            }
          } else {
            verificationMessage = "Invalid BSC wallet address format. Please enter a valid address starting with 0x followed by 40 hexadecimal characters.";
          }
        }
        // For telegram_group task
        else if (taskName === "telegram_group") {
          if (!process.env.TELEGRAM_BOT_TOKEN) {
            verificationMessage = "Telegram verification is not properly configured. Please contact support.";
          } else {
            // Get the username or user ID from verification data
            const telegramIdentifier = verificationData?.trim();
            
            if (!telegramIdentifier) {
              verificationMessage = "Please provide your Telegram username or ID.";
            } else {
              try {
                // In a production environment, we'd make an API call to Telegram Bot API
                // Example: checking if user is a member of the group
                // const response = await axios.get(
                //   `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getChatMember`,
                //   { params: { chat_id: '@gleritaschat', user_id: telegramIdentifier } }
                // );
                // isVerified = response.data.ok && response.data.result.status !== 'left';
                
                // For now, we'll treat this as async verification that's pending
                asyncVerificationInProgress = true;
                
                // Store the verification attempt for later processing
                await storage.storeVerificationAttempt(user.id, taskName, telegramIdentifier);
                
                // Return pending verification status
                return res.status(202).json({
                  message: "Your Telegram membership is being verified. Please check back in a few minutes.",
                  status: "verification_pending"
                });
              } catch (error) {
                console.error("Telegram verification error:", error);
                verificationMessage = "Could not verify Telegram membership. Please ensure you've joined the group and try again.";
              }
            }
          }
        }
        // For telegram_channel task
        else if (taskName === "telegram_channel") {
          if (!process.env.TELEGRAM_BOT_TOKEN) {
            verificationMessage = "Telegram verification is not properly configured. Please contact support.";
          } else {
            // Similar implementation to telegram_group
            const telegramIdentifier = verificationData?.trim();
            
            if (!telegramIdentifier) {
              verificationMessage = "Please provide your Telegram username or ID.";
            } else {
              try {
                // For now, we'll treat this as async verification that's pending
                asyncVerificationInProgress = true;
                
                // Store the verification attempt for later processing
                await storage.storeVerificationAttempt(user.id, taskName, telegramIdentifier);
                
                // Return pending verification status
                return res.status(202).json({
                  message: "Your Telegram channel subscription is being verified. Please check back in a few minutes.",
                  status: "verification_pending"
                });
              } catch (error) {
                console.error("Telegram verification error:", error);
                verificationMessage = "Could not verify Telegram subscription. Please ensure you've subscribed to the channel and try again.";
              }
            }
          }
        }
        // For twitter_follow task
        else if (taskName === "twitter_follow") {
          const twitterHandle = verificationData?.trim();
          
          if (!twitterHandle) {
            verificationMessage = "Please provide your Twitter username.";
          } else {
            try {
              // In a production environment, we'd make an API call to Twitter API
              // Example: checking if user follows the specified Twitter account
              // const response = await axios.get(
              //   `https://api.twitter.com/2/users/${twitterHandle}/following`,
              //   { headers: { Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}` } }
              // );
              // isVerified = response.data.data.some(u => u.username === 'GleritasToken');
              
              // For now, we'll treat this as async verification that's pending
              asyncVerificationInProgress = true;
              
              // Store the verification attempt for later processing
              await storage.storeVerificationAttempt(user.id, taskName, twitterHandle);
              
              // Return pending verification status
              return res.status(202).json({
                message: "Your Twitter follow is being verified. Please check back in a few minutes.",
                status: "verification_pending"
              });
            } catch (error) {
              console.error("Twitter verification error:", error);
              verificationMessage = "Could not verify Twitter follow. Please ensure you've followed @GleritasToken and try again.";
            }
          }
        }
        // For twitter_retweet task
        else if (taskName === "twitter_retweet") {
          const retweetUrl = verificationData?.trim();
          
          if (!retweetUrl || !retweetUrl.includes('twitter.com')) {
            verificationMessage = "Please provide a valid Twitter retweet URL.";
          } else {
            try {
              // Extract tweet ID from URL
              const tweetIdMatch = retweetUrl.match(/status\/(\d+)/);
              const tweetId = tweetIdMatch ? tweetIdMatch[1] : null;
              
              if (!tweetId) {
                verificationMessage = "Invalid Twitter URL format. Please provide a valid retweet link.";
              } else {
                // In a production environment, we'd make an API call to Twitter API to verify the retweet
                // For now, we'll treat this as async verification that's pending
                asyncVerificationInProgress = true;
                
                // Store the verification attempt for later processing
                await storage.storeVerificationAttempt(user.id, taskName, retweetUrl);
                
                // Return pending verification status
                return res.status(202).json({
                  message: "Your retweet is being verified. Please check back in a few minutes.",
                  status: "verification_pending"
                });
              }
            } catch (error) {
              console.error("Twitter verification error:", error);
              verificationMessage = "Could not verify retweet. Please ensure you've retweeted the correct post and try again.";
            }
          }
        }
        // For website_visit task - we can track this via special parameters in the URL
        else if (taskName === "website_visit") {
          // We'll verify this by checking if the user has a special cookie or session marker
          // For this prototype, we'll set it to true for now
          // In a production environment, you would verify that the user actually visited the site
          // by setting a cookie when they visit and checking for it here
          isVerified = true;
        }
        // For other tasks where task link is provided but no verification data
        else if (task.link && !verificationData) {
          // When task has a link but user hasn't provided verification data
          // We'll consider this as "pending verification" - direct user to the link
          return res.status(202).json({ 
            message: "Please complete this task by visiting the link. You'll need to provide proof of completion afterward.", 
            status: "pending_verification",
            redirectUrl: task.link
          });
        }
        // For any other tasks - use default strict verification
        else {
          if (verificationData && verificationData.trim().length > 3) {
            // Store it for manual review
            asyncVerificationInProgress = true;
            await storage.storeVerificationAttempt(user.id, taskName, verificationData);
            
            return res.status(202).json({
              message: "Your task completion is pending verification. Please check back later.",
              status: "verification_pending"
            });
          } else {
            verificationMessage = "Please provide detailed verification data to complete this task.";
          }
        }
      } catch (error) {
        console.error("Task verification error:", error);
        verificationMessage = "Error during task verification. Please try again later.";
      }
      
      // For async verification processes, we exit early with a 202 status
      if (asyncVerificationInProgress) {
        return;
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
      const validationResult = createTaskSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid task data", 
          errors: validationResult.error.format() 
        });
      }
      
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
      const validationResult = createTaskSchema.safeParse(req.body);
      
      if (!validationResult.success) {
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
  
  // Get all pending verification attempts for admin review
  app.get("/api/admin/verifications", requireAdmin, async (req: Request, res: Response) => {
    try {
      const verifications = await storage.getPendingVerificationAttempts();
      res.json(verifications);
    } catch (error) {
      console.error("Error getting verification attempts:", error);
      res.status(500).json({ message: "Failed to retrieve verification attempts." });
    }
  });
  
  // Approve a verification attempt
  app.post("/api/admin/verifications/:id/approve", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const notes = req.body.notes || 'Approved by admin';
      const adminId = req.user?.id;
      
      const attempt = await storage.approveVerificationAttempt(id, adminId, notes);
      
      if (!attempt) {
        return res.status(404).json({ message: "Verification attempt not found." });
      }
      
      res.json({
        message: "Verification attempt approved successfully.",
        attempt
      });
    } catch (error) {
      console.error("Error approving verification:", error);
      res.status(500).json({ message: "Failed to approve verification attempt." });
    }
  });
  
  // Reject a verification attempt
  app.post("/api/admin/verifications/:id/reject", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const reason = req.body.reason || 'Rejected by admin';
      
      const attempt = await storage.rejectVerificationAttempt(id, reason);
      
      if (!attempt) {
        return res.status(404).json({ message: "Verification attempt not found." });
      }
      
      res.json({
        message: "Verification attempt rejected successfully.",
        attempt
      });
    } catch (error) {
      console.error("Error rejecting verification:", error);
      res.status(500).json({ message: "Failed to reject verification attempt." });
    }
  });
  
  // Check verification status for a specific task
  app.get("/api/verifications/:taskName/status", requireUser, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const taskName = req.params.taskName;
      
      // First check if the task is already completed
      const isCompleted = await storage.checkTaskCompletion(userId, taskName);
      
      if (isCompleted) {
        return res.json({
          status: "completed",
          message: "Task already completed successfully."
        });
      }
      
      // Check for pending verification attempts
      const attempt = await storage.getVerificationAttempt(userId, taskName);
      
      if (!attempt) {
        return res.json({
          status: "not_started",
          message: "No verification attempt found. Please complete the task."
        });
      }
      
      // Return the appropriate status message based on verification status
      if (attempt.status === "pending") {
        return res.json({
          status: "pending",
          message: "Your verification is being processed. Please check back later."
        });
      } else if (attempt.status === "approved") {
        return res.json({
          status: "approved",
          message: "Your verification has been approved. The task is now complete."
        });
      } else if (attempt.status === "rejected") {
        return res.json({
          status: "rejected",
          message: `Your verification was rejected: ${attempt.adminNotes || 'No reason provided.'}. Please try again.`
        });
      }
      
      // Fallback
      return res.json({
        status: attempt.status,
        message: "Verification status is being tracked."
      });
    } catch (error) {
      console.error("Error checking verification status:", error);
      res.status(500).json({ message: "Failed to check verification status." });
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
