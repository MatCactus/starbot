import { Message } from "discord.js";
import { client } from "..";

export const loadMessage = (
    url?: string,
    ids?: { guildId: string; channelId: string; messageId: string }
): Message => {
    if (!url && !ids) throw new Error("Mess Loader : No argument specified");

    const args = url
        ? url.replace("https://discord.com/channels/", "").split("/")
        : ([ids?.guildId, ids?.channelId, ids?.messageId] as [
              string,
              string,
              string
          ]);

    const guild = client.guilds.resolve(args[0]);

    if (!guild)
        throw new Error(
            `Mess Loader : Invalid Guild ID, Check i'm on (${args[0]})`
        );

    const channel = guild.channels.resolve(args[1]);

    if (!channel || (!channel.isText() && !channel.isThread()))
        throw new Error(
            `Mess Loader : Invalid Channel ID, Check if i can read in (${args[1]})`
        );

    const message = channel.messages.resolve(args[2]);

    if (!message) throw new Error(`Mess Loader : Invalid Message ID..`);

    return message;
};
