// ===== IMPORTS =====
const {
  Client,
  GatewayIntentBits,
  Partials,
  SlashCommandBuilder,
  Routes,
  AttachmentBuilder,
  EmbedBuilder
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
    () => "⚙️ Debugging myself",
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

After payment, send payment screenshot here for verification ✅`,
      files: [attachment]
    });
  }

});

// ===== INTERACTIONS =====
client.on("interactionCreate", async interaction => {

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

  // ===== SET FEEDBACK CHANNEL =====
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

    const cleanProduct =
      product.length > 28
        ? product.substring(0, 28) + "..."
        : product;

    const filePath =
      `invoice_${Date.now()}.pdf`;

    const doc =
      new PDFDocument({
        margin: 40
      });

    const stream =
      fs.createWriteStream(filePath);

    doc.pipe(stream);

    // ===== HEADER =====
    doc
      .fontSize(18)
      .fillColor("#4F46E5")
      .text(STORE_NAME, 40, 40);

    doc
      .fontSize(24)
      .fillColor("black")
      .text("INVOICE", 420, 40);

    doc
      .moveTo(40, 80)
      .lineTo(550, 80)
      .stroke("#4F46E5");

    // ===== LEFT =====
    doc
      .fontSize(13)
      .fillColor("black")
      .text(`Invoice #: ${orderId}`, 40, 105)
      .text(`Date: ${new Date().toLocaleDateString()}`, 40, 125)
      .text(`Status: PAID`, 40, 145);

    // ===== RIGHT =====
    doc
      .text(`Billed To:`, 320, 105)
      .text(`${buyer.username}`, 320, 125);

    // ===== TABLE HEADER =====
    doc
      .rect(40, 200, 520, 28)
      .fill("#4F46E5");

    doc
      .fillColor("white")
      .fontSize(12)
      .text("#", 50, 208)
      .text("Description", 100, 208)
      .text("Qty", 340, 208)
      .text("Price", 420, 208)
      .text("Total", 500, 208);

    // ===== TABLE CONTENT =====
    doc
      .fillColor("black")
      .fontSize(12)
      .text("1", 50, 245)
      .text(
        cleanProduct,
        100,
        245,
        {
          width: 210
        }
      )
      .text("1", 350, 245)
      .text(`₹${amount}`, 420, 245)
      .text(`₹${amount}`, 500, 245);

    // ===== GRAND TOTAL =====
    doc
      .rect(40, 300, 520, 30)
      .fill("#111111");

    doc
      .fillColor("white")
      .fontSize(14)
      .text("Grand Total", 380, 308)
      .text(`₹${amount}`, 500, 308);

    // ===== FOOTER =====
    doc
      .fillColor("gray")
      .fontSize(10)
      .text(
        "Generated by Royal Store Automation",
        180,
        700
      );

    doc.end();

    await new Promise(resolve =>
      stream.on("finish", resolve)
    );

    // ===== SEND DM =====
    try {

      await buyer.send({
        files: [filePath]
      });

      await buyer.send(
`👑 Thank you for choosing ${STORE_NAME}!

✅ Your order has been completed
🧾 Invoice has been sent successfully
⭐ Feel free to leave a review using /feedback
💎 We appreciate your support
🚀 Enjoy your purchase!`
      );

    } catch (err) {
      console.log(err);
    }

    // ===== LOGS =====
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
            value: `${amount} rs`,
            inline: true
          },
          {
            name: "Product",
            value: cleanProduct
          }
        )
        .setFooter({
          text:
`Issued by ${interaction.user.username}`
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
client.on("guildMemberAdd", member => {

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

  member.send(
`👑 Welcome to ${STORE_NAME}!

Enjoy shopping with us 💰`
  );

});

// ===== SLASH COMMANDS =====
const commands = [

  // ===== SAY =====
  new SlashCommandBuilder()
    .setName("say")
    .setDescription("Send message")
    .addStringOption(opt =>
      opt
        .setName("text")
        .setDescription("Message")
        .setRequired(true)
    ),

  // ===== QR =====
  new SlashCommandBuilder()
    .setName("qr")
    .setDescription("Generate QR")
    .addStringOption(opt =>
      opt
        .setName("amount")
        .setDescription("Amount")
        .setRequired(true)
    ),

  // ===== INVOICE =====
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

  // ===== SERVER INFO =====
  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Server info"),

  // ===== FEEDBACK =====
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

  // ===== SET FEEDBACK CHANNEL =====
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
