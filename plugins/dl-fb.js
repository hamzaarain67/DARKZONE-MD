const axios = require("axios");
const { cmd } = require("../command");

cmd({
  pattern: "fb",
  alias: ["facebook", "fbdl"],
  react: '📥',
  desc: "Download HD videos from Facebook",
  category: "download",
  use: ".fb <Facebook URL>",
  filename: __filename
}, async (conn, mek, m, { from, reply, args }) => {
  try {
    const fbUrl = args[0];
    if (!fbUrl || !fbUrl.includes("facebook.com")) {
      return reply(`╭───「 *INVALID URL* 」\n│\n│ ❌ Please provide a valid\n│ Facebook video URL\n│\n├ Example:\n│ .fb https://fb.watch/xyz/\n╰───────────────`);
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    const apiUrl = `https://jawad-tech.vercel.app/downloader?url=${encodeURIComponent(fbUrl)}`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data.status || !data.result || !Array.isArray(data.result)) {
      return reply(`╭───「 *DOWNLOAD FAILED* 」\n│\n│ ❌ Video fetch error\n│ Check URL and try again\n╰───────────────`);
    }

    // Prefer HD, fallback to SD
    const hd = data.result.find(v => v.quality === "HD");
    const sd = data.result.find(v => v.quality === "SD");
    const video = hd || sd;

    if (!video) return reply("╭───「 *NO VIDEO FOUND* 」\n│\n│ ❌ No valid video format\n│ found in response\n╰───────────────");

    await reply(`╭───「 *DOWNLOADING* 」\n│\n│ 📥 Fetching ${video.quality}\n│ quality video...\n╰───────────────`);

    await conn.sendMessage(from, {
      video: { url: video.url },
      caption: `╭───「 *FACEBOOK DOWNLOADER* 」\n│\n│ 🔗 *URL*: ${fbUrl}\n│\n│ 🎞️ *Quality*: ${video.quality}\n│\n│ ⏱️ *Duration*: ${video.duration || 'N/A'}\n│\n│ 📦 *Server*: 𝐸𝑅𝐹𝒜𝒩 𝒜𝐻𝑀𝒜𝒟\n╰───────────────\n\n_🔰 Powered by DARKZONE-MD_`,
      contextInfo: {
        externalAdReply: {
          title: "Facebook Video Downloaded",
          body: "HD Quality | DARKZONE-MD",
          thumbnail: await (await axios.get('https://i.imgur.com/3pZP8xR.jpg', { responseType: 'arraybuffer' })).data,
          mediaType: 1,
          mediaUrl: fbUrl,
          sourceUrl: fbUrl
        }
      }
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
  } catch (error) {
    console.error('fb Error:', error);
    reply(`╭───「 *ERROR* 」\n│\n│ ❌ Download failed\n│ ${error.message}\n╰───────────────`);
    await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
  }
});
