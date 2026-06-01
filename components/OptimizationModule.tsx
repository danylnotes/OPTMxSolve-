import React, { useState } from 'react';
import { TrendingUp, Loader2, Play, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Sliders } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';

interface OptimizationResult {
  status: string;
  objective_value: number;
  unit_allocations: Record<string, number>;
  product_yields: Record<string, number>;
  gross_margin_usd: number;
  recommendations: string[];
  sensitivity: Record<string, number>;
}

type PricesMap = Record<string, number>;

interface OptimizationModuleProps {
  isDay: boolean;
}

const DEFAULT_PRICES = {
  crude_price_usd: 78.0,
  isomerate: 95.0,
  kerosene: 100.0,
  diesel: 98.0,
  vgo_diesel: 92.0,
  fcc_gasoline: 88.0,
  fcc_lpg: 72.0,
  bitumen: 45.0,
  sulfur: 12.0,
};

const PRODUCT_COLORS: Record<string, string> = {
  isomerate: '#fbbf24',
  kerosene: '#06b6d4',
  diesel: '#10b981',
  vgo_diesel: '#22c55e',
  fcc_gasoline: '#f97316',
  fcc_lpg: '#84cc16',
  bitumen: '#78716c',
  sulfur: '#f59e0b',
};

export const OptimizationModule: React.FC<OptimizationModuleProps> = ({ isDay }) => {
  const [crudeFeed, setCrudeFeed] = useState(140000);
  const [objective, setObjective] = useState('max_margin');
  const [prices, setPrices] = useState<PricesMap>(DEFAULT_PRICES);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrices, setShowPrices] = useState(false);

  const isD = !isDay;
  const cardBase = isD ? 'bg-gray-900/60 border-white/10 text-gray-100' : 'bg-white/80 border-gray-200 text-gray-800';
  const inputBase = isD
    ? 'bg-black/30 border-white/15 text-white placeholder-gray-600 focus:border-blue-500'
    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-sky-400';
  const subText = isD ? 'text-gray-400' : 'text-gray-500';

  const runOptimization = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/optimize/lp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crude_feed_bpd: crudeFeed,
          objective,
          crude_price_usd: prices.crude_price_usd,
          product_prices: {
            isomerate: prices.isomerate,
            kerosene: prices.kerosene,
            diesel: prices.diesel,
            vgo_diesel: prices.vgo_diesel,
            fcc_gasoline: prices.fcc_gasoline,
            fcc_lpg: prices.fcc_lpg,
            bitumen: prices.bitumen,
            sulfur: prices.sulfur,
          },
        }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data: OptimizationResult = await response.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to connect to optimization backend');
    } finally {
      setLoading(false);
    }
  };

  const yieldChartData = result
    ? Object.entries(result.product_yields).map(([k, v]) => ({
        name: k.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
        value: Math.round(v as number),
        color: PRODUCT_COLORS[k] ?? '#6b7280',
      }))
    : [];

  const allocChartData = result
    ? Object.entries(result.unit_allocations).map(([k, v]) => ({
        name: k.toUpperCase(),
        value: Math.round(v as number),
      }))
    : [];

  const radarData = result
    ? [
        { subject: 'GRM', value: Math.min(100, (result.gross_margin_usd / 20) * 100) },
        { subject: 'Throughput', value: Math.min(100, (crudeFeed / 140000) * 100) },
        { subject: 'Yield', value: Math.min(100, (Object.values(result.product_yields) as number[]).reduce((a, b) => a + b, 0) / 140000 * 100) },
        { subject: 'Distillate', value: Math.min(100, ((result.product_yields.kerosene ?? 0) + (result.product_yields.diesel ?? 0)) / 56000 * 100) },
        { subject: 'Margin', value: Math.min(100, result.objective_value / 20 * 100) },
      ]
    : [];

  return (
    <div className={`rounded-2xl border glass-panel p-6 ${cardBase}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className={`w-5 h-5 ${isD ? 'text-green-400' : 'text-green-600'}`} />
            LP Optimization Engine
          </h2>
          <p className={`text-xs mt-0.5 ${subText}`}>Gross Refinery Margin maximization via Linear Programming</p>
        </div>
        {result && (
          <div className={`text-right`}>
            <div className={`text-2xl font-black ${isD ? 'text-green-300' : 'text-green-700'}`}>
              ${result.gross_margin_usd.toLocaleString()}
            </div>
            <div className={`text-xs ${subText}`}>Gross Margin USD/day</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${subText}`}>Crude Feed (BPD)</label>
          <input type="number" value={crudeFeed} onChange={e => setCrudeFeed(Number(e.target.value))}
            className={`w-full px-3 py-2 rounded-xl border text-sm font-mono transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${inputBase}`} />
        </div>
        <div>
          <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${subText}`}>Objective</label>
          <select value={objective} onChange={e => setObjective(e.target.value)}
            className={`w-full px-3 py-2 rounded-xl border text-sm transition-all focus:outline-none ${inputBase}`}>
            <option value="max_margin">Maximize GRM</option>
            <option value="max_throughput">Maximize Throughput</option>
            <option value="max_distillate">Maximize Distillate</option>
            <option value="min_energy">Minimize Energy</option>
          </select>
        </div>
        <div>
          <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${subText}`}>Crude Price (USD/bbl)</label>
          <input type="number" value={prices.crude_price_usd} step="0.5"
            onChange={e => setPrices(p => ({ ...p, crude_price_usd: Number(e.target.value) }))}
            className={`w-full px-3 py-2 rounded-xl border text-sm font-mono transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${inputBase}`} />
        </div>
      </div>

      {/* Expandable product prices */}
      <div className={`rounded-xl border mb-4 overflow-hidden ${isD ? 'border-white/10' : 'border-gray-200'}`}>
        <button className={`w-full flex items-center justify-between px-4 py-3 text-xs font-semibold transition-colors ${isD ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}
          onClick={() => setShowPrices(v => !v)}>
          <span className={`uppercase tracking-widest ${subText}`}>Product Prices (USD/bbl)</span>
          {showPrices ? <ChevronUp className="w-4 h-4 opacity-50" /> : <ChevronDown className="w-4 h-4 opacity-50" />}
        </button>
        {showPrices && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
            {Object.entries(prices).filter(([k]) => k !== 'crude_price_usd').map(([key, val]) => (
              <div key={key}>
                <label className={`block text-[9px] uppercase tracking-wide mb-1 ${subText}`}>{key.replace('_', ' ')}</label>
                <input type="number" value={val} step="0.5"
                  onChange={e => setPrices(p => ({ ...p, [key]: Number(e.target.value) }))}
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono focus:outline-none ${inputBase}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Run button */}
      <button onClick={runOptimization} disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all mb-6 ${
          loading
            ? (isD ? 'bg-white/10 text-white/50 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
            : (isD ? 'bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-900/40' : 'bg-green-600 hover:bg-green-500 text-white shadow-lg')
        }`}>
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Running LP Solver...</>
        ) : (
          <><Play className="w-4 h-4" /> Run Optimization</>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className={`flex items-start gap-3 p-4 rounded-xl mb-4 ${isD ? 'bg-red-900/30 border border-red-600/40' : 'bg-red-50 border border-red-200'}`}>
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-red-400">Optimization Failed</div>
            <div className={`text-xs mt-0.5 ${subText}`}>{error}</div>
            <div className={`text-xs mt-1 ${subText}`}>Ensure the backend is running: <code className="font-mono">uvicorn backend.main:app --port 8000</code></div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-5">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Status', val: result.status.toUpperCase(), color: result.status === 'optimal' ? '#22c55e' : '#f59e0b' },
              { label: 'GRM $/bbl', val: `$${result.objective_value.toFixed(2)}`, color: '#3b82f6' },
              { label: 'Daily Margin', val: `$${(result.gross_margin_usd / 1000).toFixed(0)}k`, color: '#10b981' },
              { label: 'Feed', val: `${(crudeFeed / 1000).toFixed(1)}k BPD`, color: '#8b5cf6' },
            ].map(kpi => (
              <div key={kpi.label} className={`rounded-xl p-4 border ${isD ? 'bg-black/30 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`text-[10px] uppercase tracking-widest mb-1 ${subText}`}>{kpi.label}</div>
                <div className="text-xl font-black" style={{ color: kpi.color }}>{kpi.val}</div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product yields chart */}
            <div className={`rounded-xl p-4 border ${isD ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wide mb-3 ${subText}`}>Product Yields (BPD)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={yieldChartData} layout="vertical" margin={{ left: 60, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isD ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} />
                  <XAxis type="number" tick={{ fill: isD ? '#6b7280' : '#9ca3af', fontSize: 9 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: isD ? '#9ca3af' : '#6b7280', fontSize: 9 }} width={60} />
                  <Tooltip
                    contentStyle={{ background: isD ? '#111827' : 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                    labelStyle={{ color: isD ? 'white' : '#111' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {yieldChartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Radar chart */}
            <div className={`rounded-xl p-4 border ${isD ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wide mb-3 ${subText}`}>Performance Radar</h3>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData} outerRadius={75}>
                  <PolarGrid stroke={isD ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: isD ? '#9ca3af' : '#6b7280', fontSize: 9 }} />
                  <Radar dataKey="value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sensitivity */}
          {Object.keys(result.sensitivity).length > 0 && (
            <div className={`rounded-xl p-4 border ${isD ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wide mb-3 ${subText}`}>Price Sensitivity ($/bbl GRM per $1 price change)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(result.sensitivity).map(([k, v]) => {
                  const sv = v as number;
                  return (
                    <div key={k} className={`rounded-lg p-2.5 ${isD ? 'bg-white/5' : 'bg-white'}`}>
                      <div className={`text-[9px] uppercase tracking-wide ${subText}`}>{k.replace('_', ' ')}</div>
                      <div className={`text-sm font-bold ${sv > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {sv > 0 ? '+' : ''}{sv.toFixed(3)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className={`rounded-xl p-4 border ${isD ? 'bg-blue-950/30 border-blue-600/30' : 'bg-blue-50 border-blue-200'}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-2 ${isD ? 'text-blue-300' : 'text-blue-700'}`}>
                <CheckCircle className="w-3.5 h-3.5" />
                Optimization Recommendations
              </h3>
              <ul className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className={`flex items-start gap-2 text-xs ${isD ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${isD ? 'bg-blue-400' : 'bg-blue-500'}`} />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
