import React, { useState, useEffect } from 'react';
import { Thermometer, Zap, AlertCircle, CheckCircle, TrendingDown, TrendingUp } from 'lucide-react';

interface SteamHeader {
  name: string;
  pressure: string;
  temp: string;
  generation: number;    // T/h
  consumption: number;   // T/h
  balance: number;       // net T/h
  color: string;
  bgColor: string;
}

interface SteamConsumer {
  unit: string;
  hps: number;
  mps: number;
  lps: number;
}

interface SteamBalanceVisualizationProps {
  isDay: boolean;
  crudeFeedBpd?: number;
  backendData?: {
    hps: { generation: number; consumption: number; balance: number };
    mps: { generation: number; consumption: number; balance: number };
    lps: { generation: number; consumption: number; balance: number };
    consumers: Array<{ unit: string; hps: number; mps: number; lps: number }>;
    total_generation: number;
    total_consumption: number;
  } | null;
}

// Feb 2024 baseline data from steam balance sheet
const BASELINE_CONSUMERS: SteamConsumer[] = [
  { unit: 'CDU/VDU',     hps: 0,    mps: 44.4,  lps: 28.5 },
  { unit: 'NHT',         hps: 0,    mps: 4.2,   lps: 2.8  },
  { unit: 'ISOM',        hps: 0,    mps: 3.1,   lps: 1.9  },
  { unit: 'CCR',         hps: 0,    mps: 6.8,   lps: 4.2  },
  { unit: 'KHT',         hps: 0,    mps: 5.5,   lps: 3.4  },
  { unit: 'DHT',         hps: 0,    mps: 9.2,   lps: 5.8  },
  { unit: 'VGO-HT',      hps: 0,    mps: 12.4,  lps: 7.6  },
  { unit: 'FCC',         hps: 0,    mps: 38.0,  lps: 22.5 },
  { unit: 'SRU/TGTU',    hps: 0,    mps: 5.3,   lps: 6.8  },
  { unit: 'ARU/SWS',     hps: 0,    mps: 2.4,   lps: 4.1  },
  { unit: 'HPU',         hps: 22.5, mps: 0,     lps: 0    },
  { unit: 'STG #1',      hps: 85.0, mps: 0,     lps: 0    },
  { unit: 'Boilers',     hps: 18.0, mps: 0,     lps: 6.0  },
  { unit: 'Misc/Tracing', hps: 0,   mps: 4.5,   lps: 12.8 },
];

const HPS_GEN = 1110;  // T/h total HPS generation
const MPS_GEN = 340;
const LPS_GEN = 195;

