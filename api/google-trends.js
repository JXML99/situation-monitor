module.exports = async function handler(req, res) {
    const API_KEY = 'f1d96853b6b649c59b823a069b1d7eb8';
    
    try {
        const url = `https://newsapi.org/v2/top-headlines?language=en&pageSize=50&apiKey=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.articles) {
            throw new Error('No articles');
        }
        
        const keywords = {};
        
        data.articles.forEach(article => {
            const text = (article.title || '').toLowerCase();
            const words = text.split(' ');
            
            words.forEach(word => {
                word = word.replace(/[^a-z]/g, '');
                
                if (word.length < 4) return;
                if (['that', 'this', 'with', 'from', 'have', 'been', 'their', 'says', 'what', 'about'].includes(word)) return;
                
                keywords[word] = (keywords[word] || 0) + 1;
            });
        });
        
        const sorted = Object.entries(keywords)
            .filter(([word, count]) => count >= 2)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        const trends = sorted.map(([word, count]) => ({
            term: word.charAt(0).toUpperCase() + word.slice(1),
            traffic: count > 5 ? '100K+' : '50K+',
            context: 'Mentioned in ' + count + ' headlines',
            velocity: 'rising',
            mentions: count
        }));
        
        res.status(200).json({ trends });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message, trends: [] });
    }
};
