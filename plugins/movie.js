const axios = require('axios');
const { cmd } = require('../command');

cmd({
    pattern: "movie",
    desc: "Search for movies using RapidAPI",
    category: "utility",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, reply, args }) => {
    try {
        const query = args.join(' ').trim();
        if (!query) return reply("🎬 Please provide a movie name\nExample: .movie The Matrix");

        const options = {
            method: 'GET',
            url: 'https://movie-database-api1.p.rapidapi.com/list_movies.json',
            params: {
                query_term: query,
                limit: 1, // Get only the most relevant result
                sort_by: 'rating',
                order_by: 'desc'
            },
            headers: {
                'x-rapidapi-host': 'movie-database-api1.p.rapidapi.com',
                'x-rapidapi-key': '8f8214432dmshe2d6730ba6b5541p119a35jsna12406472100'
            }
        };

        const response = await axios.request(options);
        const data = response.data;
        
        if (!data.data || !data.data.movies || data.data.movies.length === 0) {
            return reply("❌ No movies found with that name");
        }

        const movie = data.data.movies[0];
        
        // Format the movie information
        let caption = `🎬 *${movie.title}* (${movie.year})\n\n`;
        caption += `⭐ *Rating:* ${movie.rating}/10\n`;
        caption += `⏳ *Duration:* ${movie.runtime} minutes\n`;
        caption += `🎭 *Genres:* ${movie.genres.join(', ')}\n\n`;
        caption += `📝 *Summary:* ${movie.synopsis || 'Not available'}\n\n`;
        caption += `📥 *Download:* ${movie.torrents ? Object.entries(movie.torrents).map(([quality, torrent]) => 
            `\n🔗 ${quality}: [${torrent.size}](${torrent.url})`).join('') : 'No torrents available'}`;

        // Send the response
        await conn.sendMessage(
            from,
            {
                image: { url: movie.medium_cover_image },
                caption: caption,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true
                }
            },
            { quoted: mek }
        );

    } catch (error) {
        console.error('Movie command error:', error);
        reply(`❌ Error: ${error.response?.data?.message || error.message}`);
    }
});
