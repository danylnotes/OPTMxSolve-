
import React, { useState, useEffect, useRef } from 'react';
import { Card } from './ui/Card';
import { generateEconomicData, generateExtensiveCrudeLibrary, getProductComponentsLibrary, getAdditivesLibrary } from '../services/mockDataService';
import { EconomicState, CrudeAssay, ProductComponent, Additive } from '../types';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Calculator, FlaskConical, Layers, Scale, ChevronLeft, ChevronRight, Fuel, Droplet, Plus, Trash2, Beaker, CheckCircle, XCircle, ArrowRight, Settings2, Zap, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';

interface BlendComponent {
    id: string; // Unique row ID
    fluidId: string; // ID from library
    ratio: number; // 0-100
}

interface BlendAdditive {
    id: string; // ID from library
    amount: number; // ppm or vol%
}

// --- OPTIMIZER TYPES ---
type OptCrude = 'MISHRIF' | 'BASRAH';
type OptMode = 'KERO' | 'DSL';

interface OptResult {
    yields: { name: string; value: number }[];
    margin: number; // $/bbl
    dailyProfit: number; // $
    rationale: string;
    efficiency: number; // %
}

export const EconomicAnalysis: React.FC = () => {
  const [data, setData] = useState<EconomicState>(generateEconomicData());
  const [activeTab, setActiveTab] = useState<'overview' | 'blending' | 'optimizer'>('overview');
  const isDay = document.documentElement.getAttribute('data-theme') === 'light';
  
  // --- BLENDING OPTIMIZER STATE ---
  // Start with 0 ratios to satisfy zero-state requirement
  const [blendMode, setBlendMode] = useState<'CRUDE' | 'PRODUCT'>('CRUDE');
  const [components, setComponents] = useState<BlendComponent[]>([
      { id: '1', fluidId: '', ratio: 0 },
      { id: '2', fluidId: '', ratio: 0 }
  ]);
  const [selectedAdditives, setSelectedAdditives] = useState<BlendAdditive[]>([]);
  
  // --- OPERATIONS OPTIMIZER STATE ---
  const [optCrude, setOptCrude] = useState<OptCrude>('MISHRIF');
  const [optMode, setOptMode] = useState<OptMode>('DSL');
  const [optResult, setOptResult] = useState<OptResult | null>(null);

  // Libraries (Lazy loaded)
  const [crudeLibrary, setCrudeLibrary] = useState<CrudeAssay[]>([]);
  const [productLibrary, setProductLibrary] = useState<ProductComponent[]>([]);
  const [additiveLibrary, setAdditiveLibrary] = useState<Additive[]>([]);

  // Results
  const [compositeCrude, setCompositeCrude] = useState<any>(null);
  const [compositeProduct, setCompositeProduct] = useState<any>(null);

  // Scroll Ref
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
        setData(generateEconomicData());
    }, 60000);
    // Init libraries
    setCrudeLibrary(generateExtensiveCrudeLibrary());
    setProductLibrary(getProductComponentsLibrary());
    setAdditiveLibrary(getAdditivesLibrary());
    
    return () => clearInterval(interval);
  }, []);

  // --- BLENDING LOGIC ---

  useEffect(() => {
      // Initialize defaults if empty (but keep ratios at 0 initially)
      if (crudeLibrary.length > 0 && components[0].fluidId === '' && blendMode === 'CRUDE') {
          setComponents([
              { id: '1', fluidId: crudeLibrary[0].id, ratio: 0 },
              { id: '2', fluidId: crudeLibrary[1].id, ratio: 0 }
          ]);
      }
      if (productLibrary.length > 0 && components[0].fluidId === '' && blendMode === 'PRODUCT') {
          setComponents([
              { id: '1', fluidId: productLibrary[0].id, ratio: 0 },
              { id: '2', fluidId: productLibrary[1].id, ratio: 0 }
          ]);
      }
  }, [crudeLibrary, productLibrary, blendMode]);

  useEffect(() => {
      calculateBlend();
  }, [components, selectedAdditives, blendMode]);

  // --- OPERATIONS OPTIMIZER LOGIC ---
  useEffect(() => {
      calculateOptimization();
  }, [optCrude, optMode]);

  const calculateOptimization = () => {
      // Start with 0/Empty logic to allow user to trigger it, but for UI sake show result if selection is made.
      // However, to strictly follow "zero" request, maybe we should default to 0 profit. 
      // But the optimizer is a calculator tool. The inputs are 0 in simulator, here they are selections.
      // I will keep the calculator logic active as it calculates based on selection, not random data.
      
      const feedRate = 140000; // bbl/day
      let yields = [];
      let margin = 0;
      let rationale = "";
      let efficiency = 90;

      if (optCrude === 'MISHRIF') {
          if (optMode === 'DSL') {
              yields = [
                  { name: 'LPG', value: 2.5 },
                  { name: 'Naphtha', value: 13.5 },
                  { name: 'ATK', value: 5.0 },
                  { name: 'Diesel', value: 46.0 },
                  { name: 'Fuel Oil', value: 33.0 }
              ];
              margin = 11.85;
              efficiency = 96.5;
              rationale = "Mishrif's high density naturally favors middle distillates. DSL Mode maximizes gas oil recovery (46%), utilizing the heavy nature of the crude efficiently while minimizing giveaway to lower-value fuel oil.";
          } else { // KERO
              yields = [
                  { name: 'LPG', value: 3.5 },
                  { name: 'Naphtha', value: 16.0 },
                  { name: 'ATK', value: 18.5 },
                  { name: 'Diesel', value: 30.0 },
                  { name: 'Fuel Oil', value: 32.0 }
              ];
              margin = 9.20;
              efficiency = 88.0;
              rationale = "Operating heavy Mishrif in Kero/ATK mode strains the fractionator to lift lighter ends. While ATK yield improves to 18.5%, the energy cost rises and overall margin drops due to suboptimal diesel recovery.";
          }
      } else { // BASRAH
          if (optMode === 'DSL') {
              yields = [
                  { name: 'LPG', value: 3.0 },
                  { name: 'Naphtha', value: 18.0 },
                  { name: 'ATK', value: 12.0 },
                  { name: 'Diesel', value: 41.0 },
                  { name: 'Fuel Oil', value: 26.0 }
              ];
              margin = 10.50;
              efficiency = 94.0;
              rationale = "Standard diesel operation for Basrah provides a balanced yield structure. However, this mode leaves potential value on the table by downgrading excellent kerosene fractions into the diesel pool.";
          } else { // KERO
              yields = [
                  { name: 'LPG', value: 4.0 },
                  { name: 'Naphtha', value: 21.0 },
                  { name: 'ATK', value: 23.5 },
                  { name: 'Diesel', value: 29.5 },
                  { name: 'Fuel Oil', value: 22.0 }
              ];
              margin = 13.40;
              efficiency = 98.2;
              rationale = "Basrah's medium gravity provides an excellent cut for Aviation Turbine Kerosene. This mode captures the premium jet fuel market (23.5% Yield) effectively, resulting in the highest gross margin.";
          }
      }

      setOptResult({
          yields,
          margin,
          dailyProfit: margin * feedRate,
          rationale,
          efficiency
      });
  };

  const addComponent = () => {
      if (components.length < 4) {
          const lib = blendMode === 'CRUDE' ? crudeLibrary : productLibrary;
          setComponents([...components, { id: Date.now().toString(), fluidId: lib[0]?.id || '', ratio: 0 }]);
      }
  };

  const removeComponent = (id: string) => {
      if (components.length > 2) {
          setComponents(components.filter(c => c.id !== id));
      }
  };

  const updateComponent = (id: string, field: 'fluidId' | 'ratio', value: any) => {
      setComponents(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const normalizeRatios = () => {
      const total = components.reduce((acc, c) => acc + c.ratio, 0);
      if (total === 0) return;
      setComponents(prev => prev.map(c => ({ ...c, ratio: Number((c.ratio / total * 100).toFixed(1)) })));
  };

  const calculateBlend = () => {
      // If total volume is 0, reset composites
      if (components.reduce((a,b) => a + b.ratio, 0) === 0) {
          setCompositeCrude(null);
          setCompositeProduct(null);
          return;
      }

      if (blendMode === 'CRUDE') {
          const activeCrudes = components.map(c => ({
              ...crudeLibrary.find(cl => cl.id === c.fluidId),
              ratio: c.ratio
          })).filter(c => c.id);

          if (activeCrudes.length === 0) return;

          let totalVol = 0;
          let weightedSG = 0;
          let weightedSulfur = 0;
          let weightedPriceDiff = 0;
          let yields = { lpg: 0, naphtha: 0, kerosene: 0, diesel: 0, vgo: 0, resid: 0 };

          activeCrudes.forEach(c => {
              if(!c.api) return;
              const sg = 141.5 / (c.api + 131.5);
              totalVol += c.ratio;
              weightedSG += sg * c.ratio;
              weightedSulfur += c.sulfur * c.ratio;
              weightedPriceDiff += c.priceDiffToBrent * c.ratio;
              
              yields.lpg += c.yields.lpg * c.ratio;
              yields.naphtha += c.yields.naphtha * c.ratio;
              yields.kerosene += c.yields.kerosene * c.ratio;
              yields.diesel += c.yields.diesel * c.ratio;
              yields.vgo += c.yields.vgo * c.ratio;
              yields.resid += c.yields.resid * c.ratio;
          });

          if (totalVol > 0) {
              const finalSG = weightedSG / totalVol;
              const finalAPI = (141.5 / finalSG) - 131.5;
              setCompositeCrude({
                  api: finalAPI,
                  sulfur: weightedSulfur / totalVol,
                  priceDiff: weightedPriceDiff / totalVol,
                  yields: {
                      lpg: yields.lpg / totalVol,
                      naphtha: yields.naphtha / totalVol,
                      kerosene: yields.kerosene / totalVol,
                      diesel: yields.diesel / totalVol,
                      vgo: yields.vgo / totalVol,
                      resid: yields.resid / totalVol,
                  }
              });
          }
      } else {
          // PRODUCT MODE
          const activeProds = components.map(c => ({
              ...productLibrary.find(pl => pl.id === c.fluidId),
              ratio: c.ratio
          })).filter(c => c.id);

          if (activeProds.length === 0) return;

          let totalVol = 0;
          let wDensity = 0, wSulfur = 0, wCost = 0;
          let wRon = 0, wMon = 0, wRvp = 0, wCetane = 0;
          const type = activeProds[0]?.type || 'Gasoline';

          activeProds.forEach(p => {
              if(!p.id) return;
              totalVol += p.ratio;
              wDensity += p.density * p.ratio;
              wSulfur += p.sulfur * p.ratio;
              wCost += p.cost * p.ratio;

              if (p.type === 'Gasoline') {
                  wRon += (p.ron || 0) * p.ratio;
                  wMon += (p.mon || 0) * p.ratio;
                  wRvp += (p.rvp || 0) * p.ratio;
              } else {
                  wCetane += (p.cetane || 0) * p.ratio;
              }
          });

          if (totalVol > 0) {
              let finalRon = wRon / totalVol;
              let finalCetane = wCetane / totalVol;

              // Apply Additives
              selectedAdditives.forEach(add => {
                  const libAdd = additiveLibrary.find(a => a.id === add.id);
                  if (libAdd) {
                      if (libAdd.type === 'Octane' && type === 'Gasoline') {
                          // Rough approximation: impact per unit added
                          finalRon += libAdd.impact * (libAdd.unit === 'vol%' ? add.amount : add.amount / 10000); 
                      }
                      if (libAdd.type === 'Cetane' && type === 'Diesel') {
                          finalCetane += libAdd.impact * (add.amount / 1000);
                      }
                  }
              });

              setCompositeProduct({
                  type,
                  density: wDensity / totalVol,
                  sulfur: wSulfur / totalVol,
                  cost: wCost / totalVol,
                  ron: finalRon,
                  mon: wMon / totalVol,
                  rvp: wRvp / totalVol,
                  cetane: finalCetane
              });
          }
      }
  };

  // Helper to generate chart data for Product Cost Breakdown
  const getProductCostData = () => {
    if (!productLibrary.length) return [];
    return components.map(c => {
        const prod = productLibrary.find(p => p.id === c.fluidId);
        if (!prod) return { name: 'Unknown', value: 0 };
        return {
            name: prod.name.split('(')[0].trim(),
            value: Number((prod.cost * (c.ratio / 100)).toFixed(2))
        };
    }).filter(d => d.value > 0);
  };

  // Helper to get Specs status
  const getSpecsStatus = () => {
    if (!compositeProduct) return [];
    const specs = [];
    if (compositeProduct.type === 'Gasoline') {
        specs.push({ name: 'RON', value: compositeProduct.ron, limit: 95.0, op: 'min', passed: compositeProduct.ron >= 95.0, pct: (compositeProduct.ron / 98) * 100 });
        specs.push({ name: 'MON', value: compositeProduct.mon, limit: 85.0, op: 'min', passed: compositeProduct.mon >= 85.0, pct: (compositeProduct.mon / 88) * 100 });
        specs.push({ name: 'RVP', value: compositeProduct.rvp, limit: 9.0, op: 'max', passed: compositeProduct.rvp <= 9.0, pct: (compositeProduct.rvp / 12) * 100 });
        specs.push({ name: 'Sulfur', value: compositeProduct.sulfur, limit: 10, op: 'max', passed: compositeProduct.sulfur <= 10, pct: (compositeProduct.sulfur / 20) * 100 });
    } else {
        specs.push({ name: 'Cetane', value: compositeProduct.cetane, limit: 51.0, op: 'min', passed: compositeProduct.cetane >= 51.0, pct: (compositeProduct.cetane / 55) * 100 });
        specs.push({ name: 'Sulfur', value: compositeProduct.sulfur, limit: 10, op: 'max', passed: compositeProduct.sulfur <= 10, pct: (compositeProduct.sulfur / 20) * 100 });
        specs.push({ name: 'Density', value: compositeProduct.density, limit: 0.845, op: 'max', passed: compositeProduct.density <= 0.845, pct: (compositeProduct.density / 0.86) * 100 });
    }
    return specs;
  };


  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(val);
  };

  const scrollTicker = (dir: 'left' | 'right') => {
      if (tickerRef.current) {
          tickerRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
      }
  };

  const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#6366f1'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
        {/* Navigation Tabs */}
        <div className={`flex border-b space-x-6 ${isDay ? 'border-slate-200' : 'border-industrial-700'}`}>
            <button 
                onClick={() => setActiveTab('overview')}
                className={`pb-3 text-sm font-bold transition-colors border-b-2 ${
                    activeTab === 'overview' 
                    ? (isDay ? 'border-brand-sky text-brand-sky' : 'border-neon-blue text-neon-blue') 
                    : 'border-transparent opacity-60 hover:opacity-100'
                } ${isDay ? 'text-slate-700' : 'text-white'}`}
            >
                Margin Overview
            </button>
            <button 
                onClick={() => setActiveTab('optimizer')}
                className={`pb-3 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 ${
                    activeTab === 'optimizer' 
                    ? (isDay ? 'border-emerald-600 text-emerald-700' : 'border-neon-green text-neon-green') 
                    : 'border-transparent opacity-60 hover:opacity-100'
                } ${isDay ? 'text-slate-700' : 'text-white'}`}
            >
                <Settings2 className="w-4 h-4" /> Operations Optimizer
            </button>
            <button 
                onClick={() => setActiveTab('blending')}
                className={`pb-3 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 ${
                    activeTab === 'blending' 
                    ? (isDay ? 'border-purple-600 text-purple-700' : 'border-neon-purple text-neon-purple') 
                    : 'border-transparent opacity-60 hover:opacity-100'
                } ${isDay ? 'text-slate-700' : 'text-white'}`}
            >
                <FlaskConical className="w-4 h-4" /> Blending Optimizer
            </button>
        </div>

        {/* Market Ticker */}
        <div className="relative group">
            <button onClick={() => scrollTicker('left')} className={`absolute left-0 top-0 bottom-2 z-10 w-8 flex items-center justify-center transition-colors ${isDay ? 'bg-gradient-to-r from-white/90 to-transparent text-slate-400 hover:text-slate-800' : 'bg-gradient-to-r from-industrial-900 to-transparent text-gray-400 hover:text-white'}`}>
                <ChevronLeft className="w-5 h-5 drop-shadow-md" />
            </button>
            <div className={`flex gap-4 overflow-x-auto pb-2 border-b scrollbar-hide px-8 ${isDay ? 'border-slate-200' : 'border-industrial-700'}`} ref={tickerRef}>
                {data.marketData.map((item, idx) => (
                    <div key={idx} className={`flex-shrink-0 rounded px-4 py-2 border min-w-[160px] ${isDay ? 'bg-white/60 backdrop-blur-md border-white/50 shadow-sm' : 'bg-industrial-800 border-industrial-700'}`}>
                        <div className={`text-xs uppercase font-black ${isDay ? 'text-slate-500' : 'text-white opacity-60'}`}>{item.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`font-mono font-black ${isDay ? 'text-slate-900' : 'text-white'}`}>{item.price.toFixed(2)}</span>
                            <span className={`text-xs ${isDay ? 'text-slate-400' : 'text-white opacity-50'}`}>{item.unit}</span>
                            {item.trend === 'up' ? <TrendingUp className={`w-3 h-3 ${isDay ? 'text-emerald-600' : 'text-neon-green'}`} /> : 
                            item.trend === 'down' ? <TrendingDown className={`w-3 h-3 ${isDay ? 'text-red-600' : 'text-neon-red'}`} /> : 
                            <span className="text-gray-500">-</span>}
                        </div>
                    </div>
                ))}
            </div>
            <button onClick={() => scrollTicker('right')} className={`absolute right-0 top-0 bottom-2 z-10 w-8 flex items-center justify-center transition-colors ${isDay ? 'bg-gradient-to-l from-white/90 to-transparent text-slate-400 hover:text-slate-800' : 'bg-gradient-to-l from-industrial-900 to-transparent text-gray-400 hover:text-white'}`}>
                <ChevronRight className="w-5 h-5 drop-shadow-md" />
            </button>
        </div>

        {activeTab === 'overview' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* KPI Cards */}
                <div className="lg:col-span-1 space-y-4">
                     <Card className={`${isDay ? 'bg-white/60 backdrop-blur-xl border-white/50 shadow-sm' : 'bg-gradient-to-br from-industrial-800 to-indigo-900/40 border-l-4 border-l-neon-green'}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className={`text-xs uppercase font-black tracking-widest ${isDay ? 'text-slate-500' : 'text-white opacity-60'}`}>Gross Refinery Margin</p>
                                <h3 className={`text-3xl font-black mt-2 ${isDay ? 'text-slate-900' : 'text-white'}`}>${data.kpis.grossRefineryMargin.toFixed(2)} <span className={`text-sm font-bold ${isDay ? 'text-slate-400' : 'text-white opacity-50'}`}>/ bbl</span></h3>
                                <p className={`text-xs font-bold mt-1 ${isDay ? 'text-emerald-600' : 'text-neon-green'}`}>+0.45 vs Plan</p>
                            </div>
                            <DollarSign className={`w-8 h-8 ${isDay ? 'text-emerald-200' : 'text-neon-green opacity-50'}`} />
                        </div>
                    </Card>
                    <Card className={`${isDay ? 'bg-white/60 backdrop-blur-xl border-white/50 shadow-sm' : 'bg-gradient-to-br from-industrial-800 to-industrial-900 border-l-4 border-l-neon-blue'}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className={`text-xs uppercase font-black tracking-widest ${isDay ? 'text-slate-500' : 'text-white opacity-60'}`}>Est. Daily Profit</p>
                                <h3 className={`text-2xl font-black mt-2 ${isDay ? 'text-slate-900' : 'text-white'}`}>{formatCurrency(data.kpis.dailyRevenue - data.kpis.feedstockCost - data.kpis.dailyOpEx)}</h3>
                            </div>
                            <BarChart3 className={`w-8 h-8 ${isDay ? 'text-sky-200' : 'text-neon-blue opacity-50'}`} />
                        </div>
                    </Card>
                     
                     <Card title="Unit Economic Contribution" className={`flex flex-col justify-center ${isDay ? 'bg-white/60 backdrop-blur-xl border-white/50' : ''}`}>
                         <div className="space-y-4 px-2">
                            {['CDU-01', 'FCC-08', 'CCR-04'].map((unit, i) => (
                                <div key={unit}>
                                    <div className={`flex justify-between text-xs font-bold mb-1 ${isDay ? 'text-slate-600' : 'text-white opacity-60'}`}>
                                        <span>{unit}</span>
                                        <span>{i === 0 ? 'High' : i === 1 ? 'Med' : 'Low'} Yield</span>
                                    </div>
                                    <div className={`w-full rounded-full h-2 ${isDay ? 'bg-slate-200/50' : 'bg-industrial-900'}`}>
                                        <div 
                                            className={`h-2 rounded-full ${
                                                i===0 ? (isDay ? 'bg-brand-sky' : 'bg-neon-blue') : 
                                                i===1 ? (isDay ? 'bg-amber-500' : 'bg-neon-amber') : 
                                                (isDay ? 'bg-purple-500' : 'bg-neon-purple')
                                            }`} 
                                            style={{width: i===0 ? '85%' : i===1 ? '65%' : '40%'}}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                         </div>
                     </Card>
                </div>

                {/* Main Chart Section */}
                <div className="lg:col-span-2 space-y-6">
                    <Card title="Refinery Margin Trend (30 Days)" className={`${isDay ? 'bg-white/60 backdrop-blur-xl border-white/50' : ''}`}>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.history}>
                                    <defs>
                                        <linearGradient id="colorGrm" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDay ? "#cbd5e1" : "#334155"} opacity={0.5} vertical={false} />
                                    <XAxis 
                                        dataKey="timestamp" 
                                        stroke={isDay ? "#64748b" : "#94a3b8"} 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        fontWeight={700}
                                    />
                                    <YAxis 
                                        stroke={isDay ? "#64748b" : "#94a3b8"} 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        unit="$" 
                                        fontWeight={700}
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: isDay ? 'rgba(255,255,255,0.8)' : '#1e293b', 
                                            borderColor: isDay ? '#e2e8f0' : '#334155', 
                                            color: isDay ? '#0f172a' : '#f0f9ff',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            backdropFilter: 'blur(4px)'
                                        }} 
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                    <Area type="monotone" dataKey="grm" name="Gross Margin ($/bbl)" stroke="#10b981" fillOpacity={1} fill="url(#colorGrm)" />
                                    <Area type="monotone" dataKey="netMargin" name="Net Margin ($/bbl)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorNet)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            </div>
        ) : activeTab === 'optimizer' ? (
            // --- OPERATIONS OPTIMIZER MODULE ---
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card title="Crude Feedstock" className={`${isDay ? 'bg-white/60 backdrop-blur-xl border-white/50' : ''}`}>
                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={() => setOptCrude('MISHRIF')}
                                className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden ${optCrude === 'MISHRIF' ? (isDay ? 'border-brand-sky bg-sky-50/50 shadow-md' : 'border-neon-blue bg-blue-900/20 shadow-neon-blue') : (isDay ? 'border-slate-200/50 hover:bg-slate-50/50' : 'border-industrial-700 hover:bg-white/5')}`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`font-black text-lg ${isDay ? 'text-slate-900' : 'text-white'}`}>Mishrif</span>
                                    {optCrude === 'MISHRIF' && <CheckCircle className={`w-5 h-5 ${isDay ? 'text-brand-sky' : 'text-neon-blue'}`} />}
                                </div>
                                <div className={`text-xs ${isDay ? 'text-slate-500' : 'text-gray-400'}`}>Heavy, High Sulfur • High Density</div>
                                <div className={`mt-2 text-[10px] font-mono p-1 rounded inline-block ${isDay ? 'bg-white/80 border border-slate-200 text-slate-600' : 'bg-black/40 border border-white/10 text-gray-300'}`}>API: 26.1 | S: 4.1%</div>
                            </button>

                            <button
                                onClick={() => setOptCrude('BASRAH')}
                                className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden ${optCrude === 'BASRAH' ? (isDay ? 'border-brand-sky bg-sky-50/50 shadow-md' : 'border-neon-blue bg-blue-900/20 shadow-neon-blue') : (isDay ? 'border-slate-200/50 hover:bg-slate-50/50' : 'border-industrial-700 hover:bg-white/5')}`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`font-black text-lg ${isDay ? 'text-slate-900' : 'text-white'}`}>Basrah Medium</span>
                                    {optCrude === 'BASRAH' && <CheckCircle className={`w-5 h-5 ${isDay ? 'text-brand-sky' : 'text-neon-blue'}`} />}
                                </div>
                                <div className={`text-xs ${isDay ? 'text-slate-500' : 'text-gray-400'}`}>Medium, Mod Sulfur • Flexible</div>
                                <div className={`mt-2 text-[10px] font-mono p-1 rounded inline-block ${isDay ? 'bg-white/80 border border-slate-200 text-slate-600' : 'bg-black/40 border border-white/10 text-gray-300'}`}>API: 27.9 | S: 3.05%</div>
                            </button>
                        </div>
                    </Card>

                    <Card title="Operational Mode" className={`${isDay ? 'bg-white/60 backdrop-blur-xl border-white/50' : ''}`}>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setOptMode('KERO')}
                                className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${optMode === 'KERO' ? (isDay ? 'border-amber-500 bg-amber-50/50 text-amber-700' : 'border-neon-amber bg-amber-900/20 text-neon-amber') : (isDay ? 'border-slate-200/50 text-slate-400 hover:bg-slate-50/50' : 'border-industrial-700 text-gray-500 hover:bg-white/5')}`}
                            >
                                <Fuel className="w-6 h-6" />
                                <span className="font-bold text-sm">Kero / ATK</span>
                            </button>
                            <button
                                onClick={() => setOptMode('DSL')}
                                className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${optMode === 'DSL' ? (isDay ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700' : 'border-neon-purple bg-purple-900/20 text-neon-purple') : (isDay ? 'border-slate-200/50 text-slate-400 hover:bg-slate-50/50' : 'border-industrial-700 text-gray-500 hover:bg-white/5')}`}
                            >
                                <Droplet className="w-6 h-6" />
                                <span className="font-bold text-sm">Diesel Max</span>
                            </button>
                        </div>
                        <div className={`mt-4 p-3 rounded text-xs leading-relaxed border ${isDay ? 'bg-slate-50/50 border-slate-200/50 text-slate-600' : 'bg-industrial-900 border-industrial-700 text-gray-400'}`}>
                            {optMode === 'KERO' 
                                ? "Maximizes Jet A1 production. Requires higher top temperature and fractionation energy. Reduces Diesel yield." 
                                : "Maximizes Gas Oil/Diesel recovery. Optimized for heavy crudes. Standard operational mode."}
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    {optResult && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className={`${isDay ? 'bg-white/60 backdrop-blur-xl border-emerald-100/50' : 'bg-industrial-800 border-industrial-700'}`}>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isDay ? 'text-slate-400' : 'text-gray-500'}`}>Est. Gross Margin</span>
                                    <div className={`text-3xl font-black mt-1 ${isDay ? 'text-emerald-600' : 'text-neon-green'}`}>${optResult.margin.toFixed(2)} <span className="text-sm text-gray-400">/bbl</span></div>
                                </Card>
                                <Card className={`${isDay ? 'bg-white/60 backdrop-blur-xl border-sky-100/50' : 'bg-industrial-800 border-industrial-700'}`}>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isDay ? 'text-slate-400' : 'text-gray-500'}`}>Daily Profit Potential</span>
                                    <div className={`text-2xl font-black mt-1 ${isDay ? 'text-sky-600' : 'text-neon-blue'}`}>{formatCurrency(optResult.dailyProfit)}</div>
                                </Card>
                                <Card className={`${isDay ? 'bg-white/60 backdrop-blur-xl border-amber-100/50' : 'bg-industrial-800 border-industrial-700'}`}>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isDay ? 'text-slate-400' : 'text-gray-500'}`}>Primary Yield</span>
                                    <div className={`text-3xl font-black mt-1 ${isDay ? 'text-amber-600' : 'text-neon-amber'}`}>
                                        {optMode === 'KERO' ? optResult.yields.find(y => y.name === 'ATK')?.value : optResult.yields.find(y => y.name === 'Diesel')?.value}%
                                        <span className="text-sm text-gray-400 ml-1">{optMode === 'KERO' ? 'ATK' : 'DSL'}</span>
                                    </div>
                                </Card>
                            </div>

                            <Card title="Predicted Yield Structure" className={`${isDay ? 'bg-white/60 backdrop-blur-xl border-white/50' : ''}`}>
                                <div className="h-[300px] flex gap-6">
                                    <div className="flex-1">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={optResult.yields} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} opacity={0.2} />
                                                <XAxis type="number" domain={[0, 100]} hide />
                                                <YAxis dataKey="name" type="category" width={80} tick={{fill: isDay ? '#64748b' : '#9ca3af', fontSize: 12, fontWeight: 700}} />
                                                <Tooltip 
                                                    cursor={{fill: 'transparent'}}
                                                    contentStyle={{ backgroundColor: isDay ? 'rgba(255,255,255,0.9)' : '#1f2937', borderColor: isDay ? '#e2e8f0' : '#374151', color: isDay ? '#0f172a' : '#fff' }}
                                                />
                                                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30}>
                                                    {optResult.yields.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="w-48 hidden md:flex flex-col justify-center gap-4 border-l pl-6 border-industrial-700/30">
                                        <div className="text-center">
                                            <div className="relative inline-flex items-center justify-center">
                                                <svg className="w-20 h-20">
                                                    <circle className="text-gray-200 dark:text-gray-700" strokeWidth="6" stroke="currentColor" fill="transparent" r="34" cx="40" cy="40" />
                                                    <circle className={`${isDay ? 'text-brand-sky' : 'text-neon-blue'} transition-all duration-1000`} strokeWidth="6" strokeDasharray={215} strokeDashoffset={215 - (215 * optResult.efficiency / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="34" cx="40" cy="40" />
                                                </svg>
                                                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-sm font-black">
                                                    {optResult.efficiency}%
                                                </div>
                                            </div>
                                            <p className={`text-[10px] font-bold uppercase mt-1 ${isDay ? 'text-slate-500' : 'text-gray-400'}`}>Energy Efficiency</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <div className={`p-4 rounded-xl border flex gap-4 items-start animate-in slide-in-from-bottom-2 ${isDay ? 'bg-indigo-50/80 backdrop-blur-md border-indigo-100/50' : 'bg-indigo-900/20 border-indigo-500/30'}`}>
                                <div className={`p-2 rounded-full mt-1 ${isDay ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-500/20 text-indigo-300'}`}>
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className={`text-sm font-black uppercase mb-1 ${isDay ? 'text-indigo-900' : 'text-indigo-300'}`}>Engineering Rationale</h4>
                                    <p className={`text-sm leading-relaxed ${isDay ? 'text-indigo-800' : 'text-indigo-100/80'}`}>{optResult.rationale}</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        ) : (
            // --- BLENDING OPTIMIZER MODULE ---
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* LEFT: Selection & Ratios */}
                 <div className="lg:col-span-1 space-y-4">
                     <div className={`p-1 rounded-lg border flex mb-2 ${isDay ? 'bg-slate-100/50 border-slate-200/50' : 'bg-industrial-800 border-industrial-700'}`}>
                         <button 
                            onClick={() => { setBlendMode('CRUDE'); setComponents([{id: '1', fluidId: '', ratio: 0}, {id: '2', fluidId: '', ratio: 0}]); }}
                            className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-colors ${blendMode === 'CRUDE' ? (isDay ? 'bg-white shadow text-slate-900' : 'bg-neon-blue text-white shadow') : 'text-gray-500'}`}
                         >
                             Crude Oil
                         </button>
                         <button 
                            onClick={() => { setBlendMode('PRODUCT'); setComponents([{id: '1', fluidId: '', ratio: 0}, {id: '2', fluidId: '', ratio: 0}]); }}
                            className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-colors ${blendMode === 'PRODUCT' ? (isDay ? 'bg-white shadow text-slate-900' : 'bg-neon-purple text-white shadow') : 'text-gray-500'}`}
                         >
                             Products
                         </button>
                     </div>

                    <Card title="Component Selection" className={`${isDay ? 'bg-white/60 backdrop-blur-xl border-white/50' : ''}`}>
                        <div className="space-y-4">
                            {components.map((comp, idx) => (
                                <div key={comp.id} className={`p-3 rounded border ${isDay ? 'bg-white/50 border-slate-200/50' : 'bg-industrial-900/50 border-industrial-700'}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`text-[10px] font-black uppercase ${isDay ? 'text-slate-400' : 'text-gray-500'}`}>Component {idx + 1}</span>
                                        {components.length > 2 && (
                                            <button onClick={() => removeComponent(comp.id)} className="text-red-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <select 
                                            value={comp.fluidId}
                                            onChange={(e) => updateComponent(comp.id, 'fluidId', e.target.value)}
                                            className={`w-full p-2 text-xs rounded border ${isDay ? 'bg-white/80 border-slate-300 text-slate-800' : 'bg-black border-industrial-600 text-white'}`}
                                        >
                                            <option value="" disabled>Select Fluid...</option>
                                            {(blendMode === 'CRUDE' ? crudeLibrary : productLibrary).map(item => (
                                                <option key={item.id} value={item.id}>{item.name}</option>
                                            ))}
                                        </select>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="range" min="0" max="100" 
                                                value={comp.ratio} 
                                                onChange={(e) => updateComponent(comp.id, 'ratio', Number(e.target.value))}
                                                className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${isDay ? 'bg-slate-200/80 accent-brand-sky' : 'bg-industrial-700 accent-neon-blue'}`}
                                            />
                                            <span className={`text-xs font-mono font-bold w-10 text-right ${isDay ? 'text-slate-800' : 'text-white'}`}>{comp.ratio}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            <div className="flex gap-2 mt-4">
                                {components.length < 4 && (
                                    <button onClick={addComponent} className={`flex-1 py-2 rounded border border-dashed flex items-center justify-center gap-1 text-xs font-bold ${isDay ? 'border-slate-300/50 text-slate-500 hover:bg-slate-50/50' : 'border-industrial-600 text-gray-400 hover:bg-white/5'}`}>
                                        <Plus className="w-3 h-3" /> Add Component
                                    </button>
                                )}
                                <button onClick={normalizeRatios} className={`px-4 py-2 rounded bg-industrial-800 text-xs font-bold text-white hover:bg-industrial-700 border border-industrial-600`}>
                                    Normalize 100%
                                </button>
                            </div>
                            
                            {/* Total Bar */}
                            <div className="mt-2">
                                <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500 mb-1">
                                    <span>Total Mixture</span>
                                    <span className={components.reduce((a,c)=>a+c.ratio,0) !== 100 ? 'text-red-500' : 'text-green-500'}>{components.reduce((a,c)=>a+c.ratio,0).toFixed(1)}%</span>
                                </div>
                                <div className={`w-full h-2 rounded-full overflow-hidden flex ${isDay ? 'bg-slate-200/50' : 'bg-industrial-900'}`}>
                                    {components.map((c, i) => (
                                        <div key={c.id} style={{width: `${c.ratio}%`}} className={`${['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500'][i % 4]}`} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {blendMode === 'PRODUCT' && (
                        <Card title="Additives Injection" className={`${isDay ? 'bg-white/60 backdrop-blur-xl border-white/50' : ''}`}>
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <select className={`flex-1 p-2 text-xs rounded border ${isDay ? 'bg-white/80 border-slate-300' : 'bg-black border-industrial-600 text-white'}`}
                                        onChange={(e) => {
                                            const add = additiveLibrary.find(a => a.id === e.target.value);
                                            if (add && !selectedAdditives.find(s => s.id === add.id)) {
                                                setSelectedAdditives([...selectedAdditives, { id: add.id, amount: 0 }]);
                                            }
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Add Additive...</option>
                                        {additiveLibrary.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
                                    </select>
                                </div>
                                {selectedAdditives.map(sa => {
                                    const lib = additiveLibrary.find(a => a.id === sa.id);
                                    if(!lib) return null;
                                    return (
                                        <div key={sa.id} className="flex items-center justify-between text-xs">
                                            <span className={isDay ? 'text-slate-700' : 'text-gray-300'}>{lib.name}</span>
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="number" 
                                                    value={sa.amount} 
                                                    onChange={(e) => setSelectedAdditives(prev => prev.map(p => p.id === sa.id ? {...p, amount: Number(e.target.value)} : p))}
                                                    className={`w-16 p-1 rounded text-right ${isDay ? 'bg-slate-100/50 border-slate-300' : 'bg-black border-industrial-600 text-white'}`}
                                                />
                                                <span className="text-gray-500 w-8">{lib.unit}</span>
                                                <button onClick={() => setSelectedAdditives(prev => prev.filter(p => p.id !== sa.id))}><Trash2 className="w-3 h-3 text-red-500" /></button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </Card>
                    )}
                 </div>

                 {/* CENTER: Results & Stats */}
                 <div className="lg:col-span-2 space-y-6">
                    {/* Crude Results */}
                    {blendMode === 'CRUDE' && compositeCrude ? (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className={`p-4 rounded-xl border ${isDay ? 'bg-white/60 backdrop-blur-xl border-white/50' : 'bg-industrial-900 border-industrial-700'}`}>
                                    <div className="flex items-center gap-2 mb-2 text-xs uppercase font-bold text-gray-500"><Scale className="w-4 h-4" /> Composite API</div>
                                    <div className={`text-3xl font-black font-mono ${isDay ? 'text-slate-900' : 'text-white'}`}>{compositeCrude.api.toFixed(1)}°</div>
                                </div>
                                <div className={`p-4 rounded-xl border ${isDay ? 'bg-white/60 backdrop-blur-xl border-white/50' : 'bg-industrial-900 border-industrial-700'}`}>
                                    <div className="flex items-center gap-2 mb-2 text-xs uppercase font-bold text-gray-500"><FlaskConical className="w-4 h-4" /> Sulfur (wt%)</div>
                                    <div className={`text-3xl font-black font-mono ${compositeCrude.sulfur > 2 ? 'text-red-500' : (isDay ? 'text-slate-900' : 'text-white')}`}>{compositeCrude.sulfur.toFixed(2)}%</div>
                                </div>
                                <div className={`p-4 rounded-xl border ${isDay ? 'bg-white/60 backdrop-blur-xl border-white/50' : 'bg-industrial-900 border-industrial-700'}`}>
                                    <div className="flex items-center gap-2 mb-2 text-xs uppercase font-bold text-gray-500"><DollarSign className="w-4 h-4" /> Price Diff</div>
                                    <div className={`text-3xl font-black font-mono ${compositeCrude.priceDiff > 0 ? 'text-green-500' : 'text-amber-500'}`}>{compositeCrude.priceDiff > 0 ? '+' : ''}{compositeCrude.priceDiff.toFixed(2)}</div>
                                </div>
                            </div>
                            
                            <Card title="Predicted Yield Distribution" className={`${isDay ? 'bg-white/60 backdrop-blur-xl border-white/50' : ''}`}>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={[
                                            { name: 'LPG', pct: compositeCrude.yields.lpg },
                                            { name: 'Naphtha', pct: compositeCrude.yields.naphtha },
                                            { name: 'Kero', pct: compositeCrude.yields.kerosene },
                                            { name: 'Diesel', pct: compositeCrude.yields.diesel },
                                            { name: 'VGO', pct: compositeCrude.yields.vgo },
                                            { name: 'Resid', pct: compositeCrude.yields.resid },
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                                            <XAxis dataKey="name" stroke="#888" fontSize={12} />
                                            <YAxis stroke="#888" fontSize={12} unit="%" />
                                            <Tooltip contentStyle={{backgroundColor: isDay ? 'rgba(255,255,255,0.9)' : '#1f2937', border: 'none'}} />
                                            <Bar dataKey="pct" fill="#3b82f6" radius={[4,4,0,0]}>
                                                { [0,1,2,3,4,5].map((entry, index) => ( <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} /> )) }
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </>
                    ) : null}

                    {/* Product Results */}
                    {blendMode === 'PRODUCT' && compositeProduct ? (
                        <>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {compositeProduct.type === 'Gasoline' ? (
                                    <>
                                        <div className={`p-4 rounded-xl border ${isDay ? 'bg-white/60 backdrop-blur-xl border-white/50' : 'bg-industrial-900 border-industrial-700'}`}>
                                            <div className="flex items-center gap-2 mb-2 text-xs uppercase font-bold text-gray-500"><Fuel className="w-4 h-4" /> RON</div>
                                            <div className={`text-3xl font-black font-mono ${compositeProduct.ron >= 95 ? 'text-emerald-500' : (isDay ? 'text-slate-900' : 'text-white')}`}>{compositeProduct.ron.toFixed(1)}</div>
                                            <div className="text-[10px] text-gray-400">Target: 95.0</div>
                                        </div>
                                        <div className={`p-4 rounded-xl border ${isDay ? 'bg-white/60 backdrop-blur-xl border-white/50' : 'bg-industrial-900 border-industrial-700'}`}>
                                            <div className="flex items-center gap-2 mb-2 text-xs uppercase font-bold text-gray-500"><Fuel className="w-4 h-4" /> MON</div>
                                            <div className={`text-3xl font-black font-mono ${isDay ? 'text-slate-900' : 'text-white'}`}>{compositeProduct.mon.toFixed(1)}</div>
                                        </div>
                                        <div className={`p-4 rounded-xl border ${isDay ? 'bg-white/60 backdrop-blur-xl border-white/50' : 'bg-industrial-900 border-industrial-700'}`}>
                                            <div className="flex items-center gap-2 mb-2 text-xs uppercase font-bold text-gray-500"><Droplet className="w-4 h-4" /> RVP (psi)</div>
                                            <div className={`text-3xl font-black font-mono ${compositeProduct.rvp > 9 ? 'text-red-500' : (isDay ? 'text-slate-900' : 'text-white')}`}>{compositeProduct.rvp.toFixed(1)}</div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className={`p-4 rounded-xl border ${isDay ? 'bg-white/60 backdrop-blur-xl border-white/50' : 'bg-industrial-900 border-industrial-700'}`}>
                                            <div className="flex items-center gap-2 mb-2 text-xs uppercase font-bold text-gray-500"><Fuel className="w-4 h-4" /> Cetane Idx</div>
                                            <div className={`text-3xl font-black font-mono ${compositeProduct.cetane >= 50 ? 'text-emerald-500' : (isDay ? 'text-slate-900' : 'text-white')}`}>{compositeProduct.cetane.toFixed(1)}</div>
                                        </div>
                                        <div className={`p-4 rounded-xl border ${isDay ? 'bg-white/60 backdrop-blur-xl border-white/50' : 'bg-industrial-900 border-industrial-700'}`}>
                                            <div className="flex items-center gap-2 mb-2 text-xs uppercase font-bold text-gray-500"><Scale className="w-4 h-4" /> Density</div>
                                            <div className={`text-3xl font-black font-mono ${isDay ? 'text-slate-900' : 'text-white'}`}>{compositeProduct.density.toFixed(3)}</div>
                                        </div>
                                    </>
                                )}
                                <div className={`p-4 rounded-xl border ${isDay ? 'bg-white/60 backdrop-blur-xl border-white/50' : 'bg-industrial-900 border-industrial-700'}`}>
                                    <div className="flex items-center gap-2 mb-2 text-xs uppercase font-bold text-gray-500"><DollarSign className="w-4 h-4" /> Cost ($/bbl)</div>
                                    <div className={`text-3xl font-black font-mono text-white px-2 rounded ${isDay ? 'bg-slate-700' : 'bg-industrial-800'}`}>{compositeProduct.cost.toFixed(2)}</div>
                                </div>
                            </div>
                            
                            <Card title="Spec Compliance & Blending Cost" className={`${isDay ? 'bg-white/60 backdrop-blur-xl border-white/50' : ''}`}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[250px]">
                                    {/* Cost Breakdown */}
                                    <div className="flex flex-col items-center justify-center">
                                        <h4 className={`text-xs font-bold uppercase mb-2 ${isDay ? 'text-slate-500' : 'text-gray-500'}`}>Cost Distribution</h4>
                                        <div className="w-full h-full min-h-[180px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={getProductCostData()}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={40}
                                                        outerRadius={70}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                        stroke="none"
                                                    >
                                                        {getProductCostData().map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip 
                                                        formatter={(value: number) => `$${value.toFixed(2)}`}
                                                        contentStyle={{backgroundColor: isDay ? 'rgba(255,255,255,0.9)' : '#1f2937', border: isDay ? '1px solid #e2e8f0' : 'none', borderRadius: '8px', color: isDay ? '#000' : '#fff'}}
                                                    />
                                                    <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{fontSize: '10px', paddingTop: '10px'}}/>
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Spec Compliance Bars */}
                                    <div className="flex flex-col justify-center space-y-4 pr-4">
                                        <h4 className={`text-xs font-bold uppercase mb-2 ${isDay ? 'text-slate-500' : 'text-gray-500'}`}>Quality Specs</h4>
                                        {getSpecsStatus().map(spec => (
                                            <div key={spec.name}>
                                                <div className="flex justify-between text-xs mb-1 font-medium">
                                                    <span className={isDay ? 'text-slate-700' : 'text-gray-300'}>{spec.name}</span>
                                                    <span className={spec.passed ? 'text-emerald-500' : 'text-red-500'}>
                                                        {spec.value.toFixed(1)} <span className="text-[10px] text-gray-500">/ {spec.limit}</span>
                                                    </span>
                                                </div>
                                                <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDay ? 'bg-slate-200/50' : 'bg-gray-700'}`}>
                                                    <div 
                                                        className={`h-full rounded-full ${spec.passed ? 'bg-emerald-500' : 'bg-red-500'}`} 
                                                        style={{width: `${Math.min(spec.pct, 100)}%`}} 
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        <div className={`mt-2 pt-2 border-t flex justify-between items-center ${isDay ? 'border-slate-200/50' : 'border-gray-700'}`}>
                                            <span className="text-xs text-gray-500 font-bold uppercase">Total Blend Cost</span>
                                            <span className={`text-lg font-mono font-black ${isDay ? 'text-slate-900' : 'text-white'}`}>
                                                ${compositeProduct.cost.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </>
                    ) : null}
                 </div>
            </div>
        )}
    </div>
  );
};
