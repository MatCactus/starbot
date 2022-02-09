// import { client } from "..";
// import { data } from "../utils/dbFileManager";
// import { createInteraction } from "../utils/interaction";
// import { createCommand } from "../utils/registerCommand";

// const configCommand = (
//     guilds: {
//         name: string;
//         guildId: string;
//         commands?: string[] | undefined;
//     }[] = data.guilds
// ) =>
//     guilds
//         .filter(e => e.commands?.some(e => e === "config"))
//         .forEach(e =>
//             createCommand(
//                 {
//                     name: "config",
//                     description: "Configure Moi",
//                     type: "CHAT_INPUT",
//                 },
//                 e.guildId
//             )
//         );
// configCommand();

// client.on("interactionCreate", async interaction => {
//     if (!interaction.isCommand() || interaction.commandName !== "config")
//         return;
// });
