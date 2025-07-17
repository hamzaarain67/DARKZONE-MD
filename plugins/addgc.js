const { cmd } = require('../command');
const config = require('../config');
const axios = require('axios');
const { google } = require('googleapis');

// Google OAuth2 Setup (for Blogger API)
const blogger = google.blogger({
  version: 'v3',
  auth: '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' // Your client secret
});

const BLOG_ID = 'https://erfan-tech.blogspot.com'; // Replace with your Blogger Blog ID
const BOT_OWNER = 'ERFAN AHMAD'; // Your name
const BOT_NUMBER = '923306137477'; // Your number

cmd({
    pattern: "gc",
    alias: ["groups", "listgc"],
    desc: "Show all groups from website",
    category: "website",
    react: "📌",
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    try {
        // Fetch posts from Blogger (assuming each post is a group entry)
        const res = await blogger.posts.list({
            blogId: BLOG_ID,
            fetchBodies: true,
            fetchImages: false
        });

        if (!res.data.items || res.data.items.length === 0) {
            return await reply("❌ No groups found on the website yet!");
        }

        // Format groups data
        let message = `╭───「 📌 *GROUP LIST* 📌 」───\n│\n│ *Bot Owner:* ${BOT_OWNER}\n│ *Contact:* ${BOT_NUMBER}\n│\n`;

        res.data.items.forEach((post, index) => {
            const groupData = post.content.split('\n').reduce((acc, line) => {
                const [key, value] = line.split(': ');
                if (key && value) acc[key] = value;
                return acc;
            }, {});

            message += `│ *${index + 1}. ${post.title}*\n`;
            message += `│ 🏷️ Category: ${groupData.Category || 'General'}\n`;
            message += `│ 👥 Admin: ${groupData.Admin || 'Not specified'}\n`;
            message += `│ 🔗 Link: ${groupData.Link || 'No link'}\n│\n`;
        });

        message += `╰─────────────────────\n\nUse *${config.PREFIX}addgc* to add your group!`;

        await reply(message);

    } catch (e) {
        console.error("GC Error:", e);
        await reply("❌ Error fetching groups. Please try again later.");
    }
});

cmd({
    pattern: "addgc",
    alias: ["addgroup"],
    desc: "Add a group to website",
    category: "website",
    react: "➕",
    filename: __filename,
    usage: `${config.PREFIX}addgc group_name, group_link, category, admin_number`
}, async (conn, mek, m, { from, sender, reply, args }) => {
    try {
        const [name, link, category, admin] = args.join(' ').split(',').map(i => i.trim());
        
        if (!name || !link || !category || !admin) {
            return await reply(`❌ Invalid format! Use:\n${config.PREFIX}addgc Name, Link, Category, AdminNumber`);
        }

        if (!link.includes('chat.whatsapp.com')) {
            return await reply("❌ Invalid WhatsApp link! Must contain 'chat.whatsapp.com'");
        }

        // Create post content structure
        const content = [
            `Category: ${category}`,
            `Admin: ${admin}`,
            `Link: ${link}`,
            `AddedBy: ${sender.split('@')[0]}`,
            `Date: ${new Date().toLocaleString()}`
        ].join('\n');

        // Create new Blogger post (group entry)
        await blogger.posts.insert({
            blogId: BLOG_ID,
            requestBody: {
                title: name,
                content: content,
                labels: [category, 'whatsapp-group']
            }
        });

        await reply(`✅ *${name}* added successfully under *${category}*!`);

    } catch (e) {
        console.error("AddGC Error:", e);
        await reply("❌ Failed to add group. Is the API configured properly?");
    }
});
