const { cmd } = require('../command');
const config = require('../config');
const axios = require('axios');

// Google Sheets Setup (Easier than Blogger API)
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID'; // Replace this
const SHEET_NAME = 'Groups';
const API_KEY = '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'; // Your existing key

cmd({
    pattern: "gc",
    desc: "List all WhatsApp groups",
    category: "website",
    react: "📌",
    filename: __filename
}, async (Void, citel, text) => {
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;
        const response = await axios.get(url);
        const groups = response.data.values.slice(1); // Skip header row

        if (!groups.length) return citel.reply("❌ No groups found!");

        let message = `╭──「 📍 *GROUP LIST* 📍 」──╮\n│\n│ *Bot Owner:* ERFAN AHMAD\n│ *Contact:* +923306137477\n│\n`;
        
        groups.forEach((group, i) => {
            message += `│ *${i+1}. ${group[0]}*\n│ 🏷️ ${group[2]}\n│ 👤 ${group[3]}\n│ 🔗 ${group[1]}\n│\n`;
        });

        message += `╰───────────────────╯\n\n_Use *${config.PREFIX}addgc* to add your group_`;
        return Void.sendMessage(citel.chat, { text: message });

    } catch (e) {
        console.error(e);
        return citel.reply("❌ Error fetching groups. Try again later.");
    }
});

cmd({
    pattern: "addgc",
    desc: "Add new WhatsApp group",
    category: "website",
    react: "➕",
    usage: `${config.PREFIX}addgc Name,Link,Category,AdminNumber`
}, async (Void, citel, text) => {
    try {
        const [name, link, category, admin] = text.split(',').map(i => i.trim());
        
        if (!link.includes('chat.whatsapp.com')) 
            return citel.reply("❌ Invalid WhatsApp link!");

        const payload = {
            range: `${SHEET_NAME}!A2:D2`,
            values: [[name, link, category, admin]],
        };

        await axios.post(
            `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/append?valueInputOption=RAW&key=${API_KEY}`,
            payload,
            { headers: { 'Content-Type': 'application/json' } }
        );

        return citel.reply(`✅ *${name}* added successfully!`);

    } catch (e) {
        console.error(e);
        return citel.reply("❌ Failed to add group. Check format: .addgc Name,Link,Category,Admin");
    }
});
