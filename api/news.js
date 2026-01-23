module.exports = async (req, res) => {
    const API_KEY = 'f1d96853b6b649c59b823a069b1d7eb8';
    
    try {
        res.status(200).json({ 
            articles: [{
                title: "Test",
                description: "Test", 
                url: "https://test.com",
                source: "Test",
                category: "politics",
                timeAgo: "1h ago"
            }],
            keywords: []
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
