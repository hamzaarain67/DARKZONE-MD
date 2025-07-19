const { cmd } = require('../command');

cmd({
    pattern: "remove",
    alias: ["kick", "k"],
    desc: "Remove any member (even admins) from the group",
    category: "admin",
    react: "❌",
    filename: __filename
},
async (Void, citel, text, { isGroup, isBotAdmin, isAdmin, participants }) => {
    try {
        // Check if used in a group
        if (!isGroup) return citel.reply("❌ This command only works in groups!");

        // Check if bot is admin
        if (!isBotAdmin) return citel.reply("❌ I need admin rights to remove members!");

        // Check if user is admin
        if (!isAdmin) return citel.reply("❌ Only admins can use this command!");

        // Get target user (quoted/mentioned)
        let target = citel.quoted ? citel.quoted.sender : 
                   citel.mentionedJid?.[0] || null;

        if (!target) return citel.reply("❌ Reply to a message or mention a user!");

        // Prevent self-kick
        if (target === citel.sender) return citel.reply("❌ You can't remove yourself!");

        // Kick the user
        await Void.groupParticipantsUpdate(citel.chat, [target], "remove");

        // Success message with mention
        await citel.reply(`🚫 @${target.split('@')[0]} has been removed from the group!`, {
            mentions: [target]
        });

    } catch (error) {
        console.error("[KICK ERROR]", error);
        citel.reply("❌ Failed to remove user. Maybe they're a higher admin?");
    }
});
