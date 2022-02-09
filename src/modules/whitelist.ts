import { serialize } from "v8";
import { client } from "..";
import { data } from "../utils/dbFileManager";
import { getPermLevel } from "../utils/getPermLevel";
import { createCommand } from "../utils/registerCommand";

// wlCommand Function who called
const wlCommand = (
    guilds: {
        name: string;
        guildId: string;
        commands?: string[] | undefined;
    }[] = data.guilds
) =>
    guilds
        .filter(e => e.commands?.some(e => e === "wl")) // Récupère les IDs de Guild pour lesquels le Module est noté comme à installé dans le Fichier db.json
        .forEach(e =>
            // Ajoute l'intéraction pour tous les Serveurs Sélectionnés par le Filtre
            createCommand(
                {
                    name: "Gérer la WL",
                    type: "USER",
                },
                e.guildId
            )
        );
wlCommand(); // Appel la Fonction d'initialisation de l'intéraction

client.on("interactionCreate", async interaction => {
    // Créer un Event Handler pour les Créations d'Intéraction en tout genre
    if (
        !interaction.isApplicationCommand() || // Stop tout si ce n'est pas une Commande ou si ce n'est pas la bonne
        interaction.commandName !== "Gérer la WL" ||
        !interaction.guild
    )
        return;

    if (getPermLevel(interaction.user.id) < 1)
        // Vérif si la Personne à les Perm de le faire sinon c'est Ciao ;)
        return interaction.reply({
            ephemeral: true,
            content:
                "Tu n'as pas la Permission de Gérer la WL d'un Membre de ce Serveur .. Si c'est une erreur, n'hésites pas à faire un Ticket",
        });

    // Je te laisse faire le Reste ici ou sous une fonction plus bas ;) Call moi si t'as un pb

    const user = interaction.options.data[0].user; // Getif (!user) return;
    if (!user) return;
    const member = interaction.guild.members.resolve(user.id);
    if (!member) return;

    const roleId = "937141114333454376";

    let message = "";

    if (!member.roles.resolve(roleId))
        await member.roles
            .add(roleId)
            .then(e => (message = `${member} à bien été ajouté à la WL !`))
            .catch(
                e =>
                    (message = `Une erreur est survenue lors de l'ajout de ${member} à la WL !`)
            );
    else
        await member.roles
            .remove(roleId)
            .then(e => (message = `${member} à bien été retiré à la WL !`))
            .catch(
                e =>
                    (message = `Une erreur est survenue lors du retrait de la WL à ${member} !`)
            );

    interaction.reply({
        ephemeral: true,
        content: message,
    });
});
