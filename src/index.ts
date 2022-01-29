import * as Discord from "discord.js";
require("dotenv").config();
import * as fs from "fs";

const client = new Discord.Client({ intents: ["GUILDS"] });

client.once("ready", () => {
    client.user?.setPresence({
        activities: [
            {
                name: "l'équipe s'occuper de moi",
                type: "WATCHING",
            },
        ],
    });
});

client.login(process.env.TOKEN);
