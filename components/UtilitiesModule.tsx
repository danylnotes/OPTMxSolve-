
import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { generateUtilityData, UTILITY_CONSUMERS_DATA } from '../services/mockDataService';
import { UtilityMetric, UnitStatus } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Factory, Wind, Droplet, Flame, ArrowUp, ArrowDown, Activity, AlertTriangle, CheckCircle, Gauge, Thermometer, Table, Info, Snowflake } from 'lucide-react';

interface UtilitiesModuleProps {
    dataVersion?: number;
}

export const UtilitiesModule: React.FC<UtilitiesModuleProps> = ({ dataVersion }) => {
  const [data, setData] = useState<UtilityMetric[]>([]);

  // Force refresh when dataVersion changes (immediate update from Ops Data Entry)
  useEffect(() => {
    setData(generateUtilityData());
  }, [dataVersion]);

  useEffect(() => {
    // Initial load
    setData(generateUtilityData());
  }, []);

  const getIcon = (type: string) => {
      switch(type) {
          case 'Nitrogen': return <Wind className="w-5 h-5 text-blue-400" />;
          case 'Air': return <Wind className="w-5 h-5 text-sky-300" />;
          case 'Gas': return <Flame className="w-5 h-5 text-amber-500" />;
          case 'Fuel': return <Droplet className="w-5 h-5 text-purple-400" />;
          case 'Water': return <Snowflake className="w-5 h-5 text-cyan-400" />;
          default: return <Factory className="w-5 h-5 text-gray-400" />;
      }
  };

  const getStatusColor = (status: UnitStatus) => {
      if (status === UnitStatus.CRITICAL) return 'text-neon-red';
      if (status === UnitStatus.WARNING) return 'text-neon-amber';
      return 'text-neon-green';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center border-b border-industrial-700 pb-4">
            <div>
                <h2 className="text-2xl font-bold text-[var(--text-main)] tracking-tight flex items-center gap-3">
                    <Factory className="text-neon-blue" /> 
                    Utilities Management
                </h2>
                <p className="text-[var(--text-main)] opacity-60 text-sm mt-1">Real-time balance: Nitrogen, Instrument Air, Fuel Gas, Fuel Oil, Cooling Water</p>
            </div>
            <div className="flex gap-4">
                 <div className="bg-industrial-800 px-4 py-2 rounded border border-industrial-700">
                     <span className="text-xs text-[var(--text-main)] opacity-50 uppercase block">Plant Status</span>
                     <span className="text-neon-green font-bold text-sm flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> NORMAL
                     </span>
                 </div>
            </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.map((utility) => {
                const balance = utility.productionRate - utility.consumptionRate;
                const isDeficit = balance < 0;
                
                return (
                    <Card key={utility.id} className="flex flex-col h-full border-t-4 border-t-industrial-600 hover:border-t-neon-blue transition-colors">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-industrial-900 rounded-lg border border-industrial-700">
                                    {getIcon(utility.type)}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[var(--text-main)]">{utility.name}</h3>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-[var(--text-main)] opacity-50 font-mono">{utility.id}</span>
                                        <span className={`flex items-center gap-1 ${getStatusColor(utility.status)}`}>
                                            ● {utility.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className={`text-right ${isDeficit ? 'text-neon-amber' : 'text-neon-green'}`}>
                                <div className="text-xs text-[var(--text-main)] opacity-60 uppercase font-semibold">Net Balance</div>
                                <div className="text-xl font-mono font-bold">
                                    {balance > 0 ? '+' : ''}{balance.toFixed(1)} <span className="text-xs font-normal text-[var(--text-main)] opacity-50">{utility.unit}</span>
                                </div>
                            </div>
                        </div>

                        {/* Operational Conditions (Pressure/Temp) */}
                        {(utility.pressure !== undefined || utility.temperature !== undefined) && (
                            <div className="grid grid-cols-2 gap-2 mb-4 bg-industrial-800/50 p-3 rounded border border-industrial-700">
                                {utility.pressure !== undefined && (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-[var(--text-main)] opacity-60">
                                            <Gauge className="w-3 h-3" /> Pressure
                                        </div>
                                        <div className="text-sm font-mono font-bold text-[var(--text-main)]">
                                            {utility.pressure.toFixed(2)} <span className="text-xs font-normal text-[var(--text-main)] opacity-50">kg/cm²</span>
                                        </div>
                                    </div>
                                )}
                                {utility.temperature !== undefined && (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-[var(--text-main)] opacity-60">
                                            <Thermometer className="w-3 h-3" /> Temp
                                        </div>
                                        <div className="text-sm font-mono font-bold text-[var(--text-main)]">
                                            {utility.temperature.toFixed(1)} <span className="text-xs font-normal text-[var(--text-main)] opacity-50">°C</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* SPECIFIC DETAILS GRID (New) */}
                        {utility.details && utility.details.length > 0 && (
                            <div className="mb-4">
                                <h4 className="text-[10px] text-[var(--text-main)] opacity-40 uppercase font-bold tracking-wider mb-2 flex items-center gap-1">
                                    <Info className="w-3 h-3" /> Unit Specifics
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {utility.details.map((det, idx) => (
                                        <div key={idx} className={`p-2 rounded border flex flex-col ${det.highlight ? 'bg-blue-900/20 border-blue-500/30' : 'bg-industrial-900/30 border-industrial-700/50'}`}>
                                            <span className="text-[9px] text-[var(--text-main)] opacity-60 uppercase">{det.label}</span>
                                            <span className={`font-mono text-sm font-semibold ${det.highlight ? 'text-neon-blue' : 'text-[var(--text-main)]'}`}>
                                                {det.value} <span className="text-[10px] opacity-50 font-normal">{det.unit}</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Real-time Metrics */}
                        <div className="grid grid-cols-2 gap-4 mb-6 bg-industrial-900/50 p-4 rounded-lg border border-industrial-700/50 mt-auto">
                             <div>
                                 <div className="flex items-center gap-2 mb-1">
                                     <ArrowUp className="w-3 h-3 text-neon-green" />
                                     <span className="text-xs text-[var(--text-main)] opacity-50 uppercase">Input</span>
                                 </div>
                                 <div className="text-2xl font-mono font-bold text-[var(--text-main)]">
                                     {utility.productionRate.toLocaleString()} <span className="text-sm font-normal text-[var(--text-main)] opacity-50">{utility.unit}</span>
                                 </div>
                                 <div className="text-xs text-[var(--text-main)] opacity-50 mt-1">
                                     Daily: <span className="text-[var(--text-main)] opacity-70">{utility.dailyProduction.toLocaleString()}</span>
                                 </div>
                             </div>
                             <div>
                                 <div className="flex items-center gap-2 mb-1">
                                     <ArrowDown className="w-3 h-3 text-neon-blue" />
                                     <span className="text-xs text-[var(--text-main)] opacity-50 uppercase">Demand</span>
                                 </div>
                                 <div className="text-2xl font-mono font-bold text-[var(--text-main)]">
                                     {utility.consumptionRate.toLocaleString()} <span className="text-sm font-normal text-[var(--text-main)] opacity-50">{utility.unit}</span>
                                 </div>
                                 <div className="text-xs text-[var(--text-main)] opacity-50 mt-1">
                                     Daily: <span className="text-[var(--text-main)] opacity-70">{utility.dailyConsumption.toLocaleString()}</span>
                                 </div>
                             </div>
                        </div>

                        {/* Trend Chart */}
                        <div className="flex-1 min-h-[100px] w-full bg-industrial-900/30 rounded p-2">
                            <div className="mb-2 flex items-center justify-between px-2">
                                <span className="text-xs text-[var(--text-main)] opacity-50 flex items-center gap-1">
                                    <Activity className="w-3 h-3" /> 24h Trend
                                </span>
                                <div className="flex gap-3 text-[10px]">
                                    <span className="flex items-center gap-1 text-[var(--text-main)] opacity-50"><div className="w-2 h-2 rounded-full bg-neon-green"></div> Prod</span>
                                    <span className="flex items-center gap-1 text-[var(--text-main)] opacity-50"><div className="w-2 h-2 rounded-full bg-neon-blue"></div> Cons</span>
                                </div>
                            </div>
                            <div className="h-[100px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={utility.history}>
                                        <defs>
                                            <linearGradient id={`gradProd-${utility.id}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id={`gradCons-${utility.id}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                                        <XAxis dataKey="time" hide />
                                        <YAxis hide domain={['auto', 'auto']} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: 'var(--color-ind-800)', borderColor: 'var(--color-ind-700)', color: 'var(--text-main)', fontSize: '12px' }}
                                            formatter={(val: number) => val.toFixed(1)}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="prod" 
                                            stroke="#10b981" 
                                            fill={`url(#gradProd-${utility.id})`} 
                                            strokeWidth={2}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="cons" 
                                            stroke="#3b82f6" 
                                            fill={`url(#gradCons-${utility.id})`} 
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    </div>
  );
};
