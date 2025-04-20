# GLRS Token Airdrop Platform

A comprehensive platform for the GLRS token airdrop, featuring Telegram Mini App integration, social media task verification, and blockchain token distribution.

## Features

- 🔒 **Secure Authentication**: User registration and login system with session management
- 📱 **Telegram Integration**: Seamless user experience as a Telegram Mini App
- 🔗 **Blockchain Integration**: BSC wallet address validation and token distribution
- 🏆 **Social Media Tasks**: Complete tasks on various platforms to earn tokens
- 👥 **Referral System**: Earn bonus tokens by referring friends (max 50 referrals)
- 💸 **Withdrawal System**: Request token withdrawals with BNB fee collection

## Technical Stack

- **Frontend**: React.js with TypeScript, TailwindCSS, and shadcn/ui components
- **Backend**: Express.js server with RESTful API architecture
- **Database**: PostgreSQL with Drizzle ORM for data persistence
- **Telegram**: Integration with Telegram Bot API and Mini App functionality
- **Blockchain**: BSC (Binance Smart Chain) compatibility for wallet connections

## Running Locally

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env` file with the required environment variables:
   ```
   DATABASE_URL=postgres://...
   TELEGRAM_BOT_TOKEN=...
   SESSION_SECRET=...
   ```
4. Start the development server with `npm run dev`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection URL |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API token |
| `SESSION_SECRET` | Secret for session encryption |

## Database Schema

The application uses a PostgreSQL database with the following main tables:

- `users`: User information and wallet addresses
- `tasks`: Available tasks that users can complete
- `user_tasks`: Record of completed tasks by users
- `referrals`: Tracking of user referrals
- `withdrawals`: Token withdrawal requests

## API Endpoints

### Authentication
- `POST /api/register`: Register a new user
- `POST /api/login`: Log in an existing user
- `POST /api/logout`: Log out the current user
- `GET /api/user`: Get the current user's data

### Tasks
- `GET /api/tasks`: Get all available tasks
- `POST /api/tasks/complete`: Mark a task as completed

### Wallet
- `POST /api/wallet`: Submit or update a wallet address

### Referrals
- `GET /api/referrals`: Get referrals for the current user

### Telegram
- `POST /api/telegram/validate`: Validate a Telegram user
- `POST /api/telegram-webhook`: Webhook for Telegram Bot events
- `GET /api/telegram/user/:userId`: Get user by ID (for Telegram Mini App)
- `POST /api/telegram/login`: Automatic login from Telegram Mini App

## Deployment

See [deploy-instructions.md](./deploy-instructions.md) for detailed deployment instructions.

## License

This project is proprietary. All rights reserved.

## Support

For support or questions, please contact the GLRS token team through the official Telegram group at [https://t.me/gleritaschat](https://t.me/gleritaschat).

## Resources

- [GLRS Token Whitepaper](https://drive.google.com/file/d/1d1e154XQTxAb-JRizElQgGpjMx8yJvmk/view?usp=drive_link)
- [Telegram Group](https://t.me/+hcJdayisPFIxOGVk)
- [Telegram Channel](https://t.me/gleritaschat)