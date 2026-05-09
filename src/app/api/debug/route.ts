import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const baseUrl = 'https://www.nseindia.com';
    const dataUrl = 'https://www.nseindia.com/api/fiidiiTradeReact';

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': 'https://www.nseindia.com/market-data/fii-dii-activity',
      'Origin': 'https://www.nseindia.com',
    };

    const baseResponse = await fetch(baseUrl, { headers });
    let cookies = '';
    const cookieHeaders = baseResponse.headers.getSetCookie();
    if (cookieHeaders?.length > 0) {
      cookies = cookieHeaders.map(c => c.split(';')[0]).join('; ');
    }

    const dataResponse = await fetch(dataUrl, { headers: { ...headers, Cookie: cookies } });
    const raw = await dataResponse.json();

    // Return the raw response so we can see its exact structure
    return NextResponse.json({
      status: dataResponse.status,
      isArray: Array.isArray(raw),
      firstItemKeys: Array.isArray(raw) ? Object.keys(raw[0] ?? {}) : Object.keys(raw),
      firstItem: Array.isArray(raw) ? raw[0] : raw,
      totalRows: Array.isArray(raw) ? raw.length : 'not array',
      raw: raw,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
