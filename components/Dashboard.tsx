
import React, { useState, useEffect } from 'react';
import { UnitStatus, RefineryUnit, Alert, EnergyState } from '../types';
import { generateEnergyState } from '../services/mockDataService';
import { Card } from './ui/Card';
import { 
  Activity, Zap, Gauge, 
  ShieldCheck, Factory, AlertCircle, ChevronRight, TrendingUp, Cloud, Droplet
} from 'lucide-react';

interface DashboardProps {
  units: RefineryUnit[];
  alerts: Alert[];
  onSelectUnit: (unitId: string) => void;
  onNavigate: (tab: string) => void;
  dataVersion: number;
}

const calculateCapacity = (current: string, design: string) => {
  const getNum = (s: string) => parseFloat(s.replace(/,/g, '').split(' ')[0]);
  const c = getNum(current);
  const d = getNum(design);
  if (isNaN(c) || isNaN(d) || d === 0) return 0;
  return Math.round((c / d) * 100);
};

export const Dashboard: React.FC<DashboardProps> = ({ units, alerts, onSelectUnit, onNavigate, dataVersion }) => {
  const isDay = document.documentElement.getAttribute('data-theme') === 'light';
  const [energyData, setEnergyData] = useState<EnergyState>(generateEnergyState());
  
  const criticalAlerts = alerts.filter(a => a.severity === 'high');

  // Trigger re-fetch when dataVersion changes (Submit button clicked)
  useEffect(() => {
    setEnergyData(generateEnergyState());
  }, [dataVersion]);

  // Refresh energy data periodically to simulate live data
  useEffect(() => {
    const interval = setInterval(() => {
        setEnergyData(generateEnergyState());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalSteamDemand = energyData.headers.reduce((acc, h) => acc + h.totalFlow, 0);
  const steamSS = energyData.kpis.systemStrength;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Cards - Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Plant Efficiency */}
        <Card className={`${isDay ? 'bg-white border-sky-100 shadow-sm' : 'bg-blue-500/20 text-white border-white/10 shadow-glass'}`}>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDay ? 'text-slate-500' : 'opacity-70'}`}>Plant Efficiency</p>
              <h3 className={`text-3xl font-black mt-1 ${isDay ? 'text-industrial-900' : 'text-white'}`}>94%</h3>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className={`w-3 h-3 ${isDay ? 'text-brand-sky' : 'text-neon-blue'}`} />
                <span className={`text-[10px] font-bold ${isDay ? 'text-brand-sky' : 'opacity-80'}`}>+2.4%</span>
              </div>
            </div>
            <div className={`p-2 rounded-full border ${isDay ? 'bg-sky-50 border-sky-100 text-brand-sky' : 'bg-white/10 border-white/20 text-white'}`}>
              <Gauge className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Refinery Feed Rate */}
        <Card className={`${isDay ? 'bg-white border-teal-100 shadow-sm' : 'bg-emerald-500/20 text-white border-white/10 shadow-glass'}`}>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDay ? 'text-slate-500' : 'opacity-70'}`}>Refinery Feed Rate</p>
              <h3 className={`text-3xl font-black mt-1 ${isDay ? 'text-industrial-900' : 'text-white'}`}>101.0%</h3>
              <div className="flex items-center gap-1 mt-2">
                <Activity className={`w-3 h-3 ${isDay ? 'text-brand-teal' : 'text-neon-green'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-tighter ${isDay ? 'text-brand-teal' : 'opacity-80'}`}>Optimized</span>
              </div>
            </div>
            <div className={`p-2 rounded-full border ${isDay ? 'bg-teal-50 border-teal-100 text-brand-teal' : 'bg-white/10 border-white/20 text-white'}`}>
              <Factory className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Combined Steam Network Card - Redesigned */}
        <div className={`rounded-xl p-5 relative overflow-hidden flex flex-col justify-between shadow-sm border transition-all hover:shadow-md ${
            isDay ? 'bg-white border-slate-100' : 'bg-white/5 border-white/10'
        }`}>
            {/* Left Accent Bar */}
            <div className={`absolute left-0 top-3 bottom-3 w-1.5 rounded-r-lg ${isDay ? 'bg-orange-500' : 'bg-orange-400'}`}></div>
            
            <div className="pl-4">
                <div className="flex justify-between items-start mb-2">
                    <h4 className={`text-[10px] font-black uppercase tracking-widest ${isDay ? 'text-slate-500' : 'text-gray-400'}`}>
                        Total Steam Demand
                    </h4>
                    <Cloud className={`w-5 h-5 ${isDay ? 'text-orange-500' : 'text-orange-400'}`} />
                </div>
                
                <div className="flex items-baseline gap-1.5">
                    <span className={`text-4xl font-black tracking-tight ${isDay ? 'text-slate-900' : 'text-white'}`}>
                        {totalSteamDemand.toFixed(0)}
                    </span>
                    <span className={`text-sm font-bold uppercase ${isDay ? 'text-slate-400' : 'text-gray-500'}`}>T/h</span>
                </div>

                <div className="flex items-center gap-3 mt-4">
                    <span className={`text-xs font-bold ${isDay ? 'text-slate-400' : 'text-gray-500'}`}>
                        System Strength:
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        steamSS < 20 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-emerald-100 text-emerald-600'
                    }`}>
                        SS: {steamSS.toFixed(1)}%
                    </span>
                </div>
            </div>
        </div>

        {/* Combined Power Card */}
        <Card className={`${isDay ? 'bg-white border-purple-100 shadow-sm' : 'bg-purple-500/20 text-white border-white/10 shadow-glass'}`}>
          <div className="flex justify-between items-start relative z-10">
            <div className="flex-1">
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${isDay ? 'text-slate-500' : 'opacity-70'}`}>Power Network</p>
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col">
                  <span className={`text-[9px] uppercase font-bold ${isDay ? 'text-slate-400' : 'opacity-50'}`}>Demand</span>
                  <span className={`text-xl font-black ${isDay ? 'text-purple-900' : 'text-white'}`}>{energyData.kpis.powerDemand.toFixed(1)}</span>
                </div>
                <div className={`h-8 w-px mx-4 ${isDay ? 'bg-slate-200' : 'bg-white/20'}`}></div>
                <div className="flex flex-col items-end">
                  <span className={`text-[9px] uppercase font-bold ${isDay ? 'text-slate-400' : 'opacity-50'}`}>Gen</span>
                  <span className={`text-xl font-black ${isDay ? 'text-purple-900' : 'text-white'}`}>{energyData.kpis.totalGeneration.toFixed(1)}</span>
                </div>
              </div>
              <div className={`flex items-center gap-2 mt-2 pt-2 border-t ${isDay ? 'border-purple-50' : 'border-white/10'}`}>
                <Zap className={`w-3 h-3 ${isDay ? 'text-purple-600' : 'text-purple-400'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isDay ? 'text-slate-400' : 'opacity-80'}`}>Grid Stability Normal</span>
              </div>
            </div>
            <div className={`p-2 rounded-full border ml-4 ${isDay ? 'bg-purple-50 border-purple-100 text-purple-600' : 'bg-white/10 border-white/20 text-white'}`}>
              <Zap className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unit Health Cards */}
        <Card title="Process Unit Health" className={`lg:col-span-2 ${isDay ? 'bg-white border-slate-200' : 'bg-black/30'}`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {units.slice(0, 8).map(unit => {
              const capPct = calculateCapacity(unit.currentLoad, unit.capacity);
              return (
              <div 
                key={unit.id}
                onClick={() => onSelectUnit(unit.id)}
                className={`cursor-pointer p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group ${
                  isDay 
                  ? 'bg-slate-50 border-slate-200 hover:border-brand-sky hover:bg-white text-slate-800' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-black ${isDay ? 'text-slate-400' : 'opacity-80'}`}>{unit.id}</span>
                  <div className={`w-2 h-2 rounded-full ${
                    unit.status === UnitStatus.OPERATIONAL ? 'bg-emerald-600' :
                    unit.status === UnitStatus.WARNING ? 'bg-amber-500' : 'bg-red-500'
                  } shadow-[0_0_8px_currentColor]`} />
                </div>
                <h4 className="text-xs font-bold truncate mb-2">{unit.name}</h4>
                <div className={`w-full h-1.5 bg-slate-200 dark:bg-gray-500/30 rounded-full overflow-hidden`}>
                  <div 
                    className={`${isDay ? 'bg-brand-sky' : 'bg-neon-blue'} h-full transition-all duration-1000`} 
                    style={{ width: `${capPct}%` }}
                  />
                </div>
                <div className={`mt-2 flex justify-between items-center text-[9px] font-black uppercase ${isDay ? 'text-slate-500' : 'opacity-60'}`}>
                    <span>Cap: {capPct}%</span>
                    <span>{unit.status}</span>
                </div>
              </div>
            )})}
          </div>
          <button 
            onClick={() => onNavigate('units')}
            className={`mt-6 w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${
              isDay 
              ? 'bg-white text-brand-sky border-slate-200 hover:bg-slate-50 hover:border-brand-sky shadow-sm' 
              : 'text-white border-white/20 glass-panel hover:bg-white/10'}`}
          >
            Enter Unit Command Center <ChevronRight className="w-3 h-3" />
          </button>
        </Card>

        <div className="space-y-6">
          <Card title="Safety Performance" className={`${isDay ? 'bg-white border-teal-100' : 'bg-emerald-500/10 text-white'}`}>
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-full ${isDay ? 'bg-teal-50 border border-teal-100 text-brand-teal' : 'bg-white/10 border-white/20'}`}>
                <ShieldCheck className={`w-8 h-8`} />
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${isDay ? 'text-slate-500' : 'opacity-60'}`}>LTI Free Days</p>
                <h3 className={`text-3xl font-black ${isDay ? 'text-industrial-900' : 'text-white'}`}>142</h3>
                <p className={`text-[10px] font-bold mt-1 ${isDay ? 'text-brand-teal' : 'opacity-80'}`}>Safety Record Clean</p>
              </div>
            </div>
          </Card>

          <Card title="Active Alerts" className={`flex-1 ${isDay ? 'bg-white border-slate-200' : 'bg-black/30'}`}>
            <div className="space-y-3">
              {criticalAlerts.length > 0 ? (
                criticalAlerts.slice(0, 3).map(alert => (
                  <div key={alert.id} className={`p-3 rounded-lg border flex gap-3 ${
                    isDay ? 'bg-red-50 border-red-100 text-red-900 shadow-sm' : 'bg-red-500/20 border-red-500/30 text-gray-200'
                  }`}>
                    <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 text-red-500`} />
                    <div>
                      <p className={`text-xs font-bold`}>{alert.message}</p>
                      <p className={`text-[9px] font-black uppercase mt-1 opacity-60`}>{alert.unitId} • {alert.timestamp}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-6 opacity-30">
                  <Activity className={`w-10 h-10 mb-2`} />
                  <p className={`text-[10px] font-black uppercase tracking-widest`}>No Process Deviations</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
