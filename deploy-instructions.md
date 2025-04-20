# Deployment Instructions for Gleritas Airdrop Platform

## Pre-Deployment Checklist

1. Make sure all environment variables are set:
   - `DATABASE_URL` - PostgreSQL database connection string
   - `TELEGRAM_BOT_TOKEN` - Your Telegram bot token
   - `SESSION_SECRET` - Secret key for session encryption

2. Run the build process:
   ```
   npm run build
   ```

3. Verify the build was successful by checking the `dist` directory.

## Deploying on Replit

1. Click the "Deploy" button in the Replit interface.

2. Select "Web Service" as the deployment type.

3. Click "Deploy" to start the deployment process.

4. Once deployment finishes, your app will be available at a `.replit.app` URL.

## Manual Deployment (if needed)

If automatic deployment fails, you can start the production server manually:

```
NODE_ENV=production node dist/index.js
```

## Post-Deployment

1. Verify all features are working correctly:
   - User registration and login
   - Task verification
   - Referral system
   - Wallet submission

2. Check that the Telegram bot integration is functional.

## Troubleshooting

If you encounter issues during deployment:

1. Check server logs for errors
2. Ensure all environment variables are set correctly
3. Verify the database connection is working properly