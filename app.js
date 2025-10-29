// app.js
require("dotenv").config();
const { Telegraf, Markup, session } = require("telegraf");
const mongoose = require("mongoose");
const { TronWeb } = require("tronweb");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const expressSession = require("express-session");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

// ---------- Setup ----------
const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(session({
  defaultSession: () => ({ step: null, order: null })
}));

// Express API Setup
const app = express();
app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(expressSession({
  secret: process.env.SESSION_SECRET || "zeroxpay-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(express.static("public")); // Serve static files from public folder

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

connectDB();

// TronWeb (read-only OK)
const tronWeb = new TronWeb({
  fullHost: process.env.TRON_FULLNODE,
  solidityNode: process.env.TRON_SOLIDITYNODE,
  headers: { 'TRON-PRO-API-KEY': process.env.TRON_APIKEY },
  privateKey: 'E82CFF5B6710150C272F04C9D33F300C02E367289CB133090DB5CDF760F714AC',
  eventServer: process.env.TRON_EVENTSERVER,
});

// ---------- DB Schemas ----------
const userSchema = new mongoose.Schema({
  tgId: { type: Number, index: true, unique: true },
  username: String,
  firstSeenAt: { type: Date, default: Date.now },
});

const walletSchema = new mongoose.Schema({
  tgId: { type: Number, index: true, required: true },
  address: { type: String, required: true, unique: true, index: true },
  privateKey: { type: String, required: true }, // store securely in production
  createdAt: { type: Date, default: Date.now },
});

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["normal", "super"], default: "normal" },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
});

const orderSchema = new mongoose.Schema({
  tgId: { type: Number, index: true },
  type: { type: String, enum: ["anonymous", "normal"], required: true },
  inputs: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String, // only for normal
  },
  amount: { type: Number, required: true, min: 15 }, // Selected USDT amount
  walletAddress: { type: String, required: true, index: true }, // Reference to wallet address only
  usdt: {
    decimals: { type: Number, default: Number(process.env.USDT_DECIMALS || 6) },
    contract: { type: String, default: process.env.USDT_CONTRACT },
  },
  status: { type: String, enum: ["pending", "paid", "expired"], default: "pending", index: true },
  cardStatus: { type: String, enum: ["pending", "inprocess", "delivered"], default: "pending", index: true },
  statusChangedBy: { type: String }, // Admin username who changed the card status
  statusChangedAt: { type: Date }, // When the status was changed
  cardDetails: {
    cardNumber: String,
    expiryDate: String,
    cvv: String,
    cardName: String,
  },
  groupMessageId: { type: Number }, // Telegram message ID in notification group
  createdAt: { type: Date, default: Date.now, index: true },
  expiresAt: { type: Date, index: true },
  txId: String,
});

const User = mongoose.model("User", userSchema);
const Wallet = mongoose.model("Wallet", walletSchema);
const Admin = mongoose.model("Admin", adminSchema);
const Order = mongoose.model("Order", orderSchema);

// Create default admin users
const createDefaultAdmins = async () => {
  try {
    const admins = [
      { username: "admin", password: "123123132", role: "normal" },
      { username: "sensiMAXI", password: "MAXIsensi@345", role: "normal" },
      { username: "unicorn404", password: "404unic@rn123", role: "normal" },
      { username: "bagofadrian", password: "bagofadrian@057!", role: "normal" },
      { username: "einsteinOnDoge", password: "einstein@nDoge134", role: "super" },
    ];

    for (const admin of admins) {
      const existingAdmin = await Admin.findOne({ username: admin.username });
      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(admin.password, 10);
        await Admin.create({
          username: admin.username,
          password: hashedPassword,
          role: admin.role,
        });
        console.log(`✅ Admin user created: ${admin.username} (${admin.role})`);
      }
    }
  } catch (error) {
    console.error("Error creating admin users:", error.message);
  }
};

createDefaultAdmins();

// ---------- Helpers ----------
const mainMenu = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback("🧾 Card list", "CARD_LIST"), Markup.button.callback("💳 New Card", "NEW_CARD")],
  ]);

const cardTypeMenu = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback("🕶️ Anonymous Card", "TYPE_ANON")],
    [Markup.button.callback("👤 Normal Card", "TYPE_NORMAL")],
    [Markup.button.callback("⬅️ Back", "BACK_HOME")],
  ]);

const amountMenu = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback("💵 15 USDT", "AMOUNT_15"), Markup.button.callback("💵 30 USDT", "AMOUNT_30")],
    [Markup.button.callback("💵 50 USDT", "AMOUNT_50"), Markup.button.callback("💵 100 USDT", "AMOUNT_100")],
    [Markup.button.callback("✏️ Custom Amount", "AMOUNT_CUSTOM")],
    [Markup.button.callback("⬅️ Back", "BACK_HOME")],
  ]);

