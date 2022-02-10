import {
    BaseCommandInteraction,
    CacheType,
    Message,
    MessageActionRow,
    MessageButton,
    MessageEmbed,
} from "discord.js";
import { isStringObject } from "util/types";
import { client } from "..";
import { data } from "../utils/dbFileManager";
import { getPermLevel } from "../utils/getPermLevel";
import {
    createReplyHandler,
    createComponentInteractionHandler,
} from "../utils/interaction";
import { loadMessage } from "../utils/loadMessage";
import { createCommand } from "../utils/registerCommand";

const voteCommand = (
    guilds: {
        name: string;
        guildId: string;
        commands?: string[] | undefined;
    }[] = data.guilds
) =>
    guilds
        .filter(e => e.commands?.some(e => e === "vote"))
        .forEach(e =>
            createCommand(
                {
                    name: "vote",
                    description:
                        "Créé un vote pour mettre tout le monde d'accord !!",
                    type: "CHAT_INPUT",
                },
                e.guildId
            )
        );
voteCommand();

client.on("interactionCreate", interaction => {
    if (
        !interaction.isApplicationCommand() ||
        interaction.commandName !== "vote" ||
        !interaction.channel
    )
        return;

    createVote(interaction);

    interaction.deferReply();
});

const createVote = async (interaction: BaseCommandInteraction<CacheType>) => {
    const userDM = await interaction.user.createDM();

    const { message, resMessage } = await createReplyHandler(
        {
            embeds: [
                new MessageEmbed()
                    .setDescription(
                        `Je te laisse m'envoyer ici le contenu du Vote.\n *Tu peux utiliser les mises en forme Markdown. Tu peux également joindre une Image de tout type (GIF y comprit).*\n\nL'action se vera annulée dans 10 minutes si je n'ai recçu aucune réponse de ta part.`
                    )
                    .setColor("DARK_BUT_NOT_BLACK")
                    .setThumbnail(`${interaction.guild?.iconURL()}`)
                    .setTimestamp(),
            ],
        },
        userDM,
        {
            max: 1,
            time: 600000,
        }
    );

    if (!resMessage) return message.delete();
    const response = resMessage.first();
    if (!response) return message.delete();

    const voteEmbed = new MessageEmbed()
        .setDescription(response.content)
        .setTitle(`${interaction.user.tag}・Place au Vote !!`)
        .setTimestamp()
        .setColor("DARK_BUT_NOT_BLACK");

    if (isStringObject(response.attachments.first()?.id))
        voteEmbed.setImage(`${response.attachments.first()?.url}`);

    const componentHandler = await createComponentInteractionHandler(
        {
            embeds: [voteEmbed],
            reply: { messageReference: response },
            components: [
                new MessageActionRow().addComponents(
                    new MessageButton()
                        .setLabel("Envoyer")
                        .setCustomId(`vote_valid_${interaction.id}`)
                        .setStyle("SUCCESS")
                        .setEmoji("📨")
                ),
            ],
        },
        userDM,
        {
            time: 350000,
            componentType: "BUTTON",
            filter: e => e.customId.endsWith(interaction.id),
        }
    ).catch(e => {
        throw new Error(e);
    });

    const finalMessage = (await interaction.editReply({
        embeds: [voteEmbed],
        components: [
            new MessageActionRow().addComponents(
                new MessageButton()
                    .setLabel("Pour")
                    .setStyle("SUCCESS")
                    .setCustomId(`vote_positive_${interaction.id}`)
                    .setEmoji("✔"),
                new MessageButton()
                    .setLabel("Contre")
                    .setStyle("DANGER")
                    .setCustomId(`vote_negative_${interaction.id}`)
                    .setEmoji("❌"),
                new MessageButton()
                    .setLabel("Terminer le Vote")
                    .setStyle("SECONDARY")
                    .setCustomId(`vote_end_${interaction.id}`)
                    .setEmoji("⏰")
            ),
        ],
    })) as Message;

    data.vote.push({
        authorId: interaction.user.id,
        interactionId: interaction.id,
        message: finalMessage,
        votes: [],
    });
};

