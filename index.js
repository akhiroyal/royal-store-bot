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
} = require("discord.js");

const { REST } = require("@discordjs/rest");
const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const express = require("express");
const path = require("path");

// ===== DATABASE =====
const DATA_FILE = path.join(__dirname, "orders.json");

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({
    orderCount: 0
  }, null, 2));
}

const data = JSON.parse(fs.readFileSync(DATA_FILE));

let orderCount = data.orderCount || 0;

// ===== WEB SERVER =====
const app = express();

app.get("/", (req, res) => {
  res.send("Royal Store Bot Running");
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

// ===== VARIABLES =====
let feedbackChannel = null;

// ===== READY =====
client.once("ready", () => {

  console.log(`Logged in as ${client.user.tag}`);

  const statuses = [
    () => `👥 ${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)} Members`,
    () => `🏠 ${client.guilds.cache.size} Servers`,
    () => "💰 Processing Payments",
    () => "🧾 Generating Invoices",
    () => "👑 Royal Store System",
    () => "🚀 Fast & Secure Orders"
  ];

  let i = 0;

  setInterval(() => {

    client.user.setPresence({
      activities: [
        {
          name: statuses[i % statuses.length](),
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

    await msg.delete().catch(() => {});

    return msg.channel.send(args.join(" "));
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

    return msg.channel.send({
      content:
`💸 QR Generated Successfully

💳 Amount: ₹${amount}

After payment, send screenshot here ✅`,
      files: [attachment]
    });
  }

});

// ===== INTERACTIONS =====
client.on("interactionCreate", async interaction => {

  // ===== SELECT MENU =====
  if (interaction.isStringSelectMenu()) {

    const value = interaction.values[0];

    // ===== BOOSTS =====
    if (value === "boosts") {

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#ff00aa")
            .setTitle("<a:Boosters:1443793092028137524> Server Boosts TOS")
            .setDescription(
`• No warranty on revokes
• No Refund Or Replace On AntiBot Bans
• Full Warranty If Mentioned Only
• Revoke Warranty If Mentioned Only
• Rep Warranty If Mentioned Only`
            )
        ],
        ephemeral: true
      });
    }

    // ===== NITRO IDS =====
    if (value === "nitroids") {

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#5865F2")
            .setTitle("<a:nitro:1505129726212177960> Nitro IDs / Discord Accounts TOS")
            .setDescription(
`• Video proof required
• Must change email & password after delivery
• No warranty on Discord lock or bans
• No warranty if Discord revokes nitro`
            )
        ],
        ephemeral: true
      });
    }

    // ===== METHODS =====
    if (value === "methods") {

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#00aeff")
            .setTitle("<a:bot_developer:1444508717994348705> Methods / Tools TOS")
            .setDescription(
`• No refund if patched
• Tools are PC only
• User mistake = no replace`
            )
        ],
        ephemeral: true
      });
    }

    // ===== MEMBERS =====
    if (value === "members") {

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#00ff99")
            .setTitle("<a:DISCORD:1443793884584083538> Discord Members TOS")
            .setDescription(
`• No warranty against bans/kicks
• No warranty if Discord bans tokens
• No refund if server bans tokens
• No replace if antibots kick tokens`
            )
        ],
        ephemeral: true
      });
    }

    // ===== GIFTLINKS =====
    if (value === "giftlinks") {

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#ff66cc")
            .setTitle("<a:NITRO:1443792698539769930> Nitro Giftlinks TOS")
            .setDescription(
`• Delivery via gift link
• Auto-claim warranty only if mentioned
• Must record full video before claiming
• No warranty for user mistakes
• No replace without proper proof
• Validity depends on product mentioned
• Fake claims will be denied
• We always stay on safe side regarding warranty claims`
            )
        ],
        ephemeral: true
      });
    }

  }

  // ===== CHAT COMMANDS =====
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
        content: "❌ Feedback channel not set",
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
      .setTimestamp();

    const channel =
      interaction.guild.channels.cache.get(feedbackChannel);

    const sent = await channel.send({
      embeds: [embed]
    });

    await sent.react("❤️");
    await sent.react("🔥");

    return interaction.reply({
      content: "✅ Feedback submitted",
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

  // ===== SET FEEDBACK =====
  if (interaction.commandName === "set_feedback_channel") {

    const channel =
      interaction.options.getChannel("channel");

    feedbackChannel = channel.id;

    return interaction.reply({
      content: `✅ Feedback channel set to ${channel}`,
      ephemeral: true
    });
  }

  // ===== SAY =====
  if (interaction.commandName === "say") {

    const text =
      interaction.options.getString("text");

    await interaction.reply({
      content: "✅ Sent",
      ephemeral: true
    });

    return interaction.channel.send(text);
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

After payment send screenshot ✅`,
      files: [attachment]
    });
  }

  // ===== SEND TOS =====
  if (interaction.commandName === "send_tos") {

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("📜 Royal Store — Terms of Service")
      .setDescription(
`## General Rules

• All deals must be inside official tickets
• Outside deals = no responsibility
• We can change TOS anytime
• Buying from Royal Store = Accepting TOS

Select category below`
      );

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
              value: "giftlinks",
              emoji: "1443792698539769930"
            }
          ])
      );

    await interaction.channel.send({
      embeds: [embed],
      components: [row]
    });

    return interaction.reply({
      content: "✅ TOS Sent",
      ephemeral: true
    });
  }

  // ===== GIVE INVOICE =====
  if (interaction.commandName === "give_invoice") {

orderCount++;

data.orderCount = orderCount;

fs.writeFileSync(
  DATA_FILE,
  JSON.stringify(data, null, 2)
);

const orderId =
  `RS-${new Date().getFullYear()}-${orderCount}`;

    const buyer =
      interaction.options.getUser("buyer");

    const product =
      interaction.options.getString("product");

    const amount =
      interaction.options.getString("amount");

    const filePath =
      `invoice_${Date.now()}.pdf`;

    const doc = new PDFDocument({
      margin: 50
    });

    const stream =
      fs.createWriteStream(filePath);

    doc.pipe(stream);

    // BACKGROUND
    doc.rect(0, 0, 612, 792)
      .fill("#0f0f14");

    // ===== STORE LOGO =====
try {

  doc.image("./logo.png", 50, 35, {
    width: 80
  });

} catch (err) {

  console.log("Logo not found");

}

// ===== HEADER TEXT =====
doc
  .fillColor("#8B5CF6")
  .fontSize(26)
  .text("ROYAL STORE", 145, 50);

doc
  .fillColor("#ffffff")
  .fontSize(18)
  .text("PAYMENT INVOICE", 145, 85);
    doc
  .fillColor("#FFD700")
  .fontSize(18)
  .text("👑", 50, 20);

    // LINE
    doc.moveTo(50, 145)
      .lineTo(550, 145)
      .strokeColor("#8B5CF6")
      .stroke();

    // INFO
doc
  .fillColor("#ffffff")
  .fontSize(13)
  .text(`Invoice ID: ${orderId}`, 50, 160)
  .text(`Customer: ${buyer.username}`, 50, 185)
  .text(
  `Date: ${new Date().toLocaleDateString("en-GB")}`,
  50,
  210
)
  .text(`Status: SUCCESSFUL`, 50, 235);

doc
  .fillColor("#00ff99")
  .fontSize(12)
  .text(`Issued By: ${interaction.user.username}`, 50, 260);

    // PRODUCT BOX
    doc.roundedRect(50, 290, 500, 120, 10)
      .fill("#1a1a22");

    doc
      .fillColor("#8B5CF6")
      .fontSize(18)
      .text("ORDER DETAILS", 70, 315);

    doc
      .fillColor("#ffffff")
      .fontSize(14)
      .text(`Product: ${product}`, 70, 350)
      .text(`Amount Paid: ₹${amount}`, 70, 380);

    // TOTAL BOX
    doc.roundedRect(50, 470, 500, 70, 10)
      .fill("#8B5CF6");

    doc
      .fillColor("#ffffff")
      .fontSize(20)
      .text(`TOTAL: ₹${amount}`, 190, 495);

    // FOOTER
    doc
      .fillColor("#aaaaaa")
      .fontSize(11)
      .text(
        "Thank you for shopping with Royal Store",
        150,
        720
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
        );

      logChannel.send({
        embeds: [embed],
        files: [filePath]
      });
    }

    return interaction.reply({
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
    .setColor("#5865F2")
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setTitle(`👑 Welcome to ${STORE_NAME}`)
.setDescription(
`Welcome ${member} 👋

🎉 You are our **${member.guild.memberCount}th** member

💎 Trusted Marketplace
⚡ Fast Delivery
🧾 Automated Invoices

Enjoy shopping with us 🚀`
)
    .setFooter({
      text: "Royal Store Commerce System"
    })
    .setTimestamp();

  await channel.send({
    embeds: [embed]
  });

  try {

    await member.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#5865F2")
          .setTitle(`👑 Welcome to ${STORE_NAME}`)
          .setDescription(
`Thanks for joining Royal Store 💜

🛒 Trusted Marketplace
⚡ Fast Delivery
🧾 Automated Invoices
⭐ Customer Reviews

Enjoy shopping with us 🚀`
          )
      ]
    });

  } catch (err) {
    console.log("DM closed");
  }

});

// ===== SLASH COMMANDS =====
const commands = [

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Server info"),

  new SlashCommandBuilder()
    .setName("send_tos")
    .setDescription("Send TOS panel"),

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
    )

].map(cmd => cmd.toJSON());

// ===== REGISTER =====
const rest =
  new REST({ version: "10" })
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
