# ZeroXPay Bot - Complete Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Installation & Setup](#installation--setup)
5. [Environment Variables](#environment-variables)
6. [Database Schema](#database-schema)
7. [Telegram Bot Flow](#telegram-bot-flow)
8. [Admin Dashboard](#admin-dashboard)
9. [API Endpoints](#api-endpoints)
10. [Card Image Generation](#card-image-generation)
11. [Payment Processing](#payment-processing)
12. [Security Features](#security-features)
13. [Testing Guide](#testing-guide)
14. [Deployment](#deployment)
15. [Troubleshooting](#troubleshooting)

---

## Project Overview

**ZeroXPay Bot** is a Telegram-based virtual card ordering system that accepts USDT (TRC-20) payments on the Tron blockchain. Users can order virtual cards through a Telegram bot, pay with cryptocurrency, and receive their card details including a dynamically generated card image.

### Key Components
- **Telegram Bot** - User interface for card ordering
- **Admin Dashboard** - Web-based management panel
- **Payment Processor** - Monitors USDT transactions on Tron blockchain
- **Card Generator** - Creates personalized card images with details
- **Wallet Manager** - Generates unique wallets for each order

---

## Features

### User Features
✅ **Card Ordering**
- Anonymous cards (minimal information)
- Normal cards (full information including phone)
- Custom or preset USDT amounts (15, 30, 50, 100+)

✅ **Payment System**
- Automatic wallet generation for each order
- Real-time payment detection (10-second polling)
- 15-minute payment window
- Supports USDT TRC-20 on Tron mainnet

✅ **Card Management**
- View list of all ordered cards
- Retrieve card details anytime (number, expiry, CVV)
- Receive card image with details printed
- Resend card image on demand
- Paginated card list (2 buttons per row)

✅ **Notifications**
- Payment confirmation messages
- Card delivery notifications
- Order status updates
- Expiry warnings

### Admin Features
✅ **Dashboard Management**
- View all paid orders
- Update card status (pending → inprocess → delivered)
- Search and filter orders
- Real-time statistics

✅ **Card Delivery**
- Modal form for entering card details
- Automatic card image generation
- Send card details to user via Telegram
- Status tracking with admin username and timestamp

✅ **Wallet Management** (Super Admin Only)
- View all generated wallets
- Check USDT balances in real-time
- Paginated wallet list (10 per page)
- Export wallet addresses and private keys

✅ **Multi-Admin Support**
- Normal admin role (manage orders)
- Super admin role (full access including wallets)
- Secure authentication with bcrypt
- Session management

---

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web server framework
- **Telegraf** - Telegram Bot API framework
- **Mongoose** - MongoDB ODM
- **TronWeb** - Tron blockchain interaction

### Frontend (Admin Dashboard)
- **HTML5** - Markup
- **CSS3** - Styling with gradients and animations
- **Vanilla JavaScript** - Interactive functionality
- **Fetch API** - Backend communication

### Database
- **MongoDB** - NoSQL database
- **Mongoose Schema** - Data modeling

### Blockchain
- **Tron Mainnet** - Payment processing
- **TronGrid API** - Blockchain queries
- **USDT (TRC-20)** - Payment token

### Image Processing
- **Canvas** - Node.js image manipulation library
- **PNG** - Card image format

### Security
- **bcryptjs** - Password hashing
- **express-session** - Session management
- **CORS** - Cross-origin resource sharing

---

## Installation & Setup

### Prerequisites
```bash
Node.js >= 16.x
MongoDB >= 5.x
npm or yarn
Telegram Bot Token
TronGrid API Key
```

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd EpaybotBackend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Create Environment File
```bash
cp .env.example .env
```

Edit `.env` with your configuration (see [Environment Variables](#environment-variables))

### Step 4: Add Card Template
Place your card template image:
```
public/card.png
```

Recommended dimensions: 800x500px or higher

### Step 5: Start Application
```bash
# Development
npm run dev

# Production
npm start
```

### Step 6: Access Dashboard
```
http://localhost:3000/dashboard.html
```

Default Admin Credentials:
- Username: `admin`
- Password: `123123132`

**⚠️ Change default passwords in production!**

---

## Environment Variables

### Required Variables

```env
# Telegram Bot Configuration
BOT_TOKEN=your_telegram_bot_token_here
NOTIFICATION_GROUP_ID=-1234567890

# MongoDB Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Tron Blockchain Configuration (Mainnet)
TRON_FULLNODE=https://api.trongrid.io
TRON_SOLIDITYNODE=https://api.trongrid.io
TRON_EVENTSERVER=https://api.trongrid.io
TRON_APIKEY=your_trongrid_api_key_here

# USDT TRC-20 Contract (Mainnet)
USDT_CONTRACT=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
USDT_DECIMALS=6

# Payment Configuration
MIN_USDT=15
PAYMENT_WINDOW_MINUTES=15
CARD_CREATION_FEE=7

# Server Configuration
PORT=3000
SESSION_SECRET=your_secret_key_change_in_production
```

### Testnet Configuration (Optional)
```env
# Tron Nile Testnet
TRON_FULLNODE=https://api.nileex.io
TRON_SOLIDITYNODE=https://api.nileex.io
TRON_EVENTSERVER=https://api.nileex.io
USDT_CONTRACT=TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf
```

### Variable Descriptions

| Variable | Description | Default |
|----------|-------------|---------|
| `BOT_TOKEN` | Telegram bot token from @BotFather | Required |
| `NOTIFICATION_GROUP_ID` | Telegram group ID for order notifications | Required |
| `MONGO_URI` | MongoDB connection string | Required |
| `TRON_FULLNODE` | Tron full node URL | Mainnet |
| `TRON_APIKEY` | TronGrid API key for higher rate limits | Required |
| `USDT_CONTRACT` | USDT smart contract address | Mainnet |
| `USDT_DECIMALS` | USDT token decimals | 6 |
| `MIN_USDT` | Minimum order amount | 15 |
| `PAYMENT_WINDOW_MINUTES` | Payment time limit | 15 |
| `CARD_CREATION_FEE` | Additional fee for card creation | 7 |
| `PORT` | Server port | 3000 |
| `SESSION_SECRET` | Express session secret key | Random |

---

## Database Schema

### User Schema
```javascript
{
  tgId: Number,           // Telegram user ID (unique)
  username: String,       // Telegram username
  firstSeenAt: Date       // First interaction timestamp
}
```

### Wallet Schema
```javascript
{
  tgId: Number,           // Owner's Telegram ID
  address: String,        // Tron wallet address (unique)
  privateKey: String,     // Wallet private key (encrypted)
  createdAt: Date         // Creation timestamp
}
```

### Order Schema
```javascript
{
  tgId: Number,           // Telegram user ID
  type: String,           // "anonymous" | "normal"
  inputs: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String         // Only for normal cards
  },
  amount: Number,         // Total amount (card balance + fee)
  walletAddress: String,  // Payment wallet address
  usdt: {
    decimals: Number,
    contract: String
  },
  status: String,         // "pending" | "paid" | "expired"
  cardStatus: String,     // "pending" | "inprocess" | "delivered"
  statusChangedBy: String, // Admin username
  statusChangedAt: Date,
  cardDetails: {
    cardNumber: String,
    expiryDate: String,
    cvv: String,
    cardName: String
  },
  groupMessageId: Number, // Notification message ID
  createdAt: Date,
  expiresAt: Date,
  txId: String           // Transaction ID (optional)
}
```

### Admin Schema
```javascript
{
  username: String,       // Admin username (unique)
  password: String,       // Hashed password (bcrypt)
  role: String,          // "normal" | "super"
  createdAt: Date,
  lastLogin: Date
}
```

### Indexes
- `User.tgId` (unique)
- `Wallet.address` (unique)
- `Wallet.tgId`
- `Order.tgId`
- `Order.status`
- `Order.cardStatus`
- `Order.walletAddress`
- `Order.createdAt`
- `Order.expiresAt`
- `Admin.username` (unique)

---

## Telegram Bot Flow

### Main Menu
```
Welcome to ZeroXPay Bot.
Choose an option:

[🧾 Card list] [💳 New Card]
```

### Card Creation Flow

#### 1. Choose Card Type
```
Choose card type:

[🕶️ Anonymous Card]
[👤 Normal Card]
[⬅️ Back]
```

#### 2. Select Amount
```
🕶️ Anonymous Card

Select the amount you want to pay:

[💵 15 USDT] [💵 30 USDT]
[💵 50 USDT] [💵 100 USDT]
[✏️ Custom Amount]
[⬅️ Back]
```

#### 3. Enter Details
```
Amount: 15 USDT

Enter your First name:
```

User enters: `John`

```
Enter your Last name:
```

User enters: `Doe`

```
You will receive PIN here. Make sure your email is correct.

Enter your Email:
```

User enters: `john@example.com`

**For Normal Cards Only:**
```
Enter your Phone number (with country code):
```

User enters: `+1234567890`

#### 4. Confirmation
```
📋 Please confirm your order:

Name: John Doe
Email: john@example.com
Number: +1234567890
Balance Amount: 15 USDT
Card Creation Fee: 7 USDT

💰 Total: 22 USDT

Do you want to proceed?

[✅ Yes, Proceed] [❌ Cancel]
```

#### 5. Payment Instructions
```
🧾 Order created!
Type: Normal Card
Amount: 22 USDT

Please pay 22 USDT (TRC-20) to this address within 15 minutes:
`TXYZabc123...`

Once paid, you'll automatically receive a success message.
If the timer runs out, the order expires and you'll need to /start again.
```

#### 6. Payment Detected
```
✅ Payment Confirmed!

Thank you for your payment. Your card request has been successfully confirmed.

🎴 Your virtual card will be created and sent to you within 20 minutes.

We appreciate your patience!
```

#### 7. Card Delivered
```
🎉 Your Virtual Card is Ready!

Here's your personalized card image.

[Card Image with details]

💳 Card Details:

Card Number: `4532 1234 5678 9012`
Card Name: JOHN DOE
Expiry Date: `12/25`
CVV: `123`

⚠️ Important Security Information:
• Keep your card details secure
• Do not share your CVV with anyone
• You can start using your card immediately
• Save the card image for easy reference

Thank you for using ZeroXPay! 🚀
```

### Card List Flow

#### View Card List
```
🧾 Your Card List

Total Cards: 3 | Page 1/1

[🔍 Card 1] [🔍 Card 2]
[🔍 Card 3]

[🔄 Refresh] [⬅️ Back]
```

#### View Card Details
User clicks `🔍 Card 1`:

```
[Card Image with details sent]

💳 Card Details

👤 Card Holder: JOHN DOE
🔢 Card Number: `4532 1234 5678 9012`
📅 Expiry Date: `12/25`
🔐 CVV: `123`

💰 Card Information:
• Card Type: 👤 Normal
• Card Amount: 22 USDT
• Created: 1/10/2025
• Delivered: 1/15/2025

⚠️ Security Reminder:
• Keep your card details secure
• Never share your CVV with anyone
• Store this information safely

🆔 Order ID: `67890abcdef12345`

[🔄 Resend Card Image]
[⬅️ Back to Card List]
```

### Bot Commands
- `/start` - Start bot and show main menu
- `/status` - Check last order status

---

## Admin Dashboard

### Login Page
**URL:** `http://localhost:3000/login.html`

Features:
- Username/password authentication
- Session management
- Role-based access control
- Secure password hashing

### Dashboard Page
**URL:** `http://localhost:3000/dashboard.html`

Features:
- **Statistics Cards**
  - Total Orders
  - Pending Orders
  - In Process Orders
  - Delivered Orders

- **Orders Table**
  - Serial number
  - Username (@telegram)
  - Full name
  - Card type (Anonymous/Normal)
  - Card status dropdown
  - Wallet address (truncated, copyable)
  - Status changed by (admin name + timestamp)

- **Status Management**
  - Change status via dropdown
  - Three states: Pending → In Process → Delivered
  - Delivered status is final (dropdown disabled)

- **Card Delivery Modal**
  - Triggers when status changed to "Delivered"
  - Input fields:
    - Card Number (auto-formatted: `1234 5678 9012 3456`)
    - Card Name (auto-uppercase)
    - Expiry Date (auto-formatted: `MM/YY`)
    - CVV (3-4 digits)
  - Real-time validation
  - Submit button disabled until all fields valid

- **Auto Features**
  - Auto-refresh every 30 seconds
  - Real-time status updates
  - Copy wallet address to clipboard
  - Delete group notification on delivery

### Wallets Page (Super Admin Only)
**URL:** `http://localhost:3000/wallets.html`

Features:
- **Wallet List**
  - Serial number
  - Username
  - Telegram ID
  - Wallet address (truncated, copyable)
  - USDT Balance (real-time)
  - Private key (truncated, copyable)
  - Created date

- **Pagination**
  - 10 wallets per page
  - First/Prev/Next/Last navigation
  - Page size selector (10/25/50/100)
  - Total wallet count

- **Balance Fetching**
  - Real-time USDT balance from blockchain
  - Cached for 1 minute
  - Rate-limited (200ms delay between requests)
  - Exponential backoff retry on errors

- **Security**
  - Only accessible to super admins
  - Private keys visible (for recovery)
  - Manual refresh button

---

## API Endpoints

### Authentication

#### POST `/api/login`
Login to admin dashboard

**Request:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "username": "admin",
  "role": "super"
}
```

#### POST `/api/logout`
Logout from dashboard

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET `/api/auth/check`
Check authentication status

**Response:**
```json
{
  "success": true,
  "authenticated": true,
  "username": "admin",
  "role": "super"
}
```

### Orders

#### GET `/api/orders`
Get all paid orders (requires authentication)

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "id": "67890abcdef12345",
      "username": "john_doe",
      "firstName": "John",
      "lastName": "Doe",
      "cardType": "normal",
      "cardStatus": "delivered",
      "walletAddress": "TXYZabc123...",
      "createdAt": "2025-01-15T10:30:00Z",
      "statusChangedBy": "admin",
      "statusChangedAt": "2025-01-15T11:00:00Z"
    }
  ]
}
```

#### PATCH `/api/orders/:orderId/status`
Update card status (requires authentication)

**Request:**
```json
{
  "cardStatus": "delivered",
  "cardDetails": {
    "cardNumber": "4532123456789012",
    "cardName": "JOHN DOE",
    "expiryDate": "12/25",
    "cvv": "123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "order": { /* updated order object */ }
}
```

**Validations:**
- `cardStatus` must be: "pending", "inprocess", or "delivered"
- If status is "delivered", `cardDetails` is required
- Card details must include all 4 fields

**Side Effects:**
- Generates and sends card image to user
- Sends card details message to user
- Deletes group notification message
- Updates `statusChangedBy` and `statusChangedAt`

### Wallets

#### GET `/api/wallets`
Get all wallets with balances (requires super admin)

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "wallets": [
    {
      "id": "abc123",
      "tgId": 123456789,
      "username": "john_doe",
      "address": "TXYZabc123...",
      "privateKey": "0x123abc...",
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

**Features:**
- Sequential balance fetching (200ms delay)
- Balance caching (1 minute)
- Retry logic with exponential backoff
- Rate limit protection

---

## Card Image Generation

### Overview
The system generates personalized card images by overlaying card details onto a base card template image.

### Implementation

#### Card Template
- **Location:** `public/card.png`
- **Recommended Size:** 800x500px or higher
- **Format:** PNG with transparent or solid background
- **Design:** Should have space for card number, name, expiry, and CVV

#### Generation Process
```javascript
async function generateCardImage(cardDetails) {
  // 1. Load base card image
  // 2. Create canvas with same dimensions
  // 3. Draw base image
  // 4. Overlay card details:
  //    - Card number (formatted with spaces)
  //    - Card holder name (uppercase)
  //    - Expiry date (with label)
  //    - CVV (with label)
  // 5. Return PNG buffer
}
```

#### Text Positioning
Customize positions in `app.js`:

```javascript
const positions = {
  cardNumber: {
    x: 80,                    // Pixels from left
    y: image.height * 0.55,   // 55% from top
    font: "bold 36px Arial",
    color: "#FFFFFF"
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
    x: image.width * 0.85,
    y: image.height * 0.75,
    font: "bold 24px Arial",
    color: "#FFFFFF"
  }
};
```

#### Customization Options

**Font Size:**
```javascript
font: "bold 40px Arial"  // Larger
font: "bold 20px Arial"  // Smaller
```

**Font Family:**
```javascript
font: "bold 36px 'Courier New'"        // Monospace
font: "bold 36px 'Times New Roman'"    // Serif
font: "bold 36px 'Helvetica'"          // Sans-serif
```

**Text Color:**
```javascript
color: "#FFFFFF"  // White
color: "#000000"  // Black
color: "#FFD700"  // Gold
color: "#1E90FF"  // Blue
```

**Text Shadow (for better visibility):**
```javascript
ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
ctx.shadowBlur = 4;
ctx.shadowOffsetX = 2;
ctx.shadowOffsetY = 2;
```

#### Features
- Anti-aliasing for smooth text
- Automatic text formatting
- Responsive positioning (percentage-based)
- Error handling (fallback to text-only)

---

## Payment Processing

### Wallet Generation
Each order gets a unique Tron wallet:

```javascript
async function generateTronWallet() {
  const account = await tronWeb.utils.accounts.generateAccount();
  return {
    address: account.address.base58,  // TXYZabc...
    privateKey: account.privateKey    // 0x123abc...
  };
}
```

### Payment Detection

#### Polling Mechanism
```javascript
async function startPaymentWatcher(orderId) {
  const pollMs = 10000;  // Check every 10 seconds

  setInterval(async () => {
    // 1. Fetch order
    // 2. Check if expired
    // 3. Query USDT balance
    // 4. If paid, update status and notify
    // 5. If expired, mark as expired
  }, pollMs);
}
```

#### Balance Check
```javascript
async function checkUsdtPaidOnce(order) {
  // 1. Connect to USDT contract
  // 2. Query balanceOf(walletAddress)
  // 3. Convert from raw units to USDT
  // 4. Compare with expected amount
  // 5. Return paid/unpaid status
}
```

### Payment Flow

1. **Order Created**
   - Generate unique wallet
   - Save order with "pending" status
   - Start payment watcher
   - Show payment instructions to user

2. **Polling (Every 10 seconds)**
   - Check wallet USDT balance
   - If balance >= order amount → Payment confirmed
   - If time expired → Mark as expired

3. **Payment Confirmed**
   - Update status to "paid"
   - Update card status to "inprocess"
   - Send confirmation to user
   - Send notification to admin group
   - Stop payment watcher

4. **Payment Expired**
   - Update status to "expired"
   - Notify user
   - Stop payment watcher
   - User must create new order

### Expiry Handling

#### Active Watcher
```javascript
if (new Date() > order.expiresAt) {
  order.status = "expired";
  await order.save();
  await bot.telegram.sendMessage(
    order.tgId,
    "⏰ Payment window expired. Please start over with /start."
  );
  clearInterval(timer);
}
```

#### Passive Sweeper
```javascript
// Runs every minute to catch any missed expirations
setInterval(async () => {
  await Order.updateMany(
    { status: "pending", expiresAt: { $lte: new Date() } },
    { $set: { status: "expired" } }
  );
}, 60000);
```

### Admin Notifications

When payment is confirmed, admin group receives:

```
🎴 New Order Paid!

👤 User: @john_doe (ID: 123456789)
📝 Name: John Doe
📧 Email: john@example.com
📱 Phone: +1234567890
💳 Card Type: Normal
💰 Amount: 22 USDT
🏦 Wallet: `TXYZabc123...`
📊 Status: In Process

🆔 Order ID: `67890abcdef12345`
```

This message is automatically deleted when card is delivered.

---

## Security Features

### Authentication & Authorization

#### Password Security
- **Hashing:** bcrypt with 10 salt rounds
- **Storage:** Only hashed passwords in database
- **Validation:** Compared using bcrypt.compare()

```javascript
// Hash password
const hashedPassword = await bcrypt.hash(password, 10);

// Verify password
const isValid = await bcrypt.compare(password, hashedPassword);
```

#### Session Management
```javascript
expressSession({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,  // Set true with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000  // 24 hours
  }
})
```

#### Role-Based Access Control

**Middleware:**
```javascript
// Require any admin
const requireAuth = (req, res, next) => {
  if (req.session && req.session.adminId) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
};

// Require super admin
const requireSuperAdmin = (req, res, next) => {
  if (req.session && req.session.role === "super") {
    return next();
  }
  return res.status(403).json({ error: "Super admin required" });
};
```

**Protected Routes:**
- `/api/orders` - requireAuth
- `/api/orders/:id/status` - requireAuth
- `/api/wallets` - requireSuperAdmin

### Data Protection

#### Telegram Bot Security
- Only processes messages from authenticated users
- Validates user's Telegram ID
- Stores minimal user data
- Prevents access to other users' cards

```javascript
// Verify card ownership
const order = await Order.findOne({
  _id: orderId,
  tgId: ctx.from.id  // Must match current user
});
```

#### Wallet Security
- Private keys stored in database (encrypt in production)
- Only super admins can access wallets page
- One-time-use wallets (generated per order)
- No reuse of wallet addresses

#### Input Validation

**Email:**
```javascript
/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
```

**Phone:**
```javascript
/^\+?\d{10,15}$/.test(phone)
```

**Card Number:**
```javascript
/^\d{13,19}$/.test(cardNumber)
```

**Expiry Date:**
```javascript
/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)
// Also checks not expired
```

**CVV:**
```javascript
/^\d{3,4}$/.test(cvv)
```

### Rate Limiting

#### TronGrid API
- API key authentication for higher limits
- 200ms delay between balance requests
- Exponential backoff retry (2s, 4s, 6s)
- Balance caching (1 minute)

```javascript
// Sequential processing with delay
for (let i = 0; i < wallets.length; i++) {
  const balance = await fetchWalletBalance(wallet.address);
  if (i < wallets.length - 1) {
    await delay(200);  // Prevent rate limit
  }
}
```

#### Error Handling
- Graceful degradation (show 0 balance on error)
- Try-catch blocks around all API calls
- User-friendly error messages
- Detailed error logging

### CORS Configuration
```javascript
app.use(cors({
  credentials: true,
  origin: true
}));
```

### Best Practices

**For Production:**
1. ✅ Change default admin passwords
2. ✅ Use HTTPS for dashboard (secure cookies)
3. ✅ Encrypt private keys in database
4. ✅ Set strong SESSION_SECRET
5. ✅ Enable MongoDB authentication
6. ✅ Use environment variables for secrets
7. ✅ Implement rate limiting on API
8. ✅ Add CAPTCHA to login page
9. ✅ Enable MongoDB connection pooling
10. ✅ Set up monitoring and alerts

---

## Testing Guide

### Manual Testing

#### 1. Test Bot Flow
```bash
# Terminal 1: Start server
npm start

# Terminal 2: Open Telegram
# Search for your bot
# Send: /start
```

**Test Cases:**
- ✅ Main menu appears
- ✅ Card list shows empty or existing cards
- ✅ New card flow works (type selection)
- ✅ Amount selection (preset and custom)
- ✅ User input validation (name, email, phone)
- ✅ Order confirmation shows correct total
- ✅ Payment instructions received
- ✅ Payment detected within 15 minutes
- ✅ Card delivered notification received
- ✅ View card details works
- ✅ Resend card image works
- ✅ Card list pagination works

#### 2. Test Admin Dashboard
```
http://localhost:3000/login.html
```

**Test Cases:**
- ✅ Login with valid credentials
- ✅ Login fails with invalid credentials
- ✅ Dashboard shows statistics
- ✅ Orders table populated
- ✅ Status dropdown works
- ✅ Modal opens on "Delivered" selection
- ✅ Card details form validation
- ✅ Form submission updates database
- ✅ User receives card via Telegram
- ✅ Dropdown disabled after delivery
- ✅ Auto-refresh works (30s)
- ✅ Logout works

#### 3. Test Wallets Page
```
http://localhost:3000/wallets.html
```

**Test Cases:**
- ✅ Only accessible to super admin
- ✅ Normal admin redirected
- ✅ Wallets list displayed
- ✅ USDT balances shown
- ✅ Pagination works
- ✅ Page size selector works
- ✅ Copy buttons work
- ✅ Refresh button works
- ✅ Balances cached for 1 minute

#### 4. Test Payment System

**Using Testnet:**
```env
TRON_FULLNODE=https://api.nileex.io
USDT_CONTRACT=TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf
```

**Steps:**
1. Create order via bot
2. Get payment wallet address
3. Send testnet USDT to address
4. Wait for payment detection (10-30 seconds)
5. Verify payment confirmation message
6. Check admin group notification
7. Deliver card from dashboard
8. Verify user receives card

**Using Mainnet:**
⚠️ Use real USDT - cannot be reversed!

### API Testing with cURL

#### Login
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123123132"}' \
  -c cookies.txt
```

#### Check Auth
```bash
curl http://localhost:3000/api/auth/check \
  -b cookies.txt
```

#### Get Orders
```bash
curl http://localhost:3000/api/orders \
  -b cookies.txt
```

#### Update Order Status
```bash
curl -X PATCH http://localhost:3000/api/orders/ORDER_ID/status \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "cardStatus": "delivered",
    "cardDetails": {
      "cardNumber": "4532123456789012",
      "cardName": "JOHN DOE",
      "expiryDate": "12/25",
      "cvv": "123"
    }
  }'
```

#### Get Wallets
```bash
curl 'http://localhost:3000/api/wallets?page=1&limit=10' \
  -b cookies.txt
```

### Testing Checklist

**Before Production:**
- [ ] All bot commands work
- [ ] Payment detection accurate
- [ ] Card delivery successful
- [ ] Image generation works
- [ ] Dashboard login secure
- [ ] Admin permissions correct
- [ ] Wallet balances accurate
- [ ] All validations working
- [ ] Error handling graceful
- [ ] No console errors
- [ ] Database indexes created
- [ ] Environment variables set
- [ ] Default passwords changed
- [ ] HTTPS enabled (production)
- [ ] Monitoring set up

---

## Deployment

### Server Requirements
- **OS:** Ubuntu 20.04+ or similar Linux distribution
- **RAM:** Minimum 2GB (4GB recommended)
- **Storage:** 10GB minimum
- **CPU:** 2 cores minimum
- **Node.js:** v16.x or higher
- **MongoDB:** v5.x or higher (can use MongoDB Atlas)

### Deployment Steps

#### 1. Prepare Server
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install MongoDB (or use MongoDB Atlas)
# See: https://docs.mongodb.com/manual/installation/
```

#### 2. Clone and Setup
```bash
# Clone repository
git clone <your-repo-url>
cd EpaybotBackend

# Install dependencies
npm install --production

# Create .env file
nano .env
# Add all environment variables

# Add card template
# Upload card.png to public/ folder
```

#### 3. Start with PM2
```bash
# Start application
pm2 start app.js --name "zeroxpay-bot"

# Save PM2 configuration
pm2 save

# Enable PM2 startup on boot
pm2 startup
```

#### 4. Configure Nginx (Optional)
```bash
# Install Nginx
sudo apt install nginx

# Create config
sudo nano /etc/nginx/sites-available/zeroxpay
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/zeroxpay /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. SSL Certificate (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

#### 6. Firewall
```bash
# Allow necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### PM2 Commands

```bash
# View logs
pm2 logs zeroxpay-bot

# View status
pm2 status

# Restart
pm2 restart zeroxpay-bot

# Stop
pm2 stop zeroxpay-bot

# Monitor
pm2 monit

# View detailed info
pm2 show zeroxpay-bot
```

### MongoDB Atlas Setup

1. Create account at mongodb.com/cloud/atlas
2. Create new cluster (free tier available)
3. Add database user
4. Whitelist IP (0.0.0.0/0 for any IP)
5. Get connection string
6. Update MONGO_URI in .env

### Environment Variables for Production

```env
# Use production values
NODE_ENV=production
SESSION_SECRET=<generate-strong-random-string>

# Use HTTPS
# Update dashboard URLs to use HTTPS

# Enable secure cookies
# Update app.js session config:
# cookie: { secure: true, httpOnly: true }
```

### Backup Strategy

#### Database Backup
```bash
# Create backup script
nano backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGO_URI" --out="/backups/mongodb_$DATE"
find /backups -type d -mtime +7 -exec rm -rf {} +
```

```bash
chmod +x backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /path/to/backup.sh
```

#### Code Backup
```bash
# Use Git for version control
git push origin main
```

### Monitoring

#### PM2 Monitor
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

#### Custom Monitoring
Add to `app.js`:

```javascript
// Log all errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
```

### Scaling Considerations

**For High Traffic:**
1. Use Redis for session storage
2. Implement job queue for payment watching
3. Use CDN for static files
4. Implement database sharding
5. Use load balancer for multiple instances
6. Cache frequently accessed data
7. Optimize database queries with indexes

---

## Troubleshooting

### Common Issues

#### Bot Not Responding

**Symptoms:**
- Bot doesn't respond to /start
- No messages received

**Solutions:**
1. Check BOT_TOKEN is correct
```bash
curl https://api.telegram.org/bot<TOKEN>/getMe
```

2. Check server is running
```bash
pm2 status
pm2 logs zeroxpay-bot
```

3. Check firewall allows outbound HTTPS
```bash
curl https://api.telegram.org
```

4. Restart bot
```bash
pm2 restart zeroxpay-bot
```

#### Payment Not Detected

**Symptoms:**
- User paid but no confirmation
- Order stuck in "pending"

**Solutions:**
1. Check USDT contract address is correct
```javascript
console.log(process.env.USDT_CONTRACT);
// Mainnet: TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
// Testnet: TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf
```

2. Verify TronGrid API key
```bash
curl -H "TRON-PRO-API-KEY: your-key" https://api.trongrid.io/wallet/getaccount?address=TXYZabc123
```

3. Check payment watcher is running
```bash
pm2 logs zeroxpay-bot --lines 50 | grep "watcher"
```

4. Manually check wallet balance
```javascript
// In Node.js console
const TronWeb = require('tronweb');
const tronWeb = new TronWeb({
  fullHost: 'https://api.trongrid.io'
});
// Check balance
```

5. Verify payment amount matches exactly
```
Expected: order.amount USDT
Received: Check TronScan
```

#### Dashboard Login Issues

**Symptoms:**
- Cannot login with correct credentials
- Session expires immediately

**Solutions:**
1. Check admin exists in database
```javascript
// MongoDB query
db.admins.findOne({ username: "admin" })
```

2. Verify password hash
```bash
# Create new admin with bcrypt
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('newpassword', 10));"
```

3. Check session configuration
```javascript
// Verify SESSION_SECRET is set
console.log(process.env.SESSION_SECRET);
```

4. Clear cookies and try again

5. Check MongoDB connection
```bash
pm2 logs | grep "MongoDB"
# Should see: "✅ MongoDB connected successfully"
```

#### Card Image Not Generated

**Symptoms:**
- User receives text details but no image
- Error in logs about canvas

**Solutions:**
1. Check card.png exists
```bash
ls -la public/card.png
```

2. Verify canvas package installed
```bash
npm list canvas
```

3. Check file permissions
```bash
chmod 644 public/card.png
```

4. Test image generation manually
```javascript
// In Node.js console
const { loadImage } = require('canvas');
loadImage('./public/card.png').then(img => {
  console.log('Image loaded:', img.width, 'x', img.height);
});
```

5. Check error logs
```bash
pm2 logs | grep "card image"
```

#### Rate Limit Errors (429)

**Symptoms:**
- "Request failed with status code 429"
- Wallet balances show 0

**Solutions:**
1. Verify TronGrid API key is set
```bash
echo $TRON_APIKEY
```

2. Reduce page size in wallets page
```javascript
// Change from 10 to 5
const limit = 5;
```

3. Increase delay between requests
```javascript
// Change from 200ms to 500ms
await delay(500);
```

4. Check API key limits
```
Free tier: 1 request/second
Pro tier: 5 requests/second
```

5. Use balance caching (already implemented)

#### MongoDB Connection Errors

**Symptoms:**
- "MongoServerError: Authentication failed"
- "ECONNREFUSED"

**Solutions:**
1. Check MONGO_URI format
```
mongodb+srv://username:password@cluster.mongodb.net/database
```

2. Verify credentials
3. Check IP whitelist in MongoDB Atlas
4. Test connection
```bash
node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGO_URI).then(() => console.log('Connected')).catch(err => console.log('Error:', err));"
```

#### Telegram API Errors

**"message is not modified"**
- Not an error, already handled
- Happens when user clicks same button twice

**"Bad Request: message to edit not found"**
- Message was deleted
- User started new conversation
- Already handled with try-catch

**"Forbidden: bot was blocked by the user"**
- User blocked the bot
- Log and skip notification

### Debug Mode

Enable detailed logging:

```javascript
// Add to app.js
if (process.env.DEBUG === 'true') {
  mongoose.set('debug', true);

  bot.use((ctx, next) => {
    console.log('Update:', JSON.stringify(ctx.update, null, 2));
    return next();
  });

  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
  });
}
```

```env
# In .env
DEBUG=true
```

### Performance Optimization

**Database:**
```javascript
// Add compound indexes
Order.collection.createIndex({ tgId: 1, status: 1 });
Order.collection.createIndex({ tgId: 1, cardStatus: 1 });
```

**Caching:**
```javascript
// Cache user data
const userCache = new Map();
setInterval(() => userCache.clear(), 300000); // Clear every 5 min
```

**Connection Pooling:**
```javascript
mongoose.connect(MONGO_URI, {
  maxPoolSize: 10,
  minPoolSize: 2
});
```

### Getting Help

**Resources:**
- Telegraf Documentation: https://telegraf.js.org/
- TronWeb Documentation: https://developers.tron.network/docs/tronweb
- MongoDB Documentation: https://docs.mongodb.com/
- Canvas Documentation: https://github.com/Automattic/node-canvas

**Support:**
- Check logs: `pm2 logs zeroxpay-bot`
- Search error messages
- Check GitHub issues
- Review this documentation

---

## Appendix

### Default Admin Accounts

```javascript
{
  username: "admin",
  password: "123123132",
  role: "normal"
},
{
  username: "sensiMAXI",
  password: "MAXIsensi@345",
  role: "normal"
},
{
  username: "unicorn404",
  password: "404unic@rn123",
  role: "normal"
},
{
  username: "bagofadrian",
  password: "bagofadrian@057!",
  role: "normal"
},
{
  username: "einsteinOnDoge",
  password: "einstein@nDoge134",
  role: "super"
}
```

**⚠️ CHANGE THESE PASSWORDS IN PRODUCTION!**

### File Structure

```
EpaybotBackend/
├── public/
│   ├── card.png              # Card template image
│   ├── dashboard.html        # Admin dashboard
│   ├── login.html           # Admin login page
│   └── wallets.html         # Wallets page (super admin)
├── node_modules/            # Dependencies
├── app.js                   # Main application
├── package.json             # NPM configuration
├── .env                     # Environment variables
├── .gitignore              # Git ignore file
└── DOCUMENTATION.md         # This file
```

### NPM Scripts

```json
{
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

### Dependencies

```json
{
  "dependencies": {
    "bcryptjs": "^3.0.2",           // Password hashing
    "canvas": "^2.11.2",            // Image generation
    "cors": "^2.8.5",               // CORS middleware
    "dotenv": "^17.2.3",            // Environment variables
    "express": "^5.1.0",            // Web server
    "express-session": "^1.18.2",   // Session management
    "mongoose": "^8.19.2",          // MongoDB ODM
    "telegraf": "^4.16.3",          // Telegram bot
    "tronweb": "^6.0.4"             // Tron blockchain
  },
  "devDependencies": {
    "nodemon": "^3.1.10"            // Development auto-restart
  }
}
```

### Useful Commands

```bash
# Development
npm run dev                    # Start with auto-reload
npm start                      # Start normally

# Production
pm2 start app.js              # Start with PM2
pm2 restart app               # Restart
pm2 stop app                  # Stop
pm2 logs app                  # View logs
pm2 monit                     # Monitor resources

# Database
mongodump --uri="$MONGO_URI"  # Backup
mongorestore --uri="$MONGO_URI" # Restore

# Git
git status                    # Check status
git add .                     # Stage changes
git commit -m "message"       # Commit
git push                      # Push to remote
```

### License

This project is proprietary software. All rights reserved.

### Contact

For support or inquiries, contact the development team.

---

**End of Documentation**

Last Updated: January 2025
Version: 1.0.0