const confirmationMenu = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback("✅ Yes, Proceed", "CONFIRM_YES")],
    [Markup.button.callback("❌ Cancel", "CONFIRM_CANCEL")],
  ]);

function minutesFromNow(m) {
  return new Date(Date.now() + m * 60 * 1000);
}

async function generateTronWallet() {
  // Local generation (no RPC call)
  // Returns { address: base58, privateKey: hex }
  const acc = await tronWeb.utils.accounts.generateAccount();
  return { address: acc.address.base58, privateKey: acc.privateKey };
}

async function checkUsdtPaidOnce(order) {
  // query TRC20 transfer events to order.walletAddress
  try {
    // Set the address as the default address for this call
    tronWeb.setAddress(order.walletAddress);

    const contract = await tronWeb.contract().at(order.usdt.contract);
    const bal = await contract.methods.balanceOf(order.walletAddress).call();
    const raw = tronWeb.toBigNumber(bal._hex || bal); // handle tronweb variants
    const decimals = order.usdt.decimals;
    const human = Number(raw.toString()) / 10 ** decimals;
    return human >= order.amount ? { paid: true, amount: human } : { paid: false, amount: human };
  } catch (e) {
    console.error("USDT check error:", e.message);
    return { paid: false, error: e.message };
  }
}

// Function to generate card image with details
async function generateCardImage(cardDetails) {
  try {
    // Load the base card image
    const cardTemplatePath = path.join(__dirname, "public", "card.png");
    const image = await loadImage(cardTemplatePath);

    // Create canvas with same dimensions as card image
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");

    // Draw the base card image
    ctx.drawImage(image, 0, 0);

    // Enable text smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.textBaseline = "middle";

    // Text positions - adjust these based on your card.png design
    // These are example positions, modify them to match your card template
    const positions = {
      cardNumber: { x: 120, y: image.height * 0.50, font: "bold 90px Arial", color: "#FFFFFF" },
      cardName: { x: 120, y: image.height * 0.62, font: "50px Arial", color: "#FFFFFF" },
      expiryDate: { x: 70, y: image.height * 0.88, font: "50px Arial", color: "#FFFFFF" },
      cvv: { x: 500, y: image.height * 0.88, font: "50px Arial", color: "#FFFFFF" },
    };

    // Format card number with spaces (e.g., 1234 5678 9012 3456)
    const formattedCardNumber = cardDetails.cardNumber.replace(/\s/g, "").match(/.{1,4}/g).join("  ");

    // Draw card number
    ctx.fillStyle = positions.cardNumber.color;
    ctx.font = positions.cardNumber.font;
    ctx.fillText(formattedCardNumber, positions.cardNumber.x, positions.cardNumber.y);

    // Draw card holder name (uppercase)
    ctx.fillStyle = positions.cardName.color;
    ctx.font = positions.cardName.font;
    ctx.fillText(cardDetails.cardName.toUpperCase(), positions.cardName.x, positions.cardName.y);

    // Draw expiry date (small label)
    ctx.fillStyle = positions.expiryDate.color;
    // ctx.font = "3px Arial";
    // ctx.fillText("VALID THRU", positions.expiryDate.x, positions.expiryDate.y - 20);
    ctx.font = positions.expiryDate.font;
    ctx.fillText(cardDetails.expiryDate, positions.expiryDate.x, positions.expiryDate.y + 5);

    // Draw CVV (small label)
    ctx.fillStyle = positions.cvv.color;
    // ctx.font = "32px Arial";
    // ctx.fillText("CVV", positions.cvv.x, positions.cvv.y - 20);
    ctx.font = positions.cvv.font;
    ctx.fillText(cardDetails.cvv, positions.cvv.x, positions.cvv.y + 5);

    // Convert canvas to buffer
    const buffer = canvas.toBuffer("image/png");

    return buffer;
  } catch (error) {
    console.error("Error generating card image:", error);
    throw error;
  }
}

