// ===== IMPORTS =====
const {
  Client,
  GatewayIntentBits,
  Partials,
  SlashCommandBuilder,
  Routes,
  AttachmentBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require('discord.js');

const { REST } = require('@discordjs/rest');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const express = require('express');

// ===== WEB SERVER =====
const app = express();

app.get('/', (req, res) => {
  res.send('Royal Store Bot Running');
});

app.listen(3000, () => {
  console.log("Web server started");
});

// ===== BOT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

const prefix = ".";

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// ===== CONFIG =====
const STAFF_ROLE = "1443529641317892197";
const LOG_CHANNEL_ID = "1501142586788675686";
const WELCOME_CHANNEL_ID = "1443404889894948974";

const UPI_ID = "bossakhil53@okicici";

const STORE_NAME = "Royal Store";

const GIF_URL =
"https://media1.tenor.com/m/TR0cAewt72UAAAAC/the-avengers-marvel.gif";

// ===== VARIABLES =====
let orderCount = 0;
let feedbackChannel = null;

// ===== READY =====
client.once("ready", () => {

  console.log(`Logged in as ${client.user.tag}`);

  const getTotalMembers = () =>
    client.guilds.cache.reduce(
      (acc, guild) => acc + guild.memberCount,
      0
    );

  const statuses = [
    () => `👥 ${getTotalMembers()} Members`,
    () => `🏠 ${client.guilds.cache.size} Servers`,
    () => "💰 Processing Payments",
    () => "🧾 Generating Invoices",
    () => "👑 Royal Store System",
    () => "🚀 Fast & Secure Orders"
  ];

  let i = 0;

  setInterval(() => {

    const status = statuses[i % statuses.length]();

    client.user.setPresence({
      activities: [
        {
          name: status,
          type: 3
        }
      ],
      status: "online"
    });

    i++;

  }, 5000);

});

// ===== STAFF CHECK =====
function isStaff(member) {
  return member?.roles?.cache?.has(STAFF_ROLE);
}

// ===== PREFIX COMMANDS =====
client.on("messageCreate", async (msg) => {

  if (!msg.content.startsWith(prefix)) return;
  if (msg.author.bot) return;

  const args = msg.content
    .slice(prefix.length)
    .trim()
    .split(/ +/);

  const cmd = args.shift().toLowerCase();

  // ===== SAY =====
  if (cmd === "say") {

    if (!isStaff(msg.member))
      return msg.reply("❌ Staff only");

    msg.delete().catch(() => {});

    msg.channel.send(args.join(" "));
  }

  // ===== QR =====
  if (cmd === "qr") {

    if (!isStaff(msg.member))
      return msg.reply("❌ Staff only");

    const amount = args[0];

    if (!amount)
      return msg.reply("Enter amount");

    const upi =
`upi://pay?pa=${UPI_ID}&pn=${STORE_NAME}&am=${amount}&cu=INR`;

    const qrBuffer = await QRCode.toBuffer(upi);

    const attachment =
      new AttachmentBuilder(qrBuffer, {
        name: "payment.png"
      });

    msg.channel.send({
      content:
`💸 QR Generated Successfully

💳 Amount: ₹${amount}

After payment, send payment screenshot here for verification ✅`,
      files: [attachment]
    });
  }

});

// ===== INTERACTIONS =====
client.on("interactionCreate", async interaction => {

  // ===== DROPDOWN =====
  if (interaction.isStringSelectMenu()) {

    await interaction.deferUpdate();

    const value = interaction.values[0];

    // ===== BOOSTS =====
    if (value === "boosts") {

      const embed = new EmbedBuilder()
        .setColor("#ff00aa")
        .setTitle("<a:Boosters:1443793092028137524> Server Boosts TOS")
        .setDescription(`
• No warranty on revokes
• No Refund Or Replace On AntiBot Bans
• Full Warranty If Mentioned Only
• Revoke Warranty If Mentioned Only
• Rep Warranty If Mentioned Only
`);

      return interaction.channel.send({
        embeds: [embed]
      });
    }

    // ===== NITRO IDS =====
    if (value === "nitroids") {

      const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("<a:nitro:1505129726212177960> Nitro IDs / Discord Accounts TOS")
        .setDescription(`
• Video proof required
• Must change email & password after delivery
• No warranty on Discord lock or bans
• No warranty if Discord revokes nitro
`);

      return interaction.channel.send({
        embeds: [embed]
      });
    }

    // ===== METHODS =====
    if (value === "methods") {

      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle("<a:bot_developer:1444508717994348705> Methods / Tools TOS")
        .setDescription(`
• No refund if patched
• Tools are PC only
• User mistake = no replace
`);

      return interaction.channel.send({
        embeds: [embed]
      });
    }

    // ===== MEMBERS =====
    if (value === "members") {

      const embed = new EmbedBuilder()
        .setColor("#00ffaa")
        .setTitle("<a:DISCORD:1443793884584083538> Discord Members TOS")
        .setDescription(`
• No warranty against bans/kicks
• No Warranty If Discord Bans Tokens
• No refund if antibot blocks joins
• No replace if tokens banned
• No refund if bot kicked while joining
`);

      return interaction.channel.send({
        embeds: [embed]
      });
    }

    // ===== GIFTLINK =====
    if (value === "giftlink") {

      const embed = new EmbedBuilder()
        .setColor("#ff66cc")
        .setTitle("<a:NITRO:1443792698539769930> Nitro Giftlinks TOS")
        .setDescription(`
• Usually works around 30 days
• Auto Claim Warranty Provided
• Must record proof while claiming
• No revoke warranty
`);

      return interaction.channel.send({
        embeds: [embed]
      });
    }

  }

  if (!interaction.isChatInputCommand()) return;

  // ===== SERVER INFO =====
  if (interaction.commandName === "serverinfo") {

    const embed = new EmbedBuilder()
      .setColor("#4F46E5")
      .setTitle(`👑 ${interaction.guild.name}`)
      .addFields(
        {
          name: "👥 Members",
          value: `${interaction.guild.memberCount}`,
          inline: true
        },
        {
          name: "👑 Owner",
          value: `<@${interaction.guild.ownerId}>`,
          inline: true
        }
      );

    return interaction.reply({
      embeds: [embed]
    });
  }

  // ===== FEEDBACK =====
  if (interaction.commandName === "feedback") {

    if (!feedbackChannel) {
      return interaction.reply({
        content: "❌ Feedback channel not set.",
        ephemeral: true
      });
    }

    const user =
      interaction.options.getUser("user");

    const product =
      interaction.options.getString("product");

    const comment =
      interaction.options.getString("comment");

    const rating =
      interaction.options.getInteger("rating");

    const stars = "⭐".repeat(rating);

    const embed = new EmbedBuilder()
      .setColor("#00ff99")
      .setTitle("🌟 New Feedback")
      .addFields(
        {
          name: "📦 Product",
          value: product
        },
        {
          name: "📝 Review",
          value: comment
        },
        {
          name: "👤 From",
          value: `${interaction.user}`
        },
        {
          name: "🎯 For",
          value: `${user}`
        },
        {
          name: "⭐ Rating",
          value: `${stars} (${rating}/5)`
        }
      )
      .setFooter({
        text: `Customer ID: ${interaction.user.id}`
      })
      .setTimestamp();

    const channel =
      interaction.guild.channels.cache.get(feedbackChannel);

    const sent = await channel.send({
      embeds: [embed]
    });

    await sent.react("❤️");
    await sent.react("🔥");

    return interaction.reply({
      content: "✅ Feedback submitted successfully",
      ephemeral: true
    });
  }

  // ===== STAFF CHECK =====
  if (!interaction.member.roles.cache.has(STAFF_ROLE)) {
    return interaction.reply({
      content: "❌ Staff only",
      ephemeral: true
    });
  }

  // ===== SEND TOS =====
  if (interaction.commandName === "send_tos") {

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("📜 Royal Store — Terms of Service")
      .setDescription(`
# General Rules

• All deals must be inside official tickets
• Outside deals = no responsibility
• We can change TOS anytime
• Buying from Royal Store = Accepting TOS

Select category below
`);

    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("tos_menu")
          .setPlaceholder("Select TOS Category")
          .addOptions([
            {
              label: "Server Boosts",
              value: "boosts",
              emoji: "1443793092028137524"
            },
            {
              label: "Nitro IDs / Accounts",
              value: "nitroids",
              emoji: "1505129726212177960"
            },
            {
              label: "Methods / Tools",
              value: "methods",
              emoji: "1444508717994348705"
            },
            {
              label: "Discord Members",
              value: "members",
              emoji: "1443793884584083538"
            },
            {
              label: "Nitro Giftlinks",
              value: "giftlink",
              emoji: "1443792698539769930"
            }
          ])
      );

    await interaction.reply({
      content: "✅ TOS Sent",
      ephemeral: true
    });

    return interaction.channel.send({
      embeds: [embed],
      components: [row]
    });
  }

  // ===== SET FEEDBACK =====
  if (interaction.commandName === "set_feedback_channel") {

    const channel =
      interaction.options.getChannel("channel");

    feedbackChannel = channel.id;

    return interaction.reply({
      content:
`✅ Feedback channel set to ${channel}`,
      ephemeral: true
    });
  }

  // ===== SAY =====
  if (interaction.commandName === "say") {

    const text =
      interaction.options.getString("text");

    await interaction.reply({
      content: "✅ Message Sent",
      ephemeral: true
    });

    interaction.channel.send(text);
  }

  // ===== QR =====
  if (interaction.commandName === "qr") {

    const amount =
      interaction.options.getString("amount");

    const upi =
`upi://pay?pa=${UPI_ID}&pn=${STORE_NAME}&am=${amount}&cu=INR`;

    const qrBuffer = await QRCode.toBuffer(upi);

    const attachment =
      new AttachmentBuilder(qrBuffer, {
        name: "payment.png"
      });

    return interaction.reply({
      content:
`💸 QR Generated Successfully

💳 Amount: ₹${amount}

After payment, send payment screenshot here for verification ✅`,
      files: [attachment]
    });
  }

  // ===== GIVE INVOICE =====
  if (interaction.commandName === "give_invoice") {

    orderCount++;

    const orderId =
      orderCount.toString().padStart(4, "0");

    const buyer =
      interaction.options.getUser("buyer");

    const product =
      interaction.options.getString("product");

    const amount =
      interaction.options.getString("amount");

    const filePath =
      `invoice_${Date.now()}.pdf`;

    const doc =
      new PDFDocument({
        margin: 40
      });

    const stream =
      fs.createWriteStream(filePath);

    doc.pipe(stream);

    doc
      .fontSize(22)
      .fillColor("#4F46E5")
      .text(STORE_NAME, 40, 40);

    doc
      .fontSize(26)
      .fillColor("black")
      .text("INVOICE", 400, 40);

    doc.moveTo(40, 85)
      .lineTo(550, 85)
      .stroke("#4F46E5");

    doc
      .fontSize(13)
      .fillColor("black")
      .text(`Invoice #: ${orderId}`, 40, 110)
      .text(`Date: ${new Date().toLocaleDateString()}`, 40, 130)
      .text(`Status: PAID`, 40, 150);

    doc
      .text(`Billed To:`, 320, 110)
      .text(`${buyer.username}`, 320, 130);

    doc.rect(40, 210, 520, 30)
      .fill("#4F46E5");

    doc
      .fillColor("white")
      .fontSize(12)
      .text("Description", 70, 220)
      .text("Price", 420, 220);

    doc
      .fillColor("black")
      .fontSize(12)
      .text(product, 70, 270)
      .text(`₹${amount}`, 420, 270);

    doc.rect(40, 340, 520, 35)
      .fill("#111111");

    doc
      .fillColor("white")
      .fontSize(15)
      .text("Grand Total", 350, 352)
      .text(`₹${amount}`, 470, 352);

    doc
      .fillColor("gray")
      .fontSize(10)
      .text(
        "Thank you for shopping with Royal Store ❤️",
        170,
        730
      );

    doc.end();

    await new Promise(resolve =>
      stream.on("finish", resolve)
    );

    try {

      await buyer.send({
        files: [filePath]
      });

      await buyer.send(
`👑 Thank you for choosing ${STORE_NAME}!

✅ Order Completed
🧾 Invoice Sent Successfully
⭐ Leave review using /feedback
🚀 Enjoy your purchase!`
      );

    } catch (err) {
      console.log("DM Failed");
    }

    const logChannel =
      interaction.guild.channels.cache.get(LOG_CHANNEL_ID);

    if (logChannel) {

      const embed = new EmbedBuilder()
        .setColor("#facc15")
        .setTitle("🧾 Invoice Issued")
        .addFields(
          {
            name: "Order #",
            value: orderId,
            inline: true
          },
          {
            name: "Buyer",
            value: `${buyer}`,
            inline: true
          },
          {
            name: "Amount",
            value: `₹${amount}`,
            inline: true
          },
          {
            name: "Product",
            value: product
          }
        )
        .setFooter({
          text: `Issued by ${interaction.user.username}`
        })
        .setTimestamp();

      logChannel.send({
        embeds: [embed],
        files: [filePath]
      });
    }

    interaction.reply({
      content: "✅ Invoice Sent",
      ephemeral: true
    });
  }

});

