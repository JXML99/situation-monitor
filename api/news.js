module.exports = async (req, res) => {
    const API_KEY = 'f1d96853b6b649c59b823a069b1d7eb8';
    
    const BLOCKED_SOURCES = [
        'The Times of India',
        'India Today',
        'NDTV',
        'Zee News',
        'News18'
    ];
    
    try {
        const queries = [
            'politics OR government',
            'stocks OR markets',
            'breaking news'
        ];
        
        const allArticles = [];
        
        for (const query of queries) {
            const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=20&apiKey=${API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.articles) allArticles.push(...data.articles);
        }
        
        const filtered = allArticles.filter(article => 
            !BLOCKED_SOURCES.includes(article.source.name)
        );
        
        const unique = Array.from(new Map(filtered.map(a => [a.title, a])).values());
        
        const sourceCounts = {};
        const diverse = unique.filter(article => {
            const source = article.source.name;
            sourceCounts[source] = (sourceCounts[source] || 0) + 1;
            return sourceCounts[source] <= 2;
        });
        
        const processed = diverse.slice(0, 15).map(article => {
            const hoursAgo = (Date.now() - new Date(article.publishedAt)) / 3600000;
            const text = (article.title + ' ' + (article.description || '')).toLowerCase();
            const category = text.match(/stock|market|economy|trading|investor|fed/) ? 'markets' : 
                           hoursAgo < 3 ? 'breaking' : 'politics';
            
            return {
                title: article.title,
                description: (article.description || '').substring(0, 150),
                url: article.url,
                source: article.source.name,
                category,
                timeAgo: hoursAgo < 1 ? `${Math.floor(hoursAgo * 60)}m ago` : 
                        hoursAgo < 24 ? `${Math.floor(hoursAgo)}h ago` : 
                        `${Math.floor(hoursAgo / 24)}d ago`
            };
        });
        
        const titles = processed.map(a => a.title).join(' ');
        const stopWords = ['news', 'says', 'after', 'latest', 'report', 'update', 'live'];
        const words = titles.toLowerCase().match(/\b[a-z]{5,}\b/g) || [];
        const counts = {};
        words.forEach(w => {
            if (!stopWords.includes(w)) {
                counts[w] = (counts[w] || 0) + 1;
            }
        });
        const keywords = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .filter(([word, count]) => count > 1);
        
        res.status(200).json({ articles: processed, keywords });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
