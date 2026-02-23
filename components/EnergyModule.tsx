
import React, { useEffect, useState, useRef } from 'react';
import { Card } from './ui/Card';
import { generateEnergyState } from '../services/mockDataService';
import { EnergyState, UnitStatus } from '../types';
import { Zap, Power, ArrowDown, Gauge, ChevronLeft, ChevronRight, Activity, Thermometer, Wind, AlertTriangle, Wrench, Factory } from 'lucide-react';
import { UtilitiesModule } from './UtilitiesModule';

interface EnergyModuleProps {
    dataVersion?: number;
}

export const EnergyModule: React.FC<EnergyModuleProps> = ({ dataVersion }) => {
  const [activeTab, setActiveTab] = useState<'power' | 'utilities'>('power');
  const [data, setData] = useState<EnergyState>(generateEnergyState());
  const diagramRef = useRef<HTMLDivElement>(null);
  const isDay = document.documentElement.getAttribute('data-theme') === 'light';

  // Force refresh when dataVersion changes (immediate update from Ops Data Entry)
  useEffect(() => {
    setData(generateEnergyState());
  }, [dataVersion]);

  // Initial Load
  useEffect(() => {
      setData(generateEnergyState());
  }, []);

  const scrollDiagram = (dir: 'left' | 'right') => {
      if (diagramRef.current) {
          diagramRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
      }
  };

  const getLineProps = (flow: number, type: 'hps' | 'mps' | 'lps') => {
      const absFlow = Math.abs(flow);
      // Scale width: min 2px, max 12px based on flow
      const width = Math.max(3, Math.min(14, 3 + (absFlow / 20)));
      
      let colorClass = 'from-gray-600 to-gray-500';
      // Colors match the new header gradients
      if (type === 'hps') colorClass = 'from-red-600 via-orange-500 to-red-600 shadow-orange-900/40';
      if (type === 'mps') colorClass = 'from-blue-600 via-sky-500 to-blue-600 shadow-blue-900/40';
      if (type === 'lps') colorClass = 'from-emerald-600 via-teal-500 to-emerald-600 shadow-emerald-900/40';

      return {
          style: { width: `${width}px` },
          className: `bg-gradient-to-r ${colorClass} shadow-md rounded-full transition-all duration-500 opacity-90 mx-auto`
      };
  };

  const FlowBadge: React.FC<{ value: number, type?: 'hps' | 'mps' | 'lps' }> = ({ value, type }) => {
    if (Math.abs(value) < 0.1) return <span className={isDay ? "text-slate-400" : "text-gray-600"}>-</span>;
    const isProd = value > 0;
    const absVal = Math.abs(value).toFixed(1);
    
    let colorClass = isDay ? 'text-slate-700' : 'text-gray-300';
    if (type === 'hps') colorClass = isDay ? 'text-orange-700' : 'text-orange-400';
    if (type === 'mps') colorClass = isDay ? 'text-sky-700' : 'text-sky-400';
    if (type === 'lps') colorClass = isDay ? 'text-emerald-700' : 'text-emerald-400';

    return (
      <div className={`flex items-center gap-1 font-mono text-xs ${colorClass} ${isDay ? 'bg-white/80 border-slate-200' : 'bg-black/40 border-white/5'} px-1.5 py-0.5 rounded border`}>
        {isProd ? <ArrowDown className="w-3 h-3 rotate-180" /> : <ArrowDown className="w-3 h-3" />}
        {absVal}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
        {/* Module Header & Tabs */}
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 ${isDay ? 'border-slate-200' : 'border-industrial-700'}`}>
            <div>
                <h2 className={`text-2xl font-bold tracking-tight flex items-center gap-3 ${isDay ? 'text-slate-900' : 'text-white'}`}>
                    <Zap className={isDay ? "text-brand-sky" : "text-neon-blue"} />
                    Energy Management
                </h2>
                <p className={`text-sm mt-1 ${isDay ? 'text-slate-500' : 'text-white opacity-60'}`}>Integrated Power, Steam, and Utility Systems</p>
            </div>
            <div className={`flex rounded p-1 border ${isDay ? 'bg-slate-100 border-slate-200' : 'bg-industrial-800 border-industrial-700'}`}>
                <button
                    onClick={() => setActiveTab('power')}
                    className={`px-4 py-1.5 text-sm font-bold rounded transition-colors flex items-center gap-2 ${
                        activeTab === 'power' 
                        ? (isDay ? 'bg-white text-brand-sky shadow-sm' : 'bg-neon-blue text-white shadow-lg') 
                        : (isDay ? 'text-slate-500 hover:text-slate-900' : 'text-white opacity-60 hover:opacity-100')
                    }`}
                >
                    <Power className="w-3 h-3" /> Power & Steam
                </button>
                <button
                    onClick={() => setActiveTab('utilities')}
                    className={`px-4 py-1.5 text-sm font-bold rounded transition-colors flex items-center gap-2 ${
                        activeTab === 'utilities' 
                        ? (isDay ? 'bg-white text-brand-teal shadow-sm' : 'bg-neon-green text-white shadow-lg') 
                        : (isDay ? 'text-slate-500 hover:text-slate-900' : 'text-white opacity-60 hover:opacity-100')
                    }`}
                >
                    <Factory className="w-3 h-3" /> Utilities
                </button>
            </div>
        </div>

      {activeTab === 'utilities' ? (
          <UtilitiesModule dataVersion={dataVersion} />
      ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
              {/* Power Generation & KPIs */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* KPI: Total Power */}
                <Card className={`${isDay ? 'bg-white border-l-4 border-l-brand-sky shadow-sm' : 'bg-gradient-to-br from-industrial-800 to-industrial-900 border-l-4 border-l-neon-blue'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`text-xs uppercase font-black tracking-widest ${isDay ? 'text-slate-500' : 'text-white opacity-60'}`}>Total Power Gen</p>
                      <h3 className={`text-2xl font-black mt-1 ${isDay ? 'text-slate-900' : 'text-white'}`}>{data.kpis.powerGeneration.toFixed(1)} <span className={`text-sm font-bold ${isDay ? 'text-slate-400' : 'text-white opacity-50'}`}>MW</span></h3>
                      <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-bold ${isDay ? 'text-slate-500' : 'text-white opacity-60'}`}>Demand: {data.kpis.powerDemand} MW</span>
                          <span className={`text-[10px] px-1 rounded font-black ${
                              data.kpis.systemStrength > 20 
                              ? (isDay ? 'bg-emerald-100 text-emerald-700' : 'bg-green-900/50 text-green-400') 
                              : (isDay ? 'bg-red-100 text-red-700' : 'bg-red-900/50 text-red-400')
                          }`}>
                              SS: {data.kpis.systemStrength.toFixed(0)}%
                          </span>
                      </div>
                    </div>
                    <Zap className={`w-6 h-6 ${isDay ? 'text-brand-sky' : 'text-neon-blue opacity-80'}`} />
                  </div>
                </Card>

                {/* Generator Status Grid */}
                <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                    {data.generators.map(gen => (
                        <div key={gen.id} className={`p-2 rounded flex flex-col items-center justify-center relative overflow-hidden group border transition-all ${
                            isDay 
                            ? 'bg-white border-slate-200 shadow-sm hover:border-brand-sky' 
                            : 'bg-industrial-800 border-industrial-700 hover:border-industrial-500'
                        } ${gen.status === UnitStatus.MAINTENANCE ? 'opacity-80 border-dashed' : ''}`}>
                            <div className={`absolute bottom-0 left-0 h-1 transition-all duration-500 ${gen.status === UnitStatus.MAINTENANCE ? 'bg-amber-500' : gen.load > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: gen.status === UnitStatus.MAINTENANCE ? '100%' : `${(gen.load/gen.capacity)*100}%` }}></div>
                            <div className="flex items-center gap-1 mb-1">
                                {gen.status === UnitStatus.MAINTENANCE ? <Wrench className="w-3 h-3 text-amber-500" /> : <Power className={`w-3 h-3 ${gen.load > 0 ? 'text-emerald-500' : 'text-gray-400'}`} />}
                                <span className={`text-xs font-black whitespace-nowrap ${isDay ? 'text-slate-700' : 'text-white opacity-70'}`}>{gen.id}</span>
                            </div>
                            {gen.status === UnitStatus.MAINTENANCE ? (
                                <div className="text-xs font-bold text-amber-500 uppercase tracking-wider my-1">Maint</div>
                            ) : (
                                <div className={`text-lg font-mono font-black ${isDay ? 'text-slate-900' : 'text-white'}`}>{gen.load.toFixed(1)} <span className={`text-[10px] ${isDay ? 'text-slate-400' : 'text-white opacity-50'}`}>MW</span></div>
                            )}
                            <div className={`text-[9px] uppercase font-bold ${
                                gen.status === UnitStatus.MAINTENANCE 
                                ? 'text-amber-500' 
                                : (isDay ? 'text-slate-400' : 'text-white opacity-40')
                            }`}>{gen.status === UnitStatus.MAINTENANCE ? 'Offline' : gen.status}</div>
                        </div>
                    ))}
                </div>
              </div>

              {/* Main Steam Balance Visualization */}
              <Card title="Steam Network Balance" className={`overflow-hidden relative group border-t-2 ${isDay ? 'border-t-brand-sky/50' : 'border-t-neon-blue/20'}`}>
                <button 
                    onClick={() => scrollDiagram('left')}
                    className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full border shadow-xl opacity-0 group-hover:opacity-100 transition-all ${isDay ? 'bg-white border-slate-200 text-slate-600 hover:text-brand-sky hover:bg-slate-50' : 'bg-black/60 border-industrial-500 text-white hover:bg-neon-blue'}`}
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                    onClick={() => scrollDiagram('right')}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full border shadow-xl opacity-0 group-hover:opacity-100 transition-all ${isDay ? 'bg-white border-slate-200 text-slate-600 hover:text-brand-sky hover:bg-slate-50' : 'bg-black/60 border-industrial-500 text-white hover:bg-neon-blue'}`}
                >
                    <ChevronRight className="w-6 h-6" />
                </button>

                <div className={`overflow-x-auto scrollbar-hide ${isDay ? 'bg-slate-50' : 'bg-industrial-950/50'}`} ref={diagramRef}>
                    <div className="min-w-full w-max p-8 flex flex-col gap-12">
                        
                        {/* --- HPS SYSTEM --- */}
                        <div className="relative min-h-[220px]">
                            {/* Header Label Block */}
                            <div className={`flex items-center gap-6 mb-6 px-4 py-3 border-l-4 border-orange-500 rounded-r-lg w-fit backdrop-blur-sm z-30 relative ${isDay ? 'bg-white/90 shadow-md' : 'bg-gradient-to-r from-orange-950/80 to-transparent'}`}>
                                <div>
                                     <h3 className={`text-2xl font-black tracking-widest drop-shadow-sm ${isDay ? 'text-slate-800' : 'text-white'}`}>HPS HEADER</h3>
                                     <p className={`text-xs font-mono tracking-widest uppercase ${isDay ? 'text-orange-600' : 'text-orange-400'}`}>High Pressure System</p>
                                </div>
                                <div className={`h-10 w-px mx-2 ${isDay ? 'bg-orange-200' : 'bg-orange-500/30'}`}></div>
                                <div className="flex gap-6">
                                    <div className="flex flex-col">
                                        <span className={`text-[10px] uppercase flex items-center gap-1 font-bold ${isDay ? 'text-slate-500' : 'text-gray-400'}`}><Gauge className="w-3 h-3" /> Pressure</span>
                                        <span className={`text-xl font-bold font-mono ${isDay ? 'text-slate-900' : 'text-white'}`}>{data.headers[0].pressure} <span className="text-sm text-gray-500">bar</span></span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-[10px] uppercase flex items-center gap-1 font-bold ${isDay ? 'text-slate-500' : 'text-gray-400'}`}><Thermometer className="w-3 h-3" /> Temp</span>
                                        <span className={`text-xl font-bold font-mono ${isDay ? 'text-slate-900' : 'text-white'}`}>{data.headers[0].temperature} <span className="text-sm text-gray-500">°C</span></span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-[10px] uppercase flex items-center gap-1 font-bold ${isDay ? 'text-slate-500' : 'text-gray-400'}`}><Wind className="w-3 h-3" /> Flow</span>
                                        <span className={`text-xl font-bold font-mono ${isDay ? 'text-slate-900' : 'text-white'}`}>{data.headers[0].totalFlow.toFixed(0)} <span className="text-sm text-gray-500">T/h</span></span>
                                    </div>
                                </div>
                            </div>

                            {/* The Massive Pipe */}
                            <div className="absolute top-28 left-0 w-full h-16 bg-gradient-to-b from-red-600 via-orange-500 to-red-700 rounded-full shadow-lg border-y border-orange-400/30 z-0">
                                 {/* Specular Highlight */}
                                 <div className="absolute top-2 left-0 w-full h-3 bg-gradient-to-b from-white/30 to-transparent blur-[3px]"></div>
                            </div>

                            {/* Asset Connections */}
                            <div className="relative z-10 flex gap-12 px-12 pt-16">
                                 {data.assets.filter(a => a.hps !== 0).map(asset => {
                                     const lineProps = getLineProps(asset.hps, 'hps');
                                     const isProducer = asset.hps > 0;
                                     
                                     return (
                                         <div key={asset.id} className="flex flex-col items-center w-28 group">
                                             <div className={`relative flex flex-col items-center ${isProducer ? '-mt-24 mb-1' : 'mt-12'}`}>
                                                {isProducer && (
                                                    <div className={`p-2 rounded w-full text-center shadow-lg hover:scale-105 transition-transform mb-2 relative z-20 border ${isDay ? 'bg-white border-slate-200' : 'bg-industrial-800 border-industrial-600'}`}>
                                                        <div className={`text-[10px] truncate ${isDay ? 'text-slate-500' : 'text-gray-400'}`}>{asset.id}</div>
                                                        <div className={`text-xs font-bold truncate ${isDay ? 'text-slate-900' : 'text-white'}`}>{asset.name.split(' ')[0]}</div>
                                                        <FlowBadge value={asset.hps} type="hps" />
                                                    </div>
                                                )}

                                                <div style={lineProps.style} className={`${lineProps.className} h-20`}></div>
                                                
                                                {!isProducer && (
                                                    <div className={`p-2 rounded w-full text-center shadow-lg hover:scale-105 transition-transform mt-2 relative z-20 border ${isDay ? 'bg-white border-slate-200' : 'bg-industrial-800 border-industrial-600'}`}>
                                                         <div className={`text-[10px] truncate ${isDay ? 'text-slate-500' : 'text-gray-400'}`}>{asset.id}</div>
                                                         <div className={`text-xs font-bold truncate ${isDay ? 'text-slate-900' : 'text-white'}`}>{asset.name.split(' ')[0]}</div>
                                                         <FlowBadge value={asset.hps} type="hps" />
                                                    </div>
                                                )}

                                                {/* Weld Point on Pipe */}
                                                <div className={`absolute ${isProducer ? 'bottom-[-6px]' : 'top-[-6px]'} left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-orange-600 border-2 border-orange-300 shadow-lg z-10`}></div>
                                             </div>
                                         </div>
                                     );
                                 })}
                                 {data.assets.filter(a => a.hps !== 0).length === 0 && (
                                     <div className="h-32 w-[600px] flex items-center justify-center text-gray-400 text-sm italic font-mono opacity-50">
                                         No flow detected - HPS Header Idle
                                     </div>
                                 )}
                            </div>
                        </div>


                        {/* --- MPS SYSTEM --- */}
                        <div className="relative min-h-[220px]">
                            <div className={`flex items-center gap-6 mb-6 px-4 py-3 border-l-4 border-sky-500 rounded-r-lg w-fit backdrop-blur-sm z-30 relative ${isDay ? 'bg-white/90 shadow-md' : 'bg-gradient-to-r from-blue-950/80 to-transparent'}`}>
                                <div>
                                     <h3 className={`text-2xl font-black tracking-widest drop-shadow-sm ${isDay ? 'text-slate-800' : 'text-white'}`}>MPS HEADER</h3>
                                     <p className={`text-xs font-mono tracking-widest uppercase ${isDay ? 'text-sky-600' : 'text-sky-400'}`}>Medium Pressure System</p>
                                </div>
                                <div className={`h-10 w-px mx-2 ${isDay ? 'bg-sky-200' : 'bg-sky-500/30'}`}></div>
                                <div className="flex gap-6">
                                    <div className="flex flex-col">
                                        <span className={`text-[10px] uppercase flex items-center gap-1 font-bold ${isDay ? 'text-slate-500' : 'text-gray-400'}`}><Gauge className="w-3 h-3" /> Pressure</span>
                                        <span className={`text-xl font-bold font-mono ${isDay ? 'text-slate-900' : 'text-white'}`}>{data.headers[1].pressure} <span className="text-sm text-gray-500">bar</span></span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-[10px] uppercase flex items-center gap-1 font-bold ${isDay ? 'text-slate-500' : 'text-gray-400'}`}><Thermometer className="w-3 h-3" /> Temp</span>
                                        <span className={`text-xl font-bold font-mono ${isDay ? 'text-slate-900' : 'text-white'}`}>{data.headers[1].temperature} <span className="text-sm text-gray-500">°C</span></span>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute top-28 left-0 w-full h-12 bg-gradient-to-b from-blue-600 via-sky-500 to-blue-700 rounded-full shadow-lg border-y border-sky-400/30 z-0">
                                 <div className="absolute top-2 left-0 w-full h-2 bg-gradient-to-b from-white/30 to-transparent blur-[2px]"></div>
                            </div>

                            <div className="relative z-10 flex gap-12 px-12 pt-16">
                                 {data.assets.filter(a => a.mps !== 0).map(asset => {
                                     const lineProps = getLineProps(asset.mps, 'mps');
                                     const isProducer = asset.mps > 0;
                                     
                                     return (
                                         <div key={asset.id} className="flex flex-col items-center w-28 group">
                                             <div className={`relative flex flex-col items-center ${isProducer ? '-mt-20 mb-1' : 'mt-10'}`}>
                                                {isProducer && (
                                                    <div className={`p-2 rounded w-full text-center shadow-lg mb-2 relative z-20 border ${isDay ? 'bg-white border-slate-200' : 'bg-industrial-800 border-industrial-600'}`}>
                                                        <div className={`text-[10px] truncate ${isDay ? 'text-slate-500' : 'text-gray-400'}`}>{asset.id}</div>
                                                        <FlowBadge value={asset.mps} type="mps" />
                                                    </div>
                                                )}
                                                <div style={lineProps.style} className={`${lineProps.className} h-16`}></div>
                                                {!isProducer && (
                                                    <div className={`p-2 rounded w-full text-center shadow-lg mt-2 relative z-20 border ${isDay ? 'bg-white border-slate-200' : 'bg-industrial-800 border-industrial-600'}`}>
                                                         <div className={`text-[10px] truncate ${isDay ? 'text-slate-500' : 'text-gray-400'}`}>{asset.id}</div>
                                                         <FlowBadge value={asset.mps} type="mps" />
                                                    </div>
                                                )}
                                                <div className={`absolute ${isProducer ? 'bottom-[-5px]' : 'top-[-5px]'} left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-sky-500 border-2 border-sky-200 shadow-lg z-10`}></div>
                                             </div>
                                         </div>
                                     );
                                 })}
                                 {data.assets.filter(a => a.mps !== 0).length === 0 && (
                                     <div className="h-28 w-[600px] flex items-center justify-center text-gray-400 text-sm italic font-mono opacity-50">
                                         No flow detected - MPS Header Idle
                                     </div>
                                 )}
                            </div>
                        </div>

                         {/* --- LPS SYSTEM --- */}
                         <div className="relative min-h-[220px]">
                            <div className={`flex items-center gap-6 mb-6 px-4 py-3 border-l-4 border-emerald-500 rounded-r-lg w-fit backdrop-blur-sm z-30 relative ${isDay ? 'bg-white/90 shadow-md' : 'bg-gradient-to-r from-emerald-950/80 to-transparent'}`}>
                                <div>
                                     <h3 className={`text-2xl font-black tracking-widest drop-shadow-sm ${isDay ? 'text-slate-800' : 'text-white'}`}>LPS HEADER</h3>
                                     <p className={`text-xs font-mono tracking-widest uppercase ${isDay ? 'text-emerald-600' : 'text-emerald-400'}`}>Low Pressure System</p>
                                </div>
                                <div className={`h-10 w-px mx-2 ${isDay ? 'bg-emerald-200' : 'bg-emerald-500/30'}`}></div>
                                <div className="flex gap-6">
                                    <div className="flex flex-col">
                                        <span className={`text-[10px] uppercase flex items-center gap-1 font-bold ${isDay ? 'text-slate-500' : 'text-gray-400'}`}><Gauge className="w-3 h-3" /> Pressure</span>
                                        <span className={`text-xl font-bold font-mono ${isDay ? 'text-slate-900' : 'text-white'}`}>{data.headers[2].pressure} <span className="text-sm text-gray-500">bar</span></span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-[10px] uppercase flex items-center gap-1 font-bold ${isDay ? 'text-slate-500' : 'text-gray-400'}`}><Thermometer className="w-3 h-3" /> Temp</span>
                                        <span className={`text-xl font-bold font-mono ${isDay ? 'text-slate-900' : 'text-white'}`}>{data.headers[2].temperature} <span className="text-sm text-gray-500">°C</span></span>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute top-28 left-0 w-full h-10 bg-gradient-to-b from-emerald-600 via-teal-500 to-emerald-700 rounded-full shadow-lg border-y border-teal-400/30 z-0">
                                 <div className="absolute top-2 left-0 w-full h-1.5 bg-gradient-to-b from-white/30 to-transparent blur-[1px]"></div>
                            </div>

                            <div className="relative z-10 flex gap-12 px-12 pt-16">
                                 {data.assets.filter(a => a.lps !== 0).map(asset => {
                                     const lineProps = getLineProps(asset.lps, 'lps');
                                     const isProducer = asset.lps > 0;
                                     
                                     return (
                                         <div key={asset.id} className="flex flex-col items-center w-28 group">
                                             <div className={`relative flex flex-col items-center ${isProducer ? '-mt-20 mb-1' : 'mt-8'}`}>
                                                {isProducer && (
                                                    <div className={`p-2 rounded w-full text-center shadow-lg mb-2 relative z-20 border ${isDay ? 'bg-white border-slate-200' : 'bg-industrial-800 border-industrial-600'}`}>
                                                        <div className={`text-[10px] truncate ${isDay ? 'text-slate-500' : 'text-gray-400'}`}>{asset.id}</div>
                                                        <FlowBadge value={asset.lps} type="lps" />
                                                    </div>
                                                )}
                                                <div style={lineProps.style} className={`${lineProps.className} h-14`}></div>
                                                {!isProducer && (
                                                    <div className={`p-2 rounded w-full text-center shadow-lg mt-2 relative z-20 border ${isDay ? 'bg-white border-slate-200' : 'bg-industrial-800 border-industrial-600'}`}>
                                                         <div className={`text-[10px] truncate ${isDay ? 'text-slate-500' : 'text-gray-400'}`}>{asset.id}</div>
                                                         <FlowBadge value={asset.lps} type="lps" />
                                                    </div>
                                                )}
                                                <div className={`absolute ${isProducer ? 'bottom-[-5px]' : 'top-[-5px]'} left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-teal-500 border-2 border-teal-200 shadow-lg z-10`}></div>
                                             </div>
                                         </div>
                                     );
                                 })}
                                 {data.assets.filter(a => a.lps !== 0).length === 0 && (
                                     <div className="h-24 w-[600px] flex items-center justify-center text-gray-400 text-sm italic font-mono opacity-50">
                                         No flow detected - LPS Header Idle
                                     </div>
                                 )}
                            </div>
                        </div>

                    </div>
                </div>
              </Card>
          </div>
      )}
    </div>
  );
};