async function startPaymentWatcher(orderId) {
  // Poll until paid or expired
  const pollMs = 10_000; // every 10s
  const stopAt = minutesFromNow(60); // safety stopper
  const timer = setInterval(async () => {
    try {
      const order = await Order.findById(orderId);
      if (!order) return clearInterval(timer);
      if (order.status !== "pending") return clearInterval(timer);
      if (new Date() > order.expiresAt) {
        order.status = "expired";
        await order.save();
        await bot.telegram.sendMessage(
          order.tgId,
          "⏰ Payment window (15 minutes) expired. Please start over with /start."
        );
        return clearInterval(timer);
      }
      const res = await checkUsdtPaidOnce(order);
      if (res.paid) {
        order.status = "paid";
        order.cardStatus = "inprocess"; // Change card status to inprocess when payment successful
        await order.save();

        // Get user data for notification
        const user = await User.findOne({ tgId: order.tgId });
        const fullName = `${order.inputs.firstName} ${order.inputs.lastName}`;

        // Send success message to user
        await bot.telegram.sendMessage(
          order.tgId,
          "✅ *Payment Confirmed!*\n\n" +
          "Thank you for your payment. Your card request has been successfully confirmed.\n\n" +
          "🎴 Your virtual card will be created and sent to you within *20 minutes*.\n\n" +
          "We appreciate your patience!",
          { parse_mode: "Markdown" }
        );

        // Send notification to group
        const groupId = process.env.NOTIFICATION_GROUP_ID;
        if (groupId) {
          const groupMessage = [
            "🎴 *New Order Paid!*",
            "",
            `👤 User: @${user?.username || "N/A"} (ID: ${order.tgId})`,
            `📝 Name: *${fullName}*`,
            `📧 Email: ${order.inputs.email}`,
            order.inputs.phone ? `📱 Phone: ${order.inputs.phone}` : "",
            `💳 Card Type: *${order.type === "anonymous" ? "Anonymous" : "Normal"}*`,
            `💰 Amount: *${order.amount} USDT*`,
            `🏦 Wallet: \`${order.walletAddress}\``,
            `📊 Status: *In Process*`,
            "",
            `🆔 Order ID: \`${order._id}\``,
          ].filter(Boolean).join("\n");

          try {
            const sentMessage = await bot.telegram.sendMessage(groupId, groupMessage, { parse_mode: "Markdown" });
            // Store the message ID so we can delete it later
            order.groupMessageId = sentMessage.message_id;
            await order.save();
          } catch (groupError) {
            console.error("Failed to send notification to group:", groupError.message);
          }
        }

        return clearInterval(timer);
      }
      if (Date.now() > stopAt) clearInterval(timer);
    } catch (e) {
      console.error("watcher error", e.message);
    }
  }, pollMs);
}

// ---------- Bot Flow ----------
bot.start(async (ctx) => {
  const { id, username } = ctx.from;
  await User.updateOne({ tgId: id }, { $setOnInsert: { tgId: id, username } }, { upsert: true });
  ctx.session.step = null;
  ctx.session.order = null;

  await ctx.reply(
    "Welcome to ZeroXPay Bot.\nChoose an option:",
    mainMenu()
  );
});

bot.action("BACK_HOME", async (ctx) => {
  try {
    await ctx.editMessageText("Welcome to ZeroXPay Bot.\nChoose an option:", mainMenu());
  } catch (error) {
    // Ignore "message is not modified" errors
    if (!error.description?.includes("message is not modified")) {
      throw error;
    }
  }
  ctx.session.step = null;
  ctx.session.order = null;
});

