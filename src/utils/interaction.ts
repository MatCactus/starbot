import {
    AwaitMessageComponentOptions,
    AwaitMessagesOptions,
    CacheType,
    DMChannel,
    Message,
    MessageComponentCollectorOptions,
    MessageComponentInteraction,
    MessageOptions,
    NewsChannel,
    PartialDMChannel,
    TextChannel,
    ThreadChannel,
} from "discord.js";

export const createInteraction = async (
    payload: MessageOptions,
    options: {
        type: "message" | "component";
    },
    channel:
        | NewsChannel
        | DMChannel
        | PartialDMChannel
        | TextChannel
        | ThreadChannel,
    collectorOptions?: AwaitMessageComponentOptions<
        MessageComponentInteraction<CacheType>
    >,
    messageCollectorOptions?: AwaitMessagesOptions
): Promise<{
    message: Message;
    component?: string[];
    resMessage?: Message[];
}> => {
    const componentRes: string[] = [];
    const messageRes: Message[] = [];

    const msg = await channel
        .send(payload)
        .catch(e => console.error("Interaction Utils Error :", e))
        .then(e => e);

    if (!msg) throw new Error("An error occured when trying to send");

    if (options.type === "component" && collectorOptions) {
        await msg.channel
            .awaitMessageComponent(collectorOptions)
            .then(collected => componentRes.push(collected.customId))
            .catch(() => new Error("Error: Collector Initialisation Error"));
    }

    if (options.type === "message" && messageCollectorOptions)
        await msg.channel
            .awaitMessages(messageCollectorOptions)
            .then(collected => collected.forEach(e => messageRes.push(e)))
            .catch(() => new Error("Error: Collector Initialisation Error"));

    return { message: msg, component: componentRes, resMessage: messageRes };
};
