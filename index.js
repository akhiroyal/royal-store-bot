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

  const statuses = [
    "💰 Processing Payments",
    "🧾 Generating Invoices",
    "👑 Royal Store System",
    "🚀 Fast & Secure Orders"
  ];

  let i = 0;

  setInterval(() => {

    client.user.setPresence({
      activities: [
        {
          name: statuses[i % statuses.length],
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

// ===== INTERACTIONS =====
client.on("interactionCreate", async interaction => {

  // ===== DROPDOWN =====
  if (interaction.isStringSelectMenu()) {

    const value = interaction.values[0];

    let embed;

    // ===== SERVER BOOST =====
    if (value === "boosts") {

      embed = new EmbedBuilder()
        .setColor("#ff00aa")
        .setTitle("🚀 Server Boosts TOS")
        .setDescription(`
• No warranty on revokes  
• No Refund Or Replace On AntiBot Bans  
• Full Warranty If Mentioned Only  
• Revoke Warranty If Mentioned Only  
• Rep Warranty If Mentioned Only
`);
    }

    // ===== NITRO IDS =====
    if (value === "nitroids") {

      embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("🎁 Nitro IDs / Discord Accounts TOS")
        .setDescription(`
• Video proof required  
• Must change email & password after delivery  
• No warranty on Discord lock or bans  
• No warranty if Discord revokes nitro
`);
    }

    // ===== METHODS =====
    if (value === "methods") {

      embed = new EmbedBuilder()
        .setColor("#00b0f4")
        .setTitle("🛠️ Methods / Tools TOS")
        .setDescription(`
• No refund if patched  
• Tools are PC only
`);
    }

    // ===== MEMBERS =====
    if (value === "members") {

      embed = new EmbedBuilder()
        .setColor("#00ff99")
        .setTitle("👥 Discord Members TOS")
        .setDescription(`
• No warranty against bans/kicks  
• No refund if antibot kicks tokens  
• No refund if bot kicked while joining  
• No refund if tokens terminated
`);
    }

    // ===== GIFTLINK =====
    if (value === "giftlink") {

      embed = new EmbedBuilder()
        .setColor("#ff66cc")
        .setTitle("🎁 Nitro Giftlink TOS")
        .setDescription(`
• Delivery via Gift Link  
• Auto-Claim Warranty only if mentioned  
• Must record full proof before claiming  
• No warranty without proof  
• No refund after delivery
`);
    }

    return interaction.reply({
      embeds: [embed],
      ephemeral: true
    });

  }

  // ===== SLASH COMMANDS =====
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

  // ===== SET FEEDBACK CHANNEL =====
  if (interaction.commandName === "set_feedback_channel") {

    const channel =
      interaction.options.getChannel("channel");

    feedbackChannel = channel.id;

    return interaction.reply({
      content: `✅ Feedback channel set to ${channel}`,
      ephemeral: true
    });
  }

  // ===== SEND TOS =====
  if (interaction.commandName === "send_tos") {

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("📜 Royal Store — Terms of Service")
      .setDescription(`
## General Rules

• All deals must be inside official tickets  
• Outside deals = no responsibility  
• We can change TOS anytime  
• Buying from Royal Store = Accepting TOS  

Select category below
`);

    const menu =
      new StringSelectMenuBuilder()
        .setCustomId("tos_menu")
        .setPlaceholder("Select TOS Category")
        .addOptions([
          {
            label: "Server Boosts",
            value: "boosts",
            emoji: "🚀"
          },
          {
            label: "Nitro IDs / Accounts",
            value: "nitroids",
            emoji: "🎁"
          },
          {
            label: "Methods / Tools",
            value: "methods",
            emoji: "🛠️"
          },
          {
            label: "Discord Members",
            value: "members",
            emoji: "👥"
          },
          {
            label: "Nitro Giftlinks",
            value: "giftlink",
            emoji: "💎"
          }
        ]);

    const row =
      new ActionRowBuilder()
        .addComponents(menu);

    return interaction.reply({
      embeds: [embed],
      components: [row]
    });
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

After payment, send screenshot for verification ✅`,
      files: [attachment]
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
    .setDescription(`
Hey ${member} 👋

Enjoy shopping with us 💰
`)
    .setImage(GIF_URL);

  channel.send({
    embeds: [embed]
  });

});

// ===== SLASH COMMANDS =====
const commands = [

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Server info"),

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
        .setDescription("Channel")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("send_tos")
    .setDescription("Send TOS embed"),

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

// ===== ERROR HANDLER =====
process.on("unhandledRejection", err => {
  console.log(err);
});

process.on("uncaughtException", err => {
  console.log(err);
});

// ===== LOGIN =====
client.login(TOKEN);
