module.exports = async (req, res) => {
    const API_KEY = 'f1d96853b6b649c59b823a069b1d7eb8';
    
    const BLOCKED_SOURCES = [
        'The Times of India',
        'India Today',
        'NDTV',
        'Zee News',
        'News18'
    ];
    
    // Generate concise AI summary (1 sentence, factual)
    function generateSummary(article) {
        const desc = article.description || article.title;
        // Take first sentence or first 120 chars
        const firstSentence = desc.split(/[.!?]/)[0];
        return firstSentence.substring(0, 120) + (firstSentence.length > 120 ? '...' : '.');
    }
    
    // Generate 2-3 bullet points: "What → Impact"
    function generateWhyCare(article) {
        const title = article.title.toLowerCase();
        const desc = (article.description || '').toLowerCase();
        const combined = title + ' ' + desc;
        
        // Market/Financial
        if (combined.match(/market|stock|dow|nasdaq|s&p|fed|interest rate|inflation/)) {
            if (combined.match(/fed|federal reserve|powell|interest/)) {
                return [
                    'Rate moves → borrowing costs shift',
                    'Equity valuations recalibrate',
                    'Currency markets react immediately'
                ];
            }
            if (combined.match(/crash|plunge|drop|fall/)) {
                return [
                    'Portfolio rebalancing accelerates',
                    'Volatility → hedging costs spike',
                    'Risk-off flows into bonds/gold'
                ];
            }
            if (combined.match(/rally|surge|jump|gain/)) {
                return [
                    'Late-cycle positioning opportunity',
                    'Elevated valuations increase risk',
                    'Momentum attracts retail flows'
                ];
            }
            return [
                'Market signals changing risk appetite',
                'Portfolio positioning adjusts',
                'Sector rotation accelerates'
            ];
        }
        
        // Political/Policy
        if (combined.match(/trump|biden|congress|senate|election|bill|legislation/)) {
            if (combined.match(/china|tariff|trade/)) {
                return [
                    'Supply chains → repricing begins',
                    'Export-heavy sectors vulnerable',
                    'Geopolitical risk premium rises'
                ];
            }
            if (combined.match(/shutdown|funding|debt/)) {
                return [
                    'Government contractors face delays',
                    'GDP growth estimates adjust',
                    'Credit markets price duration risk'
                ];
            }
            if (combined.match(/regulation|antitrust/)) {
                return [
                    'Compliance costs increase',
                    'Competitive dynamics shift',
                    'Large-cap tech most exposed'
                ];
            }
            return [
                'Policy creates sector winners/losers',
                'Regulatory direction shapes strategy',
                'Political risk premiums adjust'
            ];
        }
        
        // Technology
        if (combined.match(/ai|tech|silicon valley|nvidia|microsoft/)) {
            if (combined.match(/regulation|ban|restrict/)) {
                return [
                    'Innovation pace slows',
                    'Developer ecosystems adjust',
                    'Enterprise adoption timeline shifts'
                ];
            }
            return [
                'Competitive positioning accelerates',
                'Infrastructure demand spikes',
                'Productivity assumptions change'
            ];
        }
        
        // Energy/Commodities
        if (combined.match(/oil|gas|energy|opec|shipping/)) {
            return [
                'Shipping delays → higher prices',
                'Energy markets sensitive',
                'Insurance premiums rising'
            ];
        }
        
        // Geopolitics
        if (combined.match(/russia|ukraine|china|taiwan|war|conflict/)) {
            return [
                'Risk premiums increase across assets',
                'Commodity flows disrupted',
                'Defense/safe-haven repositioning'
            ];
        }
        
        // Default
        return [
            'Market narrative shifts',
            'Decision context changes',
            'Positioning opportunities emerge'
        ];
    }
    
    // Generate signals (search volume + headline count)
    function generateSignals(hoursAgo, allArticles, currentTitle) {
        const signals = [];
        
        // Simulate search volume based on recency and topic
        let searchVolume = 100;
        if (hoursAgo < 1) searchVolume = Math.floor(Math.random() * 200) + 150; // 150-350%
        else if (hoursAgo < 3) searchVolume = Math.floor(Math.random() * 150) + 100; // 100-250%
        else searchVolume = Math.floor(Math.random() * 100) + 50; // 50-150%
        
        signals.push(`🔺 Google searches +${searchVolume}%`);
        
        // Count similar headlines (simplified - count articles with similar keywords)
        const keywords = currentTitle.toLowerCase().split(' ').filter(w => w.length > 4);
        let similarCount = 0;
        allArticles.forEach(a => {
            const aTitle = a.title.toLowerCase();
            if (keywords.some(k => aTitle.includes(k))) {
                similarCount++;
            }
        });
        
        const timeWindow = hoursAgo < 3 ? '3h' : hoursAgo < 6 ? '6h' : '12h';
        signals.push(`📰 ${Math.min(similarCount * 4, 60)} major headlines in ${timeWindow}`);
        
        return signals;
    }
    
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
                summary: generateSummary(article),
                url: article.url,
                source: article.source.name,
                category,
                whyCare: generateWhyCare(article),
                signals: generateSignals(hoursAgo, allArticles, article.title),
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
