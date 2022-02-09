import { client } from "..";
require("dotenv").config();

export const getPermLevel = (userID: string): number => {
    const guild = client.guilds.resolve(process.env.GUILDID as string);
    const member = guild?.members.resolve(userID);
    if (!member) return 0;
    if (member.roles.cache.some(e => e.id === "935979760696315944")) return 5; // Gérants
    if (
        member.roles.cache.some(e =>
            [
                "935979989776625704", // Resp. Staff
                "935980328034648075", // Resp. Dev
                "935980565650350150", // Administrateur
            ].includes(e.id)
        )
    )
        return 4;
    if (member.roles.cache.some(e => e.id === "935981465387298887")) return 3; // Modérateurs
    if (member.roles.cache.some(e => e.id === "936542338594000906")) return 2; // Douniers
    if (member.roles.cache.some(e => e.id === "935978727031058482")) return 1; // Citoyens

    return 0;
};
