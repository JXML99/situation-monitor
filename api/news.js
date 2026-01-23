module.exports = async (req, res) => {
    const API_KEY = 'f1d96853b6b649c59b823a069b1d7eb8';
    
    const BLOCKED_SOURCES = [
        'The Times of India',
        'India Today',
        'NDTV',
        'Zee News',
        'News18'
    ];
    
    // Smart "Why this matters" generator
    function generateWhyMatters(article) {
        const title = article.title.toLowerCase();
        const desc = (article.description || '').toLowerCase();
        const combined = title + ' ' + desc;
        
        // Market/Financial
        if (combined.match(/market|stock|dow|nasdaq|s&p|trading|investor|fed|interest rate|inflation/)) {
            if (combined.match(/fed|federal reserve|powell|interest rate/)) {
                return "Rate decisions directly impact borrowing costs, equity valuations, and currency markets. Could trigger sector rotation if guidance shifts hawkish or dovish.";
            }
            if (combined.match(/crash|plunge|tank|drop|fall/)) {
                return "Sharp market moves often precede broader volatility and can affect portfolio allocations. Watch for contagion into credit markets and consumer confidence.";
            }
            if (combined.match(/rally|surge|jump|gain|record high/)) {
                return "Momentum shifts create entry points for late-cycle positioning. Elevated valuations increase vulnerability to negative catalysts.";
            }
            return "Market movements signal changing risk appetite and economic expectations. Affects portfolio positioning and hedging strategies.";
        }
        
        // Political/Policy
        if (combined.match(/trump|biden|congress|senate|house|election|vote|bill|legislation/)) {
            if (combined.match(/china|tariff|trade/)) {
                return "Trade policy shifts affect supply chains, corporate margins, and geopolitical risk premiums. Export-heavy sectors face immediate repricing.";
            }
            if (combined.match(/shutdown|funding|debt ceiling|budget/)) {
                return "Government dysfunction introduces tail risks to contractors, federal employees, and GDP growth. Credit markets price in shutdown duration expectations.";
            }
            if (combined.match(/regulation|antitrust|breakup/)) {
                return "Regulatory changes reshape competitive dynamics and compliance costs. Large-cap tech particularly sensitive to enforcement signals.";
            }
            return "Policy decisions create winners and losers across sectors. Anticipating regulatory direction provides positioning edge.";
        }
        
        // Technology
        if (combined.match(/ai|artificial intelligence|tech|silicon valley|nvidia|microsoft|google|meta/)) {
            if (combined.match(/regulation|ban|restrict|investigation/)) {
                return "Tech regulation affects innovation pace and market concentration. Developer ecosystems and enterprise adoption timelines shift with policy clarity.";
            }
            if (combined.match(/breakthrough|launch|release|announce/)) {
                return "Technology launches accelerate competitive repositioning and capital allocation. First-mover advantages create immediate valuation gaps.";
            }
            return "Tech sector developments drive productivity assumptions and equity multiples. Infrastructure and chip demand particularly sensitive.";
        }
        
        // Energy/Commodities
        if (combined.match(/oil|gas|energy|opec|crude|pipeline|climate/)) {
            if (combined.match(/price|surge|jump|spike/)) {
                return "Energy price shocks feed into inflation expectations and transportation costs. Industrial margins compress while energy equity multiples expand.";
            }
            if (combined.match(/supply|production|output|disruption/)) {
                return "Supply constraints create immediate cost pressures and strategic reserve discussions. Refining spreads and alternative energy investments react first.";
            }
            return "Energy developments affect inflation trajectory and geopolitical leverage. Transportation and manufacturing sectors face direct margin impacts.";
        }
        
        // Geopolitics
        if (combined.match(/russia|ukraine|china|taiwan|iran|israel|war|conflict|military/)) {
            return "Geopolitical escalation increases risk premiums across asset classes and disrupts commodity flows. Defense stocks and safe havens see immediate repositioning.";
        }
        
        // Corporate/M&A
        if (combined.match(/merger|acquisition|buyout|deal|takeover/)) {
            return "M&A activity signals sector consolidation and private equity appetite. Affects competitive landscape and creates comparison multiples for peers.";
        }
        
        // Default for breaking/general news
        if (combined.match(/breaking|urgent|developing/)) {
            return "Fast-moving developments require immediate situational awareness. Early positioning ahead of consensus reaction provides tactical advantage.";
        }
        
        // Generic fallback
        return "This development shapes today's narrative and affects decision-making context. Monitoring progression helps identify second-order opportunities.";
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
                description: (article.description || '').substring(0, 150),
                url: article.url,
                source: article.source.name,
                category,
                whyMatters: generateWhyMatters(article),
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