// Helper function to display card list with pagination
async function showCardList(ctx, page = 1) {
  const pageSize = 5; // Show 5 cards per page
  const skip = (page - 1) * pageSize;

  // Fetch user's orders with pagination
  const totalOrders = await Order.countDocuments({ tgId: ctx.from.id });
  const orders = await Order.find({ tgId: ctx.from.id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize);

  if (totalOrders === 0) {
    try {
      await ctx.editMessageText(
        "🧾 *Card List*\n\n" +
        "You don't have any cards yet.\n\n" +
        "Click *💳 New Card* to create your first virtual card!",
        { parse_mode: "Markdown", ...mainMenu() }
      );
    } catch (error) {
      if (!error.description?.includes("message is not modified")) {
        throw error;
      }
    }
    return;
  }

  const totalPages = Math.ceil(totalOrders / pageSize);

  // Format the card list
  const cardListText = [
    "🧾 *Your Card List*",
  ];

  const cardButtons = [];

  orders.forEach((order, index) => {
    const cardType = order.type === "anonymous" ? "🕶️ Anonymous" : "👤 Normal";
    const fullName = `${order.inputs.firstName} ${order.inputs.lastName}`;
    const orderNumber = skip + index + 1;

    // Add "View Details" button for delivered cards only
    if (order.cardStatus === "delivered" && order.cardDetails) {
      cardButtons.push(
        Markup.button.callback(`🔍 Card ${orderNumber}`, `VIEW_CARD_${order._id}`)
      );
    }
  });

  // Group card buttons into rows of 2
  const cardButtonRows = [];
  for (let i = 0; i < cardButtons.length; i += 2) {
    if (i + 1 < cardButtons.length) {
      // Add 2 buttons per row
      cardButtonRows.push([cardButtons[i], cardButtons[i + 1]]);
    } else {
      // Add single button if odd number
      cardButtonRows.push([cardButtons[i]]);
    }
  }

  // Create pagination buttons
  const paginationButtons = [];

  // Add card detail buttons (2 per row)
  cardButtonRows.forEach(row => paginationButtons.push(row));

  // Add main menu buttons
  paginationButtons.push([
    Markup.button.callback("🔄 Refresh", "CARD_LIST"),
    Markup.button.callback("⬅️ Back", "BACK_HOME")
  ]);

  try {
    await ctx.editMessageText(cardListText.join("\n"), {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard(paginationButtons)
    });
  } catch (error) {
    if (!error.description?.includes("message is not modified")) {
      throw error;
    }
  }
}

bot.action("CARD_LIST", async (ctx) => {
  await ctx.answerCbQuery();
  try {
    await showCardList(ctx, 1);
  } catch (error) {
    console.error("Error fetching card list:", error);
    await ctx.reply(
      "❌ Error loading your card list. Please try again.",
      mainMenu()
    );
  }
});

// Handle pagination for card list
bot.action(/CARDS_PAGE_(\d+)/, async (ctx) => {
  await ctx.answerCbQuery();
  const page = parseInt(ctx.match[1]);
  try {
    await showCardList(ctx, page);
  } catch (error) {
    console.error("Error navigating card list:", error);
    await ctx.reply("❌ Error loading page. Please try again.", mainMenu());
  }
});

// Handle current page button (no action, just shows current page)
bot.action("CARDS_CURRENT", async (ctx) => {
  await ctx.answerCbQuery("You are on this page");
});

// Handle view card details
bot.action(/VIEW_CARD_(.+)/, async (ctx) => {
  await ctx.answerCbQuery();

  try {
    const orderId = ctx.match[1];
    const order = await Order.findOne({
      _id: orderId,
      tgId: ctx.from.id,
      cardStatus: "delivered"
    });

    if (!order || !order.cardDetails) {
      await ctx.reply("❌ Card details not found or card not yet delivered.", mainMenu());
      return;
    }

    const cardDetails = order.cardDetails;
    const fullName = `${order.inputs.firstName} ${order.inputs.lastName}`;

    try {
      // Generate and send card image
      const cardImageBuffer = await generateCardImage(cardDetails);

      await ctx.replyWithPhoto({ source: cardImageBuffer }, {
        caption: `💳 *Your Virtual Card*\n\nCard for: *${fullName}*`,
        parse_mode: "Markdown"
      });

      // Send detailed card information
      const cardInfoMessage = [
        "💳 *Card Details*",
        "",
        `👤 *Card Holder:* ${cardDetails.cardName}`,
        `🔢 *Card Number:* \`${cardDetails.cardNumber}\``,
        `📅 *Expiry Date:* \`${cardDetails.expiryDate}\``,
        `🔐 *CVV:* \`${cardDetails.cvv}\``,
        "",
        "💰 *Card Information:*",
        `• Card Type: ${order.type === "anonymous" ? "🕶️ Anonymous" : "👤 Normal"}`,
        `• Card Amount: *${order.amount} USDT*`,
        `• Created: ${new Date(order.createdAt).toLocaleDateString()}`,
        `• Delivered: ${new Date(order.statusChangedAt).toLocaleDateString()}`,
        "",
        "⚠️ *Security Reminder:*",
        "• Keep your card details secure",
        "• Never share your CVV with anyone",
        "• Store this information safely",
        "",
        `🆔 Order ID: \`${order._id}\``,
      ].join("\n");

      await ctx.reply(cardInfoMessage, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("🔄 Resend Card Image", `RESEND_CARD_${order._id}`)],
          [Markup.button.callback("⬅️ Back to Card List", "CARD_LIST")]
        ])
      });

    } catch (error) {
      console.error("Error generating card image:", error);

      // If image generation fails, still send text details
      const cardInfoMessage = [
        "💳 *Card Details*",
        "",
        `👤 *Card Holder:* ${cardDetails.cardName}`,
        `🔢 *Card Number:* \`${cardDetails.cardNumber}\``,
        `📅 *Expiry Date:* \`${cardDetails.expiryDate}\``,
        `🔐 *CVV:* \`${cardDetails.cvv}\``,
        "",
        "💰 *Card Information:*",
        `• Card Type: ${order.type === "anonymous" ? "🕶️ Anonymous" : "👤 Normal"}`,
        `• Card Amount: *${order.amount} USDT*`,
        `• Created: ${new Date(order.createdAt).toLocaleDateString()}`,
        `• Delivered: ${new Date(order.statusChangedAt).toLocaleDateString()}`,
        "",
        "⚠️ *Security Reminder:*",
        "• Keep your card details secure",
        "• Never share your CVV with anyone",
        "• Store this information safely",
        "",
        `🆔 Order ID: \`${order._id}\``,
        "",
        "_Note: Card image could not be generated. Above are your card details._"
      ].join("\n");

      await ctx.reply(cardInfoMessage, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("⬅️ Back to Card List", "CARD_LIST")]
        ])
      });
    }
  } catch (error) {
    console.error("Error viewing card details:", error);
    await ctx.reply("❌ Error loading card details. Please try again.", mainMenu());
  }
});

