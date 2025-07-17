const config = require('../config');
const { cmd, commands } = require('../command');
const { getBuffer, reply, fetchJson } = require('../lib/functions');
const yts = require('yt-search');
const fs = require('fs-extra');

cmd({
    pattern: "yts",
    alias: ["ytsearch", "youtubesearch"],
    use: '.yts <query>',
    react: "🔎",
    desc: "Search and get details from YouTube",
    category: "search",
    filename: __filename
}, async (conn, mek, m, { from, l, quoted, body, isCmd, args, q, isGroup, pushname, reply }) => {
    try {
        // Check if query is provided
        if (!q) return await reply('❌ Please provide a search query\nExample: .yts DARKZONE-MD bot');

        // Show typing indicator
        await conn.sendPresenceUpdate('composing', from);

        // Search YouTube
        const searchResults = await yts(q);
        
        // Check if results were found
        if (!searchResults.all || searchResults.all.length === 0) {
            return await reply('🔍 No results found for your search query.');
        }

        // Format results with emojis and better structure
        let resultMessage = `*📺 YouTube Search Results for "${q}"*\n\n`;
        let counter = 1;
        
        // Limit to top 10 results
        const topResults = searchResults.all.slice(0, 10);
        
        topResults.forEach((video) => {
            if (video.type === 'video') {
                resultMessage += 
                    `*${counter}. ${video.title}*\n` +
                    `⏱️ Duration: ${video.timestamp}\n` +
                    `👀 Views: ${video.views}\n` +
                    `📅 Uploaded: ${video.ago}\n` +
                    `🔗 URL: ${video.url}\n\n`;
                counter++;
            }
        });

        // Add footer with bot name
        resultMessage += `\n*🔎 Powered by DARKZONE-MD*`;

        // Send results with thumbnail if available
        if (topResults[0]?.thumbnail) {
            await conn.sendMessage(from, {
                image: { url: topResults[0].thumbnail },
                caption: resultMessage
            }, { quoted: mek });
        } else {
            await reply(resultMessage);
        }

    } catch (error) {
        console.error('YouTube Search Error:', error);
        await reply('❌ An error occurred while searching YouTube. Please try again later.');
    }
});
