// WOODcraft https://github.com/SudoR2spr/Save-Restricted-Bot/

const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');
const express = require('express');
const pTimeout = require('p-timeout'); // Added p-timeout for managing timeouts
const app = express();

// Read configuration file content
fs.readFile(path.join(__dirname, 'config.json'), 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading config file:', err);
        return;
    }
    const config = JSON.parse(data);

const bot = new Telegraf(config.TOKEN);

let acc = null;
if (config.STRING) {
    try {
        acc = new Client({
            apiId: config.ID,
            apiHash: config.HASH,
            session: config.STRING
        });
    } catch (error) {
        console.error("Failed to initialize Client:", error);
    }
} else {
    console.warn("String session not provided; Client will not be initialized.");
}

    const USAGE = `
    〇 FOR PUBLIC CHATS
    Just send the post link.

    〇 FOR PRIVATE CHATS
    First, send the invite link of the chat (unnecessary if the account with the string session is already a member of the chat). 
    Then, send the post link.

    〇 FOR BOT CHATS
    Send a link with '/b/', the bot's username, and the message ID. You might want to install an unofficial client to get the ID, as shown below:
    
    ◉▷ https://t.me/b/botusername/4321

    〇 MULTI POSTS
    Send public/private post links as explained above in the format "from - to" to send multiple messages, as shown below:

    ◉▷ https://t.me/xxxx/1001-1010
    ◉▷ https://t.me/c/xxxx/101-120

    〇 Note that spaces between the numbers don't matter.
`;
    // Start command
    bot.start((ctx) => {
        ctx.replyWithPhoto(
            'https://i.ibb.co/4SGvDMj/WD-save.jpg', // WD Image link
            {
                caption: `👋 𝐇𝐢 ${ctx.message.from.first_name}, I am Save Restricted Bot, I can send you restricted content by its post link.\n\n\ᢵ⎔⎔⎔⎔⎔🦋⎔⎔⎔⎔⎔ᢶ\n\n${USAGE}`,
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "🌐 Source Code", url: "https://github.com/SudoR2spr/Save-Restricted-Bot/" }],
                        [{ text: "✨ Any Help? ✨", url: "https://t.me/+XfmrBSzTyRFlZTI9" }] // New button added
                    ]
                }
            }
        );
    });

    // Handle text messages
    bot.on('text', async (ctx) => {
        const message = ctx.message.text;

        if (message.includes("https://t.me/+") || message.includes("https://t.me/joinchat/")) {
            // Handle join chat links
            if (!acc) {
                ctx.reply("𝐒𝐭𝐫𝐢𝐧𝐠 𝐒𝐞𝐬𝐬𝐢𝐨𝐧 𝐢𝐬 𝐍𝐨 𝐒𝐞𝐭", { reply_to_message_id: ctx.message.message_id });
                return;
            }

            try {
                await acc.joinChat(message);
                ctx.reply("𝐂𝐡𝐚𝐭 𝐉𝐨𝐢𝐧𝐞𝐝 ✅", { reply_to_message_id: ctx.message.message_id });
            } catch (error) {
                ctx.reply(`𝐄𝐫𝐫𝐨𝐫: __${error.message}__`, { reply_to_message_id: ctx.message.message_id });
            }
        } else if (message.includes("https://t.me/")) {
            // Handle public/private messages
            const parts = message.split("/");
            const temp = parts[parts.length - 1].replace("?single", "").split("-");
            const fromID = parseInt(temp[0].trim());
            const toID = parseInt(temp[1]?.trim() || fromID);

            for (let msgID = fromID; msgID <= toID; msgID++) {
                if (message.includes("https://t.me/c/")) {
                    const chatid = parseInt("-100" + parts[4]);

                    if (!acc) {
                        ctx.reply("𝐒𝐭𝐫𝐢𝐧𝐠 𝐒𝐞𝐬𝐬𝐢𝐨𝐧 𝐢𝐬 𝐍𝐨 𝐒𝐞𝐭", { reply_to_message_id: ctx.message.message_id });
                        return;
                    }
                    await handlePrivate(ctx, chatid, msgID);
                } else if (message.includes("https://t.me/b/")) {
                    const username = parts[4];

                    if (!acc) {
                        ctx.reply("𝐒𝐭𝐫𝐢𝐧𝐠 𝐒𝐞𝐬𝐬𝐢𝐨𝐧 𝐢𝐬 𝐍𝐨 𝐒𝐞𝐭", { reply_to_message_id: ctx.message.message_id });
                        return;
                    }
                    await handlePrivate(ctx, username, msgID);
                } else {
                    const username = parts[3];

                    try {
                        const msg = await bot.telegram.getMessage(username, msgID);
                        await ctx.replyWithMessage(msg.chat.id, msg.id);
                    } catch (error) {
                        ctx.reply("𝐓𝐡𝐞 𝐔𝐬𝐞𝐫𝐧𝐚𝐦𝐞 𝐢𝐬 𝐍𝐨𝐭 𝐎𝐜𝐜𝐮𝐩𝐢𝐞𝐝 𝐛𝐲 𝐚𝐧𝐲𝐨𝐧𝐞", { reply_to_message_id: ctx.message.message_id });
                    }
                }

                // Wait time
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
    });

    // Fetch message with timeout handling
    const fetchMessageWithTimeout = async (ctx, chatId, msgId) => {
        try {
            return await pTimeout(acc.getMessage(chatId, msgId), 90000); // 90 seconds timeout
        } catch (error) {
            if (error instanceof pTimeout.TimeoutError) {
                ctx.reply('Request timed out. Please try again later.', { reply_to_message_id: ctx.message.message_id });
            } else {
                ctx.reply(`𝐄𝐫𝐫𝐨𝐫: __${error.message}__`, { reply_to_message_id: ctx.message.message_id });
            }
        }
    };

    // Handle private messages with timeout
    async function handlePrivate(ctx, chatId, msgId) {
        try {
            const msg = await fetchMessageWithTimeout(ctx, chatId, msgId);
            if (!msg) return;  // If timed out or failed

            const msgType = getMessageType(msg);
            const file = await acc.downloadMedia(msg);

            if (msgType === "document") {
                await ctx.replyWithDocument({ source: file });
            } else if (msgType === "video") {
                await ctx.replyWithVideo({ source: file });
            } else if (msgType === "animation") {
                await ctx.replyWithAnimation({ source: file });
            } else if (msgType === "sticker") {
                await ctx.replyWithSticker({ source: file });
            } else if (msgType === "voice") {
                await ctx.replyWithVoice({ source: file });
            } else if (msgType === "audio") {
                await ctx.replyWithAudio({ source: file });
            } else if (msgType === "photo") {
                await ctx.replyWithPhoto({ source: file });
            } else if (msgType === "text") {
                await ctx.reply(msg.text);
            }

            fs.unlinkSync(file);  // Remove file after sending
        } catch (error) {
            ctx.reply(`**Error**: __${error.message}__`, { reply_to_message_id: ctx.message.message_id });
        }
    }

    // Get the type of message
    function getMessageType(msg) {
        if (msg.document) return "document";
        if (msg.video) return "video";
        if (msg.animation) return "animation";
        if (msg.sticker) return "sticker";
        if (msg.voice) return "voice";
        if (msg.audio) return "audio";
        if (msg.photo) return "photo";
        if (msg.text) return "text";
    }

    app.listen(config.PORT, () => {
        console.log(`Server is running on port ${config.PORT}`);
    });

    app.get('/', (req, res) => {
        res.send('বট চালু আছে!');
    });

    // Start bot
    bot.launch();
});
                          
