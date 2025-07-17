////
const { cmd } = require('../command');
const config = require('../config');
const axios = require('axios');

// Blogger API configuration
const BLOGGER_API_KEY = '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'; // Replace with your actual API key
const BLOGGER_URL = 'https://erfan-tech.blogspot.com';

cmd({
    pattern: "gc",
    alias: ["gc", "groups", "groupcategories"],
    desc: "Show all bot groups from website",
    category: "website",
    react: "📌",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
    try {
        // Fetch groups from Blogger API
        const response = await axios.get(`${BLOGGER_URL}/api/groups?key=${BLOGGER_API_KEY}`);
        const groups = response.data;
        
        if (!groups || groups.length === 0) {
            return await reply("No groups found on the website.");
        }

        // Format groups by category
        const categories = {};
        groups.forEach(group => {
            if (!categories[group.category]) {
                categories[group.category] = [];
            }
            categories[group.category].push(group);
        });

        // Create formatted message
        let message = `╭───「 📌 *GROUP CATEGORIES* 📌 」───\n│\n`;
        
        for (const [category, groupList] of Object.entries(categories)) {
            message += `│ *${category.toUpperCase()}*\n`;
            groupList.forEach((group, index) => {
                message += `│ ${index + 1}. ${group.name}\n`;
                message += `│    🔗 ${group.link}\n`;
            });
            message += `│\n`;
        }
        
        message += `╰─────────────────────\n\nUse *.addgc* to add your group to our website!`;

        await reply(message);

    } catch (e) {
        console.error("GC Command Error:", e);
        await reply("❌ Failed to fetch groups from website. Please try again later.");
    }
});

cmd({
    pattern: "addgc",
    alias: ["addgroup", "addtosite"],
    desc: "Add group to website",
    category: "website",
    react: "➕",
    filename: __filename,
    usage: ".addgc group_name, group_link, category, admin_number"
},
async (conn, mek, m, { from, sender, reply, args }) => {
    try {
        // Parse input
        const [groupName, groupLink, category, adminNumber] = args.join(" ").split(",").map(item => item.trim());
        
        if (!groupName || !groupLink || !category || !adminNumber) {
            return await reply("❌ Please provide all required details:\n.addgc group_name, group_link, category, admin_number");
        }

        // Validate WhatsApp group link
        if (!groupLink.includes("chat.whatsapp.com")) {
            return await reply("❌ Invalid WhatsApp group link. It should contain 'chat.whatsapp.com'");
        }

        // Prepare data for API
        const groupData = {
            name: groupName,
            link: groupLink,
            category: category,
            admin: adminNumber,
            addedBy: sender.split("@")[0],
            timestamp: new Date().toISOString()
        };

        // Send data to Blogger API
        const response = await axios.post(`${BLOGGER_URL}/api/addgroup?key=${BLOGGER_API_KEY}`, groupData);
        
        if (response.data.success) {
            await reply(`✅ Group *${groupName}* added successfully to ${category} category!`);
        } else {
            await reply(`❌ Failed to add group: ${response.data.message || "Unknown error"}`);
        }

    } catch (e) {
        console.error("AddGC Command Error:", e);
        await reply("❌ Failed to add group. Please check your details and try again.");
    }
});
