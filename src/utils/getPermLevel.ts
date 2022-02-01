import { ReactionUserManager } from "discord.js";
import { client } from "..";
require("dotenv").config();

export const getPermLevel = (userID: string): number => {
    const guild = client.guilds.resolve(process.env.GUILDID as string);
    const member = guild?.members.resolve(userID);
    if (!member) return 0;

    if (member.roles.cache.some(e => e.id in ["935979760696315944"])) return 5;
    if (
        member.roles.cache.some(
            e =>
                e.id in
                [
                    "936536108085432341",
                    "935980565650350150",
                    "935980328034648075",
                    "935979989776625704",
                ]
        )
    )
        return 4;
    if (member.roles.cache.some(e => e.id in ["935981465387298887"])) return 3;
    if (member.roles.cache.some(e => e.id in ["936542338594000906"])) return 2;
    if (member.roles.cache.some(e => e.id in ["935978727031058482"])) return 1;

    return 0;
};
