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

let orderCount = 0;

// ===== STAFF CHECK =====
function isStaff(member) {
  return member?.roles?.cache?.has(STAFF_ROLE);
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ===== PREFIX =====
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
    const qrBuffer = await QRCode.toBuffer(upi);

    const attachment = new AttachmentBuilder(qrBuffer, { name: "payment.png" });

    msg.channel.send({
      content: `💰 Pay ₹${amount}`,
      files: [attachment]
    });
  }
});

// ===== SLASH =====
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (!interaction.member.roles.cache.has(STAFF_ROLE)) {
    return interaction.reply({ content: "❌ Staff only", ephemeral: true });
  }

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

    // ===== LOGO =====
    try {
      doc.image("logo.png", 40, 30, { width: 60 });
    } catch {
      console.log("Logo not found");
    }

    // ===== HEADER TEXT =====
    doc.fontSize(18).fillColor("#4F46E5").text(STORE_NAME, 110, 40);
    doc.fontSize(10).fillColor("gray").text("Discord Commerce Automation", 110, 60);

    doc.fontSize(20).fillColor("black").text("INVOICE", 450, 40);

    doc.moveTo(40, 90).lineTo(550, 90).stroke("#4F46E5");

    // ===== DETAILS =====
    doc.fontSize(10).fillColor("black");

    doc.text(`Invoice #: ${orderId}`, 40, 110);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 40, 125);
    doc.text(`Status: PAID`, 40, 140);

    doc.text(`Billed To:`, 320, 110);
    doc.text(`${buyer.username}`, 320, 125);

    // ===== TABLE POSITIONS =====
    const startX = 40;
    const col1 = startX;
    const col2 = 90;
    const col3 = 350;
    const col4 = 420;
    const col5 = 500;

    // HEADER
    doc.rect(startX, 180, 520, 25).fill("#4F46E5");

    doc.fillColor("white")
      .text("#", col1, 188)
      .text("Description", col2, 188)
      .text("Qty", col3, 188)
      .text("Unit Price", col4, 188)
      .text("Total", col5, 188);

    // DATA
    doc.fillColor("black");

    doc.text("1", col1, 220);
    doc.text(product, col2, 220, { width: 240 });
    doc.text("1", col3, 220);
    doc.text(`₹${amount}`, col4, 220);
    doc.text(`₹${amount}`, col5, 220);

    // TOTAL
    doc.rect(startX, 260, 520, 25).fill("#111");

    doc.fillColor("white")
      .text("Grand Total", 380, 268)
      .text(`₹${amount}`, col5, 268);

    // FOOTER
    doc.fillColor("gray")
      .fontSize(10)
      .text("Thank you for your purchase. This invoice is official proof of transaction.", 40, 310);

    doc.end();

    await new Promise(resolve => stream.on("finish", resolve));

    await buyer.send({ files: [filePath] });

    // LOG EMBED
    const embed = new EmbedBuilder()
      .setColor("#facc15")
      .setTitle("🧾 Invoice Issued")
      .addFields(
        { name: "Order #", value: orderId, inline: true },
        { name: "Buyer", value: `${buyer}`, inline: true },
        { name: "Amount", value: `${amount} rs only`, inline: true },
        { name: "Product", value: product },
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

// ===== SLASH REGISTER =====
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
