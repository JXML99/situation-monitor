module.exports = async function handler(req, res) {
    const API_KEY = 'f1d96853b6b649c59b823a069b1d7eb8';
    
    try {
        const categories = ['general', 'business', 'technology'];
        const allHeadlines = [];
        
        for (const category of categories) {
            const url = `https://newsapi.org/v2/top-headlines?language=en&category=${category}&pageSize=20&apiKey=${API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.articles) {
                allHeadlines.push(...data.articles);
            }
        }
        
        const scoredArticles = allHeadlines.map(article => {
            let score = 0;
            
            const hoursAgo = (Date.now() - new Date(article.publishedAt)) / 3600000;
            if (hoursAgo < 2) score += 50;
            else if (hoursAgo < 6) score += 30;
            else if (hoursAgo < 12) score += 15;
            
            const topSources = ['Reuters', 'BBC', 'CNN', 'Bloomberg', 'The Guardian', 'AP News', 'Financial Times'];
            if (topSources.includes(article.source.name)) score += 20;
            
            const title = article.title.toLowerCase();
            if (title.includes('breaking')) score += 30;
            if (title.includes('live')) score += 25;
            if (title.includes('urgent')) score += 20;
            if (title.includes('trump') || title.includes('biden')) score += 15;
            if (title.includes('market') || title.includes('stock')) score += 10;
            
            return {
                title: article.title,
                url: article.url,
                source: article.source.name,
                publishedAt: article.publishedAt,
                description: article.description,
                score: score,
                timeAgo: hoursAgo < 1 ? `${Math.floor(hoursAgo * 60)}m ago` : 
                        hoursAgo < 24 ? `${Math.floor(hoursAgo)}h ago` : 
                        `${Math.floor(hoursAgo / 24)}d ago`
            };
        });
        
        const unique = [];
        const seenTitles = new Set();
        
        for (const article of scoredArticles) {
            const normalized = article.title.toLowerCase().substring(0, 50);
            if (!seenTitles.has(normalized)) {
                seenTitles.add(normalized);
                unique.push(article);
            }
        }
        
        const trending = unique
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
        
        res.status(200).json({ trending });
        
    } catch (error) {
        console.error('Trending API error:', error);
        res.status(500).json({ error: error.message });
    }
};
