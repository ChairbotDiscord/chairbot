import { REST, Routes } from 'discord.js';

const commands = [
    {
        name: 'add',
        description: 'make it able to earn chairs from this channel',
        default_member_permissions: '3'
    },
    {
        name: "remove",
        description: "make this chnannel unable to earn chairs",
        default_member_permissions: '3'
    },
    {
        name: "count",
        description: "shows you the amount of chairs you have",
        options: [
            {
                name: "user",
                description: "get the chair count of another user" ,
                type: 6,
                required: false

            }
        ]
    },
    {
        name: "leaderboard",
        description: "check who has the most chairs and yes i finally fixed the spelling"
    },
    {
        name: "developer",
        description: "who made chairbot !!!!"
    },
    {
        name: "about",
        description: "about chairbot"
    },
    {
        name: "uptime",
        description: "how long chairbot has been online for"
    },
    {
        name: "debug",
        description: "wanna get info about chairbot?"
    },
    {
        name: "suggest",
        description: "suggest somthing new to the chiarbot devs",
        options:[
            {
                name: "suggestion",
                description: "the message to send to the devs",
                type: 3,
                required: true
            }
        ]
    }

];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

export async function startCommands(){
    try {
        console.log('Started refreshing application (/) commands.');
    
        await rest.put(Routes.applicationCommands(process.env.APP_ID), { body: commands });
    
        console.log('Successfully reloaded application (/) commands.');
      } catch (error) {
        console.error(error);
      }

}