# Deploying Your GLRS Token Airdrop Platform

This guide will walk you through deploying your GLRS Token Airdrop platform and connecting it to your Telegram bot.

## 1. Deploy on Replit

1. Click the "Deploy" button in the Replit interface.
2. Choose the deployment settings:
   - Name: `glrs-airdrop` (or your preferred name)
   - Environment variables: All environment variables will be automatically copied from your development environment
   - Domain: You can use the default Replit domain or connect a custom domain

3. Wait for the deployment process to complete (usually takes a few minutes).

## 2. Setting Up Your Telegram Bot

### Update Webhook URL

After deployment, you need to update your Telegram bot's webhook URL to point to your deployed application:

1. Replace `YOUR_BOT_TOKEN` with your actual bot token
2. Replace `YOUR_DEPLOYMENT_URL` with your Replit deployment URL (e.g., `https://glrs-airdrop.example.repl.co`)

```
https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=YOUR_DEPLOYMENT_URL/api/telegram-webhook
```

For example:
```
https://api.telegram.org/bot7761039144:AAF3HnwJdn0W0EGVRbcXUMQc9onI2VXQ9xg/setWebhook?url=https://glrs-airdrop.example.repl.co/api/telegram-webhook
```

Visit this URL in your browser to set the webhook.

### Set Up Mini App URL

To set up your Mini App URL in Telegram:

1. Open Telegram and message @BotFather
2. Send `/mybots` and select your bot
3. Click "Bot Settings" > "Menu Button" or "Menu Commands"
4. Click "Configure Menu Button"
5. Set the button text (e.g., "GLRS Airdrop") and use your deployment URL as the website

### Test Your Deployment

1. Open your Telegram bot in Telegram
2. Click the Menu Button you configured
3. Verify that the Mini App loads correctly
4. Test all functionality including:
   - User registration
   - Social media task verification
   - Referral system
   - Wallet submission

## Troubleshooting

If you encounter issues with your deployment:

1. Check the deployment logs in Replit
2. Verify that all environment variables are set correctly
3. Ensure the Telegram webhook is set to the correct URL
4. Test the API endpoints directly using tools like Postman

## Additional Configuration

### Custom Domain

For a professional look, you can configure a custom domain:

1. In Replit deployment settings, add your custom domain
2. Follow Replit's instructions to verify domain ownership
3. Update your Telegram webhook URL to use the custom domain

### SSL Certificate

Replit automatically provides SSL certificates for both Replit domains and custom domains.