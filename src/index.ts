import * as Discord from "discord.js";
import { data } from "./utils/dbFileManager";
require("dotenv").config();
require("./utils/dbFileManager");

import * as fs from "fs";

export const client = new Discord.Client({
    intents: [
        "GUILDS",
        "DIRECT_MESSAGES",
        "GUILD_MESSAGES",
        "GUILD_MESSAGE_REACTIONS",
        "DIRECT_MESSAGE_REACTIONS",
    ],
});

client.once("ready", async () => {
    console.log(`Client logged as ${client.user?.tag}`);
    client.user?.setPresence({
        activities: [
            {
                name: "l'équipe s'occuper de moi",
                type: "WATCHING",
            },
        ],
    });

    const modules = await fs.promises.readdir(`${__dirname}/modules`);
    modules.forEach(e => require(`${__dirname}/modules/${e}`));
    console.log("I'm ready to be Abused");
});

client.login(process.env.TOKEN);