client.on("interactionCreate", async interaction => {
    if (
        !interaction.isButton() ||
        !interaction.customId.startsWith("vote_") ||
        !data.vote.some(e => interaction.customId.endsWith(e.interactionId)) ||
        !interaction.channel
    )
        return;

    const [_, type, interactionId] = interaction.customId.split("_") as [
        string,
        "positive" | "negative" | "end",
        string
    ];

    if (type === "end") {
        if (
            data.vote.some(
                e =>
                    e.interactionId === interactionId &&
                    (e.authorId === interaction.user.id ||
                        getPermLevel(interaction.user.id) >= 3)
            )
        ) {
            if (
                !(
                    data.vote.find(e => e.interactionId === interactionId)
                        ?.votes.length ?? 0 > 0
                )
            ) {
                const confirmation = await createComponentInteractionHandler(
                    {
                        content:
                            "Personne n'a encore voté, êtes vous sur de vouloir clore le vote ?",
                        components: [
                            new MessageActionRow().addComponents(
                                new MessageButton()
                                    .setLabel("Annuler")
                                    .setStyle("SUCCESS")
                                    .setCustomId(
                                        `${interaction.customId}_cancel`
                                    )
                                    .setEmoji("❌"),
                                new MessageButton()
                                    .setLabel("Continuer")
                                    .setStyle("DANGER")
                                    .setCustomId(
                                        `${interaction.customId}_confirm`
                                    )
                                    .setEmoji("✔")
                            ),
                        ],
                    },
                    interaction.channel,
                    {
                        time: 120000,
                        filter: e =>
                            e.user.id === interaction.user.id &&
                            (e.customId === `${interaction.customId}_cancel` ||
                                e.customId ===
                                    `${interaction.customId}_confirm`),
                    }
                );
                if (confirmation.resComponent.endsWith("_cancel")) {
                    await confirmation.message.delete();
                    return;
                }
            }

            const results = data.vote.splice(
                data.vote.findIndex(e => e.interactionId === interactionId),
                1
            )[0];
            const positive = results.votes.filter(e => e.vote === "positive");
            const negative = results.votes.filter(e => e.vote === "negative");

            let positiveMembers = "";
            positive.forEach(
                e => (positiveMembers += `${client.users.resolve(e.userId)}\n`)
            );
            let negativeMembers = "";
            negative.forEach(
                e => (negativeMembers += `${client.users.resolve(e.userId)}\n`)
            );

            const Embed = new MessageEmbed()
                .setTitle(`${interaction.user.tag}・ Résultats du Vote`)
                .setColor(positive.length > negative.length ? "GREEN" : "RED")
                .setDescription(
                    `Le vote vient d'être cloturé par ${
                        interaction.user.tag
                    }, merci d'avoir participé !!\n**Le résultat du vote est :** \`\` ${
                        positive.length > negative.length ? "Pour" : "Contre"
                    } \`\`\n> ${results.message.url}`
                )
                .addFields(
                    {
                        name: "Membres ayant voté pour :",
                        inline: false,
                        value:
                            positiveMembers !== ""
                                ? positiveMembers
                                : "Personne n'a voté pour",
                    },
                    {
                        name: "Membres ayant voté contre :",
                        value:
                            negativeMembers !== ""
                                ? negativeMembers
                                : "Personne n'a voté contre",
                        inline: false,
                    }
                )
                .setTimestamp();

            loadMessage(undefined, {
                messageId: results.message.id ?? "",
                channelId: results.message.channelId ?? "",
                guildId: results.message.guildId ?? "",
            })
                .edit({
                    components: [
                        new MessageActionRow().addComponents(
                            new MessageButton()
                                .setLabel(
                                    positive.length > negative.length
                                        ? `Approuvé à ${
                                              (positive.length /
                                                  (positive.length +
                                                      negative.length)) *
                                              100
                                          }%`
                                        : `Non Approuvé à ${
                                              (negative.length /
                                                  (negative.length +
                                                      positive.length)) *
                                              100
                                          }%`
                                )
                                .setDisabled(true)
                                .setCustomId(`vote_results_${interactionId}`)
                                .setStyle(
                                    positive.length > negative.length
                                        ? "SECONDARY"
                                        : "DANGER"
                                ),
                            new MessageButton()
                                .setLabel(`Clos par ${interaction.user.tag}`)
                                .setDisabled(true)
                                .setStyle("PRIMARY")
                                .setCustomId(
                                    `vote_results_author_${interactionId}`
                                )
                        ),
                    ],
                })
                .catch(e => {
                    throw new Error(e);
                });
            await client.users
                .resolve(results.authorId)
                ?.send({ embeds: [Embed] });
            return interaction.reply({
                ephemeral: true,
                content:
                    "Les résultats d'un de vos votes viennent d'être partagés !",
            });
        }
    }
    if (type === "positive" || type === "negative") {
        const results = data.vote.find(e => e.interactionId === interactionId);

        if (!results) return;
        if (results.votes.some(e => e.userId === interaction.user.id)) {
            (
                results.votes.find(e => e.userId === interaction.user.id) as {
                    userId: string;
                    vote: "negative" | "positive";
                }
            ).vote = type;
            return interaction.reply({
                ephemeral: true,
                content: "Votre changement vient bien d'être prit en compte !",
            });
        }

        results.votes.push({ userId: interaction.user.id, vote: type });
        return interaction.reply({
            ephemeral: true,
            content: "Votre vote a bien été prit en compte !",
        });
    }
});
