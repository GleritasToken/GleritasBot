# Gleritas Token Airdrop Platform

A complete airdrop platform for Gleritas Token with Telegram Mini App integration, social media task verification, referral system, and more.

## Features

- User registration and authentication
- Social media task verification
- Referral system with Telegram username integration
- Wallet address submission and validation
- Token allocation tracking
- Responsive dark theme UI

## Deployment Instructions

1. Build the application:
```
npm run build
```

2. Start the production server:
```
npm run start
```

## Environment Variables Required

Make sure these environment variables are set for production deployment:

- `DATABASE_URL`: PostgreSQL database connection string
- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
- `SESSION_SECRET`: Secret for session encryption

## Tech Stack

- PostgreSQL database
- Express.js backend
- React frontend with TypeScript
- Tailwind CSS for styling
- Telegram Bot API integration