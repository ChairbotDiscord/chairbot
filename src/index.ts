import { env } from "./env";
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { FileStore } from "./file-store";
import { startCommands } from "./commandStarter";
import { PrismaClient } from "@prisma/client";

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const PREFIX = "!";

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

// mongoose
//   .connect(process.env.MONGOOSE_DB, {
//     useNewUrlParser: true,
//     useFindAndModify: false,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log("MongoDB Connected..."))
//   .catch(console.error);

const db = new PrismaClient({ log: ["error", "warn", "query", "info"] });
db.$connect()
  .then(() => console.log("Connected to Prisma"))
  .catch((e) => console.error("Failed to connect to Prisma", e));

bot.once("ready", async () => {
  console.log("This bot is online");
  bot.user.setActivity(`🪑 ${await countStore.get()} | Made by Salty Mat`);
  startCommands();
});

bot.on("messageCreate", async function (msg) {
  if (msg.guild === null) return;

  let msgLowercase = msg.content.toLowerCase();

  if (msgLowercase.includes("chair")) {
    msg.channel.send("<:phrog:821089725816766536>");
    //msg.channel.send('<a:gmagik:726661980219506688>');
  }

  if ((await channelsStore.get()).includes(msg.channel.id)) {
    msg.react("🪑").catch(function (error) {
      console.log(error);
    });
    await countStore.save((await countStore.get()) + 1);
    bot.user.setActivity(`🪑 ${await countStore.get()} | Made by Salty Mat`);

    if (msg.author.bot) return;
    try {
      const userInfo = {
        username: msg.author.username,
        discriminator: msg.author.discriminator,
        avatarUrl: msg.author.avatarURL(),
      };

      const serverInfo = {
        name: msg.guild.name,
        avatarUrl: msg.guild.iconURL(),
      };
      //upsert | create or update
      await db.serverProfile.upsert({
        where: {
          userId_serverId: { serverId: msg.guild.id, userId: msg.author.id },
        },
        create: {
          chairCount: 1,
          server: {
            connectOrCreate: {
              where: { id: msg.guild.id },
              create: {
                id: msg.guild.id,
                ...serverInfo,
              },
            },
          },
          user: {
            connectOrCreate: {
              where: { id: msg.author.id },
              create: {
                id: msg.author.id,
                ...userInfo,
              },
            },
          },
        },
        update: {
          chairCount: { increment: 1 },
          user: { update: userInfo },
          server: { update: serverInfo },
        },
      });
    } catch (error) {
      console.error("failed to update user chairs count", error);
    }

    // let profileData;
    // try {
    //   profileData = await profileModel.findOne({
    //     userID: msg.author.id,
    //     serverID: msg.guild.id,
    //   });
    //   if (!profileData) {
    //     let profile = await profileModel.create({
    //       userID: msg.author.id,
    //       serverID: msg.guild.id,
    //       userName: msg.author.tag,
    //       serverName: msg.guild.name,
    //       serverPFP: msg.guild.iconURL(),
    //       pfp: msg.author.avatarURL(),
    //       chair_count: 0,
    //     });
    //     profile.save();
    //   }
    // } catch (err) {
    //   console.log(err);
    // }

    // const response = await profileModel.findOneAndUpdate(
    //   {
    //     userID: msg.author.id,
    //     serverID: msg.guild.id,
    //   },
    //   {
    //     $set: {
    //       userName: msg.author.tag,
    //       serverName: msg.guild.name,
    //       serverPFP: msg.guild.iconURL(),
    //       pfp: msg.author.avatarURL(),
    //     },
    //     $inc: {
    //       chair_count: 1,
    //     },
    //   }
    // );
  }
});

