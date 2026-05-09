"use client";

import { useEffect, useState, useRef } from "react";
import { Download, RefreshCw, TrendingUp, TrendingDown, Activity, Zap, Globe } from "lucide-react";
import { toPng } from "html-to-image";

interface NSEData {
  category: string;
  date: string;
  buyValue: string;
  sellValue: string;
  netValue: string;
}

const CHANNELS = [
  "AlphX",
  "THE ALPHA ANALYST",
  "AJINKYA DVKATTE",
  "TRADE VISTA"
] as const;

type Channel = typeof CHANNELS[number];

export default function Home() {
  const [data, setData] = useState<NSEData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFallback, setIsFallback] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel>(CHANNELS[0]);
  const cardRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/nse");
      if (!response.ok) throw new Error("Failed to fetch data");
      
      if (response.headers.get("x-fallback-data")) {
        setIsFallback(true);
      } else {
        setIsFallback(false);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const downloadImage = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 3,
        cacheBust: true,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      });
      const link = document.createElement('a');
      const dateStr = data[0]?.date || new Date().toISOString().split('T')[0];
      const channelName = selectedChannel.replace(/\s+/g, '_');
      link.download = `${channelName}_FII_DII_${dateStr}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate image", err);
      alert("Failed to download image. Please try again.");
    }
  };

  const formatNumber = (numStr: string | undefined | null) => {
    if (!numStr && numStr !== '0') return '0.00';
    const num = parseFloat(String(numStr).replace(/,/g, ''));
    if (isNaN(num)) return '0.00';
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(num);
  };

  const getNetVal = (item: NSEData) => parseFloat((item.netValue ?? '0').replace(/,/g, ''));
  const isPos = (item: NSEData) => getNetVal(item) >= 0;

  // Reusable social media row with real SVG logos
  const SocialRow = ({ handles, color = '#666' }: { handles: { ig: string; yt: string; x: string; tg: string }, color?: string }) => (
    <div className="flex items-center gap-5">
      {/* Instagram */}
      <div className="flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill={color}>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
        <span style={{ color, fontSize: '11px', fontFamily: 'monospace' }}>{handles.ig}</span>
      </div>
      {/* YouTube */}
      <div className="flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill={color}>
          <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
        </svg>
        <span style={{ color, fontSize: '11px', fontFamily: 'monospace' }}>{handles.yt}</span>
      </div>
      {/* X / Twitter */}
      <div className="flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill={color}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        <span style={{ color, fontSize: '11px', fontFamily: 'monospace' }}>{handles.x}</span>
      </div>
      {/* Telegram */}
      <div className="flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill={color}>
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
        <span style={{ color, fontSize: '11px', fontFamily: 'monospace' }}>{handles.tg}</span>
      </div>
    </div>
  );

  const renderAlphX = () => (
    <div ref={cardRef} className="bg-black w-[800px] p-8 border-4 border-[#222] font-mono text-sm relative">
      <div className="flex justify-between items-end border-b-2 border-[#333] pb-2 mb-6">
        <div className="flex items-center gap-3">
          <img src="/logo-alphx.jpg" alt="AlphX" style={{ height: '48px', width: '48px', objectFit: 'cover', borderRadius: '6px' }} />
          <div>
            <div className="text-orange-500 font-bold text-xl tracking-tighter">ALPHX</div>
            <div className="text-[#888] text-xs mt-0.5">EQUITY MARKET ANALYSIS</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-cyan-400">{data[0]?.date || "Loading..."}</div>
        </div>
      </div>

      <div className="bg-[#111] border border-[#333] p-1 mb-6">
        <div className="bg-[#222] text-white px-2 py-1 font-bold">INSTITUTIONAL FLOW (CASH MARKET)</div>
        <table className="w-full text-right mt-2 border-collapse">
          <thead>
            <tr className="text-[#888] border-b border-[#333]">
              <th className="text-left font-normal py-1 px-2">CATEGORY</th>
              <th className="font-normal py-1 px-2">GROSS BUY (CR)</th>
              <th className="font-normal py-1 px-2">GROSS SELL (CR)</th>
              <th className="font-normal py-1 px-2">NET VALUE (CR)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => {
              const positive = isPos(item);
              return (
                <tr key={item.category} className={idx === 0 ? "border-b border-[#222]" : ""}>
                  <td className="text-left text-cyan-400 py-2 px-2 font-bold">{item.category}</td>
                  <td className="text-white py-2 px-2">{formatNumber(item.buyValue)}</td>
                  <td className="text-white py-2 px-2">{formatNumber(item.sellValue)}</td>
                  <td className={`py-2 px-2 font-bold ${positive ? 'text-green-500' : 'text-red-500'}`}>
                    {positive ? '+' : ''}{formatNumber(item.netValue)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center border-t border-[#333] pt-4">
        <div className="text-[#555] text-xs">SOURCE: NSE INDIA</div>
        <SocialRow handles={{ ig: '@alphx_official', yt: 'AlphX', x: '@alphx', tg: 't.me/alphx' }} color="#555" />
      </div>
    </div>
  );

  const renderAlphaAnalyst = () => (
    <div ref={cardRef} className="bg-[#F9F7F1] w-[800px] p-10 font-serif text-[#111] relative border border-[#d1ccc0]">
      <div className="text-center border-b-4 border-double border-[#111] pb-6 mb-8">
        <div className="flex justify-center mb-3">
          <img src="/logo-alphaanalyst.png" alt="The Alpha Analyst" style={{ height: '64px', width: '64px', objectFit: 'cover', borderRadius: '50%' }} />
        </div>
        <h1 className="text-5xl font-black tracking-tight mb-2 uppercase">The Alpha Analyst</h1>
        <div className="flex justify-center items-center text-sm font-sans border-t border-b border-[#111] py-1 mt-4 gap-12">
          <span className="font-bold">{data[0]?.date || "Loading..."}</span>
          <span className="text-[#555]">|</span>
          <span className="font-bold tracking-widest">CASH MARKET DATA</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12">
        {data.map((item) => {
          const positive = isPos(item);
          return (
            <div key={item.category}>
              <h2 className="text-2xl font-bold border-b border-[#111] pb-2 mb-4 uppercase">{item.category} Activity</h2>
              <p className="text-sm text-[#444] mb-4 leading-relaxed font-sans">
                Summary of total gross purchases and sales executed by {item.category.includes("FII") ? "Foreign" : "Domestic"} Institutional Investors during the trading session.
              </p>
              
              <div className="space-y-3 font-sans">
                <div className="flex justify-between border-b border-dotted border-[#aaa] pb-1">
                  <span className="text-sm font-semibold uppercase">Total Buy</span>
                  <span className="font-mono">₹{formatNumber(item.buyValue)} Cr</span>
                </div>
                <div className="flex justify-between border-b border-dotted border-[#aaa] pb-1">
                  <span className="text-sm font-semibold uppercase">Total Sell</span>
                  <span className="font-mono">₹{formatNumber(item.sellValue)} Cr</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="font-bold uppercase">Net Position</span>
                  <span className={`font-mono font-bold text-lg ${positive ? 'text-[#166534]' : 'text-[#991b1b]'}`}>
                    {positive ? '+' : ''}{formatNumber(item.netValue)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t-2 border-double border-[#bbb] pt-4 mt-8 flex justify-center">
        <SocialRow handles={{ ig: '@thealpha_analyst', yt: 'The Alpha Analyst', x: '@alphaanalyst', tg: 't.me/thealpha_analyst' }} color="#777" />
      </div>
    </div>
  );

  const renderAjinkya = () => (
    <div ref={cardRef} className="bg-[#fdfaf5] w-[800px] font-sans text-[#1a1a1a] border border-[#e8e0d0]">
      {/* Top accent bar */}
      <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }} />

      {/* Header */}
      <div className="px-10 pt-8 pb-6 border-b border-[#e0d8cc] flex justify-between items-end">
        <div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-[#999] mb-1">Market Intelligence</div>
          <h1 className="text-4xl font-black text-[#0f3460] tracking-tight">AJINKYA DVKATTE</h1>
        </div>
        <div className="text-right">
          <div className="text-[10px] tracking-[0.2em] uppercase text-[#bbb] mb-1">Trading Session</div>
          <div className="text-xl font-bold text-[#333]">{data[0]?.date || 'Loading...'}</div>
        </div>
      </div>
      
      {/* Data section */}
      <div className="px-10 py-6">
        {data.map((item, idx) => {
          const positive = isPos(item);
          return (
            <div key={item.category} className={`flex items-stretch gap-0 ${idx === 0 ? 'mb-5 pb-5 border-b border-[#e8e0d0]' : ''}`}>
              {/* Category label */}
              <div className="w-48 pr-6 flex flex-col justify-center">
                <div className="text-2xl font-black text-[#0f3460]">{item.category.includes('FII') ? 'FII' : 'DII'}</div>
                <div className="text-[10px] text-[#aaa] tracking-[0.2em] uppercase mt-0.5">{item.category.includes('FII') ? 'Foreign Inst.' : 'Domestic Inst.'}</div>
              </div>
              {/* Divider */}
              <div className="w-px bg-[#e8e0d0] mx-2" />
              {/* Stats */}
              <div className="flex-1 flex items-center justify-around py-2">
                <div className="text-center">
                  <div className="text-[10px] text-[#aaa] tracking-widest uppercase mb-1">Gross Buy</div>
                  <div className="text-lg font-semibold text-[#333] font-mono">{formatNumber(item.buyValue)}</div>
                  <div className="text-[10px] text-[#bbb]">₹ Cr</div>
                </div>
                <div className="text-[#e0d8cc] text-xl">—</div>
                <div className="text-center">
                  <div className="text-[10px] text-[#aaa] tracking-widest uppercase mb-1">Gross Sell</div>
                  <div className="text-lg font-semibold text-[#333] font-mono">{formatNumber(item.sellValue)}</div>
                  <div className="text-[10px] text-[#bbb]">₹ Cr</div>
                </div>
                <div className="text-[#e0d8cc] text-xl">=</div>
                <div className="text-center">
                  <div className="text-[10px] text-[#aaa] tracking-widest uppercase mb-1">Net Flow</div>
                  <div className={`text-3xl font-black font-mono ${positive ? 'text-[#0f6b35]' : 'text-[#c0392b]'}`}>
                    {positive ? '+' : ''}{formatNumber(item.netValue)}
                  </div>
                  <div className="text-[10px] text-[#bbb]">₹ Cr</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-10 pb-6 pt-3 border-t border-[#e8e0d0] flex justify-between items-center">
        <div className="text-[10px] text-[#bbb] tracking-widest">NSE INDIA • CASH MARKET</div>
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#aaa"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          <span style={{ color: '#aaa', fontSize: '11px', fontFamily: 'monospace' }}>@ajinkya_devkatte</span>
        </div>
      </div>
    </div>
  );

  const renderTradeVista = () => (
    <div ref={cardRef} className="bg-[#12141c] w-[800px] font-sans text-[#cdd6f4]">
      {/* Header bar */}
      <div className="flex justify-between items-center px-8 py-5 border-b border-[#24273a]">
        <div className="flex items-center gap-3">
          <img src="/logo-tradevista.jpg" alt="Trade Vista" style={{ height: '52px', objectFit: 'contain', background: 'white', borderRadius: '6px', padding: '2px' }} />
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">TRADE VISTA</h1>
            <div className="text-[10px] tracking-[0.25em] uppercase text-[#89b4fa]/70">Institutional Flow Monitor</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-[#6c7086] tracking-widest uppercase">Session Date</div>
          <div className="text-[#cdd6f4] font-mono mt-0.5">{data[0]?.date || 'Loading...'}</div>
        </div>
      </div>

      {/* Data panels */}
      <div className="grid grid-cols-2 gap-0 border-b border-[#24273a]">
        {data.map((item, idx) => {
          const positive = isPos(item);
          return (
            <div key={item.category} className={`p-8 ${idx === 0 ? 'border-r border-[#24273a]' : ''}`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-[10px] tracking-[0.2em] uppercase text-[#6c7086] mb-1">{item.category.includes('FII') ? 'Foreign Inst.' : 'Domestic Inst.'}</div>
                  <h2 className="text-3xl font-black text-white">{item.category.includes('FII') ? 'FII' : 'DII'}</h2>
                </div>
                <div className={`text-xs font-bold px-2.5 py-1 rounded ${
                  positive ? 'bg-[#a6e3a1]/15 text-[#a6e3a1]' : 'bg-[#f38ba8]/15 text-[#f38ba8]'
                }`}>
                  {positive ? 'NET BUYER' : 'NET SELLER'}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[#6c7086] uppercase tracking-widest">Gross Buy</span>
                  <span className="font-mono text-[#cdd6f4]">₹ {formatNumber(item.buyValue)} Cr</span>
                </div>
                <div className="w-full h-px bg-[#24273a]" />
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[#6c7086] uppercase tracking-widest">Gross Sell</span>
                  <span className="font-mono text-[#cdd6f4]">₹ {formatNumber(item.sellValue)} Cr</span>
                </div>
              </div>

              <div className={`rounded-lg p-4 ${positive ? 'bg-[#a6e3a1]/10' : 'bg-[#f38ba8]/10'}`}>
                <div className="text-[10px] text-[#6c7086] uppercase tracking-widest mb-1">Net Position</div>
                <div className={`text-4xl font-black font-mono ${ positive ? 'text-[#a6e3a1]' : 'text-[#f38ba8]'}`}>
                  {positive ? '+' : ''}{formatNumber(item.netValue)}
                  <span className="text-sm font-normal ml-1 text-[#6c7086]">Cr</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-8 py-4 flex justify-between items-center">
        <div className="text-[10px] text-[#6c7086] tracking-widest">NSE INDIA • CASH MARKET</div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#6c7086"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            <span style={{ color: '#6c7086', fontSize: '11px', fontFamily: 'monospace' }}>@trade_vista</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#6c7086"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            <span style={{ color: '#6c7086', fontSize: '11px', fontFamily: 'monospace' }}>t.me/tradevista</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-black text-gray-100 font-sans selection:bg-blue-500/30">
      <div className="max-w-5xl mx-auto p-6 lg:p-12">
        
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-800 pb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight">
              Market Content Creator
            </h1>
            <p className="text-gray-400 mt-2 text-sm max-w-lg">
              Select your channel to generate a branded infographic for today's market data.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <button 
              onClick={fetchData} 
              disabled={loading}
              className="p-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-600 hover:bg-gray-800 transition-all text-gray-300 flex items-center justify-center group disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw size={20} className={loading ? "animate-spin text-blue-400" : "group-hover:text-blue-400 transition-colors"} />
            </button>
            <button 
              onClick={downloadImage}
              disabled={loading || data.length === 0}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              <span>Export for Channel</span>
            </button>
          </div>
        </div>

        {/* Channel Selector */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-400 mb-3 uppercase tracking-widest">Select Channel Brand</label>
          <div className="flex flex-wrap gap-3">
            {CHANNELS.map(channel => (
              <button
                key={channel}
                onClick={() => setSelectedChannel(channel)}
                className={`px-5 py-3 rounded-xl border text-sm font-bold transition-all ${
                  selectedChannel === channel 
                  ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {channel}
              </button>
            ))}
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
            Error: {error}
          </div>
        )}
        {isFallback && !loading && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300/80 text-sm flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
            Showing sample data. NSE API might be blocking the direct fetch request.
          </div>
        )}

        {/* Main Card Wrapper */}
        <div className="bg-gray-950 p-4 sm:p-8 rounded-3xl border border-gray-800/60 shadow-2xl overflow-x-auto flex justify-center min-h-[500px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center text-gray-500 gap-4 w-full h-full my-auto">
              <RefreshCw size={32} className="animate-spin text-blue-500/50" />
              <p className="animate-pulse font-mono tracking-widest uppercase">Fetching Data...</p>
            </div>
          ) : (
            <div className="scale-[0.85] sm:scale-100 origin-top">
              {selectedChannel === "AlphX" && renderAlphX()}
              {selectedChannel === "THE ALPHA ANALYST" && renderAlphaAnalyst()}
              {selectedChannel === "AJINKYA DVKATTE" && renderAjinkya()}
              {selectedChannel === "TRADE VISTA" && renderTradeVista()}
            </div>
          )}
        </div>
        
      </div>
    </main>
  );
}