export const SteamBalanceVisualization: React.FC<SteamBalanceVisualizationProps> = ({
  isDay, crudeFeedBpd = 140000, backendData,
}) => {
  const [activeView, setActiveView] = useState<'headers' | 'consumers' | 'flow'>('headers');

  const scale = crudeFeedBpd / 140000;

  // Use backend data if available, otherwise compute from baseline
  const hpsGen  = backendData ? backendData.hps.generation  : Math.round(HPS_GEN * scale);
  const mpGen   = backendData ? backendData.mps.generation  : Math.round(MPS_GEN * scale);
  const lpsGen  = backendData ? backendData.lps.generation  : Math.round(LPS_GEN * scale);

  const hpsCons = backendData ? backendData.hps.consumption : Math.round(125.5 * scale);
  const mpsCons = backendData ? backendData.mps.consumption : Math.round(135.8 * scale);
  const lpsCons = backendData ? backendData.lps.consumption : Math.round(106.4 * scale);

  const consumers = backendData?.consumers ?? BASELINE_CONSUMERS.map(c => ({
    unit: c.unit,
    hps: Math.round(c.hps * scale * 10) / 10,
    mps: Math.round(c.mps * scale * 10) / 10,
    lps: Math.round(c.lps * scale * 10) / 10,
  }));

  const headers: SteamHeader[] = [
    {
      name: 'HPS', pressure: '42 barg', temp: '~450°C',
      generation: hpsGen, consumption: hpsCons, balance: hpsGen - hpsCons,
      color: '#ef4444', bgColor: 'rgba(239,68,68,0.1)',
    },
    {
      name: 'MPS', pressure: '11 barg', temp: '~250°C',
      generation: mpGen, consumption: mpsCons, balance: mpGen - mpsCons,
      color: '#f97316', bgColor: 'rgba(249,115,22,0.1)',
    },
    {
      name: 'LPS', pressure: '3.5 barg', temp: '~145°C',
      generation: lpsGen, consumption: lpsCons, balance: lpsGen - lpsCons,
      color: '#3b82f6', bgColor: 'rgba(59,130,246,0.1)',
    },
  ];

  const totalGen  = hpsGen + mpGen + lpsGen;
  const totalCons = hpsCons + mpsCons + lpsCons;
  const netBalance = totalGen - totalCons;

  const isD = !isDay;
  const cardBase = isD
    ? 'bg-gray-900/60 border-white/10 text-gray-100'
    : 'bg-white/80 border-gray-200 text-gray-800';
  const subText = isD ? 'text-gray-400' : 'text-gray-500';
  const tabBase = isD ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200';
  const tabActive = isD ? 'bg-blue-600 text-white' : 'bg-brand-sky text-white shadow-sm';

  const barMax = Math.max(hpsGen, mpGen, lpsGen) * 1.1;

  return (
    <div className={`rounded-2xl border glass-panel p-5 ${cardBase}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Thermometer className={`w-5 h-5 ${isD ? 'text-orange-400' : 'text-orange-500'}`} />
            Steam Balance
          </h2>
          <p className={`text-xs mt-0.5 ${subText}`}>
            HPS / MPS / LPS header status — {crudeFeedBpd.toLocaleString()} BPD basis
          </p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
          netBalance >= 0
            ? (isD ? 'bg-green-900/40 border-green-600/40 text-green-300' : 'bg-green-50 border-green-300 text-green-700')
            : (isD ? 'bg-red-900/40 border-red-600/40 text-red-300' : 'bg-red-50 border-red-300 text-red-700')
        }`}>
          {netBalance >= 0 ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
          Net {netBalance >= 0 ? '+' : ''}{netBalance.toFixed(0)} T/h
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 p-1 rounded-xl mb-5 w-fit" style={{ background: isD ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
        {(['headers', 'consumers', 'flow'] as const).map(v => (
          <button key={v} onClick={() => setActiveView(v)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${activeView === v ? tabActive : tabBase}`}>
            {v === 'headers' ? 'Headers' : v === 'consumers' ? 'Consumers' : 'Flow Diagram'}
          </button>
        ))}
      </div>

      {/* === HEADERS VIEW === */}
      {activeView === 'headers' && (
        <div className="space-y-4">
          {headers.map(h => {
            const genPct = (h.generation / barMax) * 100;
            const consPct = (h.consumption / barMax) * 100;
            const isSurplus = h.balance >= 0;
            return (
              <div key={h.name} className="rounded-xl border p-4 transition-all"
                style={{ background: h.bgColor, borderColor: h.color + '40' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm"
                      style={{ background: h.color + '25', color: h.color, border: `1px solid ${h.color}50` }}>
                      {h.name}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{h.pressure}</div>
                      <div className={`text-xs ${subText}`}>{h.temp}</div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                    isSurplus
                      ? (isD ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700')
                      : (isD ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700')
                  }`}>
                    {isSurplus ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isSurplus ? '+' : ''}{h.balance.toFixed(0)} T/h
                  </div>
                </div>

                {/* Generation bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-[10px] mb-1" style={{ color: h.color }}>
                    <span className="font-semibold uppercase tracking-wide">Generation</span>
                    <span className="font-bold">{h.generation.toFixed(0)} T/h</span>
                  </div>
                  <div className={`h-4 rounded-full overflow-hidden ${isD ? 'bg-white/10' : 'bg-gray-100'}`}>
                    <div className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
                      style={{ width: `${genPct}%`, background: `linear-gradient(90deg, ${h.color}cc, ${h.color})` }}>
                      <div className="absolute inset-0 bg-white/10 animate-pulse rounded-full" style={{ animationDuration: '2s' }} />
                    </div>
                  </div>
                </div>

                {/* Consumption bar */}
                <div>
                  <div className={`flex justify-between text-[10px] mb-1 ${subText}`}>
                    <span className="font-semibold uppercase tracking-wide">Consumption</span>
                    <span className="font-bold">{h.consumption.toFixed(0)} T/h</span>
                  </div>
                  <div className={`h-4 rounded-full overflow-hidden ${isD ? 'bg-white/10' : 'bg-gray-100'}`}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${consPct}%`, background: isD ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }} />
                  </div>
                </div>

                {/* Stats row */}
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Generation', val: `${h.generation.toFixed(0)} T/h` },
                    { label: 'Consumption', val: `${h.consumption.toFixed(0)} T/h` },
                    { label: 'Net Balance', val: `${h.balance >= 0 ? '+' : ''}${h.balance.toFixed(0)} T/h`, color: isSurplus ? '#22c55e' : '#ef4444' },
                  ].map(stat => (
                    <div key={stat.label} className={`rounded-lg p-2 ${isD ? 'bg-black/20' : 'bg-white/60'}`}>
                      <div className="text-[9px] uppercase tracking-wide mb-0.5" style={{ color: h.color + 'cc' }}>{stat.label}</div>
                      <div className="text-xs font-bold" style={stat.color ? { color: stat.color } : {}}>{stat.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Total summary */}
          <div className={`rounded-xl border p-4 ${isD ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: 'Total Generation', val: `${totalGen.toFixed(0)} T/h`, col: '#22c55e' },
                { label: 'Total Consumption', val: `${totalCons.toFixed(0)} T/h`, col: '#f97316' },
                { label: 'Net Balance', val: `${netBalance >= 0 ? '+' : ''}${netBalance.toFixed(0)} T/h`, col: netBalance >= 0 ? '#22c55e' : '#ef4444' },
              ].map(s => (
                <div key={s.label}>
                  <div className={`text-[10px] uppercase tracking-wide mb-1 ${subText}`}>{s.label}</div>
                  <div className="text-lg font-black" style={{ color: s.col }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* === CONSUMERS VIEW === */}
      {activeView === 'consumers' && (
        <div>
          <div className={`rounded-xl overflow-hidden border ${isD ? 'border-white/10' : 'border-gray-200'}`}>
            <table className="w-full text-xs">
              <thead>
                <tr className={isD ? 'bg-white/5' : 'bg-gray-50'}>
                  <th className={`px-4 py-3 text-left font-semibold uppercase tracking-wide ${subText}`}>Unit</th>
                  <th className={`px-3 py-3 text-right font-semibold uppercase tracking-wide text-red-400`}>HPS (T/h)</th>
                  <th className={`px-3 py-3 text-right font-semibold uppercase tracking-wide text-orange-400`}>MPS (T/h)</th>
                  <th className={`px-3 py-3 text-right font-semibold uppercase tracking-wide text-blue-400`}>LPS (T/h)</th>
                  <th className={`px-3 py-3 text-right font-semibold uppercase tracking-wide ${subText}`}>Total</th>
                </tr>
              </thead>
              <tbody>
                {consumers.map((c, i) => {
                  const total = c.hps + c.mps + c.lps;
                  const maxTotal = Math.max(...consumers.map(x => x.hps + x.mps + x.lps));
                  return (
                    <tr key={c.unit} className={`border-t transition-colors hover:bg-white/5 ${isD ? 'border-white/5' : 'border-gray-100'}`}>
                      <td className="px-4 py-2.5 font-semibold">{c.unit}</td>
                      <td className="px-3 py-2.5 text-right">
                        {c.hps > 0 ? <span className="text-red-400 font-mono">{c.hps.toFixed(1)}</span> : <span className={subText}>—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {c.mps > 0 ? <span className="text-orange-400 font-mono">{c.mps.toFixed(1)}</span> : <span className={subText}>—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {c.lps > 0 ? <span className="text-blue-400 font-mono">{c.lps.toFixed(1)}</span> : <span className={subText}>—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className={`h-1.5 rounded-full ${isD ? 'bg-white/10' : 'bg-gray-200'}`} style={{ width: '40px' }}>
                            <div className="h-full rounded-full bg-blue-500 transition-all"
                              style={{ width: `${(total / maxTotal) * 100}%` }} />
                          </div>
                          <span className="font-mono font-bold w-12 text-right">{total.toFixed(1)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === FLOW DIAGRAM === */}
      {activeView === 'flow' && (
        <div className="overflow-x-auto">
          <svg width="820" height="320" className="font-mono">
            {/* Background grid */}
            <defs>
              <pattern id="sg" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke={isD ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'} strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="820" height="320" fill="url(#sg)" />

            {/* Boilers & Generators — left */}
            {[
              { label: 'STG #1/#2', y: 40, val: `${Math.round(320 * scale)} T/h`, col: '#ef4444' },
              { label: 'HRSG',      y: 90, val: `${Math.round(495 * scale)} T/h`, col: '#ef4444' },
              { label: 'Boiler A',  y: 140, val: `${Math.round(164 * scale)} T/h`, col: '#ef4444' },
              { label: 'Boiler B',  y: 180, val: `${Math.round(164 * scale)} T/h`, col: '#ef4444' },
              { label: 'Boiler C',  y: 220, val: `${Math.round(167 * scale)} T/h`, col: '#ef4444' },
            ].map(src => (
              <g key={src.label}>
                <rect x={10} y={src.y} width={110} height={28} rx="4" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeOpacity="0.5" strokeWidth="1" />
                <text x={65} y={src.y + 12} textAnchor="middle" fill="white" fontSize="8" fontWeight="600">{src.label}</text>
                <text x={65} y={src.y + 22} textAnchor="middle" fill="#ef4444" fontSize="8">{src.val}</text>
                <line x1={120} y1={src.y+14} x2={200} y2={150} stroke="#ef4444" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="4,3" />
              </g>
            ))}

            {/* HPS Header */}
            <rect x={200} y={120} width={100} height={60} rx="6" fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="1.5" />
            <text x={250} y={145} textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="700">HPS</text>
            <text x={250} y={158} textAnchor="middle" fill="white" fontSize="9">42 barg</text>
            <text x={250} y={170} textAnchor="middle" fill="#ef4444" fontSize="8">{hpsGen} T/h</text>

            {/* HPS → MPS letdown */}
            <line x1={300} y1={150} x2={380} y2={190} stroke="#f97316" strokeWidth="2" strokeOpacity="0.6" markerEnd="url(#tarrow)" />
            <text x={338} y={175} fill="#f97316" fontSize="7" textAnchor="middle">Letdown</text>

            {/* MPS Header */}
            <rect x={380} y={165} width={100} height={60} rx="6" fill="#f97316" fillOpacity="0.2" stroke="#f97316" strokeWidth="1.5" />
            <text x={430} y={190} textAnchor="middle" fill="#f97316" fontSize="11" fontWeight="700">MPS</text>
            <text x={430} y={203} textAnchor="middle" fill="white" fontSize="9">11 barg</text>
            <text x={430} y={215} textAnchor="middle" fill="#f97316" fontSize="8">{mpGen} T/h</text>

            {/* MPS → LPS letdown */}
            <line x1={480} y1={195} x2={560} y2={230} stroke="#3b82f6" strokeWidth="2" strokeOpacity="0.6" />
            <text x={518} y={218} fill="#3b82f6" fontSize="7" textAnchor="middle">Letdown</text>

            {/* LPS Header */}
            <rect x={560} y={210} width={100} height={60} rx="6" fill="#3b82f6" fillOpacity="0.2" stroke="#3b82f6" strokeWidth="1.5" />
            <text x={610} y={235} textAnchor="middle" fill="#3b82f6" fontSize="11" fontWeight="700">LPS</text>
            <text x={610} y={248} textAnchor="middle" fill="white" fontSize="9">3.5 barg</text>
            <text x={610} y={260} textAnchor="middle" fill="#3b82f6" fontSize="8">{lpsGen} T/h</text>

            {/* Consumer branches */}
            {[
              { x: 660, label: 'Process Units', val: `${mpsCons} T/h`, y: 195, col: '#f97316' },
              { x: 660, label: 'Process Units', val: `${lpsCons} T/h`, y: 240, col: '#3b82f6' },
            ].map((c, i) => (
              <g key={i}>
                <line x1={660} y1={c.y} x2={740} y2={c.y} stroke={c.col} strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="3,2" />
                <rect x={740} y={c.y-12} width={70} height={24} rx="4" fill={c.col} fillOpacity="0.15" stroke={c.col} strokeOpacity="0.4" strokeWidth="0.5" />
                <text x={775} y={c.y+2} textAnchor="middle" fill="white" fontSize="8">{c.label}</text>
                <text x={775} y={c.y+12} textAnchor="middle" fill={c.col} fontSize="8">{c.val}</text>
              </g>
            ))}

            {/* HPS consumers */}
            <line x1={300} y1={145} x2={740} y2={145} stroke="#ef4444" strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="3,2" />
            <rect x={740} y={133} width={70} height={24} rx="4" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeOpacity="0.4" strokeWidth="0.5" />
            <text x={775} y={143} textAnchor="middle" fill="white" fontSize="8">Process Units</text>
            <text x={775} y={153} textAnchor="middle" fill="#ef4444" fontSize="8">{hpsCons} T/h</text>

            {/* Net balance indicator */}
            <rect x={200} y={270} width={560} height={30} rx="6"
              fill={netBalance >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}
              stroke={netBalance >= 0 ? '#22c55e' : '#ef4444'} strokeWidth="1" strokeOpacity="0.5" />
            <text x={480} y={282} textAnchor="middle" fill={netBalance >= 0 ? '#22c55e' : '#ef4444'} fontSize="9" fontWeight="700">
              SYSTEM NET BALANCE
            </text>
            <text x={480} y={293} textAnchor="middle" fill="white" fontSize="11" fontWeight="700">
              {netBalance >= 0 ? '+' : ''}{netBalance.toFixed(0)} T/h  |  Total Gen: {totalGen.toFixed(0)}  |  Total Cons: {totalCons.toFixed(0)} T/h
            </text>

            <defs>
              <marker id="tarrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#f97316" opacity="0.7" />
              </marker>
            </defs>
          </svg>
        </div>
      )}
    </div>
  );
};
