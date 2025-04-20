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
    
    let message = `📊 *GLRS Token Airdrop Status*\n\n` +
      `👤 Username: ${user.username}\n` +
      `🪙 Total Tokens: ${user.totalTokens}\n` +
      `👥 Referral Tokens: ${user.referralTokens}\n` +
      `👨‍👩‍👧‍👦 Referral Count: ${user.referralCount}\n` +
      `✅ Tasks Completed: ${completedTasks}/${totalTasks}\n\n`;
      
    if (user.walletAddress) {
      message += `💼 Wallet: ${user.walletAddress}\n\n`;
    } else {
      message += `⚠️ Wallet not submitted yet! Please submit your wallet address in the app.\n\n`;
    }
    
    message += `Use the Web App to complete remaining tasks and earn more tokens!`;
    
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
      `🎯 *Your GLRS Token Referral Link*\n\n` +
      `Share this link to earn 5 tokens for each referral:\n\n` +
      `${referralLink}\n\n` +
      `👨‍👩‍👧‍👦 Current Referrals: ${user.referralCount}\n` +
      `🪙 Referral Tokens Earned: ${user.referralTokens}\n\n` +
      `You can earn up to 250 tokens from referrals (50 referrals max).`,
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
          tokenAmount: 5
        });
        
        await ctx.reply(
          `Welcome to the GLRS Token Airdrop, ${username}! 🚀\n\n` +
          `You were referred by ${referrer.username}.\n\n` +
          `Complete tasks to earn tokens for the upcoming airdrop.`
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
export function setupTelegramRoutes(app: any) {
  // Webhook endpoint for Telegram
  app.post('/api/telegram-webhook', (req: any, res: any) => {
    bot.handleUpdate(req.body, res);
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
          totalTokens: user.totalTokens,
          referralTokens: user.referralTokens,
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
          totalTokens: user.totalTokens,
          referralTokens: user.referralTokens,
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
            totalTokens: user.totalTokens,
            referralTokens: user.referralTokens,
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