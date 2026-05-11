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
    if (setCookie) {
      cookies = setCookie.split(',').map(c => c.split(';')[0]).join('; ');
    }
  }

  // Step 2: Hit the FII/DII page to warm up session
  await fetch('https://www.nseindia.com/market-data/fii-dii-activity', {
    headers: { ...headers, Cookie: cookies },
    redirect: 'follow',
  });

  // Step 3: Fetch actual data
  const dataResponse = await fetch(dataUrl, {
    headers: { ...headers, Cookie: cookies },
  });

  if (!dataResponse.ok) {
    throw new Error(`NSE responded with ${dataResponse.status}`);
  }

  const data = await dataResponse.json();
  return data;
}

// Cron endpoint — called by Vercel daily at 4 PM IST
export async function GET(request: Request) {
  // Security: Only allow Vercel Cron calls
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    console.log('[CRON] Starting NSE data refresh...');
    const rawData = await fetchFromNSE();

    // Normalize field names
    const rows: any[] = Array.isArray(rawData) ? rawData : (rawData?.data ?? []);
    const normalized = rows.map((row: any) => ({
      category:  row.category  ?? row.Category  ?? 'Unknown',
      date:      row.date      ?? row.Date       ?? new Date().toLocaleDateString('en-IN'),
      buyValue:  String(row.buyValue  ?? row.grossPurchase  ?? row.grossBuy  ?? row.buy  ?? '0'),
      sellValue: String(row.sellValue ?? row.grossSale      ?? row.grossSell ?? row.sell ?? '0'),
      netValue:  String(row.netValue  ?? row.netPurchaseSale ?? row.net      ?? '0'),
    }));

    // Filter for only FII and DII (remove TOTAL rows)
    const data = normalized.filter(row => 
      row.category.toUpperCase().includes('FII') || 
      row.category.toUpperCase().includes('DII')
    );

    // Store in Upstash Redis if configured
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (redisUrl && redisToken) {
      const payload = JSON.stringify(data);
      // Store with 30-hour expiry (covers overnight + weekend buffer)
      await fetch(`${redisUrl}/set/nse:fii_dii`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([payload, 'EX', 108000]), // 30 hours
      });
      console.log('[CRON] Data saved to Redis successfully.');
    }

    return NextResponse.json({ success: true, records: data.length, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error('[CRON] Failed:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
