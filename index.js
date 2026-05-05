// ===== IMPORTS =====
const { Client, GatewayIntentBits, Partials, SlashCommandBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const express = require('express');

// ===== WEB SERVER (FOR RENDER) =====
const app = express();
app.get('/', (req, res) => res.send('Bot Running'));
app.listen(3000);

// ===== BOT SETUP =====
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

// ===== CHANGE THESE =====
const STAFF_ROLE = "1443529641317892197";
const LOG_CHANNEL = "1501142586788675686";
const WELCOME_CHANNEL = "1443404889894948974";
const UPI_ID = "bossakhil53@okicici";
const STORE_NAME = "Royal Store";
const GIF_URL = "https://media1.tenor.com/m/TR0cAewt72UAAAAC/the-avengers-marvel.gif";
// =======================

// ===== STAFF CHECK =====
function isStaff(member) {
  return member.roles.cache.has(STAFF_ROLE);
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ===== PREFIX COMMANDS =====
client.on("messageCreate", async (msg) => {
  if (!msg.content.startsWith(prefix) || msg.author.bot) return;

  if (!isStaff(msg.member)) return msg.reply("❌ Staff only");

  const args = msg.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  if (cmd === "say") {
    msg.delete().catch(()=>{});
    msg.channel.send(args.join(" "));
  }

  if (cmd === "qr") {
    const amount = args[0];
    if (!amount) return msg.reply("Enter amount");

    const upi = `upi://pay?pa=${UPI_ID}&pn=${STORE_NAME}&am=${amount}&cu=INR`;

    QRCode.toDataURL(upi, (err, url) => {
      msg.channel.send({
        content: `💰 Pay ₹${amount}`,
        files: [url]
      });
    });
  }

  if (cmd === "serverinfo") {
    msg.channel.send({
      embeds: [{
        title: msg.guild.name,
        description: `Members: ${msg.guild.memberCount}`
      }]
    });
  }
});

// ===== SLASH COMMAND =====
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (!interaction.member.roles.cache.has(STAFF_ROLE)) {
    return interaction.reply({ content: "❌ Staff only", ephemeral: true });
  }

  if (interaction.commandName === "give_invoice") {

    const buyer = interaction.options.getUser("buyer");
    const product = interaction.options.getString("product");
    const amount = interaction.options.getString("amount");

    const filePath = `invoice_${Date.now()}.pdf`;

    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(20).text(`${STORE_NAME} INVOICE`, { align: "center" });
    doc.moveDown();

    doc.text(`Buyer: ${buyer.username}`);
    doc.text(`Product: ${product}`);
    doc.text(`Amount: ₹${amount}`);
    doc.text(`Status: PAID`);

    doc.end();

    await interaction.reply({ content: "✅ Invoice Sent", ephemeral: true });

    buyer.send({
      content: "🧾 Your Invoice",
      files: [filePath]
    });

    const logChannel = interaction.guild.channels.cache.find(c => c.name === LOG_CHANNEL);
    if (logChannel) {
      logChannel.send({
        content: `Invoice for ${buyer}`,
        files: [filePath]
      });
    }
  }
});

// ===== WELCOME SYSTEM =====
client.on("guildMemberAdd", member => {
  const channel = member.guild.channels.cache.find(c => c.name === WELCOME_CHANNEL);
  if (!channel) return;

  channel.send({
    embeds: [{
      title: `Welcome to ${STORE_NAME}`,
      description: `${member}\nMembers: ${member.guild.memberCount}`,
      image: { url: GIF_URL }
    }]
  });

  member.send(`Welcome to ${STORE_NAME}`);
});

// ===== REGISTER SLASH =====
const commands = [
  new SlashCommandBuilder()
    .setName("give_invoice")
    .setDescription("Generate Invoice")
    .addUserOption(opt => opt.setName("buyer").setDescription("Buyer").setRequired(true))
    .addStringOption(opt => opt.setName("product").setDescription("Product").setRequired(true))
    .addStringOption(opt => opt.setName("amount").setDescription("Amount").setRequired(true))
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
})();

client.login(TOKEN);
