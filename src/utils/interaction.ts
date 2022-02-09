import {
    AwaitMessageComponentOptions,
    AwaitMessagesOptions,
    CacheType,
    Collection,
    DMChannel,
    Message,
    MessageComponentInteraction,
    MessageOptions,
    NewsChannel,
    PartialDMChannel,
    TextChannel,
    ThreadChannel,
} from "discord.js";

// export const createInteraction = async (
//     payload: MessageOptions,
//     options: {
//         type: "message" | "component";
//     },
//     channel:
//         | NewsChannel
//         | DMChannel
//         | PartialDMChannel
//         | TextChannel
//         | ThreadChannel,
//     collectorOptions?: AwaitMessageComponentOptions<
//         MessageComponentInteraction<CacheType>
//     >,
//     messageCollectorOptions?: AwaitMessagesOptions
// ): Promise<{
//     message: Message;
//     component?: string[];
//     resMessage?: Message[];
// }> => {
//     const componentRes: string[] = [];
//     const messageRes: Message[] = [];

//     const msg = await channel
//         .send(payload)
//         .catch(e => {
//             throw new Error(e);
//         })
//         .then(e => e);

//     if (options.type === "component" && collectorOptions) {
//         await msg.channel
//             .awaitMessageComponent(collectorOptions)
//             .then(collected => componentRes.push(collected.customId))
//             .catch(() => {
//                 throw new Error("Error: Collector Initialisation Error");
//             });
//     }

//     if (options.type === "message" && messageCollectorOptions)
//         await msg.channel
//             .awaitMessages(messageCollectorOptions)
//             .then(collected => collected.forEach(e => messageRes.push(e)))
//             .catch(() => {
//                 throw new Error("Error: Collector Initialisation Error");
//             });

//     return { message: msg, component: componentRes, resMessage: messageRes };
// };

export const createComponentInteractionHandler = async (
    payload: MessageOptions,
    channel:
        | NewsChannel
        | DMChannel
        | PartialDMChannel
        | TextChannel
        | ThreadChannel,
    replyCollectorOptions: AwaitMessageComponentOptions<
        MessageComponentInteraction<CacheType>
    >
): Promise<{ message: Message; resComponent: string }> => {
    const msg = await channel
        .send(payload)
        .then(e => e)
        .catch(e => {
            throw new Error(e);
        });

    const collector = await msg.channel
        .awaitMessageComponent(replyCollectorOptions)
        .then(collected => collected.customId)
        .catch(() => {
            throw new Error("Error: Collector Initialisation Error");
        });

    await msg.edit({ components: [] });

    return { message: msg, resComponent: collector };
};

export const createReplyHandler = async (
    payload: MessageOptions,
    channel:
        | NewsChannel
        | DMChannel
        | PartialDMChannel
        | TextChannel
        | ThreadChannel,
    replyMessageOptions: AwaitMessagesOptions
): Promise<{
    message: Message;
    resMessage?: Collection<string, Message<boolean>>;
}> => {
    const msg = await channel
        .send(payload)
        .catch(e => {
            throw new Error(e);
        })
        .then(e => e);

    const collector = await msg.channel
        .awaitMessages(replyMessageOptions)
        .then(collected => collected)
        .catch(e => {
            throw new Error(e);
        });

    return { message: msg, resMessage: collector };
};
