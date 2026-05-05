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

let orderCount = 0;

// ===== READY + ADVANCED STATUS =====
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);

  const getTotalMembers = () =>
    client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);

  const statuses = [
    () => `👥 ${getTotalMembers()} Members`,
    () => `🏠 ${client.guilds.cache.size} Server`,
    () => "💰 Processing Payments",
    () => "🧾 Generating Invoices",
    () => "⚙️ Debugging myself",
    () => "👑 Royal Store System",
    () => "🚀 Fast & Secure Orders"
  ];

  let i = 0;

  setInterval(() => {
    const status = statuses[i % statuses.length]();

    client.user.setPresence({
      activities: [{ name: status, type: 3 }], // WATCHING
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
  if (!msg.content.startsWith(prefix) || msg.author.bot) return;

  const args = msg.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  if (cmd === "say") {
    if (!isStaff(msg.member)) return msg.reply("❌ Staff only");
    msg.delete().catch(()=>{});
    msg.channel.send(args.join(" "));
  }

  if (cmd === "qr") {
    if (!isStaff(msg.member)) return msg.reply("❌ Staff only");

    const amount = args[0];
    if (!amount) return msg.reply("Enter amount");

    const upi = `upi://pay?pa=${UPI_ID}&pn=${STORE_NAME}&am=${amount}&cu=INR`;
    const qrBuffer = await QRCode.toBuffer(upi);

    const attachment = new AttachmentBuilder(qrBuffer, { name: "payment.png" });

    msg.channel.send({
      content: `💰 Pay ₹${amount}`,
      files: [attachment]
    });
  }
});

// ===== SLASH COMMANDS =====
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // PUBLIC
  if (interaction.commandName === "serverinfo") {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(interaction.guild.name)
          .setColor("#4F46E5")
          .addFields(
            { name: "Members", value: `${interaction.guild.memberCount}`, inline: true },
            { name: "Owner", value: `<@${interaction.guild.ownerId}>`, inline: true }
          )
      ]
    });
  }

  // STAFF CHECK
  if (!interaction.member.roles.cache.has(STAFF_ROLE)) {
    return interaction.reply({ content: "❌ Staff only", ephemeral: true });
  }

  // SAY
  if (interaction.commandName === "say") {
    const text = interaction.options.getString("text");
    await interaction.reply({ content: "Sent", ephemeral: true });
    interaction.channel.send(text);
  }

  // QR
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

  // INVOICE
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

    doc.fontSize(18).fillColor("#4F46E5").text(STORE_NAME, 40, 40);
    doc.fontSize(20).fillColor("black").text("INVOICE", 450, 40);

    doc.moveTo(40, 80).lineTo(550, 80).stroke("#4F46E5");

    doc.text(`Invoice #: ${orderId}`, 40, 100);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 40, 115);
    doc.text(`Status: PAID`, 40, 130);

    doc.text(`Billed To:`, 320, 100);
    doc.text(`${buyer.username}`, 320, 115);

    doc.rect(40, 180, 520, 25).fill("#4F46E5");

    doc.fillColor("white")
      .text("#", 40, 188)
      .text("Description", 90, 188)
      .text("Qty", 350, 188)
      .text("Price", 420, 188)
      .text("Total", 500, 188);

    doc.fillColor("black")
      .text("1", 40, 220)
      .text(product, 90, 220)
      .text("1", 350, 220)
      .text(`₹${amount}`, 420, 220)
      .text(`₹${amount}`, 500, 220);

    doc.rect(40, 260, 520, 25).fill("#111");

    doc.fillColor("white")
      .text("Grand Total", 380, 268)
      .text(`₹${amount}`, 500, 268);

    doc.end();

    await new Promise(resolve => stream.on("finish", resolve));

    await buyer.send({ files: [filePath] });

    const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);

    const embed = new EmbedBuilder()
      .setColor("#facc15")
      .setTitle("🧾 Invoice Issued")
      .addFields(
        { name: "Order #", value: orderId, inline: true },
        { name: "Buyer", value: `${buyer}`, inline: true },
        { name: "Amount", value: `${amount} rs`, inline: true },
        { name: "Product", value: product }
      );

    logChannel.send({ embeds: [embed], files: [filePath] });

    await interaction.reply({ content: "✅ Invoice Sent", ephemeral: true });
  }
});

// ===== WELCOME =====
client.on("guildMemberAdd", member => {
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor("#4F46E5")
    .setTitle(`👑 Welcome to ${STORE_NAME}`)
    .setDescription(
      `Hey ${member} 👋\n\n` +
      `You're member **#${member.guild.memberCount}** 🎉\n\n` +
      `Enjoy shopping with us 💰`
    )
    .setImage(GIF_URL);

  channel.send({ embeds: [embed] });
  member.send(`Welcome to ${STORE_NAME} 👋`);
});

// ===== REGISTER SLASH =====
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
    .setDescription("Generate invoice")
    .addUserOption(opt => opt.setName("buyer").setDescription("Buyer").setRequired(true))
    .addStringOption(opt => opt.setName("product").setDescription("Product").setRequired(true))
    .addStringOption(opt => opt.setName("amount").setDescription("Amount").setRequired(true)),

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Server info")

].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
})();

client.login(TOKEN);
