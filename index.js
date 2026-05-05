// ===== IMPORTS =====
const { 
  Client, GatewayIntentBits, Partials,
  SlashCommandBuilder, Routes,
  AttachmentBuilder, EmbedBuilder
} = require('discord.js');

const { REST } = require('@discordjs/rest');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const express = require('express');

// ===== WEB SERVER =====
const app = express();
app.get('/', (req, res) => res.send('Bot Running'));
app.listen(3000);

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
const GIF_URL = "https://media1.tenor.com/m/TR0cAewt72UAAAAC/the-avengers-marvel.gif";

// ===== ORDER COUNTER =====
let orderCount = 0;

// ===== STAFF CHECK =====
function isStaff(member) {
  return member?.roles?.cache?.has(STAFF_ROLE);
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

    try {
      const upi = `upi://pay?pa=${UPI_ID}&pn=${STORE_NAME}&am=${amount}&cu=INR`;
      const qrBuffer = await QRCode.toBuffer(upi);

      const attachment = new AttachmentBuilder(qrBuffer, { name: "payment.png" });

      msg.channel.send({
        content: `💰 Pay ₹${amount}`,
        files: [attachment]
      });

    } catch {
      msg.reply("QR failed");
    }
  }
});

// ===== SLASH COMMAND HANDLER =====
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (!interaction.member.roles.cache.has(STAFF_ROLE)) {
    return interaction.reply({ content: "❌ Staff only", ephemeral: true });
  }

  // ===== /say =====
  if (interaction.commandName === "say") {
    const text = interaction.options.getString("text");
    await interaction.reply({ content: "Sent", ephemeral: true });
    interaction.channel.send(text);
  }

  // ===== /qr =====
  if (interaction.commandName === "qr") {
    const amount = interaction.options.getString("amount");

    const upi = `upi://pay?pa=${UPI_ID}&pn=${STORE_NAME}&am=${amount}&cu=INR`;
    const qrBuffer = await QRCode.toBuffer(upi);

    const attachment = new AttachmentBuilder(qrBuffer, { name: "payment.png" });

    await interaction.reply({
      content: `💰 Pay ₹${amount}`,
      files: [attachment]
    });
  }

  // ===== /give_invoice =====
  if (interaction.commandName === "give_invoice") {

    orderCount++;
    const orderId = orderCount.toString().padStart(4, "0");

    const buyer = interaction.options.getUser("buyer");
    const product = interaction.options.getString("product");
    const amount = interaction.options.getString("amount");

    const filePath = `invoice_${Date.now()}.pdf`;

    const doc = new PDFDocument({ margin: 40 });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // ===== DESIGN =====
    doc.fontSize(20).fillColor("#4F46E5").text(STORE_NAME, 40, 40);
    doc.fontSize(10).fillColor("gray").text("Discord Commerce Automation", 40, 60);
    doc.fontSize(20).fillColor("black").text("INVOICE", 400, 40);

    doc.moveTo(40, 80).lineTo(550, 80).stroke("#4F46E5");

    doc.text(`Invoice #: ${orderId}`, 40, 100);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 40, 115);
    doc.text(`Status: PAID`, 40, 130);

    doc.text(`Billed To:`, 300, 100);
    doc.text(`${buyer.username}`, 300, 115);

    doc.rect(40, 160, 500, 25).fill("#4F46E5");

    doc.fillColor("white")
      .text("#", 50, 168)
      .text("Description", 80, 168)
      .text("Qty", 350, 168)
      .text("Unit Price", 420, 168)
      .text("Total", 500, 168);

    doc.fillColor("black");

    doc.text("1", 50, 200);
    doc.text(product, 80, 200);
    doc.text("1", 350, 200);
    doc.text(`₹${amount}`, 420, 200);
    doc.text(`₹${amount}`, 500, 200);

    doc.rect(40, 240, 500, 25).fill("#111");

    doc.fillColor("white")
      .text("Grand Total", 380, 248)
      .text(`₹${amount}`, 500, 248);

    doc.end();

    await new Promise(resolve => stream.on("finish", resolve));

    // DM
    try {
      await buyer.send({
        content: "🧾 Your Invoice",
        files: [filePath]
      });
    } catch {
      return interaction.reply({ content: "❌ DM failed", ephemeral: true });
    }

    // LOG EMBED
    const embed = new EmbedBuilder()
      .setColor("#facc15")
      .setTitle("🧾 Invoice Issued")
      .addFields(
        { name: "Order #", value: orderId, inline: true },
        { name: "Buyer", value: `${buyer}`, inline: true },
        { name: "Amount", value: `${amount} rs only`, inline: true },
        { name: "Product", value: product, inline: false },
        { name: "DM Sent", value: "✅ Yes", inline: true }
      )
      .setFooter({
        text: `Issued by ${interaction.user.username} | ${new Date().toLocaleString()}`
      });

    const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);

    if (logChannel) {
      logChannel.send({
        embeds: [embed],
        files: [filePath]
      });
    }

    await interaction.reply({ content: "✅ Invoice Sent", ephemeral: true });
  }
});

// ===== WELCOME =====
client.on("guildMemberAdd", member => {
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
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

// ===== SLASH REGISTER =====
const commands = [
  new SlashCommandBuilder()
    .setName("say")
    .setDescription("Send message")
    .addStringOption(opt => opt.setName("text").setDescription("Message").setRequired(true)),

  new SlashCommandBuilder()
    .setName("qr")
    .setDescription("Generate QR")
    .addStringOption(opt => opt.setName("amount").setDescription("Amount").setRequired(true)),

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
