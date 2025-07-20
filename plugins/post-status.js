const { cmd } = require("../command");
const fs = require("fs");
const { tmpdir } = require("os");
const path = require("path");

cmd({
  pattern: "post",
  alias: ["poststatus", "status", "story", "repost", "reshare"],
  react: "📝",
  desc: "Posts replied media to bot's WhatsApp status",
  category: "utility",
  filename: __filename
}, async (client, message, match, { from, isCreator }) => {
  try {
    if (!isCreator) {
      return await client.sendMessage(from, {
        text: "*📛 This is an owner-only command.*"
      }, { quoted: message });
    }

    const quotedMsg = message.quoted || message;
    const mediaTypes = ["image", "video", "audio"];

    // Check if the message has media
    const hasMedia = mediaTypes.some(type => quotedMsg[`${type}Message`] || quotedMsg.msg?.[`${type}Message`]);
    
    if (!hasMedia) {
      return await client.sendMessage(message.chat, {
        text: "*❗ Please reply to an image, video, or audio file.*"
      }, { quoted: message });
    }

    // Download the media
    const buffer = await quotedMsg.download();
    const tempFilePath = path.join(tmpdir(), `status_${Date.now()}.${quotedMsg.type === "audio" ? "mp3" : quotedMsg.type === "video" ? "mp4" : "jpg"}`);
    fs.writeFileSync(tempFilePath, buffer);

    const caption = quotedMsg.text || quotedMsg.caption || "";

    // Upload to WhatsApp status
    await client.setStatus(caption, tempFilePath);

    // Delete the temporary file
    fs.unlinkSync(tempFilePath);

    await client.sendMessage(message.chat, {
      text: "✅ *Status uploaded successfully!*"
    }, { quoted: message });

  } catch (error) {
    console.error("Status Error:", error);
    await client.sendMessage(message.chat, {
      text: `❌ *Failed to post status:*\n${error.message || "Unknown error"}`
    }, { quoted: message });
  }
});
