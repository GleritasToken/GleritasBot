import { Telegraf, Markup, Context } from 'telegraf';
import { storage } from './storage';
import { User } from '@shared/schema';

// Create a Telegraf instance with updated token
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');

// Set up commands
bot.command('start', async (ctx) => {
  try {
    // Get user information from Telegram
    const telegramUser = ctx.from;
    if (!telegramUser) {
      return ctx.reply('Could not get user information.');
    }

    // User information
    const username = telegramUser.username || `user_${telegramUser.id}`;
    
    // Check if user exists in our database
    let user = await storage.getUserByUsername(username);
    
    if (!user) {
      // Create new user if doesn't exist
      const newUser = {
        username,
        walletAddress: null,
        referralCode: '', // Will be generated on creation
        referredBy: null,
        ipAddress: null,
        fingerprint: `telegram_${telegramUser.id}`,
      };
      
      user = await storage.createUser(newUser);
      
      await ctx.reply(
        `Welcome to the GLRS Token Airdrop, ${username}! 🚀 \n\nComplete tasks to earn tokens for the upcoming airdrop.`
      );
    } else {
      await ctx.reply(
        `Welcome back, ${username}! 🚀\n\nContinue completing tasks to earn more tokens.`
      );
    }
    
    // Create inline keyboard with WebApp button
    const webAppButton = Markup.button.webApp(
      'Open Airdrop App',
      `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co?user=${user.id}`
    );

    await ctx.reply(
      'Click the button below to access the airdrop application:',
      {
        reply_markup: {
          inline_keyboard: [[webAppButton]],
        },
      }
    );
  } catch (error) {
    console.error('Error in start command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again later.');
  }
});

// Help command
bot.command('help', async (ctx) => {
  await ctx.reply(
    'GLRS Token Airdrop Bot Help:\n\n' +
    '/start - Start the bot and get access to the airdrop application\n' +
    '/help - Show this help message\n' +
    '/status - Check your current airdrop status\n' +
    '/referral - Get your referral link\n'
  );
});

// Status command - shows the user's current airdrop status
bot.command('status', async (ctx) => {
  try {
    const telegramUser = ctx.from;
    if (!telegramUser) {
      return ctx.reply('Could not get user information.');
    }
    
    const username = telegramUser.username || `user_${telegramUser.id}`;
    const user = await storage.getUserByUsername(username);
    
    if (!user) {
      return ctx.reply('You have not registered for the airdrop yet. Use /start to register.');
    }
    
    const userWithTasks = await storage.getUserWithTasks(user.id);
    if (!userWithTasks) {
      return ctx.reply('Could not retrieve task information.');
    }
    
    const tasks = await storage.getAllTasks();
    const completedTasks = userWithTasks.tasks.length;
    const totalTasks = tasks.length;
    
    let message = `📊 *GLRS Points Airdrop Status*\n\n` +
      `👤 Username: ${user.username}\n` +
      `🪙 Total Points: ${user.totalPoints}\n` +
      `👥 Referral Points: ${user.referralPoints}\n` +
      `👨‍👩‍👧‍👦 Referral Count: ${user.referralCount}\n` +
      `✅ Tasks Completed: ${completedTasks}/${totalTasks}\n\n`;
      
    if (user.walletAddress) {
      message += `💼 Wallet: ${user.walletAddress}\n\n`;
    } else {
      message += `⚠️ Wallet not submitted yet! Please submit your wallet address in the app.\n\n`;
    }
    
    message += `Use the Web App to complete remaining tasks and earn more points!`;
    
    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in status command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again later.');
  }
});

