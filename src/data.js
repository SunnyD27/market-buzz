const FMP_BASE = 'https://financialmodelingprep.com/stable';

async function fmpFetch(path, label) {
  const url = `${FMP_BASE}${path}`;
  const res = await fetch(url);
  const body = await res.text();
  let data;
  try {
    data = JSON.parse(body);
  } catch {
    console.error(`[Data] ${label} returned non-JSON (HTTP ${res.status}): ${body.slice(0, 200)}`);
    return null;
  }
  if (data && typeof data === 'object' && !Array.isArray(data) && data['Error Message']) {
    console.error(`[Data] ${label} FMP error: ${data['Error Message']}`);
    return null;
  }
  return data;
}

export async function fetchMarketData(apiKey) {
  const symbols = ['^GSPC', '^IXIC', '^DJI', 'VOO'];
  const results = {};
  for (const symbol of symbols) {
    try {
      const data = await fmpFetch(
        `/quote?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`,
        `quote(${symbol})`,
      );
      const q = Array.isArray(data) ? data[0] : data;
      if (q && typeof q.price === 'number') {
        results[symbol] = {
          name: q.name || symbol,
          price: q.price,
          change: q.change,
          changesPercentage: q.changesPercentage,
          previousClose: q.previousClose,
          dayHigh: q.dayHigh,
          dayLow: q.dayLow,
        };
      } else {
        console.error(`[Data] quote(${symbol}) returned no usable data:`, JSON.stringify(data).slice(0, 200));
      }
    } catch (err) {
      console.error(`[Data] Failed to fetch ${symbol}:`, err.message);
    }
  }
  return results;
}

export async function fetchNews(apiKey) {
  try {
    const articles = await fmpFetch(`/stock-news?limit=15&apikey=${apiKey}`, 'stock-news');
    if (!Array.isArray(articles)) {
      console.error('[Data] Unexpected news response:', JSON.stringify(articles).slice(0, 200));
      return [];
    }
    const filtered = articles.filter(a => {
      const title = (a.title || '').toLowerCase();
      const skipTerms = ['penny stock', 'cannabis', 'meme coin', 'shiba', 'dogecoin', 'pump and dump'];
      return !skipTerms.some(term => title.includes(term));
    });
    return filtered.slice(0, 8).map(a => ({
      title: a.title,
      text: (a.text || '').substring(0, 500),
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
    const [gainers, losers] = await Promise.all([
      fmpFetch(`/biggest-gainers?apikey=${apiKey}`, 'biggest-gainers'),
      fmpFetch(`/biggest-losers?apikey=${apiKey}`, 'biggest-losers'),
    ]);
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