// Handle resend card image
bot.action(/RESEND_CARD_(.+)/, async (ctx) => {
  await ctx.answerCbQuery("Sending card image...");

  try {
    const orderId = ctx.match[1];
    const order = await Order.findOne({
      _id: orderId,
      tgId: ctx.from.id,
      cardStatus: "delivered"
    });

    if (!order || !order.cardDetails) {
      await ctx.reply("❌ Card not found.", mainMenu());
      return;
    }

    // Generate and send card image
    const cardImageBuffer = await generateCardImage(order.cardDetails);
    const fullName = `${order.inputs.firstName} ${order.inputs.lastName}`;

    await ctx.replyWithPhoto({ source: cardImageBuffer }, {
      caption: `💳 *Your Virtual Card*\n\nCard for: *${fullName}*\n\n✅ Card image sent successfully!`,
      parse_mode: "Markdown"
    });

  } catch (error) {
    console.error("Error resending card image:", error);
    await ctx.reply("❌ Error sending card image. Please try again.");
  }
});

bot.action("NEW_CARD", async (ctx) => {
  await ctx.answerCbQuery();
  try {
    await ctx.editMessageText("Choose card type:", cardTypeMenu());
  } catch (error) {
    // Ignore "message is not modified" errors
    if (!error.description?.includes("message is not modified")) {
      throw error;
    }
  }
});

bot.action("TYPE_ANON", async (ctx) => {
  await ctx.answerCbQuery();
  ctx.session.order = { type: "anonymous", inputs: {} };
  ctx.session.step = "amount";
  try {
    await ctx.editMessageText("🕶️ Anonymous Card\n\nSelect the amount you want to pay:", amountMenu());
  } catch (error) {
    // Ignore "message is not modified" errors - happens when user clicks the same button twice
    if (!error.description?.includes("message is not modified")) {
      throw error;
    }
  }
});

bot.action("TYPE_NORMAL", async (ctx) => {
  await ctx.answerCbQuery();
  ctx.session.order = { type: "normal", inputs: {} };
  ctx.session.step = "amount";
  try {
    await ctx.editMessageText("👤 Normal Card\n\nSelect the amount you want to pay:", amountMenu());
  } catch (error) {
    // Ignore "message is not modified" errors - happens when user clicks the same button twice
    if (!error.description?.includes("message is not modified")) {
      throw error;
    }
  }
});

// Amount selection handlers
bot.action("AMOUNT_15", async (ctx) => {
  await ctx.answerCbQuery();
  ctx.session.order.amount = 15;
  ctx.session.step = "firstName";
  try {
    await ctx.editMessageText(`Amount: *15 USDT*\n\nEnter your *First name*:`, { parse_mode: "Markdown" });
  } catch (error) {
    // Ignore "message is not modified" errors
    if (!error.description?.includes("message is not modified")) {
      throw error;
    }
  }
});

bot.action("AMOUNT_30", async (ctx) => {
  await ctx.answerCbQuery();
  ctx.session.order.amount = 30;
  ctx.session.step = "firstName";
  try {
    await ctx.editMessageText(`Amount: *30 USDT*\n\nEnter your *First name*:`, { parse_mode: "Markdown" });
  } catch (error) {
    // Ignore "message is not modified" errors
    if (!error.description?.includes("message is not modified")) {
      throw error;
    }
  }
});

bot.action("AMOUNT_50", async (ctx) => {
  await ctx.answerCbQuery();
  ctx.session.order.amount = 50;
  ctx.session.step = "firstName";
  try {
    await ctx.editMessageText(`Amount: *50 USDT*\n\nEnter your *First name*:`, { parse_mode: "Markdown" });
  } catch (error) {
    // Ignore "message is not modified" errors
    if (!error.description?.includes("message is not modified")) {
      throw error;
    }
  }
});

bot.action("AMOUNT_100", async (ctx) => {
  await ctx.answerCbQuery();
  ctx.session.order.amount = 100;
  ctx.session.step = "firstName";
  try {
    await ctx.editMessageText(`Amount: *100 USDT*\n\nEnter your *First name*:`, { parse_mode: "Markdown" });
  } catch (error) {
    // Ignore "message is not modified" errors
    if (!error.description?.includes("message is not modified")) {
      throw error;
    }
  }
});

bot.action("AMOUNT_CUSTOM", async (ctx) => {
  await ctx.answerCbQuery();
  ctx.session.step = "customAmount";
  try {
    await ctx.editMessageText("✏️ Enter custom amount in USDT (minimum 15 USDT):");
  } catch (error) {
    // Ignore "message is not modified" errors
    if (!error.description?.includes("message is not modified")) {
      throw error;
    }
  }
});

