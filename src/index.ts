import "dotenv-safe/config";
import { Client, MessageEmbed } from "discord.js";
import * as fs from "fs";
import * as mongoose from "mongoose";
import { profileModel } from "./data";
import { FileStore } from "./file-store";

const bot = new Client();

const PREFIX = "!";

const channels = JSON.parse(fs.readFileSync("./channels.json", "utf-8"));

//let count = 0;
//let countPath = "count.txt";

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
});

bot.on("message", async function (msg) {
  if (msg.guild === null) return;

  for (let i = 0; i < channels.length; i++) {
    if (msg.channel.id === channels[i]) {
      msg.react("🪑");
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
  }
});

bot.on("message", async function (msg) {
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
  } catch (err) {}
  if (msgLowercase.includes("chair")) {
    msg.channel.send("<:phrog:821089725816766536>");
    //msg.channel.send('<a:gmagik:726661980219506688>');
  } else if (!msgLowercase.startsWith(PREFIX)) {
    return;
  } else if (msgLowercase == "!count") {
    const embed = new MessageEmbed()
      .setColor("#78d6ff")
      //.setAuthor(`${msg.author.tag}`, msg.author.avatarURL())
      .setTitle(`${msg.author.username}'s chair count`)
      .setDescription(`**__chairs__**: ${profileData.chair_count}`)
      //.addField (`**${msg.author.username}'s chair count**`,`**chairs**: ${profileData.chair_count}`)
      .setFooter(
        "WARNING this is a beta your data might get deleted",
        profileData.pfp
      );

    msg.channel.send(embed);
  } else if (msgLowercase.includes("!count ")) {
    try {
      const embed = new MessageEmbed()
        .setColor("#78d6ff")
        //.setAuthor(`${msg.author.tag}`, msg.author.avatarURL())
        .setTitle(`${msg.mentions.users.first().username}'s chair count`)
        .setDescription(`**__chairs__**: ${profileDataOther.chair_count}`)
        //.addField (`**${msg.author.username}'s chair count**`,`**chairs**: ${profileData.chair_count}`)
        .setFooter(
          "WARNING this is a beta your data might get deleted",
          profileDataOther.pfp
        );

      msg.channel.send(embed);
    } catch (error) {
      msg.reply("you need to ping a valid person");
    }
  } else if (
    msgLowercase == "!leaderbord" ||
    msgLowercase == "!lb" ||
    msgLowercase == "!leaderbords"
  ) {
    leaderbord = await profileModel.find({ serverID: msg.guild.id });
    let embed = new MessageEmbed()
      .setFooter(
        `${profileData.serverName} | WARNING this is a beta your data might get deleted`,
        profileData.serverPFP
      )
      .setColor("#78d6ff")
      .setTitle(`${profileData.serverName}'s Chair count`);

    leaderbord.sort(
      (a: { chair_count: number }, b: { chair_count: number }) =>
        b.chair_count - a.chair_count
    );

    leaderbord.forEach((e: { userName: any; chair_count: any }) => {
      message += `\n**${rank}** | **${e.userName.slice(0, -5)}** 🪑: ${
        e.chair_count
      }`;
      rank++;
    });
    embed.setDescription(message);
    msg.channel.send(embed);
    rank = 1;
    message = "";
  } else if (msgLowercase == "!add") {
    if (msg.member.hasPermission("ADMINISTRATOR")) {
      channels.push(msg.channel.id);
      msg.channel.send("channel added ✅ ᶦ ᵗʰᶦⁿᵏ");

      const jsonContent = JSON.stringify(channels);

      fs.writeFile("./channels.json", jsonContent, "utf8", function (err) {
        if (err) {
          return console.log(err);
        }

        console.log("saved!");
      });
    } else {
      msg.channel.send("you got no admin **>:(**");
    }
  } else if (msgLowercase == "!remove") {
    if (msg.member.hasPermission("ADMINISTRATOR")) {
      for (let i = 0; i < channels.length; i++) {
        if (channels[i] == msg.channel.id) {
          channels.splice(i, parseInt(msg.channel.id));

          const jsonContent = JSON.stringify(channels);

          fs.writeFile("./channels.json", jsonContent, "utf8", function (err) {
            if (err) {
              return console.log(err);
            }

            console.log("saved!");
          });
        }
      }
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
    msg.channel.send("```" + channels + "```");
    msg.channel.send(`🏓 API Latency is ${Math.round(bot.ws.ping)}ms`);
    console.log(`DEBUG HAS BEEN USE BY ${msg.author.tag}`);
  } else if (msgLowercase == "!commands" || msgLowercase == "!command") {
    msg.channel.send(
      "**!add\n!remove\n!about\n!suggest\n!uptime\n**i will make it look better later afjlafkkfds :char:"
    );
  } else if (msgLowercase == "!about") {
    msg.channel.send(aboutEmbed);
  } else if (msgLowercase == "!uptime") {
    let days = Math.floor(bot.uptime / 86400000);
    let hours = Math.floor(bot.uptime / 3600000) % 24;
    let minutes = Math.floor(bot.uptime / 60000) % 60;
    let seconds = Math.floor(bot.uptime / 1000) % 60;

    const embed = new MessageEmbed()
      .setColor("#78d6ff")
      .addField(
        "**__uptime__**",
        `**days**: ${days} \n**hours**: ${hours} \n**minutes**: ${minutes} \n**seconds**: ${seconds}`
      );

    msg.channel.send(embed);
  }
});

bot.on("message", async (message) => {
  // Voice only works in guilds, if the message does not come from a guild,
  // we ignore it
  if (!message.guild) return;

  if (message.content === "aaa") {
    // Only try to join the sender's voice channel if they are in one themselves
    if (message.member.voice.channel) {
      const connection = await message.member.voice.channel.join();
    } else {
      message.reply("You need to join a voice channel first!");
    }
  }
});

const aboutEmbed = new MessageEmbed()
  .setColor("#78d6ff")
  .setDescription(
    "this is my first bot i ever\nmade i hope you like the chairs :)"
  )
  .setAuthor(
    "Made by: Salty Mat",
    "https://imgur.com/PWR3DeX.png",
    "https://twitter.com/Salty_Mat"
  )
  .setTitle("About")
  .setThumbnail("https://imgur.com/ablIrp4.png")
  .addField("Discord server", "coming soon")
  .addField("website", "https://chairbot.xyz")
  .addField("Email", "chairbot.discord@gmail.com")
  .addField(
    `contact me`,
    `**twitter**: @Salty_Mat\n**Youtube**: Salty Mat\n**Discord**: Salt#0330 `
  )
  .setFooter("Chair bot was born at jun 10th 2020");

bot.login(process.env.DISCORD_TOKEN);
