export default async function handler(req, res) {
    try {
        // Use Google Trends RSS feed for real-time trending searches
        // This is free and doesn't require authentication
        const trendingUrl = 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US';
        
        const response = await fetch(trendingUrl);
        const xmlText = await response.text();
        
        // Parse XML to extract trending terms
        const items = [];
        const itemMatches = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
        
        for (let i = 0; i < Math.min(itemMatches.length, 10); i++) {
            const item = itemMatches[i];
            
            const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
            const trafficMatch = item.match(/<ht:approx_traffic><!\[CDATA\[(.*?)\]\]><\/ht:approx_traffic>/);
            const newsMatch = item.match(/<ht:news_item_title><!\[CDATA\[(.*?)\]\]><\/ht:news_item_title>/);
            
            if (titleMatch) {
                items.push({
                    term: titleMatch[1],
                    traffic: trafficMatch ? trafficMatch[1] : 'High',
                    context: newsMatch ? newsMatch[1] : '',
                    velocity: 'rising'
                });
            }
        }
        
        res.status(200).json({ trends: items });
        
    } catch (error) {
        console.error('Google Trends error:', error);
        res.status(500).json({ error: error.message, trends: [] });
    }
}