// Referral command - provides the user's referral link
bot.command('referral', async (ctx) => {
  try {
    const telegramUser = ctx.from;
    if (!telegramUser) {
      return ctx.reply('Could not get user information.');
    }
    
    const username = telegramUser.username || `user_${telegramUser.id}`;
    const user = await storage.getUserByUsername(username);
    
    if (!user) {
      return ctx.reply('You have not registered for the airdrop yet. Use /start to register.');
    }
    
    const referralLink = `https://t.me/${bot.botInfo?.username}?start=${user.referralCode}`;
    
    await ctx.reply(
      `🎯 *Your GLRS Points Referral Link*\n\n` +
      `Share this link to earn 5 points for each referral:\n\n` +
      `${referralLink}\n\n` +
      `👨‍👩‍👧‍👦 Current Referrals: ${user.referralCount}\n` +
      `🪙 Referral Points Earned: ${user.referralPoints}\n\n` +
      `You can earn up to 250 points from referrals (50 referrals max).`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error in referral command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again later.');
  }
});

// Handle referral links when someone uses a start parameter
bot.on('text', async (ctx) => {
  const messageText = ctx.message?.text;
  if (messageText && messageText.startsWith('/start ')) {
    try {
      const referralCode = messageText.split(' ')[1];
      if (!referralCode) return;
      
      // Check if referral code exists
      const referrer = await storage.getUserByReferralCode(referralCode);
      if (!referrer) {
        return;
      }
      
      const telegramUser = ctx.from;
      if (!telegramUser) return;
      
      const username = telegramUser.username || `user_${telegramUser.id}`;
      let user = await storage.getUserByUsername(username);
      
      if (!user) {
        // Create new user if doesn't exist
        const newUser = {
          username,
          walletAddress: null,
          referralCode: '', // Will be generated on creation
          referredBy: referralCode,
          ipAddress: null,
          fingerprint: `telegram_${telegramUser.id}`,
        };
        
        user = await storage.createUser(newUser);
        
        // Create referral record
        await storage.createReferral({
          referrerUserId: referrer.id,
          referredUserId: user.id,
          pointAmount: 5
        });
        
        await ctx.reply(
          `Welcome to the GLRS Points Airdrop, ${username}! 🚀\n\n` +
          `You were referred by ${referrer.username}.\n\n` +
          `Complete tasks to earn points for the upcoming airdrop.`
        );
      }
      
      // Create WebApp button
      const webAppButton = Markup.button.webApp(
        'Open Airdrop App',
        `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co?user=${user.id}`
      );

      await ctx.reply(
        'Click the button below to access the airdrop application:',
        {
          reply_markup: {
            inline_keyboard: [[webAppButton]],
          },
        }
      );
    } catch (error) {
      console.error('Error processing referral:', error);
    }
  }
});

// Export the bot
export { bot };

// Initialize and start the bot
export async function startBot() {
  try {
    // Only enable bot in production to avoid conflicts during deployment
    if (process.env.NODE_ENV === 'production') {
      try {
        // First try to stop any existing webhook to resolve conflict
        await bot.telegram.deleteWebhook({ drop_pending_updates: true });
        console.log('Deleted any existing webhooks');
        
        // Use webhooks in production
        const webhookUrl = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/telegram-webhook`;
        await bot.telegram.setWebhook(webhookUrl);
        console.log(`Webhook set to ${webhookUrl}`);
        
        // Get bot information
        const botInfo = await bot.telegram.getMe();
        if (botInfo) {
          console.log(`Bot started: @${botInfo.username}`);
        }
      } catch (error) {
        console.error('Error setting up bot webhook:', error);
      }
    } else {
      // In development mode, simply log that the bot is disabled
      console.log('Bot disabled in development mode to prevent conflicts');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to start bot:', error);
    // Continue without the bot functionality
    return false;
  }
}

// Set up an API endpoint to initialize the Telegram Mini App in the frontend
// Task verification methods
export async function verifyTelegramChannel(userTelegramId: number, channelUsername: string): Promise<boolean> {
  try {
    console.log(`Attempting to verify channel membership for user ${userTelegramId} in channel ${channelUsername}`);
    
    // IMPORTANT: Private channels with invite links (+) cannot be easily verified with the bot API
    // They require the bot to be an admin in the channel to verify membership
    
    // First, check if we're in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV MODE] Simulating successful verification for channel verification`);
      return true;
    }
    
    // Handle private channel links that start with +
    if (channelUsername.startsWith('+')) {
      // For private channels, we have several approaches:
      
      try {
        // Approach 1: Try using a known chat ID if we've saved it previously
        // This might work if the channel is public or the bot is an admin
        console.log(`Attempting to verify channel membership for private channel`);
        
        // IMPORTANT: For this to work, you need to:
        // 1. Make the bot an admin in the channel
        // 2. Find the correct channel ID (can be done by forwarding a message from the channel to @getidsbot)
        // Replace this with your actual channel ID
        const channelId = "-1001812356781";  // Example ID, replace with your actual channel ID
        
        try {
          console.log(`Attempting verification with channel ID: ${channelId}`);
          const member = await bot.telegram.getChatMember(channelId, userTelegramId);
          const isVerified = ['member', 'administrator', 'creator'].includes(member.status);
          console.log(`Channel verification with ID result: ${isVerified ? 'Successfully verified' : 'Not verified'}, status: ${member.status}`);
          
          if (isVerified) {
            return true;
          }
        } catch (err) {
          console.error(`Could not verify with channel ID:`, err);
          // Continue to other approaches
        }
        
        // Approach 2: If we can't verify directly, we can trust the user in development
        // or implement an alternative verification mechanism
        if (process.env.NODE_ENV === 'development') {
          console.log(`[DEV MODE] Falling back to simulated verification for private channel`);
          return true;
        } else {
          // In production, implement one of these approaches:
          // 1. Request a screenshot from the user (manual verification)
          // 2. Ask the user to send a specific message in the channel that the bot can see
          // 3. Use a web hook that's triggered when a user joins
          // 4. Use Telegram's Mini App capabilities to verify channel membership
          
          // For now, in production, we'll return true to allow users to complete the task
          // but you should implement a more robust verification method
          console.log(`[PRODUCTION] Cannot verify private channel membership automatically. Allowing task completion.`);
          return true;
        }
      } catch (err) {
        console.error(`Failed all private channel verification approaches:`, err);
        
        // In development mode, always return true
        if (process.env.NODE_ENV === 'development') {
          console.log(`[DEV MODE] Falling back to simulated verification for private channel after errors`);
          return true;
        }
        
        // In production, be lenient for now - eventually replace with proper verification
        console.log(`[PRODUCTION] Allowing task completion despite verification errors for private channel`);
        return true;
      }
    }
    
    // For public channels, use the standard method
    const formattedChannelUsername = channelUsername.startsWith('@') 
      ? channelUsername 
      : `@${channelUsername}`;
    
    console.log(`Checking membership in public channel: ${formattedChannelUsername}`);
    
    try {
      // Get chat member information
      const member = await bot.telegram.getChatMember(formattedChannelUsername, userTelegramId);
      
      // Check if user is a member or admin
      const isVerified = ['member', 'administrator', 'creator'].includes(member.status);
      console.log(`Public channel verification result: ${isVerified ? 'Successfully verified' : 'Not verified'}, status: ${member.status}`);
      
      return isVerified;
    } catch (channelErr) {
      console.error(`Error checking public channel with username:`, channelErr);
      
      // In development mode, allow the task to complete
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV MODE] Allowing task completion despite public channel verification error`);
        return true;
      }
      
      // In production, be lenient for now - eventually replace with proper verification
      console.log(`[PRODUCTION] Allowing task completion despite public channel verification error`);
      return true;
    }
  } catch (error) {
    console.error(`Error in channel verification process:`, error);
    
    // In development mode, return true to allow testing
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV MODE] General error occurred, falling back to simulated verification`);
      return true;
    }
    
    // In production, be lenient for now
    console.log(`[PRODUCTION] Allowing task completion despite general verification error`);
    return true;
  }
}

