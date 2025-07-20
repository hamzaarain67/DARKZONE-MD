const { cmd } = require("../command");

cmd({
  pattern: "post",
  alias: ["poststatus", "status", "story", "repost", "reshare"],
  react: '📝',
  desc: "Posts replied media to bot's status",
  category: "utility",
  filename: __filename
}, async (client, message, match, { from, isCreator }) => {
  try {
    if (!isCreator) {
      return await client.sendMessage(from, {
        text: "*📛 This is an owner-only command.*"
      }, { quoted: message });
    }

    const quotedMsg = message.quoted ? message.quoted : message;
    
    // Improved media detection
    const isImage = quotedMsg.imageMessage || quotedMsg.msg?.imageMessage;
    const isVideo = quotedMsg.videoMessage || quotedMsg.msg?.videoMessage;
    const isAudio = quotedMsg.audioMessage || quotedMsg.msg?.audioMessage;
    
    if (!isImage && !isVideo && !isAudio) {
      return await client.sendMessage(message.chat, {
        text: "*Please reply to an image, video, or audio file.*"
      }, { quoted: message });
    }

    const buffer = await quotedMsg.download();
    const caption = quotedMsg.text || quotedMsg.caption || '';

    let statusContent = {
      caption: caption
    };

    if (isImage) {
      statusContent.image = buffer;
    } 
    else if (isVideo) {
      statusContent.video = buffer;
    }
    else if (isAudio) {
      statusContent.audio = buffer;
      statusContent.mimetype = "audio/mp4";
      statusContent.ptt = quotedMsg.ptt || false;
    }

    // Try alternative status posting methods
    try {
      await client.sendMessage("status@broadcast", statusContent);
      
      // Alternative method if above fails
      if (!client.sendMessage("status@broadcast", statusContent)) {
        await client.setStatus(caption, buffer);
      }
    } catch (statusError) {
      console.error("Status Upload Error:", statusError);
      throw new Error("Failed to post to status. WhatsApp may have changed their API.");
    }

    await client.sendMessage(message.chat, {
      text: "✅ Status Uploaded Successfully."
    }, { quoted: message });

  } catch (error) {
    console.error("Status Error:", error);
    await client.sendMessage(message.chat, {
      text: "❌ Failed to post status:\n" + (error.message || "Unknown error occurred")
    }, { quoted: message });
  }
});