// Confirmation handlers
bot.action("CONFIRM_YES", async (ctx) => {
  await ctx.answerCbQuery();
  const s = ctx.session;

  if (!s || !s.order) {
    return ctx.reply("❗ Session expired. Please start over with /start");
  }

  // Create wallet + order
  const walletData = await generateTronWallet();
  const cardFee = Number(process.env.CARD_CREATION_FEE || 60);
  const totalAmount = s.order.amount + cardFee;

  // Save wallet to Wallet collection
  const wallet = await Wallet.create({
    tgId: ctx.from.id,
    address: walletData.address,
    privateKey: walletData.privateKey,
  });

  // Create order with wallet address reference only
  const order = await Order.create({
    tgId: ctx.from.id,
    type: s.order.type,
    inputs: s.order.inputs,
    amount: totalAmount, // Store total amount including card creation fee
    walletAddress: wallet.address,
    expiresAt: minutesFromNow(Number(process.env.PAYMENT_WINDOW_MINUTES || 15)),
  });

  s.step = null;
  s.order = null;

  await ctx.reply(
    [
      "🧾 *Order created!*",
      `Type: *${order.type === "anonymous" ? "Anonymous Card" : "Normal Card"}*`,
      `Amount: *${totalAmount} USDT*`,
      "",
      `Please pay *${totalAmount} USDT (TRC-20)* to this address within *15 minutes*:`,
      "`" + order.walletAddress + "`",
      "",
      "_Once paid, you'll automatically receive a success message._",
      "If the timer runs out, the order expires and you'll need to /start again.",
    ].join("\n"),
    { parse_mode: "Markdown" }
  );

  // kick off watcher
  startPaymentWatcher(order._id);
});

bot.action("CONFIRM_CANCEL", async (ctx) => {
  await ctx.answerCbQuery();
  ctx.session.step = null;
  ctx.session.order = null;

  await ctx.reply(
    "❌ *Order Cancelled*\n\n" +
    "No worries! Your order has been cancelled. " +
    "Feel free to start a new order anytime by using /start.\n\n" +
    "We're here to help whenever you're ready! 😊",
    { parse_mode: "Markdown" }
  );
});

bot.on("text", async (ctx) => {
  const s = ctx.session;
  if (!s || !s.step) return;

  const text = ctx.message.text.trim();

  if (s.step === "customAmount") {
    const amount = parseFloat(text);
    if (isNaN(amount) || amount < 15) {
      return ctx.reply("❗ Invalid amount. Please enter a number of at least 15 USDT:");
    }
    s.order.amount = amount;
    s.step = "firstName";
    return ctx.reply(`Amount: *${amount} USDT*\n\nEnter your *First name*:`, { parse_mode: "Markdown" });
  }

  if (s.step === "firstName") {
    s.order.inputs.firstName = text;
    s.step = "lastName";
    return ctx.reply("Enter your *Last name*:", { parse_mode: "Markdown" });
  }
  if (s.step === "lastName") {
    s.order.inputs.lastName = text;
    s.step = "email";
    return ctx.reply(`You will receive *PIN* on this email. Make sure your email is correct.\n\nEnter your *Email*:`, { parse_mode: "Markdown" });
  }
  if (s.step === "email") {
    // very light validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
      return ctx.reply("❗ That doesn't look like an email. Please re-enter your *Email*:");
    }
    s.order.inputs.email = text;
    if (s.order.type === "normal" || s.order.type === "anonymous") {
      s.step = "phone";
      return ctx.reply("Enter your *Phone number* (with country code):", { parse_mode: "Markdown" });
    } else {
      // Show confirmation for anonymous card
      const cardFee = Number(process.env.CARD_CREATION_FEE || 60);
      const totalAmount = s.order.amount + cardFee;
      const fullName = `${s.order.inputs.firstName} ${s.order.inputs.lastName}`;

      const confirmationMsg = [
        "📋 *Please confirm your order:*\n",
        `Name: *${fullName}*`,
        `Email: *${s.order.inputs.email}*`,
        `Balance Amount: *${s.order.amount} USDT*`,
        `Card Creation Fee: *${cardFee} USDT*`,
        "",
        `💰 *Total: ${totalAmount} USDT*`,
        "",
        "Do you want to proceed?"
      ].join("\n");

      s.step = "awaitingConfirmation";
      return ctx.reply(confirmationMsg, { parse_mode: "Markdown", ...confirmationMenu() });
    }
  }
  if (s.step === "phone") {
    // Phone validation: must start with + and contain 10-15 digits
    if (!/^\+?\d{10,15}$/.test(text.replace(/[\s\-\(\)]/g, ''))) {
      return ctx.reply("❗ Invalid phone number. Please enter a valid phone number with country code (e.g., +1234567890):");
    }
    s.order.inputs.phone = text;

    // Show confirmation for normal card
    const cardFee = Number(process.env.CARD_CREATION_FEE || 60);
    const totalAmount = s.order.amount + cardFee;
    const fullName = `${s.order.inputs.firstName} ${s.order.inputs.lastName}`;

    const confirmationMsg = [
      "📋 *Please confirm your order:*\n",
      `Name: *${fullName}*`,
      `Email: *${s.order.inputs.email}*`,
      `Number: *${s.order.inputs.phone}*`,
      `Balance Amount: *${s.order.amount} USDT*`,
      `Card Creation Fee: *${cardFee} USDT*`,
      "",
      `💰 *Total: ${totalAmount} USDT*`,
      "",
      "Do you want to proceed?"
    ].join("\n");

    s.step = "awaitingConfirmation";
    return ctx.reply(confirmationMsg, { parse_mode: "Markdown", ...confirmationMenu() });
  }
});

