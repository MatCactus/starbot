import { Message } from "discord.js";

export interface dbFile {
    guilds: { name: string; guildId: string; commands?: string[] }[]; // All Auth Guilds Id with there attributed commands
    vote: {
        interactionId: string;
        message: Message;
        authorId: string;
        votes: { userId: string; vote: "negative" | "positive" }[];
    }[];
}
