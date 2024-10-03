import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, Client, Guild, IntentsBitField, ModalBuilder, PermissionsBitField, TextInputBuilder, TextInputStyle } from "discord.js";
import dotenv from "dotenv";
import { checkServerLink, getTwitters, makeServerLink } from "./utils";
import axios from "axios";

dotenv.config();

axios.defaults.validateStatus = (status: number) => {
    return true;
};
const client = new Client({ intents: [IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.GuildMembers, IntentsBitField.Flags.Guilds] });
const MINUTES_15 = 900000;
client.once("ready", () => {
    console.log(`logged in as ${client.user?.tag}`);
    setInterval(loop, MINUTES_15);
});

async function loop() {
    //await client.guilds.fetch();
    //client.guilds.cache.forEach(loadTwitters);
}
client.on("guildCreate", async (guild: Guild) => {
    try {
        const channel1 = await guild.channels.create({
            name: "xfollowx",
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionsBitField.Flags.SendMessages],
                    allow: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                    id: guild.client.user.id,
                    allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel]
                }
            ]
        });
        const channel2 = await guild.channels.create({
            name: 'xfollowx-admin',
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel]
                },
                {
                    id: guild.client.user.id, // Bot user ID
                    allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel] // Ensure bot can send and view
                }
            ],
        });
        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('server_link') // this is where users go to get their roles
                    .setLabel('Link to Server')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId("check_link_status")
                    .setLabel("Check Link Status")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("loop")
                    .setLabel("Reload User X Accounts")
                    .setStyle(ButtonStyle.Danger)
            );
        await channel2.send({
            content: 'Admin Page. Make sure to link your server to XFollowX.',
            // @ts-ignore
            components: [row2]
        });
    } catch (e) {
        console.error(e);
    }
});

async function loadTwitters(guild: Guild) {
    let channel: any = guild.channels.cache.find(channel => channel.name === "xfollowx");
    // If the channel doesn't exist, create it
    if (!channel) {
        channel = await guild.channels.create({
            name: "xfollowx",
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: guild.id, // Deny everyone
                    deny: ["SendMessages"],
                    allow: ["ViewChannel"]
                },
                {
                    id: guild.client.user.id, // Allow the bot to send messages
                    allow: ["SendMessages", "ViewChannel"]
                }
            ]
        });
    }
    await guild.members.fetch();
    const memberIds = guild.members.cache.map(member => member.id);
    const data = await getTwitters(memberIds, guild.id);

    if (!data.length) return data;
    for (const user of data) {
        const rows = [];
        let messageContent = `Discord name: ${user.discordName}\n`;
        const twitterButton = new ButtonBuilder()
            .setLabel(`Go to ${user.twitter}`)
            .setStyle(ButtonStyle.Link)
            .setURL(`https://x.com/${user.twitter}`);
        const row = new ActionRowBuilder().addComponents(twitterButton);
        rows.push(row);

        await channel.send({
            content: messageContent,
            components: rows
        });
    }
    return data.length;
}
client.on("interactionCreate", async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === "check_link_status") {
            const result = await checkServerLink(interaction.guild!.id);
            if (result) {
                await interaction.reply({ content: `Successfully linked to ${result.id}`, ephemeral: true });
            } else {
                await interaction.reply({ content: "Server not linked", ephemeral: true });
            }
        } else if (interaction.customId === 'server_link') {
            const modal = new ModalBuilder()
                .setCustomId('server_link_form')
                .setTitle('Verification Form')
                .addComponents(
                    // @ts-ignore
                    [new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('server_link_text_input')
                            .setLabel('Enter your Lens project ID')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )]
                );
            await interaction.showModal(modal);
        } else if (interaction.customId === "loop") {

            const amount = await loadTwitters(interaction.guild);
            if (Number.isNaN(Number(amount))) {
                await interaction.reply({ content: `${amount.error}` || "Completed", ephemeral: true });
            } else {
                await interaction.reply({ content: `Loaded ${amount} twitters`, ephemeral: true });
            }
        }
    } else if (interaction.isModalSubmit() && interaction.customId === "server_link_form") {
        const input = interaction.fields.getTextInputValue("server_link_text_input");
        const status = await makeServerLink(interaction.guild!.id, interaction.user.id, input);
        if (status) {
            await interaction.reply({ content: "Link success!", ephemeral: true });
        } else {
            await interaction.reply({ content: `Link Failure...`, ephemeral: true });
        }
    }
});


client.login(process.env.DISCORD_BOT_TOKEN);