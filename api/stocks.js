export default async function handler(req, res) {
    try {
        // Top stock tickers to track
        const tickers = ['SPY', 'QQQ', 'AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'META', 'AMZN'];
        
        const stockData = await Promise.all(
            tickers.map(async (ticker) => {
                try {
                    // Yahoo Finance quote endpoint (no auth needed)
                    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
                    const response = await fetch(url);
                    const data = await response.json();
                    
                    if (!data.chart || !data.chart.result || !data.chart.result[0]) {
                        return null;
                    }
                    
                    const result = data.chart.result[0];
                    const quote = result.meta;
                    const currentPrice = quote.regularMarketPrice;
                    const previousClose = quote.chartPreviousClose || quote.previousClose;
                    const change = currentPrice - previousClose;
                    const changePercent = (change / previousClose) * 100;
                    
                    return {
                        ticker: ticker,
                        price: currentPrice.toFixed(2),
                        change: change.toFixed(2),
                        changePercent: changePercent.toFixed(2),
                        direction: change >= 0 ? 'up' : 'down'
                    };
                } catch (error) {
                    console.error(`Error fetching ${ticker}:`, error);
                    return null;
                }
            })
        );
        
        // Filter out nulls and sort by absolute change percentage
        const validStocks = stockData
            .filter(stock => stock !== null)
            .sort((a, b) => Math.abs(parseFloat(b.changePercent)) - Math.abs(parseFloat(a.changePercent)))
            .slice(0, 6); // Top 6 movers
        
        res.status(200).json({ stocks: validStocks });
        
    } catch (error) {
        console.error('Stock API error:', error);
        res.status(500).json({ error: error.message });
    }
}
