export default async function handler(req, res) {
    const API_KEY = 'f1d96853b6b649c59b823a069b1d7eb8';
    
    try {
        // Fetch top headlines
        const url = `https://newsapi.org/v2/top-headlines?language=en&pageSize=50&apiKey=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.articles) {
            throw new Error('No articles');
        }
        
        // Simple keyword extraction
        const keywords = {};
        
        data.articles.forEach(article => {
            const text = (article.title || '').toLowerCase();
            const words = text.split(' ');
            
            words.forEach(word => {
                // Clean word
                word = word.replace(/[^a-z]/g, '');
                
                // Skip short or common words
                if (word.length < 4) return;
                if (['that', 'this', 'with', 'from', 'have', 'been', 'their', 'says', 'what', 'about'].includes(word)) return;
                
                keywords[word] = (keywords[word] || 0) + 1;
            });
        });
        
        // Convert to array and sort
        const sorted = Object.entries(keywords)
            .filter(([word, count]) => count >= 2)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        // Format output
        const trends = sorted.map(([word, count]) => ({
            term: word.charAt(0).toUpperCase() + word.slice(1),
            traffic: count > 5 ? '100K+' : '50K+',
            context: 'Mentioned in ' + count + ' headlines',
            velocity: 'rising',
            mentions: count
        }));
        
        console.log('Trends generated:', trends); // Debug log
        
        res.status(200).json({ trends });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: error.message,
            trends: []
        });
    }
}
