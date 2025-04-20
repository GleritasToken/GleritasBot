# Gleritas Token Airdrop Platform Deployment Instructions

## Deployment to Replit

This application is fully configured for deployment on Replit. Follow these steps to deploy your application:

1. Click the "Deploy" button at the top of the Replit editor
2. Confirm the deployment when prompted
3. Wait for the build process to complete
4. Your application will be deployed to a URL like: `https://your-repl-name.yourusername.repl.co`

## Environment Variables

The following environment variables are required for the application to function properly:

- `DATABASE_URL`: The URL for your PostgreSQL database (already set up)
- `TELEGRAM_BOT_TOKEN`: Your Telegram Bot token (already set up)
- `NODE_ENV`: Should be set to "production" when deployed (automatically set during deployment)
- `SESSION_SECRET`: A secret string used for session encryption (will be set automatically)

## Post-Deployment Configuration

After deployment, you should:

1. Configure your Telegram Bot to use the webhook URL:
   - The webhook URL will be: `https://your-repl-name.yourusername.repl.co/api/telegram-webhook`
   - This is automatically set up during deployment

2. Update your Telegram Bot settings:
   - Go to BotFather on Telegram
   - Set up the Bot Domain to point to your Replit URL
   - Configure menu buttons for easy navigation

3. Test the application:
   - Try accessing via the Telegram Mini App
   - Test user registration and login
   - Verify task completion works
   - Test referral links

## Troubleshooting

If you encounter issues after deployment:

1. Check the Replit logs for any errors
2. Verify all environment variables are correctly set
3. Ensure the database connection is working
4. Check if the Telegram Bot is properly configured

For persistent database issues, you may need to run migrations manually:
```
npm run db:push
```

## Maintenance

Regular maintenance tasks:

1. Monitor the application logs for errors
2. Periodically backup the database
3. Keep dependencies updated
4. Monitor Telegram API changes that might affect the application

## Contact

For assistance with deployment or troubleshooting, contact support.