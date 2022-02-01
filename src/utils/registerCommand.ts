import { ApplicationCommandDataResolvable } from "discord.js";
import { client } from "..";

export const createCommand = (
    command: ApplicationCommandDataResolvable,
    guildID?: string
) => client.application?.commands.create(command, guildID);