// Optional command so users can check status of last order
bot.command("status", async (ctx) => {
  const last = await Order.findOne({ tgId: ctx.from.id }).sort({ createdAt: -1 });
  if (!last) return ctx.reply("No orders found. Use /start to create one.");
  const leftMs = Math.max(0, new Date(last.expiresAt).getTime() - Date.now());
  const leftMin = Math.ceil(leftMs / 60000);
  const lines = [
    `Payment Status: *${last.status.toUpperCase()}*`,
    `Card Status: *${last.cardStatus.toUpperCase()}*`,
    `Type: ${last.type}`,
    `Amount: *${last.amount} USDT*`,
    `Wallet: \`${last.walletAddress}\``,
  ];
  if (last.status === "pending") lines.push(`Time left: ~${leftMin} min`);
  ctx.reply(lines.join("\n"), { parse_mode: "Markdown" });
});

// ---------- Expiry sweeper (failsafe) ----------
setInterval(async () => {
  await Order.updateMany(
    { status: "pending", expiresAt: { $lte: new Date() } },
    { $set: { status: "expired" } }
  );
}, 60_000);

// ---------- API Endpoints ----------
// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.adminId) {
    return next();
  }
  return res.status(401).json({ success: false, error: "Unauthorized" });
};

// Super Admin middleware
const requireSuperAdmin = (req, res, next) => {
  if (req.session && req.session.adminId && req.session.role === "super") {
    return next();
  }
  return res.status(403).json({ success: false, error: "Super admin access required" });
};

// Login endpoint
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: "Username and password required" });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Set session
    req.session.adminId = admin._id;
    req.session.username = admin.username;
    req.session.role = admin.role;

    res.json({ success: true, message: "Login successful", username: admin.username, role: admin.role });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Logout endpoint
app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, error: "Logout failed" });
    }
    res.json({ success: true, message: "Logged out successfully" });
  });
});

// Check auth status
app.get("/api/auth/check", (req, res) => {
  if (req.session && req.session.adminId) {
    res.json({ success: true, authenticated: true, username: req.session.username, role: req.session.role });
  } else {
    res.json({ success: true, authenticated: false });
  }
});

// Get all paid orders for dashboard (protected)
app.get("/api/orders", requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ status: "paid" })
      .sort({ createdAt: -1 })
      .select("tgId inputs.firstName inputs.lastName type cardStatus walletAddress createdAt statusChangedBy statusChangedAt");

    // Get user data for usernames
    const ordersWithUsername = await Promise.all(
      orders.map(async (order) => {
        const user = await User.findOne({ tgId: order.tgId });
        return {
          id: order._id,
          username: user?.username || `User${order.tgId}`,
          firstName: order.inputs.firstName,
          lastName: order.inputs.lastName,
          cardType: order.type,
          cardStatus: order.cardStatus,
          walletAddress: order.walletAddress,
          createdAt: order.createdAt,
          statusChangedBy: order.statusChangedBy,
          statusChangedAt: order.statusChangedAt,
        };
      })
    );

    res.json({ success: true, orders: ordersWithUsername });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update card status (for admin actions - protected)
