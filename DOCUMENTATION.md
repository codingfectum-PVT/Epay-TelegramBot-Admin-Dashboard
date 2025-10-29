# ZeroXPay Bot - Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Installation & Setup](#installation--setup)
5. [Environment Configuration](#environment-configuration)
6. [Database Schema](#database-schema)
7. [User Flow](#user-flow)
8. [Admin Dashboard](#admin-dashboard)
9. [API Endpoints](#api-endpoints)
10. [Card Image System](#card-image-system)
11. [Payment Processing](#payment-processing)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)

---

## Project Overview

**ZeroXPay Bot** is a Telegram-based virtual card ordering system that accepts cryptocurrency payments (USDT TRC-20) on the Tron blockchain. Users can order virtual cards through a Telegram bot interface, pay with cryptocurrency, and receive their card details including a dynamically generated card image.

### What This System Does

1. **Accepts Card Orders** - Users order virtual cards via Telegram bot
2. **Processes Payments** - Automatically detects USDT (TRC-20) payments on Tron blockchain
3. **Generates Cards** - Creates personalized card images with customer details
4. **Manages Orders** - Web dashboard for administrators to manage orders
5. **Delivers Cards** - Sends card details and images to users via Telegram

### Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Telegram   │────────▶│   Node.js    │────────▶│  MongoDB    │
│    Bot      │         │   Backend    │         │  Database   │
└─────────────┘         └──────────────┘         └─────────────┘
                               │
                               │
                        ┌──────┴──────┐
                        │             │
                   ┌────▼────┐   ┌───▼────┐
                   │  Tron   │   │  Web   │
                   │Blockchain│   │Dashboard│
                   └─────────┘   └────────┘
```

---

## Features

### User Features

**🎴 Card Ordering**
- Two card types: Anonymous (minimal info) and Normal (full details)
- Flexible amounts: Preset (15, 30, 50, 100 USDT) or custom
- User-friendly Telegram interface with inline buttons

**💰 Payment System**
- Automatic wallet generation for each order
- Real-time payment detection (checks every 10 seconds)
- 15-minute payment window
- Supports USDT TRC-20 on Tron blockchain

**📱 Card Management**
- View all ordered cards in a paginated list
- Retrieve card details anytime (card number, expiry, CVV, name)
- Receive professionally designed card images
- Resend card image feature
- 2 cards per row display for better UX

**🔔 Notifications**
- Payment confirmation messages
- Card delivery notifications
- Order expiry warnings
- Real-time status updates

### Admin Features

**📊 Dashboard**
- View all paid orders
- Real-time statistics (total, pending, in-process, delivered)
- Update card status with dropdown
- Track status changes with admin name and timestamp

**💳 Card Delivery System**
- Modal form for entering card details
- Real-time input validation
- Auto-formatting (card number, expiry date)
- Automatic card image generation
- Send card details to user via Telegram

**👥 Multi-Admin Support**
- Two roles: Normal Admin and Super Admin
- Normal: Manage orders and deliver cards
- Super: Full access including wallet management
- Secure authentication with hashed passwords

**💼 Wallet Management** (Super Admin Only)
- View all generated wallets
- Real-time USDT balance checking
- Paginated list (10/25/50/100 per page)
- Copy wallet addresses and private keys
- Balance caching to prevent rate limits

---

## Technology Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Telegraf** - Telegram Bot API
- **Mongoose** - MongoDB ORM
- **TronWeb** - Tron blockchain SDK

### Frontend
- **HTML5/CSS3** - Dashboard UI
- **Vanilla JavaScript** - Client-side logic
- **Fetch API** - HTTP requests

### Database
- **MongoDB** - NoSQL database
- **Indexes** - Optimized queries

### Blockchain
- **Tron Mainnet** - Payment network
- **TronGrid API** - Blockchain queries
- **USDT (TRC-20)** - Payment token

### Other Libraries
- **Canvas** - Image generation
- **bcryptjs** - Password hashing
- **express-session** - Session management
- **dotenv** - Environment variables

---

## Installation & Setup

### Prerequisites

```bash
Node.js >= 16.x
MongoDB >= 5.x
npm or yarn
Telegram Bot Token (from @BotFather)
TronGrid API Key (from trongrid.io)
```

### Step 1: Clone and Install

```bash
# Navigate to project directory
cd EpaybotBackend

# Install dependencies
npm install
```

### Step 2: Configure Environment

Create a `.env` file in the root directory:

```env
# Telegram Configuration
BOT_TOKEN=your_bot_token_here
NOTIFICATION_GROUP_ID=your_group_id_here

# MongoDB
MONGO_URI=mongodb://localhost:27017/zeroxpay
# Or use MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Tron Blockchain (Mainnet)
TRON_FULLNODE=https://api.trongrid.io
TRON_SOLIDITYNODE=https://api.trongrid.io
TRON_EVENTSERVER=https://api.trongrid.io
TRON_APIKEY=your_trongrid_api_key

# USDT Contract (Mainnet)
USDT_CONTRACT=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
USDT_DECIMALS=6

# Payment Settings
MIN_USDT=15
PAYMENT_WINDOW_MINUTES=15
CARD_CREATION_FEE=7

# Server
PORT=3000
SESSION_SECRET=your_random_secret_key_here
```

### Step 3: Add Card Template

Place your card template image:
```
public/card.png
```

**Requirements:**
- Format: PNG
- Recommended size: 800x500px or larger
- Should have space for: card number, name, expiry, CVV

### Step 4: Create Admin Account

The system will automatically create default admin accounts on first run. **Important:** Change these credentials immediately after setup.

Edit `app.js` to customize admin accounts:

```javascript
// Find the createDefaultAdmins function and modify as needed
const admins = [
  { username: "your_admin_username", password: "your_secure_password", role: "super" }
];
```

### Step 5: Start Application

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### Step 6: Access Dashboard

```
http://localhost:3000/login.html
```

Login with your admin credentials, then navigate to:
- Dashboard: `http://localhost:3000/dashboard.html`
- Wallets (Super Admin): `http://localhost:3000/wallets.html`

---

## Environment Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `BOT_TOKEN` | Telegram bot token from @BotFather | `123456:ABC-DEF...` |
| `NOTIFICATION_GROUP_ID` | Telegram group ID for notifications | `-1001234567890` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/db` |
| `TRON_FULLNODE` | Tron node URL | `https://api.trongrid.io` |
| `TRON_APIKEY` | TronGrid API key | `your-api-key` |
| `USDT_CONTRACT` | USDT TRC-20 contract address | `TR7NHqje...` |

### Payment Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `MIN_USDT` | Minimum order amount | 15 |
| `PAYMENT_WINDOW_MINUTES` | Payment time limit | 15 |
| `CARD_CREATION_FEE` | Additional card fee | 7 |
| `USDT_DECIMALS` | USDT token decimals | 6 |

### Server Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `SESSION_SECRET` | Session encryption key | Required |

### How to Get Credentials

**Telegram Bot Token:**
1. Open Telegram and search for @BotFather
2. Send `/newbot` command
3. Follow instructions to create bot
4. Copy the token provided

**Telegram Group ID:**
1. Create a Telegram group
2. Add your bot to the group
3. Send a message in the group
4. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
5. Look for `"chat":{"id":-1234567890}` in the response

**TronGrid API Key:**
1. Visit https://www.trongrid.io/
2. Sign up for an account
3. Navigate to API section
4. Generate new API key

---

## Database Schema

### Collections Overview

**Users Collection**
- Stores Telegram user information
- Links users to their orders and wallets

**Wallets Collection**
- One unique wallet per order
- Stores wallet address and private key
- Used for receiving payments

**Orders Collection**
- Core business logic
- Tracks order status and card status
- Stores card details after delivery

**Admins Collection**
- Admin user accounts
- Role-based access control
- Hashed passwords

### User Schema

```javascript
{
  tgId: Number,           // Telegram user ID (unique, indexed)
  username: String,       // Telegram username
  firstSeenAt: Date       // Registration timestamp
}
```

### Wallet Schema

```javascript
{
  tgId: Number,           // Owner's Telegram ID (indexed)
  address: String,        // Tron wallet address (unique, indexed)
  privateKey: String,     // Wallet private key
  createdAt: Date         // Creation timestamp
}
```

### Order Schema

```javascript
{
  tgId: Number,           // User's Telegram ID (indexed)
  type: String,           // "anonymous" or "normal"
  inputs: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String         // Only for "normal" type
  },
  amount: Number,         // Total amount in USDT
  walletAddress: String,  // Payment wallet address (indexed)
  status: String,         // "pending", "paid", or "expired" (indexed)
  cardStatus: String,     // "pending", "inprocess", or "delivered" (indexed)
  statusChangedBy: String,// Admin username who changed status
  statusChangedAt: Date,  // Timestamp of status change
  cardDetails: {
    cardNumber: String,
    expiryDate: String,
    cvv: String,
    cardName: String
  },
  groupMessageId: Number, // Telegram message ID in admin group
  createdAt: Date,        // Order creation timestamp (indexed)
  expiresAt: Date,        // Payment expiry timestamp (indexed)
  txId: String           // Transaction ID (optional)
}
```

### Admin Schema

```javascript
{
  username: String,       // Admin username (unique, indexed)
  password: String,       // Bcrypt hashed password
  role: String,          // "normal" or "super"
  createdAt: Date,       // Account creation timestamp
  lastLogin: Date        // Last login timestamp
}
```

---

## User Flow

### Complete Order Journey

```
┌──────────────┐
│ User starts  │
│  /start bot  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Main Menu   │
│ [Card List]  │
│ [New Card]   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Choose Type  │
│ Anonymous or │
│    Normal    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│Select Amount │
│ 15/30/50/100 │
│  or Custom   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Enter Info   │
│ Name, Email  │
│ (Phone)      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Confirm    │
│    Order     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Pay to       │
│   Wallet     │
│ (15 minutes) │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Payment    │
│  Confirmed   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Admin Review │
│ & Delivery   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Card Details │
│  + Image     │
│  Received    │
└──────────────┘
```

### Bot Commands

**Main Commands:**
- `/start` - Start bot and show main menu
- `/status` - Check status of last order

**Main Menu Buttons:**
- `🧾 Card list` - View all your cards
- `💳 New Card` - Create new card order

**Card Types:**
- `🕶️ Anonymous Card` - Minimal information required
- `👤 Normal Card` - Full details including phone number

**Amount Selection:**
- `💵 15 USDT` to `💵 100 USDT` - Preset amounts
- `✏️ Custom Amount` - Enter any amount (minimum 15 USDT)

---

## Admin Dashboard

### Dashboard Features

**Statistics Overview**
- Total Orders
- Pending Orders
- In Process Orders
- Delivered Orders

**Orders Table**
- Serial number
- Username (with copy button)
- Full name
- Card type (Anonymous/Normal)
- Card status (dropdown to change)
- Wallet address (truncated, with copy button)
- Status changed by (admin name + date)

**Status Management**
- Three states: `Pending` → `In Process` → `Delivered`
- Dropdown for easy status changes
- Once `Delivered`, dropdown is disabled (final state)

**Card Delivery Process**
1. Admin changes status to "Delivered"
2. Modal appears with form fields
3. Admin enters card details:
   - Card Number (auto-formatted)
   - Card Name (auto-uppercase)
   - Expiry Date (MM/YY format)
   - CVV (3-4 digits)
4. Real-time validation
5. Submit triggers:
   - Card details saved to database
   - Card image generated
   - Details sent to user via Telegram
   - Group notification deleted

### Wallets Page (Super Admin Only)

**Features:**
- View all generated wallets
- Real-time USDT balance fetching
- Pagination (10/25/50/100 per page)
- Copy wallet addresses and private keys
- Filter and search capabilities

**Balance Fetching:**
- Queries Tron blockchain via TronGrid API
- Caches balances for 1 minute
- Rate-limited (200ms between requests)
- Exponential backoff on errors

**Security:**
- Only accessible to super admin role
- Session-based authentication
- Private keys displayed for recovery purposes

---

## API Endpoints

### Authentication

**POST** `/api/login`
```javascript
// Request
{
  "username": "admin",
  "password": "password"
}

// Response
{
  "success": true,
  "message": "Login successful",
  "username": "admin",
  "role": "super"
}
```

**POST** `/api/logout`
```javascript
// Response
{
  "success": true,
  "message": "Logged out successfully"
}
```

**GET** `/api/auth/check`
```javascript
// Response
{
  "success": true,
  "authenticated": true,
  "username": "admin",
  "role": "super"
}
```

### Orders

**GET** `/api/orders`
```javascript
// Response
{
  "success": true,
  "orders": [
    {
      "id": "order_id",
      "username": "telegram_username",
      "firstName": "John",
      "lastName": "Doe",
      "cardType": "normal",
      "cardStatus": "delivered",
      "walletAddress": "TXYZabc...",
      "createdAt": "2025-01-15T10:30:00Z",
      "statusChangedBy": "admin_name",
      "statusChangedAt": "2025-01-15T11:00:00Z"
    }
  ]
}
```

**PATCH** `/api/orders/:orderId/status`
```javascript
// Request
{
  "cardStatus": "delivered",
  "cardDetails": {
    "cardNumber": "4532123456789012",
    "cardName": "JOHN DOE",
    "expiryDate": "12/25",
    "cvv": "123"
  }
}

// Response
{
  "success": true,
  "order": { /* updated order */ }
}
```

### Wallets

**GET** `/api/wallets?page=1&limit=10`
```javascript
// Response
{
  "success": true,
  "wallets": [
    {
      "id": "wallet_id",
      "tgId": 123456789,
      "username": "user",
      "address": "TXYZabc...",
      "privateKey": "0x123...",
      "balance": 15.50,
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalWallets": 25,
    "limit": 10
  }
}
```

---

## Card Image System

### Overview

The system generates personalized card images by overlaying card details onto a base template.

### Setup

1. **Prepare Card Template**
   - Create a card design in PNG format
   - Recommended size: 800x500px or higher
   - Leave space for: card number, name, expiry, CVV
   - Save as `public/card.png`

2. **Customize Text Positions**

Edit positions in `app.js`:

```javascript
const positions = {
  cardNumber: {
    x: 80,                    // Horizontal position (pixels from left)
    y: image.height * 0.55,   // Vertical position (55% from top)
    font: "bold 36px Arial",  // Font style
    color: "#FFFFFF"          // Text color (white)
  },
  cardName: {
    x: 80,
    y: image.height * 0.75,
    font: "bold 28px Arial",
    color: "#FFFFFF"
  },
  expiryDate: {
    x: image.width * 0.65,    // 65% from left
    y: image.height * 0.75,
    font: "bold 24px Arial",
    color: "#FFFFFF"
  },
  cvv: {
    x: image.width * 0.85,    // 85% from left
    y: image.height * 0.75,
    font: "bold 24px Arial",
    color: "#FFFFFF"
  }
};
```

3. **Adjust Styling**

**Font Size:**
```javascript
font: "bold 40px Arial"  // Larger text
font: "bold 20px Arial"  // Smaller text
```

**Colors:**
```javascript
color: "#FFFFFF"  // White
color: "#000000"  // Black
color: "#FFD700"  // Gold
```

**Text Shadow:**
```javascript
ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
ctx.shadowBlur = 4;
ctx.shadowOffsetX = 2;
ctx.shadowOffsetY = 2;
```

### Features

- Auto-formatting of card numbers (spaces every 4 digits)
- Uppercase conversion for card names
- Labels for expiry and CVV
- High-quality rendering with anti-aliasing
- Error handling (fallback to text-only)

---

## Payment Processing

### How It Works

```
User creates order
       ↓
Unique wallet generated
       ↓
User sends USDT to wallet
       ↓
System checks balance every 10 seconds
       ↓
Payment detected
       ↓
User and admin notified
```

### Wallet Generation

Each order gets a unique Tron wallet:

```javascript
{
  address: "TXYZabc123...",  // Public address for receiving
  privateKey: "0x123abc..."  // Private key for spending
}
```

### Payment Detection

**Polling Mechanism:**
- Checks every 10 seconds
- Queries USDT balance from blockchain
- Compares with expected amount
- Auto-confirms when paid

**Expiry Handling:**
- 15-minute payment window (configurable)
- Warning messages at 5 and 2 minutes
- Auto-expires unpaid orders
- Users can create new order after expiry

### Security Features

- One-time-use wallets
- No wallet address reuse
- Automatic payment verification
- Real-time balance checking
- Transaction history tracking

---

## Deployment

### Server Requirements

- **OS:** Ubuntu 20.04+ or similar
- **RAM:** 2GB minimum (4GB recommended)
- **Storage:** 10GB minimum
- **CPU:** 2 cores minimum
- **Node.js:** v16.x or higher

### Deployment with PM2

**1. Install PM2:**
```bash
npm install -g pm2
```

**2. Start Application:**
```bash
pm2 start app.js --name "zeroxpay-bot"
```

**3. Save Configuration:**
```bash
pm2 save
pm2 startup
```

**4. Useful Commands:**
```bash
pm2 logs zeroxpay-bot    # View logs
pm2 restart zeroxpay-bot # Restart
pm2 stop zeroxpay-bot    # Stop
pm2 status               # Check status
pm2 monit                # Monitor resources
```

### Production Checklist

Before deploying to production:

- [ ] Change all default admin passwords
- [ ] Set strong SESSION_SECRET
- [ ] Enable HTTPS (use Let's Encrypt)
- [ ] Set up MongoDB authentication
- [ ] Configure firewall (allow only necessary ports)
- [ ] Set up automatic backups
- [ ] Configure monitoring and alerts
- [ ] Test payment system thoroughly
- [ ] Verify card image generation
- [ ] Test all admin functions

### Database Backup

**Automated Backup Script:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGO_URI" --out="/backups/mongodb_$DATE"
find /backups -type d -mtime +7 -exec rm -rf {} +
```

**Schedule with Cron:**
```bash
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

---

## Troubleshooting

### Bot Not Responding

**Check server status:**
```bash
pm2 status
pm2 logs zeroxpay-bot
```

**Verify bot token:**
```bash
curl https://api.telegram.org/bot<TOKEN>/getMe
```

**Restart bot:**
```bash
pm2 restart zeroxpay-bot
```

### Payment Not Detected

**Verify USDT contract:**
- Mainnet: `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`
- Testnet: `TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf`

**Check TronGrid API key:**
```bash
curl -H "TRON-PRO-API-KEY: your-key" \
  https://api.trongrid.io/wallet/getaccount
```

**View payment logs:**
```bash
pm2 logs | grep "payment"
```

### Card Image Not Generated

**Verify template exists:**
```bash
ls -la public/card.png
```

**Check canvas installation:**
```bash
npm list canvas
```

**Test image loading:**
```bash
node -e "const { loadImage } = require('canvas'); \
  loadImage('./public/card.png').then(img => \
  console.log('Success:', img.width, 'x', img.height));"
```

### Rate Limit Errors

**Symptoms:**
- "Request failed with status code 429"
- Balances showing as 0

**Solutions:**
1. Verify TronGrid API key is set correctly
2. Reduce page size in wallets (default: 10)
3. Increase delay between requests (default: 200ms)
4. Wait for cache refresh (1 minute)

### MongoDB Connection Issues

**Test connection:**
```bash
node -e "const mongoose = require('mongoose'); \
  mongoose.connect(process.env.MONGO_URI) \
  .then(() => console.log('Connected')) \
  .catch(err => console.log('Error:', err));"
```

**Check URI format:**
```
mongodb://localhost:27017/database
mongodb+srv://username:password@cluster.mongodb.net/database
```

---

## Project Structure

```
EpaybotBackend/
├── public/
│   ├── card.png              # Card template image
│   ├── dashboard.html        # Admin dashboard
│   ├── login.html           # Admin login
│   └── wallets.html         # Wallets page
├── node_modules/            # Dependencies
├── app.js                   # Main application
├── package.json             # NPM configuration
├── .env                     # Environment variables
├── .gitignore              # Git ignore rules
└── DOCUMENTATION.md         # This file
```

## Dependencies

```json
{
  "dependencies": {
    "bcryptjs": "^3.0.2",
    "canvas": "^2.11.2",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.1.0",
    "express-session": "^1.18.2",
    "mongoose": "^8.19.2",
    "telegraf": "^4.16.3",
    "tronweb": "^6.0.4"
  }
}
```

---

## Support

### Common Resources

- **Telegraf Docs:** https://telegraf.js.org/
- **TronWeb Docs:** https://developers.tron.network/docs/tronweb
- **MongoDB Docs:** https://docs.mongodb.com/
- **Canvas Docs:** https://github.com/Automattic/node-canvas

### Getting Help

1. Check server logs: `pm2 logs zeroxpay-bot`
2. Review this documentation
3. Search error messages online
4. Check GitHub issues for similar problems

---

**Last Updated:** January 2025
**Version:** 1.0.0
