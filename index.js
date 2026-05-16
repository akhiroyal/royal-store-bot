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

const GIF_URL =
"https://media1.tenor.com/m/TR0cAewt72UAAAAC/the-avengers-marvel.gif";

// ===== VARIABLES =====
let orderCount = 0;
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

After payment, send payment screenshot here for verification ✅`,
      files: [attachment]
    });
  }

});

// ===== INTERACTIONS =====
client.on("interactionCreate", async interaction => {

  // ===== SELECT MENU =====
  if (interaction.isStringSelectMenu()) {

    const value = interaction.values[0];

    // ===== SERVER BOOSTS =====
    if (value === "boosts") {

      const embed = new EmbedBuilder()
        .setColor("#ff00aa")
        .setTitle("<a:Boosters:1443793092028137524> Server Boosts TOS")
        .setDescription(
`• No warranty on revokes
• No Refund Or Replace On AntiBot Bans
• Full Warranty If Mentioned Only
• Revoke Warranty If Mentioned Only
• Rep Warranty If Mentioned Only`
        );

      return interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }

    // ===== NITRO IDS =====
    if (value === "nitroids") {

      const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("<a:nitro:1505129726212177960> Nitro IDs / Discord Accounts TOS")
        .setDescription(
`• Video proof required
• Must change email & password after delivery
• No warranty on Discord lock or bans
• No warranty if Discord revokes nitro`
        );

      return interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }

    // ===== METHODS =====
    if (value === "methods") {

      const embed = new EmbedBuilder()
        .setColor("#00aeff")
        .setTitle("<a:bot_developer:1444508717994348705> Methods / Tools TOS")
        .setDescription(
`• No refund if patched
• Tools are PC only
• User mistake = no replace`
        );

      return interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }

    // ===== MEMBERS =====
    if (value === "members") {

      const embed = new EmbedBuilder()
        .setColor("#00ff99")
        .setTitle("<a:DISCORD:1443793884584083538> Discord Members TOS")
        .setDescription(
`• No warranty against bans/kicks
• No warranty if Discord bans tokens
• No refund if server bans tokens
• No replace if antibots kick tokens`
        );

      return interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }

    // ===== GIFTLINKS =====
    if (value === "giftlinks") {

      const embed = new EmbedBuilder()
        .setColor("#ff66cc")
        .setTitle("<a:NITRO:1443792698539769930> Nitro Giftlinks TOS")
        .setDescription(
`• Delivery via gift link
• Auto-claim warranty provided only if mentioned
• Must record full video before claiming
• Warranty valid only with proper proof
• No warranty for user mistakes
• No replace if link already claimed without proof
• Validity depends on product mentioned in ticket
• Royal Store holds rights to deny fake claims`
        );

      return interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }

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

  // ===== SEND TOS =====
  if (interaction.commandName === "send_tos") {

    if (!interaction.member.roles.cache.has(STAFF_ROLE)) {
      return interaction.reply({
        content: "❌ Staff only",
        ephemeral: true
      });
    }

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

  try {

    await member.send(
`👑 Welcome to ${STORE_NAME}!

Enjoy shopping with us 💰`
    );

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
    .setDescription("Send TOS panel")

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
