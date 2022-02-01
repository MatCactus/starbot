import {
    DMChannel,
    Message,
    MessageActionRow,
    MessageButton,
    MessageEmbed,
    StoreChannel,
    TextChannel,
} from "discord.js";
import { client } from "..";
import { data } from "../utils/dbFileManager";
import { createInteraction } from "../utils/interaction";
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

client.on("interactionCreate", async interaction => {
    if (
        !interaction.isApplicationCommand() ||
        interaction.commandName !== "vote" ||
        !interaction.channel
    )
        return;

    const userDM: DMChannel = await interaction.user.createDM();

    await interaction.reply({
        ephemeral: true,
        content: `Viens par ici => ${client.user}`,
    });

    const checkVoteMessage = (await createInteraction(
        {
            embeds: [
                {
                    color: "DARK_BUT_NOT_BLACK",
                    description:
                        "Réponds à ce message avec ce que tu souhaites passer au vote. Images, liens, tout est accepté.",
                },
            ],
        },
        { type: "message" },
        userDM,
        undefined,
        {
            filter: e => e.author.id === interaction.user.id,
            max: 1,
            time: 1000 * 60 * 10,
        }
    )) as {
        message: Message;
        component?: string[];
        resMessage?: Message[];
    };

    if (!checkVoteMessage.resMessage) return;

    const embed = new MessageEmbed()
        .setTitle(`${interaction.user.tag}・ À vos Votes !!`)
        .setDescription(checkVoteMessage.resMessage[0].content)
        .setTimestamp();

    if (checkVoteMessage.resMessage[0].attachments)
        embed.setImage(
            checkVoteMessage.resMessage[0].attachments.first()?.url ?? ""
        );

    const displayEmbed = await createInteraction(
        {
            embeds: [embed],
            components: [
                new MessageActionRow().addComponents(
                    new MessageButton()
                        .setCustomId("vote_valid")
                        .setStyle("SUCCESS")
                        .setEmoji("📨")
                        .setLabel("Envoyer")
                ),
            ],
        },
        { type: "component" },
        userDM,
        {
            filter: e => e.customId === "vote_valid",
            time: 1000 * 60 * 10,
        }
    );

    if (!displayEmbed.component) return;
    const voteMessage = await interaction.channel.send({
        embeds: [embed],
        components: [
            new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId(`vote_negative_${interaction.id}`)
                    .setStyle("DANGER")
                    .setEmoji("❌")
                    .setLabel("Vote Contre"),
                new MessageButton()
                    .setCustomId(`vote_positive_${interaction.id}`)
                    .setStyle("SUCCESS")
                    .setEmoji("✔")
                    .setLabel("Vote Pour"),
                new MessageButton()
                    .setCustomId(`vote_end_${interaction.id}`)
                    .setStyle("PRIMARY")
                    .setEmoji("⏰")
                    .setLabel("Fin du Débat")
            ),
        ],
    });
    data.vote.push({
        authorId: interaction.user.id,
        interactionId: interaction.id,
        message: voteMessage,
        votes: [],
    });
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isButton() || !interaction.customId.startsWith("vote_"))
        return;

    const [type, interactionId] = interaction.customId
        .replace("vote_", "")
        .split("_") as ["negative" | "positive" | "end", string];

    if (type === "end") {
        if (
            data.vote.find(e => e.interactionId === interactionId)?.votes
                .length ??
            0 > 0
        ) {
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

            await (
                (
                    client.channels.resolve(
                        results.message.channelId
                    ) as TextChannel
                ).messages.resolve(results.message.id) as Message
            )
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
                                )
                        ),
                    ],
                })
                .catch(e => console.error(e));
            await client.users
                .resolve(results.authorId)
                ?.send({ embeds: [Embed] });
            interaction.reply({
                ephemeral: true,
                content: "Les résultats viennent d'être partagé !",
            });
        } else
            return interaction.reply({
                ephemeral: true,
                content: "Personne n'a encore voté ..",
            });
    } else if (type === "positive" || type === "negative") {
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
                content: "Votre changement vient bien d'être prise en compte !",
            });
        }

        results.votes.push({ userId: interaction.user.id, vote: type });
        return interaction.reply({
            ephemeral: true,
            content: "Votre vote à bien été prit en compte !",
        });
    }
});
