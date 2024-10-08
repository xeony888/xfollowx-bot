import axios from "axios";


export async function makeServerLink(guildId: string, userId: string, serverId: string, guildName: string) {
    const response = await axios.post(`${process.env.SERVER_URL}/bot/link?key=${process.env.DISCORD_BOT_TOKEN}`, {
        guildId,
        userId,
        serverId,
        guildName,
    });
    if (response.status === 200) {
        return true;
    } else {
        return false;
    }
}

export async function checkServerLink(guildId: string) {
    const response = await axios.get(`${process.env.SERVER_URL}/bot/link?key=${process.env.DISCORD_BOT_TOKEN}&guildId=${guildId}`);
    if (response.status === 200) {
        return response.data;
    } else {
        return undefined;
    }
}
export async function getTwitters(memberIds: string[], guildId: string) {
    const response = await axios.get(`${process.env.SERVER_URL}/bot/twitters?key=${process.env.DISCORD_BOT_TOKEN}&memberIds=${memberIds}&guildId=${guildId}`);
    return response.data;
}
export async function getFollowed(userId: string) {
    const response = await axios.get(`${process.env.SERVER_URL}/bot/${userId}/followed?key=${process.env.DISCORD_BOT_TOKEN}`);
    return response.data;
}