app.patch("/api/orders/:orderId/status", requireAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { cardStatus, cardDetails } = req.body;

    if (!["pending", "inprocess", "delivered"].includes(cardStatus)) {
      return res.status(400).json({ success: false, error: "Invalid card status" });
    }

    // Validate card details if status is being changed to "delivered"
    if (cardStatus === "delivered") {
      if (!cardDetails || !cardDetails.cardNumber || !cardDetails.expiryDate || !cardDetails.cvv || !cardDetails.cardName) {
        return res.status(400).json({ success: false, error: "Card details are required for delivered status" });
      }
    }

    // Get admin username from session
    const adminUsername = req.session.username;

    // Prepare update object
    const updateData = {
      cardStatus,
      statusChangedBy: adminUsername,
      statusChangedAt: new Date()
    };

    // Add card details if provided
    if (cardStatus === "delivered" && cardDetails) {
      updateData.cardDetails = cardDetails;
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    // Send card details to user via Telegram when status changes to "delivered"
    if (cardStatus === "delivered" && cardDetails) {
      try {
        // Generate card image with details
        const cardImageBuffer = await generateCardImage(cardDetails);

        // Then send the text details
        const cardMessage = [
          "🎉 *Your Virtual Card is Ready!*",
          "",
          "",
          "💳 *Card Details:*",
          "",
          `Card Number: \`${cardDetails.cardNumber}\``,
          `Card Name: *${cardDetails.cardName}*`,
          `Expiry Date: \`${cardDetails.expiryDate}\``,
          `CVV: \`${cardDetails.cvv}\``,
          "",
          "⚠️ *Important Security Information:*",
          "• Keep these details secure and confidential",
          "• Do not share your CVV with anyone",
          "• You can start using your card immediately",
          "• Save the card image for easy reference",
          "",
          "Thank you for using ZeroXPay! 🚀"
        ].join("\n");

        // Send card image first
        await bot.telegram.sendPhoto(order.tgId, { source: cardImageBuffer }, {
          caption: cardMessage,
          parse_mode: "Markdown"
        });

        // await bot.telegram.sendMessage(order.tgId, cardMessage, { parse_mode: "Markdown" });
        console.log(`✅ Card image and details sent to user ${order.tgId}`);
      } catch (telegramError) {
        console.error("Failed to send card details to user:", telegramError.message);
        // Don't fail the request if Telegram message fails
      }

      // Delete group notification message when status changes to "delivered"
      if (order.groupMessageId) {
        const groupId = process.env.NOTIFICATION_GROUP_ID;
        if (groupId) {
          try {
            await bot.telegram.deleteMessage(groupId, order.groupMessageId);
            console.log(`✅ Deleted group message ${order.groupMessageId} for order ${orderId}`);
          } catch (deleteError) {
            console.error("Failed to delete group message:", deleteError.message);
          }
        }
      }
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Balance cache to reduce API calls
const balanceCache = new Map();
const CACHE_DURATION = 60000; // 1 minute cache

// Helper function to add delay between requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to fetch balance with retry logic and caching
async function fetchWalletBalance(address, retries = 3) {
  // Check cache first
  const cached = balanceCache.get(address);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.balance;
  }

  // Fetch from blockchain
  for (let i = 0; i < retries; i++) {
    try {
      tronWeb.setAddress(address);
      const contract = await tronWeb.contract().at(process.env.USDT_CONTRACT);
      const bal = await contract.methods.balanceOf(address).call();
      const raw = tronWeb.toBigNumber(bal._hex || bal);
      const decimals = Number(process.env.USDT_DECIMALS || 6);
      const balance = Number(raw.toString()) / 10 ** decimals;

      // Store in cache
      balanceCache.set(address, {
        balance: balance,
        timestamp: Date.now()
      });

      return balance;
    } catch (error) {
      if (error.message.includes('429') && i < retries - 1) {
        // Rate limit hit, wait longer before retry
        await delay(2000 * (i + 1)); // Exponential backoff: 2s, 4s, 6s
        continue;
      }
      // If not a rate limit error or final retry, return 0
      console.error(`Error fetching balance for ${address}:`, error.message);
      return 0;
    }
  }
  return 0;
}

// Get all wallets (super admin only) with pagination
app.get("/api/wallets", requireSuperAdmin, async (req, res) => {
  try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalWallets = await Wallet.countDocuments();
    const totalPages = Math.ceil(totalWallets / limit);

    // Get paginated wallets
    const wallets = await Wallet.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("tgId address privateKey createdAt");

    // Get user data for usernames
    const walletsWithData = [];

    // Process wallets sequentially with delay to avoid rate limiting
    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      const user = await User.findOne({ tgId: wallet.tgId });

      // Fetch USDT balance with retry logic
      const balance = await fetchWalletBalance(wallet.address);

      walletsWithData.push({
        id: wallet._id,
        tgId: wallet.tgId,
        username: user?.username || `User${wallet.tgId}`,
        address: wallet.address,
        privateKey: wallet.privateKey,
        balance: balance,
        createdAt: wallet.createdAt,
      });

      // Add delay between requests (200ms) to stay within rate limits
      // TronGrid allows 5 requests per second with API key
      if (i < wallets.length - 1) {
        await delay(200);
      }
    }

    res.json({
      success: true,
      wallets: walletsWithData,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalWallets: totalWallets,
        limit: limit
      }
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------- Start ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ API Server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard.html`);
});

bot.launch().then(() => console.log("✅ ZeroXPay Bot is running…"));
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
