const FMP_BASE = 'https://financialmodelingprep.com/api';

export async function fetchMarketData(apiKey) {
  const symbols = ['^GSPC', '^IXIC', '^DJI', 'VOO'];
  const results = {};
  for (const symbol of symbols) {
    try {
      const url = `${FMP_BASE}/v3/quote/${encodeURIComponent(symbol)}?apikey=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data[0]) {
        const q = data[0];
        results[symbol] = {
          name: q.name || symbol,
          price: q.price,
          change: q.change,
          changesPercentage: q.changesPercentage,
          previousClose: q.previousClose,
          dayHigh: q.dayHigh,
          dayLow: q.dayLow,
        };
      }
    } catch (err) {
      console.error(`[Data] Failed to fetch ${symbol}:`, err.message);
    }
  }
  return results;
}

export async function fetchNews(apiKey) {
  try {
    const url = `${FMP_BASE}/v3/stock_news?limit=15&apikey=${apiKey}`;
    const res = await fetch(url);
    const articles = await res.json();
    if (!Array.isArray(articles)) {
      console.error('[Data] Unexpected news response:', articles);
      return [];
    }
    const filtered = articles.filter(a => {
      const title = (a.title || '').toLowerCase();
      const skipTerms = ['penny stock', 'cannabis', 'meme coin', 'shiba', 'dogecoin', 'pump and dump'];
      return !skipTerms.some(term => title.includes(term));
    });
    return filtered.slice(0, 8).map(a => ({
      title: a.title,
      text: a.text?.substring(0, 500) || '',
      symbol: a.symbol || '',
      url: a.url || '',
      publishedDate: a.publishedDate,
      site: a.site || '',
    }));
  } catch (err) {
    console.error('[Data] Failed to fetch news:', err.message);
    return [];
  }
}

export async function fetchMovers(apiKey) {
  try {
    const [gainersRes, losersRes] = await Promise.all([
      fetch(`${FMP_BASE}/v3/stock_market/gainers?apikey=${apiKey}`),
      fetch(`${FMP_BASE}/v3/stock_market/losers?apikey=${apiKey}`),
    ]);
    const gainers = await gainersRes.json();
    const losers = await losersRes.json();
    const topGainers = (Array.isArray(gainers) ? gainers : [])
      .filter(s => s.price > 5).slice(0, 3)
      .map(s => ({ symbol: s.symbol, name: s.name, change: s.changesPercentage, price: s.price }));
    const topLosers = (Array.isArray(losers) ? losers : [])
      .filter(s => s.price > 5).slice(0, 3)
      .map(s => ({ symbol: s.symbol, name: s.name, change: s.changesPercentage, price: s.price }));
    return { topGainers, topLosers };
  } catch (err) {
    console.error('[Data] Failed to fetch movers:', err.message);
    return { topGainers: [], topLosers: [] };
  }
}

export async function fetchAllData(apiKey) {
  const [marketData, news, movers] = await Promise.all([
    fetchMarketData(apiKey),
    fetchNews(apiKey),
    fetchMovers(apiKey),
  ]);
  return { marketData, news, movers };
}
