export default async function handler(req, res) {
    try {
        // Just return static data to test if the function works
        res.status(200).json({ 
            articles: [
                {
                    title: "Test Article 1",
                    description: "This is a test",
                    url: "https://example.com",
                    source: "Test Source",
                    category: "politics",
                    timeAgo: "1h ago"
                }
            ],
            keywords: [["test", 1]]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