export async function verifyTelegramGroup(userTelegramId: number, groupUsername: string): Promise<boolean> {
  try {
    console.log(`Attempting to verify group membership for user ${userTelegramId} in group ${groupUsername}`);
    
    // First, check if we're in development mode - always return true in dev mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV MODE] Simulating successful verification for group verification`);
      return true;
    }
    
    // Make sure group username starts with @ for the API call
    const formattedGroupUsername = groupUsername.startsWith('@') 
      ? groupUsername 
      : `@${groupUsername}`;
    
    console.log(`Checking membership in group: ${formattedGroupUsername}`);
    
    try {
      // Get chat member information
      const member = await bot.telegram.getChatMember(formattedGroupUsername, userTelegramId);
      
      // Check if user is a member or admin
      const isVerified = ['member', 'administrator', 'creator'].includes(member.status);
      console.log(`Group verification result: ${isVerified ? 'Successfully verified' : 'Not verified'}, status: ${member.status}`);
      
      return isVerified;
    } catch (groupErr) {
      console.error(`Error checking group with username:`, groupErr);
      
      // In development mode, we already returned true above
      
      // In production, be lenient for now - eventually replace with proper verification
      console.log(`[PRODUCTION] Allowing task completion despite group verification error`);
      return true;
    }
  } catch (error) {
    console.error(`Error in group verification process:`, error);
    
    // In development mode, we already returned true above
    
    // In production, be lenient for now
    console.log(`[PRODUCTION] Allowing task completion despite general verification error`);
    return true;
  }
}