bot.on("interactionCreate", async function (msg: ChatInputCommandInteraction) {
  if (msg.guild === null) return;

  let msgLowercase = msg.commandName.toLowerCase();

  let rank = 1;
  let message: string = "";

  if (msgLowercase == "count" && msg.options.data.length === 0) {
    try {
      const profileData = await db.serverProfile.findUnique({
        where: {
          userId_serverId: { userId: msg.user.id, serverId: msg.guild.id },
        },
        include: {
          user: {
            select: { avatarUrl: true },
          },
          server: true,
        },
      });

      if (!profileData) {
        msg.reply("you dont have any data");
        return;
      }
      const embed = new EmbedBuilder()
        .setColor("#78d6ff")
        //.setAuthor(`${msg.author.tag}`, msg.author.avatarURL())
        .setTitle(`${msg.user.username}'s chair count`)
        .setDescription(`**__chairs__**: ${profileData.chairCount}`)
        //.addField (`**${msg.author.username}'s chair count**`,`**chairs**: ${profileData.chair_count}`)
        .setFooter({
          text: "WARNING this is a beta your data might get deleted",
          iconURL: profileData.user.avatarUrl,
        });

      msg.reply({ embeds: [embed] });
    } catch (err) {
      console.log(err);
    }
  } else if (msgLowercase == "count" && msg.options.data.length !== 0) {
    try {
      const profileDataOther = await db.serverProfile.findUnique({
        where: {
          userId_serverId: {
            userId: msg.options.data[0].user.id,
            serverId: msg.guild.id,
          },
        },
        include: {
          user: {
            select: { avatarUrl: true },
          },
        },
      });
      if (!profileDataOther) {
        msg.reply("they dont have any data");
        return;
      }
      const embed = new EmbedBuilder()
        .setColor("#78d6ff")
        //.setAuthor(`${msg.author.tag}`, msg.author.avatarURL())
        .setTitle(`${msg.options.data[0].user.username}'s chair count`)
        .setDescription(`**__chairs__**: ${profileDataOther.chairCount}`)
        //.addField (`**${msg.author.username}'s chair count**`,`**chairs**: ${profileData.chair_count}`)
        .setFooter({
          text: "WARNING this is a beta your data might get deleted",
          iconURL: profileDataOther.user.avatarUrl,
        });

      msg.reply({ embeds: [embed] });
    } catch (error) {
      msg.reply("you need to ping a valid person");
    }
  } else if (msgLowercase == "leaderboard") {
    //leaderbord = await profileModel.find({ serverID: msg.guild.id });
    const leaderbord = await db.serverProfile.findMany({
      where: { serverId: msg.guild.id },
      include: {
        user: {
          select: { username: true },
        },
      },
    });
    let embed = new EmbedBuilder()
      .setFooter({
        text: `${msg.guild.name} | WARNING this is a beta your data might get deleted`,
        iconURL: msg.guild.iconURL(),
      })
      .setColor("#78d6ff")
      .setTitle(`${msg.guild.name}'s Chair count`);

    leaderbord.sort((a, b) => b.chairCount - a.chairCount);

    leaderbord.forEach((e) => {
      message += `\n**${rank}** | **${e.user.username.slice(0, -5)}** 🪑: ${
        e.chairCount
      }`;
      rank++;
    });
    embed.setDescription(message);
    msg.reply({ embeds: [embed] });
    rank = 1;
    message = "";
  } else if (msgLowercase == "add") {
    const currentChannels = await channelsStore.get();
    await channelsStore.save([...currentChannels, msg.channel.id]);
    msg.reply("channel added ✅ ᶦ ᵗʰᶦⁿᵏ");
  } else if (msgLowercase == "remove") {
    const currentChannels = await channelsStore.get();
    const newChans = currentChannels.filter((val) => msg.channel.id !== val);
    await channelsStore.save(newChans);
    msg.reply("channel removed ✅ ᶦ ᵗʰᶦⁿᵏ");
  } else if (msgLowercase == "developer") {
    msg.reply("https://imgur.com/a/CGOkqSE");
  } else if (msgLowercase == "suggest") {
    const user = bot.users.cache.get("173569047684841472");
    user.send(
      "***from:*** " +
        msg.user.username +
        "#" +
        msg.user.discriminator +
        "\n```" +
        msg.options.data[0].value +
        "```"
    );
    msg.reply("suggestion sent ✅ ᶦ ᵗʰᶦⁿᵏ");
  } else if (msgLowercase == "debug") {
    const currentChannels = await channelsStore.get();
    msg.reply(
      "```" +
        currentChannels +
        "```" +
        `🏓 API Latency is ${Math.round(bot.ws.ping)}ms`
    );
  } else if (msgLowercase == "!commands" || msgLowercase == "!command") {
    msg.reply(
      "**!add\n!remove\n!about\n!suggest\n!uptime\n**i will make it look better later afjlafkkfds :char:"
    );
  } else if (msgLowercase == "about") {
    msg.reply({ embeds: [aboutEmbed] });
  } else if (msgLowercase == "uptime") {
    let days = Math.floor(bot.uptime / 86400000);
    let hours = Math.floor(bot.uptime / 3600000) % 24;
    let minutes = Math.floor(bot.uptime / 60000) % 60;
    let seconds = Math.floor(bot.uptime / 1000) % 60;

    const embed = new EmbedBuilder().setColor("#78d6ff").addFields({
      name: "**__uptime__**",
      value: `**days**: ${days} \n**hours**: ${hours} \n**minutes**: ${minutes} \n**seconds**: ${seconds}`,
    });

    msg.reply({ embeds: [embed] });
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
    url: "https://twitter.com/Salty_Mat",
  })
  .setTitle("About")
  .setThumbnail("https://imgur.com/ablIrp4.png")
  .addFields(
    { name: "Discord server", value: "coming soon" },
    { name: "Email", value: "chairbot.discord@gmail.com" },
    {
      name: `contact me`,
      value: `**twitter**: @Salty_Mat\n**Youtube**: Salty Mat\n**Discord**: Salt#0330 `,
    }
  )
  .setFooter({ text: "Chair bot was born at jun 10th 2020" });

bot.login(env.DISCORD_TOKEN);
