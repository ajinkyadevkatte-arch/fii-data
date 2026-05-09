import { NextResponse } from 'next/server';

// NSE fetch with full browser simulation
async function fetchFromNSE() {
  const baseUrl = 'https://www.nseindia.com';
  const dataUrl = 'https://www.nseindia.com/api/fiidiiTradeReact';

  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://www.nseindia.com/market-data/fii-dii-activity',
    'Origin': 'https://www.nseindia.com',
    'Connection': 'keep-alive',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'DNT': '1',
  };

  // Step 1: Get cookies from homepage
  const baseResponse = await fetch(baseUrl, { headers, redirect: 'follow' });
  let cookies = '';
  const cookieHeaders = baseResponse.headers.getSetCookie();
  if (cookieHeaders && cookieHeaders.length > 0) {
    cookies = cookieHeaders.map(c => c.split(';')[0]).join('; ');
  } else {
    const setCookie = baseResponse.headers.get('set-cookie');
    if (setCookie) cookies = setCookie.split(',').map(c => c.split(';')[0]).join('; ');
  }

  // Step 2: Warm up session
  await fetch('https://www.nseindia.com/market-data/fii-dii-activity', {
    headers: { ...headers, Cookie: cookies }, redirect: 'follow',
  });

  // Step 3: Fetch data
  const dataResponse = await fetch(dataUrl, { headers: { ...headers, Cookie: cookies } });
  if (!dataResponse.ok) throw new Error(`NSE responded with ${dataResponse.status}`);

  const raw = await dataResponse.json();

  // NSE can return array directly OR { data: [...] } — handle both
  const rows: any[] = Array.isArray(raw) ? raw : (raw?.data ?? []);

  // Normalize field names — NSE uses different keys sometimes
  const normalized = rows.map((row: any) => ({
    category:  row.category  ?? row.Category  ?? 'Unknown',
    date:      row.date      ?? row.Date       ?? new Date().toLocaleDateString('en-IN'),
    buyValue:  String(row.buyValue  ?? row.grossPurchase  ?? row.grossBuy  ?? row.buy  ?? '0'),
    sellValue: String(row.sellValue ?? row.grossSale      ?? row.grossSell ?? row.sell ?? '0'),
    netValue:  String(row.netValue  ?? row.netPurchaseSale ?? row.net      ?? '0'),
  }));

  if (normalized.length === 0) throw new Error('No data rows returned from NSE');
  return normalized;
}

export async function GET() {
  const redisUrl   = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // ── 1. Try Redis cache first ──
  if (redisUrl && redisToken) {
    try {
      const redisRes  = await fetch(`${redisUrl}/get/nse:fii_dii`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      });
      const redisData = await redisRes.json();
      if (redisData.result) {
        const parsed = JSON.parse(redisData.result);
        console.log('[API] Serving from Redis cache.');
        return NextResponse.json(parsed, { headers: { 'x-data-source': 'redis-cache' } });
      }
    } catch { console.warn('[API] Redis read failed.'); }
  }

  // ── 2. Try live NSE fetch ──
  try {
    const data = await fetchFromNSE();
    console.log('[API] Serving live NSE data:', JSON.stringify(data));

    // Save to Redis for next request
    if (redisUrl && redisToken) {
      fetch(`${redisUrl}/set/nse:fii_dii`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${redisToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([JSON.stringify(data), 'EX', 108000]),
      }).catch(() => {});
    }

    return NextResponse.json(data, { headers: { 'x-data-source': 'nse-live' } });
  } catch (error: any) {
    console.error('[API] NSE fetch failed:', error.message);
  }

  // ── 3. Fallback — zeros, not fake numbers ──
  const today   = new Date();
  const dateStr = `${today.getDate().toString().padStart(2,'0')}-${(today.getMonth()+1).toString().padStart(2,'0')}-${today.getFullYear()}`;
  const mockData = [
    { category: 'FII/FPI *', date: dateStr, buyValue: '0', sellValue: '0', netValue: '0' },
    { category: 'DII **',    date: dateStr, buyValue: '0', sellValue: '0', netValue: '0' },
  ];
  return NextResponse.json(mockData, {
    status: 200,
    headers: { 'x-fallback-data': 'true', 'x-data-source': 'fallback' },
  });
}
