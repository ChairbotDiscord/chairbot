import "dotenv-safe/config";
import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import * as fs from "fs";
import * as mongoose from "mongoose";
import { profileModel } from "./data";
import { FileStore } from "./file-store";
import { startCommands } from "./commandStarter";

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
}
);

const PREFIX = "!";

//const channels = JSON.parse(fs.readFileSync("./channels.json", "utf-8"));

//let count = 0;
//let countPath = "count.txt";

const channelsStore = new FileStore<string[]>({
  fileName: "channels.json",
  defaultValue: [],
  encoder: (d) => {
    return JSON.stringify(d);
  },
  decoder: (d) => {
    return JSON.parse(d);
  },
});

const countStore = new FileStore<number>({
  fileName: "count.txt",
  defaultValue: 0,
  encoder: (d) => {
    return d.toString();
  },
  decoder: (d) => {
    return parseInt(d);
  },
});

mongoose
  .connect(process.env.MONGOOSE_DB, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected..."))
  .catch(console.error);

bot.once("ready", async () => {
  console.log("This bot is online");
  bot.user.setActivity(`🪑 ${await countStore.get()} | Made by Salty Mat`);
  startCommands();
});

bot.on("messageCreate", async function (msg) {
  if (msg.guild === null) return;

  if ((await channelsStore.get()).includes(msg.channel.id)) {
    msg.react("🪑").catch(function (error) {
      console.log(error)
    });
    await countStore.save((await countStore.get()) + 1);
    bot.user.setActivity(`🪑 ${await countStore.get()} | Made by Salty Mat`);

    if (msg.author.bot) return;

    let profileData;
    try {
      profileData = await profileModel.findOne({
        userID: msg.author.id,
        serverID: msg.guild.id,
      });
      if (!profileData) {
        let profile = await profileModel.create({
          userID: msg.author.id,
          serverID: msg.guild.id,
          userName: msg.author.tag,
          serverName: msg.guild.name,
          serverPFP: msg.guild.iconURL(),
          pfp: msg.author.avatarURL(),
          chair_count: 0,
        });
        profile.save();
      }
    } catch (err) {
      console.log(err);
    }

    const response = await profileModel.findOneAndUpdate(
      {
        userID: msg.author.id,
        serverID: msg.guild.id,
      },
      {
        $set: {
          userName: msg.author.tag,
          serverName: msg.guild.name,
          serverPFP: msg.guild.iconURL(),
          pfp: msg.author.avatarURL(),
        },
        $inc: {
          chair_count: 1,
        },
      }
    );
  }
});

bot.on("messageCreate", async function (msg) {
  if (msg.guild === null) return;
  let msgLowercase = msg.content.toLowerCase();

  let rank = 1;
  let message: string = "";
  let leaderbord: any;

  let profileData;
  let profileDataOther;
  try {
    profileData = await profileModel.findOne({
      userID: msg.author.id,
      serverID: msg.guild.id,
    });
  } catch (err) {
    console.log(err);
  }
  try {
    profileDataOther = await profileModel.findOne({
      userID: msg.mentions.users.first().id,
      serverID: msg.guild.id,
    });
  } catch (err) { }
  if (msgLowercase.includes("chair")) {
    msg.channel.send("<:phrog:821089725816766536>");
    //msg.channel.send('<a:gmagik:726661980219506688>');
  } else if (!msgLowercase.startsWith(PREFIX)) {
    return;
  } else if (msgLowercase == "!count") {
    const embed = new EmbedBuilder()
      .setColor("#78d6ff")
      //.setAuthor(`${msg.author.tag}`, msg.author.avatarURL())
      .setTitle(`${msg.author.username}'s chair count`)
      .setDescription(`**__chairs__**: ${profileData.chair_count}`)
      //.addField (`**${msg.author.username}'s chair count**`,`**chairs**: ${profileData.chair_count}`)
      .setFooter({ text: "WARNING this is a beta your data might get deleted", iconURL: profileData.pfp });

    msg.reply({ embeds: [embed] });
  } else if (msgLowercase.includes("!count ")) {
    try {
      const embed = new EmbedBuilder()
        .setColor("#78d6ff")
        //.setAuthor(`${msg.author.tag}`, msg.author.avatarURL())
        .setTitle(`${msg.mentions.users.first().username}'s chair count`)
        .setDescription(`**__chairs__**: ${profileDataOther.chair_count}`)
        //.addField (`**${msg.author.username}'s chair count**`,`**chairs**: ${profileData.chair_count}`)
        .setFooter({ text: "WARNING this is a beta your data might get deleted", iconURL: profileDataOther.pfp }
        );

      msg.channel.send({ embeds: [embed] });
    } catch (error) {
      msg.reply("you need to ping a valid person");
    }
  } else if (
    msgLowercase == "!leaderbord" ||
    msgLowercase == "!lb" ||
    msgLowercase == "!leaderbords"
  ) {
    leaderbord = await profileModel.find({ serverID: msg.guild.id });
    let embed = new EmbedBuilder()
      .setFooter(
        { text: `${profileData.serverName} | WARNING this is a beta your data might get deleted`, iconURL: profileData.serverPFP }
      )
      .setColor("#78d6ff")
      .setTitle(`${profileData.serverName}'s Chair count`);

    leaderbord.sort(
      (a: { chair_count: number }, b: { chair_count: number }) =>
        b.chair_count - a.chair_count
    );

    leaderbord.forEach((e: { userName: any; chair_count: any }) => {
      message += `\n**${rank}** | **${e.userName.slice(0, -5)}** 🪑: ${e.chair_count
        }`;
      rank++;
    });
    embed.setDescription(message);
    msg.channel.send({ embeds: [embed] });
    rank = 1;
    message = "";
  } else if (msgLowercase == "!add") {
    if (msg.member.permissions.has("Administrator")) {
      const currentChannels = await channelsStore.get();
      await channelsStore.save([...currentChannels, msg.channel.id]);
      msg.channel.send("channel added ✅ ᶦ ᵗʰᶦⁿᵏ");
    } else {
      msg.channel.send("you got no admin **>:(**");
    }
  } else if (msgLowercase == "!remove") {
    if (msg.member.permissions.has("Administrator")) {
      const currentChannels = await channelsStore.get();
      const newChans = currentChannels.filter((val) => msg.channel.id !== val);
      await channelsStore.save(newChans);
      msg.channel.send("channel removed ✅ ᶦ ᵗʰᶦⁿᵏ");
    } else {
      msg.channel.send("you got no admin **>:(**");
    }
  } else if (msgLowercase == "!developer") {
    msg.channel.send("https://imgur.com/a/CGOkqSE");
  } else if (msgLowercase.includes("!suggest")) {
    let suggestion = msg.content.replace("!suggest", "");
    if (suggestion == "") {
      msg.channel.send("you can't suggest nothing **br u  h**");
    } else {
      const user = bot.users.cache.get("173569047684841472");
      user.send("***from:*** " + msg.author.tag + "\n```" + suggestion + "```");
      msg.channel.send("suggestion sent ✅ ᶦ ᵗʰᶦⁿᵏ");
    }
  } else if (msgLowercase == "!debug") {
    msg.channel.send("```" + channelsStore.cache + "```");
    msg.channel.send(`🏓 API Latency is ${Math.round(bot.ws.ping)}ms`);
    console.log(`DEBUG HAS BEEN USE BY ${msg.author.tag}`);
  } else if (msgLowercase == "!commands" || msgLowercase == "!command") {
    msg.channel.send(
      "**!add\n!remove\n!about\n!suggest\n!uptime\n**i will make it look better later afjlafkkfds :char:"
    );
  } else if (msgLowercase == "!about") {
    msg.channel.send({ embeds: [aboutEmbed] });
  } else if (msgLowercase == "!uptime") {
    let days = Math.floor(bot.uptime / 86400000);
    let hours = Math.floor(bot.uptime / 3600000) % 24;
    let minutes = Math.floor(bot.uptime / 60000) % 60;
    let seconds = Math.floor(bot.uptime / 1000) % 60;

    const embed = new EmbedBuilder()
      .setColor("#78d6ff")
      .addFields({
        name: "**__uptime__**",
        value: `**days**: ${days} \n**hours**: ${hours} \n**minutes**: ${minutes} \n**seconds**: ${seconds}`
      }
      );

    msg.channel.send({ embeds: [embed] });
  }
});

const aboutEmbed = new EmbedBuilder()
  .setColor("#78d6ff")
  .setDescription(
    "this is my first bot i ever\nmade i hope you like the chairs :)"
  )
  .setAuthor({
    name: "Made by: Salty Mat",
    iconURL: "https://imgur.com/PWR3DeX.png",
    url: "https://twitter.com/Salty_Mat"
  }
  )
  .setTitle("About")
  .setThumbnail("https://imgur.com/ablIrp4.png")
  .addFields(
    { name: "Discord server", value: "coming soon" },
    { name: "Email", value: "chairbot.discord@gmail.com" },
    { name: `contact me`, value: `**twitter**: @Salty_Mat\n**Youtube**: Salty Mat\n**Discord**: Salt#0330 ` }
  )
  .setFooter({ text: "Chair bot was born at jun 10th 2020" });

bot.login(process.env.DISCORD_TOKEN);