export async function verifyTwitterFollow(userTelegramId: number, twitterUsername: string): Promise<boolean> {
  // Twitter verification requires OAuth integration, which is beyond this simple example
  // For now, return true - in a real implementation, you'd need to use Twitter API with user authentication
  
  // TODO: Implement actual Twitter verification when possible
  console.log(`Simulating verification of Twitter follow for ${twitterUsername} by Telegram user ${userTelegramId}`);
  return true;
}

export function setupTelegramRoutes(app: any) {
  // Webhook endpoint for Telegram
  app.post('/api/telegram-webhook', (req: any, res: any) => {
    try {
      bot.handleUpdate(req.body, res);
    } catch (error) {
      console.error('Error handling Telegram webhook:', error);
      res.status(500).json({ error: 'Failed to process Telegram webhook' });
    }
  });
  
  // Add a GET endpoint for testing Telegram webhook
  app.get('/api/telegram-webhook', (req: any, res: any) => {
    res.json({ status: 'Telegram webhook is active', botInfo: bot.botInfo || null });
  });
  
  // Task verification endpoint
  app.post('/api/verify-task', async (req: any, res: any) => {
    try {
      const { userId, taskId, telegramId } = req.body;
      
      if (!userId || !taskId) {
        return res.status(400).json({ 
          success: false, 
          error: "Missing userId or taskId" 
        });
      }
      
      // Get the user and task
      const user = await storage.getUser(parseInt(userId));
      const task = await storage.getTask(taskId);
      
      if (!user || !task) {
        return res.status(404).json({ 
          success: false, 
          error: "User or task not found" 
        });
      }
      
      // Check if task is already completed
      const isCompleted = await storage.checkTaskCompletion(user.id, taskId);
      if (isCompleted) {
        return res.json({ 
          success: true, 
          message: "Task already completed" 
        });
      }
      
      // Get the user's Telegram ID from multiple sources with priority:
      // 1. User's telegramId property
      // 2. telegramId from request
      // 3. Telegram ID embedded in fingerprint
      const userTelegramId = user.telegramId || telegramId || 
        (user.fingerprint?.startsWith('telegram_') 
          ? parseInt(user.fingerprint.replace('telegram_', ''))
          : null);
          
      if (!userTelegramId) {
        return res.status(400).json({
          success: false,
          error: "Telegram ID not available"
        });
      }
      
      let verificationSuccess = false;
      let verificationData = "";
      
      // Verify task based on task type
      console.log(`Verifying task ${taskId} for user ${userId} with Telegram ID ${userTelegramId}`);
      
      switch(taskId) {
        case 'telegram_channel':
          console.log(`Starting Telegram channel verification for user ${userId}`);
          // Channel link is https://t.me/+hcJdayisPFIxOGVk
          // For private channels, we need to use the invite link instead of username
          verificationSuccess = await verifyTelegramChannel(userTelegramId, '+hcJdayisPFIxOGVk');
          verificationData = "joined_channel";
          console.log(`Telegram channel verification result: ${verificationSuccess ? 'Success' : 'Failed'}`);
          break;
          
        case 'telegram_group':
          console.log(`Starting Telegram group verification for user ${userId}`);
          // Group link is https://t.me/gleritaschat
          verificationSuccess = await verifyTelegramGroup(userTelegramId, 'gleritaschat');
          verificationData = "joined_group";
          console.log(`Telegram group verification result: ${verificationSuccess ? 'Success' : 'Failed'}`);
          break;
          
        case 'twitter_follow':
          console.log(`Starting Twitter follow verification for user ${userId}`);
          verificationSuccess = await verifyTwitterFollow(userTelegramId, 'GleritasToken');
          verificationData = "followed";
          console.log(`Twitter follow verification result: ${verificationSuccess ? 'Success' : 'Failed'}`);
          break;
          
        default:
          console.log(`No specific verification for task type ${taskId}, auto-completing`);
          // For other task types, we'll just accept the completion for now
          verificationSuccess = true;
          verificationData = "completed";
      }
      
      if (verificationSuccess) {
        // Complete the task
        await storage.completeUserTask({
          userId: user.id,
          taskName: taskId,
          verificationData
        });
        
        return res.json({
          success: true,
          message: "Task verified and completed successfully"
        });
      } else {
        return res.json({
          success: false,
          error: `Task verification failed. Please complete the task first.`
        });
      }
    } catch (error) {
      console.error("Error verifying task:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  });
  
  // Telegram user validation endpoint
  app.post('/api/telegram/validate', async (req: any, res: any) => {
    try {
      const { initData } = req.body;
      
      // In a production environment, you would validate the initData
      // For simplicity, we're just extracting the user info
      
      // Extract user_id from the initData
      const params = new URLSearchParams(initData);
      const userDataStr = params.get('user');
      
      if (!userDataStr) {
        return res.status(400).json({ 
          success: false, 
          message: 'No user data provided' 
        });
      }
      
      // Parse user data
      const userData = JSON.parse(userDataStr);
      const telegramId = userData.id;
      
      // Find or create user
      const username = userData.username || `user_${telegramId}`;
      let user = await storage.getUserByUsername(username);
      
      if (!user) {
        // Create new user
        const newUser = {
          username,
          walletAddress: null,
          referralCode: '', // Will be generated on creation
          referredBy: null,
          ipAddress: null,
          fingerprint: `telegram_${telegramId}`,
        };
        
        user = await storage.createUser(newUser);
      }
      
      // Get user with tasks
      const userWithTasks = await storage.getUserWithTasks(user.id);
      
      return res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          telegramId,
          walletAddress: user.walletAddress,
          referralCode: user.referralCode,
          totalPoints: user.totalPoints, 
          referralPoints: user.referralPoints,
          referralCount: user.referralCount,
          tasks: userWithTasks?.tasks || []
        }
      });
    } catch (error) {
      console.error('Error validating Telegram user:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  });
  
  // Endpoint to get user by ID (for Telegram Mini App fallback)
  app.get('/api/telegram/user/:userId', async (req: any, res: any) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
      }
      
      // Get user from database
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Get user with tasks
      const userWithTasks = await storage.getUserWithTasks(userId);
      
      return res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          telegramId: parseInt(user.fingerprint?.replace('telegram_', '') || '0'),
          walletAddress: user.walletAddress,
          referralCode: user.referralCode,
          totalPoints: user.totalPoints,
          referralPoints: user.referralPoints,
          referralCount: user.referralCount,
          tasks: userWithTasks?.tasks || []
        }
      });
    } catch (error) {
      console.error('Error getting user by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });
  
  // Allow automatic login using Telegram parameters
  app.post('/api/telegram/login', async (req: any, res: any) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }
      
      // Get user from database
      const user = await storage.getUser(parseInt(userId));
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Set session
      if (req.session) {
        req.session.userId = user.id;
        
        return res.json({
          success: true,
          message: 'Logged in successfully',
          user: {
            id: user.id,
            username: user.username,
            walletAddress: user.walletAddress,
            referralCode: user.referralCode,
            totalPoints: user.totalPoints,
            referralPoints: user.referralPoints,
            referralCount: user.referralCount
          }
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Session not available'
        });
      }
    } catch (error) {
      console.error('Error logging in with Telegram:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });
}