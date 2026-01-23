module.exports = async (req, res) => {
    try {
        // Expanded list: Major indices, sector ETFs, commodities, currencies
        const tickers = [
            // Major Indices
            'SPY',    // S&P 500
            '^DJI',   // Dow Jones
            'QQQ',    // Nasdaq 100
            '^VIX',   // Volatility Index
            
            // Sector ETFs
            'XLF',    // Financials
            'XLE',    // Energy
            'XLK',    // Technology
            'XLV',    // Healthcare
            'XLI',    // Industrials
            
            // Tech Giants
            'AAPL',   // Apple
            'MSFT',   // Microsoft
            'NVDA',   // Nvidia
            'GOOGL',  // Google
            'TSLA',   // Tesla
            'META',   // Meta
            
            // Commodities & Currencies
            'GLD',    // Gold
            'USO',    // Oil
            'UUP',    // US Dollar
            'TLT'     // 20Y Treasury
        ];
        
        const stockData = await Promise.all(
            tickers.map(async (ticker) => {
                try {
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
                    
                    // Categorize tickers
                    let category = 'stock';
                    let displayName = ticker;
                    
                    if (['^DJI', 'SPY', 'QQQ', '^VIX'].includes(ticker)) {
                        category = 'index';
                        if (ticker === '^DJI') displayName = 'DOW';
                        if (ticker === 'SPY') displayName = 'S&P 500';
                        if (ticker === 'QQQ') displayName = 'NASDAQ';
                        if (ticker === '^VIX') displayName = 'VIX';
                    } else if (['XLF', 'XLE', 'XLK', 'XLV', 'XLI'].includes(ticker)) {
                        category = 'sector';
                    } else if (['GLD', 'USO', 'UUP', 'TLT'].includes(ticker)) {
                        category = 'commodity';
                        if (ticker === 'GLD') displayName = 'GOLD';
                        if (ticker === 'USO') displayName = 'OIL';
                        if (ticker === 'UUP') displayName = 'USD';
                        if (ticker === 'TLT') displayName = 'BONDS';
                    }
                    
                    return {
                        ticker: ticker,
                        displayName: displayName,
                        category: category,
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
        
        const validStocks = stockData.filter(stock => stock !== null);
        
        res.status(200).json({ stocks: validStocks });
        
    } catch (error) {
        console.error('Stock API error:', error);
        res.status(500).json({ error: error.message });
    }
};
