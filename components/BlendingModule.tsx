
import React, { useState, useCallback } from 'react';
import { FlaskConical, Plus, Trash2, Zap, CheckCircle, XCircle, RefreshCw, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from './ui/Card';

type BlendTab = 'gasoline' | 'diesel';

interface GasComp {
  id: string;
  name: string;
  ron: number;
  mon: number;
  rvp: number;
  sulfur: number;
  density: number;
  cost: number;
}

interface DslComp {
  id: string;
  name: string;
  cetane: number;
  density: number;
  sulfur: number;
  cost: number;
}

interface BlendRow {
  id: string;
  componentId: string;
  volume: number;
}

interface OptResult {
  ratios: { componentId: string; volume: number }[];
  cost: number;
  savings: number;
}

const GAS_COMPS: GasComp[] = [
  { id: 'reformate',    name: 'Reformate (CCR-04)',       ron: 102, mon: 92, rvp: 3.2,  sulfur: 1,   density: 0.785, cost: 82 },
  { id: 'isomerate',   name: 'Isomerate (ISOM-03)',      ron: 87,  mon: 85, rvp: 12.5, sulfur: 0.5, density: 0.655, cost: 74 },
  { id: 'fcc_gasoline',name: 'FCC Gasoline (FCC-08)',    ron: 93,  mon: 82, rvp: 7.8,  sulfur: 120, density: 0.730, cost: 68 },
  { id: 'poly_gasoline',name:'Poly-gasoline (POLY-09)',  ron: 90,  mon: 84, rvp: 5.5,  sulfur: 5,   density: 0.745, cost: 71 },
  { id: 'butane',      name: 'n-Butane',                 ron: 94,  mon: 89, rvp: 51.7, sulfur: 0,   density: 0.584, cost: 55 },
];

const DSL_COMPS: DslComp[] = [
  { id: 'ulsd',    name: 'ULSD (DHT-06)',    cetane: 52, density: 0.840, sulfur: 8,   cost: 88 },
  { id: 'atk',    name: 'ATK/Jet (KHT-05)', cetane: 45, density: 0.800, sulfur: 3,   cost: 92 },
  { id: 'vgo',    name: 'Heavy VGO cut',     cetane: 38, density: 0.880, sulfur: 450, cost: 58 },
  { id: 'fcc_lcO',name: 'FCC LCO',           cetane: 22, density: 0.910, sulfur: 800, cost: 45 },
];

let rowCounter = 0;
const newId = () => `row_${++rowCounter}`;

function calcGas(rows: BlendRow[]) {
  const resolved = rows
    .map(r => ({ row: r, comp: GAS_COMPS.find(c => c.id === r.componentId) }))
    .filter((x): x is { row: BlendRow; comp: GasComp } => !!x.comp && x.row.volume > 0);

  const totalVol = resolved.reduce((s, x) => s + x.row.volume, 0);
  if (totalVol === 0) return null;

  const ron      = resolved.reduce((s, x) => s + x.row.volume * x.comp.ron, 0) / totalVol;
  const mon      = resolved.reduce((s, x) => s + x.row.volume * x.comp.mon, 0) / totalVol;
  const rvpRaw   = resolved.reduce((s, x) => s + x.row.volume * Math.pow(x.comp.rvp, 1.25), 0) / totalVol;
  const rvp      = Math.pow(rvpRaw, 1 / 1.25);
  const sulfur   = resolved.reduce((s, x) => s + x.row.volume * x.comp.sulfur, 0) / totalVol;
  const density  = resolved.reduce((s, x) => s + x.row.volume * x.comp.density, 0) / totalVol;
  const cost     = resolved.reduce((s, x) => s + x.row.volume * x.comp.cost, 0) / totalVol;

  return { ron, mon, rvp, sulfur, density, cost, totalVol };
}

function calcDsl(rows: BlendRow[]) {
  const resolved = rows
    .map(r => ({ row: r, comp: DSL_COMPS.find(c => c.id === r.componentId) }))
    .filter((x): x is { row: BlendRow; comp: DslComp } => !!x.comp && x.row.volume > 0);

  const totalVol = resolved.reduce((s, x) => s + x.row.volume, 0);
  if (totalVol === 0) return null;

  const cetane  = resolved.reduce((s, x) => s + x.row.volume * x.comp.cetane, 0) / totalVol;
  const density = resolved.reduce((s, x) => s + x.row.volume * x.comp.density, 0) / totalVol;
  const sulfur  = resolved.reduce((s, x) => s + x.row.volume * x.comp.sulfur, 0) / totalVol;
  const cost    = resolved.reduce((s, x) => s + x.row.volume * x.comp.cost, 0) / totalVol;

  return { cetane, density, sulfur, cost, totalVol };
}

function gasSpecPass(props: ReturnType<typeof calcGas>) {
  if (!props) return { ron: false, mon: false, rvp: false, sulfur: false };
  return {
    ron:    props.ron >= 95,
    mon:    props.mon >= 85,
    rvp:    props.rvp <= 60,
    sulfur: props.sulfur <= 10,
  };
}

function dslSpecPass(props: ReturnType<typeof calcDsl>) {
  if (!props) return { cetane: false, sulfur: false, density: false };
  return {
    cetane:  props.cetane >= 51,
    sulfur:  props.sulfur <= 10,
    density: props.density >= 0.820 && props.density <= 0.845,
  };
}

function optimizeGas(currentCost: number): OptResult | null {
  const comps = GAS_COMPS;
  let best: OptResult | null = null;

  const steps = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  for (const v0 of steps) {
    for (const v1 of steps) {
      for (const v2 of steps) {
        for (const v3 of steps) {
          const v4 = 100 - v0 - v1 - v2 - v3;
          if (v4 < 0) continue;
          const vols = [v0, v1, v2, v3, v4];
          const totalVol = 100;

          const ron    = vols.reduce((s, v, i) => s + v * comps[i].ron, 0) / totalVol;
          const mon    = vols.reduce((s, v, i) => s + v * comps[i].mon, 0) / totalVol;
          const rvpRaw = vols.reduce((s, v, i) => s + v * Math.pow(comps[i].rvp, 1.25), 0) / totalVol;
          const rvp    = Math.pow(rvpRaw, 1 / 1.25);
          const sulfur = vols.reduce((s, v, i) => s + v * comps[i].sulfur, 0) / totalVol;
          const cost   = vols.reduce((s, v, i) => s + v * comps[i].cost, 0) / totalVol;

          if (ron >= 95 && mon >= 85 && rvp <= 60 && sulfur <= 10) {
            if (!best || cost < best.cost) {
              best = {
                ratios: comps.map((c, i) => ({ componentId: c.id, volume: vols[i] })).filter(r => r.volume > 0),
                cost,
                savings: currentCost - cost,
              };
            }
          }
        }
      }
    }
  }
  return best;
}

function optimizeDsl(currentCost: number): OptResult | null {
  const comps = DSL_COMPS;
  let best: OptResult | null = null;

  const steps = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  for (const v0 of steps) {
    for (const v1 of steps) {
      for (const v2 of steps) {
        const v3 = 100 - v0 - v1 - v2;
        if (v3 < 0) continue;
        const vols = [v0, v1, v2, v3];
        const totalVol = 100;

        const cetane  = vols.reduce((s, v, i) => s + v * comps[i].cetane, 0) / totalVol;
        const density = vols.reduce((s, v, i) => s + v * comps[i].density, 0) / totalVol;
        const sulfur  = vols.reduce((s, v, i) => s + v * comps[i].sulfur, 0) / totalVol;
        const cost    = vols.reduce((s, v, i) => s + v * comps[i].cost, 0) / totalVol;

        if (cetane >= 51 && sulfur <= 10 && density >= 0.820 && density <= 0.845) {
          if (!best || cost < best.cost) {
            best = {
              ratios: comps.map((c, i) => ({ componentId: c.id, volume: vols[i] })).filter(r => r.volume > 0),
              cost,
              savings: currentCost - cost,
            };
          }
        }
      }
    }
  }
  return best;
}

const SpecBadge: React.FC<{ pass: boolean; label: string; value: string; spec: string; isDay: boolean }> = ({ pass, label, value, spec, isDay }) => (
  <div className={`flex items-center justify-between p-2.5 rounded-lg border ${
    pass
      ? (isDay ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-900/20 border-emerald-700/40')
      : (isDay ? 'bg-red-50 border-red-200' : 'bg-red-900/20 border-red-700/40')
  }`}>
    <div className="flex items-center gap-2">
      {pass
        ? <CheckCircle className={`w-4 h-4 ${isDay ? 'text-emerald-600' : 'text-neon-green'}`} />
        : <XCircle className={`w-4 h-4 ${isDay ? 'text-red-600' : 'text-neon-red'}`} />
      }
      <span className={`text-xs font-bold uppercase tracking-wider ${isDay ? 'text-slate-700' : 'text-white/80'}`}>{label}</span>
    </div>
    <div className="text-right">
      <span className={`text-sm font-mono font-black ${pass ? (isDay ? 'text-emerald-700' : 'text-neon-green') : (isDay ? 'text-red-700' : 'text-neon-red')}`}>{value}</span>
      <span className={`text-[10px] block ${isDay ? 'text-slate-400' : 'text-white/40'}`}>{spec}</span>
    </div>
  </div>
);

export const BlendingModule: React.FC = () => {
  const isDay = document.documentElement.getAttribute('data-theme') === 'light';
  const [activeTab, setActiveTab] = useState<BlendTab>('gasoline');
  const [gasRows, setGasRows] = useState<BlendRow[]>([{ id: newId(), componentId: 'reformate', volume: 60 }, { id: newId(), componentId: 'isomerate', volume: 40 }]);
  const [dslRows, setDslRows] = useState<BlendRow[]>([{ id: newId(), componentId: 'ulsd', volume: 80 }, { id: newId(), componentId: 'atk', volume: 20 }]);
  const [gasOptResult, setGasOptResult] = useState<OptResult | null>(null);
  const [dslOptResult, setDslOptResult] = useState<OptResult | null>(null);
  const [optimizing, setOptimizing] = useState(false);

  const rows = activeTab === 'gasoline' ? gasRows : dslRows;
  const setRows = activeTab === 'gasoline' ? setGasRows : setDslRows;

  const addRow = useCallback(() => {
    const defaultId = activeTab === 'gasoline' ? GAS_COMPS[0].id : DSL_COMPS[0].id;
    setRows(prev => [...prev, { id: newId(), componentId: defaultId, volume: 0 }]);
  }, [activeTab, setRows]);

  const removeRow = useCallback((id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  }, [setRows]);

  const updateRow = useCallback((id: string, field: 'componentId' | 'volume', value: string | number) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }, [setRows]);

  const gasProps = calcGas(gasRows);
  const dslProps = calcDsl(dslRows);
  const gasSpec  = gasSpecPass(gasProps);
  const dslSpec  = dslSpecPass(dslProps);

  const currentProps = activeTab === 'gasoline' ? gasProps : dslProps;
  const currentSpec  = activeTab === 'gasoline' ? gasSpec  : dslSpec;
  const specValues   = Object.values(currentSpec);
  const passCount    = specValues.filter(Boolean).length;
  const totalSpec    = specValues.length;
  const optResult    = activeTab === 'gasoline' ? gasOptResult : dslOptResult;

  const chartData = rows
    .filter(r => r.volume > 0)
    .map(r => {
      const compName = activeTab === 'gasoline'
        ? GAS_COMPS.find(c => c.id === r.componentId)?.name ?? r.componentId
        : DSL_COMPS.find(c => c.id === r.componentId)?.name ?? r.componentId;
      return { name: compName.split(' ')[0], volume: r.volume };
    });

  const handleOptimize = useCallback(() => {
    setOptimizing(true);
    setTimeout(() => {
      if (activeTab === 'gasoline') {
        const currentCost = gasProps?.cost ?? 0;
        setGasOptResult(optimizeGas(currentCost));
      } else {
        const currentCost = dslProps?.cost ?? 0;
        setDslOptResult(optimizeDsl(currentCost));
      }
      setOptimizing(false);
    }, 400);
  }, [activeTab, gasProps, dslProps]);

  const compOptions = activeTab === 'gasoline' ? GAS_COMPS : DSL_COMPS;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 ${isDay ? 'border-slate-200' : 'border-industrial-700'}`}>
        <div>
          <h2 className={`text-2xl font-bold tracking-tight flex items-center gap-3 ${isDay ? 'text-slate-900' : 'text-white'}`}>
            <FlaskConical className={isDay ? 'text-brand-sky' : 'text-neon-blue'} />
            Product Blending Optimizer
          </h2>
          <p className={`text-sm mt-1 ${isDay ? 'text-slate-500' : 'text-white opacity-60'}`}>Euro V compliance & cost optimization</p>
        </div>
        <div className={`flex rounded p-1 border ${isDay ? 'bg-slate-100 border-slate-200' : 'bg-industrial-800 border-industrial-700'}`}>
          <button
            onClick={() => setActiveTab('gasoline')}
            className={`px-4 py-1.5 text-sm font-bold rounded transition-colors flex items-center gap-2 ${
              activeTab === 'gasoline'
                ? (isDay ? 'bg-white text-brand-sky shadow-sm' : 'bg-neon-blue text-white shadow-lg')
                : (isDay ? 'text-slate-500 hover:text-slate-900' : 'text-white opacity-60 hover:opacity-100')
            }`}
          >
            <FlaskConical className="w-3 h-3" /> Gasoline Blend
          </button>
          <button
            onClick={() => setActiveTab('diesel')}
            className={`px-4 py-1.5 text-sm font-bold rounded transition-colors flex items-center gap-2 ${
              activeTab === 'diesel'
                ? (isDay ? 'bg-white text-brand-teal shadow-sm' : 'bg-neon-green text-white shadow-lg')
                : (isDay ? 'text-slate-500 hover:text-slate-900' : 'text-white opacity-60 hover:opacity-100')
            }`}
          >
            <FlaskConical className="w-3 h-3" /> Diesel Blend
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2">
          <div className="space-y-3">
            <div className={`flex items-center justify-between pb-2 border-b ${isDay ? 'border-slate-200' : 'border-white/10'}`}>
              <h3 className={`text-xs font-black uppercase tracking-widest ${isDay ? 'text-slate-600' : 'text-white/60'}`}>Component Library</h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isDay ? 'bg-slate-100 text-slate-500' : 'bg-white/5 text-white/40'}`}>{rows.length} streams</span>
            </div>

            {rows.map((row, idx) => {
              const comp = activeTab === 'gasoline'
                ? GAS_COMPS.find(c => c.id === row.componentId)
                : DSL_COMPS.find(c => c.id === row.componentId);
              return (
                <div key={row.id} className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all ${isDay ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                  <span className={`text-[10px] font-mono font-black w-5 text-center ${isDay ? 'text-slate-400' : 'text-white/30'}`}>{idx + 1}</span>
                  <select
                    value={row.componentId}
                    onChange={e => updateRow(row.id, 'componentId', e.target.value)}
                    className={`flex-1 text-xs font-medium rounded px-2 py-1.5 border outline-none focus:ring-1 ${
                      isDay
                        ? 'bg-white border-slate-200 text-slate-800 focus:ring-brand-sky'
                        : 'bg-industrial-800 border-industrial-600 text-white focus:ring-neon-blue'
                    }`}
                  >
                    {compOptions.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={row.volume}
                      onChange={e => updateRow(row.id, 'volume', Math.max(0, Math.min(100, Number(e.target.value))))}
                      className={`w-16 text-xs font-mono font-bold text-right rounded px-2 py-1.5 border outline-none focus:ring-1 ${
                        isDay
                          ? 'bg-white border-slate-200 text-slate-800 focus:ring-brand-sky'
                          : 'bg-industrial-800 border-industrial-600 text-white focus:ring-neon-blue'
                      }`}
                    />
                    <span className={`text-[10px] ${isDay ? 'text-slate-400' : 'text-white/40'}`}>vol%</span>
                  </div>
                  <button
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length <= 1}
                    className={`p-1.5 rounded transition-colors disabled:opacity-30 ${isDay ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-white/30 hover:bg-red-900/30 hover:text-neon-red'}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            <button
              onClick={addRow}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed text-xs font-bold transition-all ${
                isDay
                  ? 'border-slate-300 text-slate-500 hover:border-brand-sky hover:text-brand-sky hover:bg-sky-50'
                  : 'border-white/20 text-white/40 hover:border-neon-blue hover:text-neon-blue hover:bg-neon-blue/5'
              }`}
            >
              <Plus className="w-3.5 h-3.5" /> Add Component
            </button>
          </div>
        </Card>

        <Card className="lg:col-span-3">
          <div className="space-y-4">
            <div className={`flex items-center justify-between pb-2 border-b ${isDay ? 'border-slate-200' : 'border-white/10'}`}>
              <h3 className={`text-xs font-black uppercase tracking-widest ${isDay ? 'text-slate-600' : 'text-white/60'}`}>Blend Properties — Euro V Spec</h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                passCount === totalSpec
                  ? (isDay ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-900/30 text-neon-green')
                  : (isDay ? 'bg-red-100 text-red-700' : 'bg-red-900/30 text-neon-red')
              }`}>{passCount}/{totalSpec} pass</span>
            </div>

            {activeTab === 'gasoline' && gasProps && (
              <div className="grid grid-cols-2 gap-2">
                <SpecBadge isDay={isDay} pass={gasSpec.ron}    label="RON"    value={gasProps.ron.toFixed(1)}    spec="≥ 95" />
                <SpecBadge isDay={isDay} pass={gasSpec.mon}    label="MON"    value={gasProps.mon.toFixed(1)}    spec="≥ 85" />
                <SpecBadge isDay={isDay} pass={gasSpec.rvp}    label="RVP"    value={`${gasProps.rvp.toFixed(1)} kPa`} spec="≤ 60 kPa" />
                <SpecBadge isDay={isDay} pass={gasSpec.sulfur} label="Sulfur" value={`${gasProps.sulfur.toFixed(1)} ppm`} spec="≤ 10 ppm" />
              </div>
            )}

            {activeTab === 'diesel' && dslProps && (
              <div className="grid grid-cols-1 gap-2">
                <SpecBadge isDay={isDay} pass={dslSpec.cetane}  label="Cetane Index" value={dslProps.cetane.toFixed(1)}                   spec="≥ 51" />
                <SpecBadge isDay={isDay} pass={dslSpec.sulfur}  label="Sulfur"       value={`${dslProps.sulfur.toFixed(1)} ppm`}           spec="≤ 10 ppm" />
                <SpecBadge isDay={isDay} pass={dslSpec.density} label="Density"      value={`${dslProps.density.toFixed(3)} kg/L`}          spec="0.820–0.845" />
              </div>
            )}

            {!currentProps && (
              <div className={`text-center py-6 text-xs ${isDay ? 'text-slate-400' : 'text-white/30'}`}>Add components with volume &gt; 0 to see blend properties</div>
            )}

            {currentProps && (
              <div className={`flex items-center justify-between p-3 rounded-lg border ${isDay ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                <span className={`text-xs font-bold uppercase tracking-wider ${isDay ? 'text-slate-500' : 'text-white/50'}`}>Blend Cost</span>
                <span className={`text-xl font-mono font-black ${isDay ? 'text-slate-900' : 'text-neon-blue'}`}>
                  ${currentProps.cost.toFixed(2)} <span className={`text-sm font-bold ${isDay ? 'text-slate-400' : 'text-white/40'}`}>/bbl</span>
                </span>
              </div>
            )}

            {chartData.length > 0 && (
              <div className={`rounded-lg border p-3 ${isDay ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                <p className={`text-[10px] uppercase font-black tracking-widest mb-2 ${isDay ? 'text-slate-500' : 'text-white/40'}`}>Component Volumes</p>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: isDay ? '#64748b' : 'rgba(255,255,255,0.5)' }} />
                    <YAxis tick={{ fontSize: 9, fill: isDay ? '#64748b' : 'rgba(255,255,255,0.5)' }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        background: isDay ? 'rgba(255,255,255,0.95)' : 'rgba(15,23,42,0.95)',
                        border: isDay ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: isDay ? '#0f172a' : '#f8fafc',
                      }}
                      formatter={(val: number) => [`${val} vol%`, 'Volume']}
                    />
                    <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={i % 2 === 0 ? '#3b82f6' : '#10b981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <button
              onClick={handleOptimize}
              disabled={optimizing || !currentProps}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all disabled:opacity-50 ${
                isDay
                  ? 'bg-brand-sky text-white hover:bg-sky-600 shadow-md'
                  : 'bg-neon-blue/20 text-neon-blue border border-neon-blue/40 hover:bg-neon-blue/30'
              }`}
            >
              {optimizing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {optimizing ? 'Optimizing...' : 'Optimize for Cost'}
            </button>

            {optResult && (
              <div className={`p-3 rounded-lg border space-y-2 ${isDay ? 'bg-amber-50 border-amber-200' : 'bg-amber-900/10 border-amber-700/30'}`}>
                <div className="flex items-center gap-2">
                  <TrendingDown className={`w-4 h-4 ${isDay ? 'text-amber-600' : 'text-neon-amber'}`} />
                  <span className={`text-xs font-black uppercase tracking-wider ${isDay ? 'text-amber-700' : 'text-neon-amber'}`}>
                    Optimal Blend — ${optResult.cost.toFixed(2)}/bbl
                    {optResult.savings > 0 && <span className="ml-2 text-emerald-600">(save ${optResult.savings.toFixed(2)}/bbl)</span>}
                    {optResult.savings <= 0 && <span className={`ml-2 ${isDay ? 'text-slate-500' : 'text-white/40'}`}>(already optimal)</span>}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {optResult.ratios.map(r => {
                    const name = activeTab === 'gasoline'
                      ? GAS_COMPS.find(c => c.id === r.componentId)?.name ?? r.componentId
                      : DSL_COMPS.find(c => c.id === r.componentId)?.name ?? r.componentId;
                    return (
                      <div key={r.componentId} className={`flex justify-between items-center text-xs rounded px-2 py-1 ${isDay ? 'bg-white border border-amber-100' : 'bg-white/5 border border-white/5'}`}>
                        <span className={`truncate ${isDay ? 'text-slate-600' : 'text-white/70'}`}>{name.split(' ')[0]}</span>
                        <span className={`font-mono font-black ml-2 ${isDay ? 'text-slate-900' : 'text-neon-amber'}`}>{r.volume}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className={`grid grid-cols-3 gap-4 p-4 rounded-xl border ${isDay ? 'bg-white/60 border-slate-200' : 'bg-white/5 border-white/10'} glass-panel`}>
        <div className="text-center">
          <p className={`text-[10px] uppercase font-black tracking-widest mb-1 ${isDay ? 'text-slate-400' : 'text-white/40'}`}>Total Volume</p>
          <p className={`text-2xl font-mono font-black ${isDay ? 'text-slate-900' : 'text-white'}`}>
            {currentProps ? currentProps.totalVol.toFixed(0) : '—'}
            <span className={`text-xs font-bold ml-1 ${isDay ? 'text-slate-400' : 'text-white/40'}`}>vol%</span>
          </p>
        </div>
        <div className="text-center">
          <p className={`text-[10px] uppercase font-black tracking-widest mb-1 ${isDay ? 'text-slate-400' : 'text-white/40'}`}>Spec Compliance</p>
          <p className={`text-2xl font-mono font-black ${
            passCount === totalSpec
              ? (isDay ? 'text-emerald-600' : 'text-neon-green')
              : (isDay ? 'text-red-600' : 'text-neon-red')
          }`}>{passCount}<span className={`text-base font-bold ${isDay ? 'text-slate-400' : 'text-white/40'}`}>/{totalSpec}</span></p>
        </div>
        <div className="text-center">
          <p className={`text-[10px] uppercase font-black tracking-widest mb-1 ${isDay ? 'text-slate-400' : 'text-white/40'}`}>Est. Batch Cost</p>
          <p className={`text-2xl font-mono font-black ${isDay ? 'text-slate-900' : 'text-neon-blue'}`}>
            {currentProps ? `$${(currentProps.cost * 10000).toLocaleString()}` : '—'}
            <span className={`text-xs font-bold ml-1 ${isDay ? 'text-slate-400' : 'text-white/40'}`}>total</span>
          </p>
        </div>
      </div>
    </div>
  );
};
