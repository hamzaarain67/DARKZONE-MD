const { cmd } = require('../command');

cmd({
    pattern: "promote",
    alias: ["p", "makeadmin"],
    desc: "Promotes a member to group admin",
    category: "admin",
    react: "⬆️",
    filename: __filename
},
async (Void, citel, text, { isGroup, isAdmin, isBotAdmin }) => {
    try {
        // Check if used in group
        if (!isGroup) return citel.reply("❌ This command only works in groups!");

        // Check if user is admin
        if (!isAdmin) return citel.reply("❌ Only admins can promote members!");

        // Check if bot is admin
        if (!isBotAdmin) return citel.reply("❌ I need admin rights to promote!");

        // Get target user (quoted/mentioned)
        const target = citel.quoted?.sender || citel.mentionedJid?.[0];
        if (!target) return citel.reply("❌ Reply to a message or mention a user!");

        // Promote the user
        await Void.groupParticipantsUpdate(citel.chat, [target], "promote");

        // Success message
        await citel.reply(`⬆️ @${target.split('@')[0]} has been promoted to admin!`, {
            mentions: [target]
        });

    } catch (error) {
        console.error("[PROMOTE ERROR]", error);
        citel.reply("❌ Failed to promote. Maybe user is already admin?");
    }
});
