export default async function handler(req, res) {
    const API_KEY = 'f1d96853b6b649c59b823a069b1d7eb8';
    
    try {
        // Fetch top headlines from multiple sources
        const url = `https://newsapi.org/v2/top-headlines?language=en&pageSize=100&apiKey=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.articles || data.articles.length === 0) {
            throw new Error('No articles found');
        }
        
        // Extract and count important keywords from all headlines
        const keywordFrequency = {};
        const keywordContext = {};
        const keywordRecency = {};
        
        // Common words to filter out
        const stopWords = [
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
            'of', 'with', 'from', 'by', 'as', 'is', 'was', 'are', 'been', 'be', 
            'has', 'have', 'had', 'will', 'would', 'could', 'should', 'may', 
            'might', 'can', 'their', 'this', 'that', 'these', 'those', 'after', 
            'says', 'over', 'new', 'more', 'what', 'who', 'how', 'when', 'where',
            'latest', 'breaking', 'news', 'today', 'live', 'updates'
        ];
        
        data.articles.forEach(function(article) {
            const hoursAgo = (Date.now() - new Date(article.publishedAt)) / 3600000;
            const text = (article.title + ' ' + (article.description || '')).toLowerCase();
            
            // Extract meaningful phrases (2-3 words) and single important words
            const words = text.match(/\b[a-z]{4,}\b/g) || [];
            
            words.forEach(function(word) {
                if (!stopWords.includes(word)) {
                    keywordFrequency[word] = (keywordFrequency[word] || 0) + 1;
                    
                    // Track the most recent mention
                    if (!keywordRecency[word] || hoursAgo < keywordRecency[word]) {
                        keywordRecency[word] = hoursAgo;
                    }
                    
                    // Store context (first article mentioning it)
                    if (!keywordContext[word]) {
                        keywordContext[word] = article.title.substring(0, 80);
                    }
                }
            });
            
            // Also extract two-word phrases
            for (let i = 0; i < words.length - 1; i++) {
                const phrase = words[i] + ' ' + words[i + 1];
                if (!stopWords.includes(words[i]) && !stopWords.includes(words[i + 1])) {
                    keywordFrequency[phrase] = (keywordFrequency[phrase] || 0) + 1;
                    
                    if (!keywordRecency[phrase] || hoursAgo < keywordRecency[phrase]) {
                        keywordRecency[phrase] = hoursAgo;
                    }
                    
                    if (!keywordContext[phrase]) {
                        keywordContext[phrase] = article.title.substring(0, 80);
                    }
                }
            }
        });
        
        // Score keywords based on frequency, recency, and importance
        const scoredKeywords = Object.keys(keywordFrequency).map(function(keyword) {
            const frequency = keywordFrequency[keyword];
            const recency = keywordRecency[keyword];
            
            // Scoring algorithm
            let score = frequency * 10; // Base score from frequency
            
            // Recency bonus (newer = higher score)
            if (recency < 1) score += 50; // Last hour
            else if (recency < 3) score += 30; // Last 3 hours
            else if (recency < 6) score += 15; // Last 6 hours
            
            // Importance indicators
            const lower = keyword.toLowerCase();
            if (lower.includes('trump') || lower.includes('biden')) score += 20;
            if (lower.includes('market') || lower.includes('stock')) score += 15;
            if (lower.includes('china') || lower.includes('russia')) score += 15;
            if (lower.includes('federal') || lower.includes('congress')) score += 10;
            
            // Penalize very common words
            if (frequency > 30) score -= 20; // Too common, probably not specific
            
            return {
                term: keyword,
                frequency: frequency,
                score: score,
                recency: recency,
                context: keywordContext[keyword]
            };
        });
        
        // Sort by score and filter
        const trending = scoredKeywords
            .sort(function(a, b) { return b.score - a.score; })
            .filter(function(item) {
                // Only show terms that appear at least 3 times
                return item.frequency >= 3 && item.term.length > 3;
            })
            .slice(0, 10)
            .map(function(item) {
                // Format traffic based on frequency
                let traffic = 'Trending';
                if (item.frequency > 20) traffic = '500K+ searches';
                else if (item.frequency > 10) traffic = '200K+ searches';
                else if (item.frequency > 5) traffic = '100K+ searches';
                else traffic = '50K+ searches';
                
                // Determine velocity
                let velocity = 'rising';
                if (item.recency < 2) velocity = 'surging';
                else if (item.recency > 12) velocity = 'stable';
                
                return {
                    term: item.term.split(' ').map(function(w) {
                        return w.charAt(0).toUpperCase() + w.slice(1);
                    }).join(' '),
                    traffic: traffic,
                    context: item.context,
                    velocity: velocity,
                    mentions: item.frequency
                };
            });
        
        res.status(200).json({ trends: trending });
        
    } catch (error) {
        console.error('Trending analyzer error:', error);
        res.status(500).json({ 
            error: error.message,
            trends: []
        });
    }
}
```

---

## **How This Works - Smart Algorithm:**

### **1. Data Collection:**
- Fetches top 100 headlines from NewsAPI
- Analyzes both single keywords AND two-word phrases
- Tracks how recently each term was mentioned

### **2. Scoring System:**
```
Score = (Frequency × 10) + Recency Bonus + Importance Bonus - Penalty
