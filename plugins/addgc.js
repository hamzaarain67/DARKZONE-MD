// plugins/blogger-groups.js
const axios = require('axios');

module.exports = {
    name: "Blogger Group Manager",
    version: "1.1.0",
    author: "Erfan",
    description: "Manage groups through erfan-tech.blogspot.com",
    command: {
        gc: {
            description: "Show all groups from website by category",
            usage: ".gc [category]",
            func: async (m, sock, { args, prefix }) => {
                try {
                    const category = args[0] ? args[0].toLowerCase() : null;
                    const apiUrl = `https://www.googleapis.com/blogger/v3/blogs/2399953092286269862/posts?key=AIzaSyDpQ4xQZ4ZQZ4ZQZ4ZQZ4ZQZ4ZQZ4ZQZ4Z&maxResults=50`;
                    
                    const response = await axios.get(apiUrl);
                    let groups = response.data.items.filter(post => 
                        post.labels && post.labels.includes('group')
                    );

                    if (category) {
                        groups = groups.filter(group => 
                            group.labels.map(l => l.toLowerCase()).includes(category)
                        );
                    }

                    if (groups.length === 0) {
                        return await sock.sendMessage(m.key.remoteJid, { 
                            text: category 
                                ? `❌ No groups found in "${category}" category`
                                : "❌ No groups available yet"
                        }, { quoted: m });
                    }

                    let message = category
                        ? `📌 *Groups in ${category.toUpperCase()} category*\n\n`
                        : "📌 *All Available Groups*\n\n";

                    groups.forEach((group, index) => {
                        const content = group.content.replace(/<[^>]*>?/gm, '');
                        message += `*${index + 1}. ${group.title}*\n`;
                        message += `🔗 ${extractLink(content) || 'No link provided'}\n`;
                        message += `📝 ${content.substring(0, 60)}...\n`;
                        message += `🏷️ ${group.labels.filter(l => l !== 'group').join(', ')}\n\n`;
                    });

                    await sock.sendMessage(m.key.remoteJid, { text: message }, { quoted: m });
                } catch (error) {
                    console.error('GC Command Error:', error);
                    await sock.sendMessage(m.key.remoteJid, { 
                        text: "❌ Error fetching groups. Please try again later."
                    }, { quoted: m });
                }
            }
        },
        addgc: {
            description: "Add new group to website",
            usage: ".addgc group_name, group_link, category, admin_number",
            func: async (m, sock, { args, prefix, isAdmin }) => {
                // Only allow admins to add groups
                if (!isAdmin) {
                    return await sock.sendMessage(m.key.remoteJid, { 
                        text: "❌ This command is only for admins!"
                    }, { quoted: m });
                }

                const input = args.join(' ');
                const parts = input.split(',').map(part => part.trim());
                
                if (parts.length < 4) {
                    return await sock.sendMessage(m.key.remoteJid, { 
                        text: `❌ Invalid format! Usage:\n${prefix}addgc group_name, group_link, category, admin_number\n\nExample:\n${prefix}addgc Tech Group, https://chat.whatsapp.com/ABC123, Technology, 923001234567`
                    }, { quoted: m });
                }

                const [name, link, category, adminNumber] = parts;
                
                try {
                    const postData = {
                        title: name,
                        content: `
                            <b>Group Name:</b> ${name}<br>
                            <b>Group Link:</b> <a href="${link}">Join Here</a><br>
                            <b>Admin Contact:</b> ${adminNumber}<br>
                            <b>Added via:</b> DARKZONE-MD Bot
                        `,
                        labels: ['group', category.toLowerCase()]
                    };

                    const response = await axios.post(
                        'https://www.googleapis.com/blogger/v3/blogs/2399953092286269862/posts?key=AIzaSyDpQ4xQZ4ZQZ4ZQZ4ZQZ4ZQZ4ZQZ4ZQZ4Z',
                        postData,
                        { headers: { 'Content-Type': 'application/json' } }
                    );

                    await sock.sendMessage(m.key.remoteJid, { 
                        text: `✅ Group added successfully!\n\n*Name:* ${name}\n*Category:* ${category}\n*Link:* ${link}`
                    }, { quoted: m });
                } catch (error) {
                    console.error('ADDGC Command Error:', error);
                    await sock.sendMessage(m.key.remoteJid, { 
                        text: "❌ Failed to add group. Please check:\n1. Valid group link\n2. Correct category\n3. Proper admin number"
                    }, { quoted: m });
                }
            }
        }
    }
};

// Helper function to extract link from content
function extractLink(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = text.match(urlRegex);
    return match ? match[0] : null;
}