// ===== WELCOME =====
client.on("guildMemberAdd", async member => {

  const channel =
    member.guild.channels.cache.get(WELCOME_CHANNEL_ID);

  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor("#4F46E5")
    .setTitle(`👑 Welcome to ${STORE_NAME}`)
    .setDescription(
`Hey ${member} 👋

You're member #${member.guild.memberCount} 🎉

Enjoy shopping with us 💰`
    )
    .setImage(GIF_URL);

  channel.send({
    embeds: [embed]
  });

});

// ===== COMMANDS =====
const commands = [

  new SlashCommandBuilder()
    .setName("say")
    .setDescription("Send message")
    .addStringOption(opt =>
      opt
        .setName("text")
        .setDescription("Message")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("qr")
    .setDescription("Generate QR")
    .addStringOption(opt =>
      opt
        .setName("amount")
        .setDescription("Amount")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("give_invoice")
    .setDescription("Generate invoice")
    .addUserOption(opt =>
      opt
        .setName("buyer")
        .setDescription("Buyer")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName("product")
        .setDescription("Product")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName("amount")
        .setDescription("Amount")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Server info"),

  new SlashCommandBuilder()
    .setName("feedback")
    .setDescription("Give feedback")
    .addUserOption(opt =>
      opt
        .setName("user")
        .setDescription("Seller")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName("product")
        .setDescription("Product")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName("comment")
        .setDescription("Review")
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt
        .setName("rating")
        .setDescription("1-5")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(5)
    ),

  new SlashCommandBuilder()
    .setName("set_feedback_channel")
    .setDescription("Set feedback channel")
    .addChannelOption(opt =>
      opt
        .setName("channel")
        .setDescription("Review channel")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("send_tos")
    .setDescription("Send TOS system")

].map(cmd => cmd.toJSON());

// ===== REGISTER =====
const rest =
  new REST({ version: '10' })
    .setToken(TOKEN);

(async () => {

  try {

    console.log("Registering slash commands...");

    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );

    console.log("Slash commands registered");

  } catch (err) {
    console.log(err);
  }

})();

// ===== LOGIN =====
client.login(TOKEN);
