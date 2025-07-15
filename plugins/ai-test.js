const config = require('../config');
const { cmd } = require('../command');
const DY_SCRAP = require('@dark-yasiya/scrap');
const dy_scrap = new DY_SCRAP();

function replaceYouTubeID(url) {
    const regex = /(?:youtube\.com\/(?:.*v=|.*\/)|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

cmd({
    pattern: "ytmp4",
    alias: ["mp3", "mp4", "ytmp3"],
    react: "🎬",
    desc: "Download YouTube audio/video",
    category: "download",
    use: ".play <Text or YT URL>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return await reply("❌ Please provide a Query or Youtube URL!");

        let id = q.startsWith("https://") ? replaceYouTubeID(q) : null;

        if (!id) {
            const searchResults = await dy_scrap.ytsearch(q);
            if (!searchResults?.results?.length) return await reply("❌ No results found!");
            id = searchResults.results[0].videoId;
        }

        const data = await dy_scrap.ytsearch(`https://youtube.com/watch?v=${id}`);
        if (!data?.results?.length) return await reply("❌ Failed to fetch video!");

        const { url, title, image, timestamp, ago, views, author } = data.results[0];

        // Beautiful ASCII art design
        const info = `
╔════════════════════════════╗
║    🎬 *MEDIA DOWNLOADER*   ║
╚════════════════════════════╝

📌 *Title:* ${title || "Unknown"}
⏱ *Duration:* ${timestamp || "Unknown"}
👁 *Views:* ${views || "Unknown"}
📅 *Uploaded:* ${ago || "Unknown"}
👤 *Channel:* ${author?.name || "Unknown"}

🔗 *URL:* ${url || "Unknown"}

╔════════════════════════════╗
║    📥 *DOWNLOAD OPTIONS*   ║
╚════════════════════════════╝

1️⃣ *Audio (MP3)*
   ↳ 1.1 - Audio Message
   ↳ 1.2 - Audio File

2️⃣ *Video (MP4)*
   ↳ 2.1 - 360p
   ↳ 2.2 - 720p (HD)

Reply with your choice number (e.g., "1.1")

${config.FOOTER || "⚡ Powered by Erfan Ahmad"}
`.trim();

        const sentMsg = await conn.sendMessage(from, { 
            image: { url: image }, 
            caption: info 
        }, { quoted: mek });
        
        const messageID = sentMsg.key.id;
        await conn.sendMessage(from, { react: { text: '🎬', key: sentMsg.key } });

        // Listen for user reply
        const replyHandler = async (messageUpdate) => { 
            try {
                const mekInfo = messageUpdate?.messages[0];
                if (!mekInfo?.message) return;

                const messageType = mekInfo?.message?.conversation || mekInfo?.message?.extendedTextMessage?.text;
                const isReplyToSentMsg = mekInfo?.message?.extendedTextMessage?.contextInfo?.stanzaId === messageID;

                if (!isReplyToSentMsg) return;

                // Remove listener after first response
                conn.ev.off('messages.upsert', replyHandler);

                let userReply = messageType.trim();
                let msg;
                let type;
                let response;
                
                switch(userReply) {
                    case "1.1": // Audio message
                        msg = await conn.sendMessage(from, { text: "🔊 Converting to audio message..." }, { quoted: mek });
                        response = await dy_scrap.ytmp3(`https://youtube.com/watch?v=${id}`);
                        if (!response?.result?.download?.url) {
                            await reply("❌ Audio download failed!");
                            return;
                        }
                        type = { 
                            audio: { url: response.result.download.url }, 
                            mimetype: "audio/mpeg",
                            ptt: false
                        };
                        break;
                        
                    case "1.2": // Audio file
                        msg = await conn.sendMessage(from, { text: "📁 Preparing audio file..." }, { quoted: mek });
                        response = await dy_scrap.ytmp3(`https://youtube.com/watch?v=${id}`);
                        if (!response?.result?.download?.url) {
                            await reply("❌ Audio download failed!");
                            return;
                        }
                        type = { 
                            document: { url: response.result.download.url }, 
                            fileName: `${title}.mp3`, 
                            mimetype: "audio/mpeg", 
                            caption: `🎵 *${title}*\n\n📁 Format: MP3\n🎤 Channel: ${author?.name || "Unknown"}`
                        };
                        break;
                        
                    case "2.1": // Video 360p
                        msg = await conn.sendMessage(from, { text: "📹 Downloading 360p video..." }, { quoted: mek });
                        response = await dy_scrap.ytmp4(`https://youtube.com/watch?v=${id}`);
                        if (!response?.result?.download?.url) {
                            await reply("❌ Video download failed!");
                            return;
                        }
                        type = { 
                            video: { url: response.result.download.url }, 
                            caption: `🎬 *${title}*\n\n📁 Format: MP4 (360p)\n🎥 Channel: ${author?.name || "Unknown"}`,
                            mimetype: "video/mp4"
                        };
                        break;
                        
                    case "2.2": // Video 720p
                        msg = await conn.sendMessage(from, { text: "📹 Downloading HD video..." }, { quoted: mek });
                        response = await dy_scrap.ytmp4(`https://youtube.com/watch?v=${id}`, { quality: "720" });
                        if (!response?.result?.download?.url) {
                            await reply("❌ HD video download failed!");
                            return;
                        }
                        type = { 
                            video: { url: response.result.download.url }, 
                            caption: `🎬 *${title}*\n\n📁 Format: MP4 (720p HD)\n🎥 Channel: ${author?.name || "Unknown"}`,
                            mimetype: "video/mp4"
                        };
                        break;
                        
                    default:
                        return await reply("❌ Invalid choice! Please reply with 1.1, 1.2, 2.1, or 2.2");
                }

                await conn.sendMessage(from, type, { quoted: mek });
                await conn.sendMessage(from, { 
                    text: '✅ Download Complete!\n\nEnjoy your media! 🎉', 
                    edit: msg.key 
                });

            } catch (error) {
                console.error(error);
                await reply(`❌ *Error:* ${error.message || "Processing failed"}`);
            }
        };

        // Set up listener with timeout
        conn.ev.on('messages.upsert', replyHandler);
        
        // Auto-remove listener after 2 minutes
        setTimeout(() => {
            conn.ev.off('messages.upsert', replyHandler);
        }, 120000);

    } catch (error) {
        console.error(error);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(`❌ *Error:* ${error.message || "Failed to process request"}`);
    }
});
