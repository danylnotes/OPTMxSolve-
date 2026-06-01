import React, { useState, useEffect } from 'react';
import { UnitStatus, RefineryUnit, Alert, EnergyState } from '../types';
import { generateEnergyState } from '../services/mockDataService';
import { Card } from './ui/Card';
import {
  Activity, Zap, Gauge,
  ShieldCheck, Factory, AlertCircle, ChevronRight, TrendingUp, Cloud, Wrench
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

  useEffect(() => { setEnergyData(generateEnergyState()); }, [dataVersion]);
  useEffect(() => {
    const interval = setInterval(() => setEnergyData(generateEnergyState()), 5000);
    return () => clearInterval(interval);
  }, []);

  // Live KPIs from actual unit data
  const avgEfficiency = units.length > 0
    ? Math.round(units.reduce((sum, u) => sum + u.efficiency, 0) / units.length)
    : 0;

  const cduUnit = units.find(u => u.id === 'CDU-01');
  const cduLoadPct = cduUnit ? calculateCapacity(cduUnit.currentLoad, cduUnit.capacity) : 0;

  const operationalCount = units.filter(u => u.status === UnitStatus.OPERATIONAL).length;
  const criticalCount = units.filter(u => u.status === UnitStatus.CRITICAL).length;
  const warningCount = units.filter(u => u.status === UnitStatus.WARNING).length;
  const reliabilityIndex = units.length > 0 ? Math.round((operationalCount / units.length) * 100) : 0;

  const criticalAlerts = alerts.filter(a => a.severity === 'high');
  const totalSteamDemand = energyData.headers.reduce((acc, h) => acc + h.totalFlow, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Plant Efficiency */}
        <div className={`rounded-2xl p-5 border relative overflow-hidden group transition-all hover:scale-[1.01] ${isDay ? 'bg-white border-sky-100 shadow-sm' : 'bg-blue-500/10 border-white/10'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDay ? 'text-slate-500' : 'opacity-60'}`}>Plant Efficiency</p>
              <h3 className={`text-4xl font-black mt-1 tabular-nums ${isDay ? 'text-slate-900' : 'text-white'}`}>{avgEfficiency}<span className="text-xl">%</span></h3>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className={`w-3 h-3 ${isDay ? 'text-brand-sky' : 'text-neon-blue'}`} />
                <span className={`text-[10px] font-bold ${isDay ? 'text-brand-sky' : 'text-neon-blue'}`}>{operationalCount}/{units.length} units nominal</span>
              </div>
            </div>
            <div className={`p-2.5 rounded-xl border ${isDay ? 'bg-sky-50 border-sky-100 text-brand-sky' : 'bg-neon-blue/10 border-neon-blue/20 text-neon-blue'}`}>
              <Gauge className="w-5 h-5" />
            </div>
          </div>
          {/* Mini bar */}
          <div className={`mt-4 w-full h-1 rounded-full ${isDay ? 'bg-slate-100' : 'bg-white/10'}`}>
            <div className="h-full rounded-full bg-neon-blue transition-all duration-1000" style={{ width: `${avgEfficiency}%` }} />
          </div>
        </div>

        {/* Crude Feed Rate */}
        <div className={`rounded-2xl p-5 border relative overflow-hidden transition-all hover:scale-[1.01] ${isDay ? 'bg-white border-teal-100 shadow-sm' : 'bg-emerald-500/10 border-white/10'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDay ? 'text-slate-500' : 'opacity-60'}`}>CDU Feed Rate</p>
              <h3 className={`text-4xl font-black mt-1 tabular-nums ${isDay ? 'text-slate-900' : 'text-white'}`}>{cduLoadPct}<span className="text-xl">%</span></h3>
              <div className="flex items-center gap-1 mt-2">
                <Activity className={`w-3 h-3 ${isDay ? 'text-brand-teal' : 'text-neon-green'}`} />
                <span className={`text-[10px] font-bold uppercase ${isDay ? 'text-brand-teal' : 'text-neon-green'}`}>
                  {cduLoadPct >= 100 ? 'Above Design' : cduLoadPct > 85 ? 'Optimized' : 'Reduced Rate'}
                </span>
              </div>
            </div>
            <div className={`p-2.5 rounded-xl border ${isDay ? 'bg-teal-50 border-teal-100 text-brand-teal' : 'bg-neon-green/10 border-neon-green/20 text-neon-green'}`}>
              <Factory className="w-5 h-5" />
            </div>
          </div>
          <div className={`mt-4 w-full h-1 rounded-full ${isDay ? 'bg-slate-100' : 'bg-white/10'}`}>
            <div className={`h-full rounded-full transition-all duration-1000 ${cduLoadPct > 100 ? 'bg-neon-amber' : 'bg-neon-green'}`} style={{ width: `${Math.min(cduLoadPct, 100)}%` }} />
          </div>
        </div>

        {/* Reliability Index */}
        <div className={`rounded-2xl p-5 border relative overflow-hidden transition-all hover:scale-[1.01] ${isDay ? 'bg-white border-purple-100 shadow-sm' : 'bg-purple-500/10 border-white/10'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDay ? 'text-slate-500' : 'opacity-60'}`}>Reliability Index</p>
              <h3 className={`text-4xl font-black mt-1 tabular-nums ${
                reliabilityIndex >= 90 ? (isDay ? 'text-emerald-600' : 'text-neon-green')
                : reliabilityIndex >= 75 ? (isDay ? 'text-amber-600' : 'text-neon-amber')
                : 'text-neon-red'
              }`}>{reliabilityIndex}<span className="text-xl">%</span></h3>
              <div className="flex items-center gap-2 mt-2">
                {criticalCount > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-neon-red">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-red animate-ping" />
                    {criticalCount} Critical
                  </span>
                )}
                {warningCount > 0 && (
                  <span className={`text-[10px] font-bold ${isDay ? 'text-amber-600' : 'text-neon-amber'}`}>
                    {warningCount} Warning
                  </span>
                )}
                {criticalCount === 0 && warningCount === 0 && (
                  <span className={`text-[10px] font-bold ${isDay ? 'text-emerald-600' : 'text-neon-green'}`}>All nominal</span>
                )}
              </div>
            </div>
            <div className={`p-2.5 rounded-xl border ${isDay ? 'bg-purple-50 border-purple-100 text-purple-600' : 'bg-purple-500/10 border-purple-500/20 text-purple-400'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className={`mt-4 w-full h-1 rounded-full ${isDay ? 'bg-slate-100' : 'bg-white/10'}`}>
            <div className={`h-full rounded-full transition-all duration-1000 ${reliabilityIndex >= 90 ? 'bg-neon-green' : reliabilityIndex >= 75 ? 'bg-neon-amber' : 'bg-neon-red'}`} style={{ width: `${reliabilityIndex}%` }} />
          </div>
        </div>

        {/* Steam & Power */}
        <div className={`rounded-2xl p-5 border relative overflow-hidden transition-all hover:scale-[1.01] ${isDay ? 'bg-white border-orange-100 shadow-sm' : 'bg-orange-500/10 border-white/10'}`}>
          <div className="flex justify-between items-start mb-3">
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDay ? 'text-slate-500' : 'opacity-60'}`}>Steam Demand</p>
            <Cloud className={`w-5 h-5 ${isDay ? 'text-orange-500' : 'text-orange-400'}`} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-4xl font-black tabular-nums ${isDay ? 'text-slate-900' : 'text-white'}`}>{totalSteamDemand.toFixed(0)}</span>
            <span className={`text-sm font-bold uppercase ${isDay ? 'text-slate-400' : 'text-gray-500'}`}>T/h</span>
          </div>
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-dashed border-white/10">
            <Zap className={`w-3.5 h-3.5 ${isDay ? 'text-purple-600' : 'text-purple-400'}`} />
            <span className={`text-[10px] font-bold ${isDay ? 'text-slate-500' : 'text-gray-400'}`}>
              Power: {energyData.kpis.powerDemand.toFixed(1)} / {energyData.kpis.totalGeneration.toFixed(1)} MW
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unit Health Grid */}
        <Card title="Process Unit Health" className={`lg:col-span-2 ${isDay ? '' : 'bg-black/20'}`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {units.slice(0, 8).map(unit => {
              const capPct = calculateCapacity(unit.currentLoad, unit.capacity);
              const isCritical = unit.status === UnitStatus.CRITICAL;
              const isWarning = unit.status === UnitStatus.WARNING;
              return (
                <div
                  key={unit.id}
                  onClick={() => onSelectUnit(unit.id)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group hover:scale-[1.02] ${
                    isCritical
                      ? (isDay ? 'bg-red-50 border-red-200 hover:border-red-400' : 'bg-red-500/10 border-red-500/30 hover:border-red-500/60')
                      : isWarning
                        ? (isDay ? 'bg-amber-50 border-amber-200 hover:border-amber-400' : 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/60')
                        : (isDay ? 'bg-slate-50 border-slate-200 hover:border-brand-sky hover:bg-white' : 'bg-white/5 border-white/10 hover:bg-white/10')
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[9px] font-black ${isDay ? 'text-slate-400' : 'opacity-60'}`}>{unit.id}</span>
                    <div className="relative flex items-center justify-center">
                      <div className={`w-2 h-2 rounded-full ${
                        isCritical ? 'bg-neon-red' : isWarning ? 'bg-neon-amber' : 'bg-neon-green'
                      }`} />
                      {isCritical && <div className="absolute w-4 h-4 rounded-full bg-neon-red/40 animate-ping" />}
                      {isWarning && <div className="absolute w-3 h-3 rounded-full bg-neon-amber/30 animate-pulse" />}
                    </div>
                  </div>
                  <h4 className={`text-[10px] font-bold leading-tight mb-3 ${isDay ? 'text-slate-800' : 'text-white'}`}>{unit.name}</h4>
                  <div className={`w-full h-1.5 rounded-full ${isDay ? 'bg-slate-200' : 'bg-white/10'}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        isCritical ? 'bg-neon-red' : isWarning ? 'bg-neon-amber' : (isDay ? 'bg-brand-sky' : 'bg-neon-blue')
                      }`}
                      style={{ width: `${Math.min(capPct, 100)}%` }}
                    />
                  </div>
                  <div className={`mt-1.5 flex justify-between text-[9px] font-black uppercase ${isDay ? 'text-slate-400' : 'opacity-50'}`}>
                    <span>{capPct}%</span>
                    <span>{unit.efficiency}%eff</span>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => onNavigate('units')}
            className={`mt-5 w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${
              isDay
                ? 'bg-white text-brand-sky border-slate-200 hover:bg-slate-50 hover:border-brand-sky shadow-sm'
                : 'text-white border-white/20 glass-panel hover:bg-white/10'
            }`}
          >
            Enter Unit Command Center <ChevronRight className="w-3 h-3" />
          </button>
        </Card>

        <div className="space-y-4">
          {/* Safety */}
          <div className={`rounded-2xl p-5 border transition-all hover:scale-[1.01] ${isDay ? 'bg-emerald-50 border-emerald-100' : 'bg-emerald-500/10 border-white/10'}`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl border ${isDay ? 'bg-white border-emerald-200 text-emerald-600' : 'bg-white/10 border-white/20 text-neon-green'}`}>
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${isDay ? 'text-slate-500' : 'opacity-50'}`}>LTI-Free Days</p>
                <h3 className={`text-3xl font-black ${isDay ? 'text-slate-900' : 'text-white'}`}>142</h3>
                <p className={`text-[10px] font-bold mt-0.5 ${isDay ? 'text-emerald-600' : 'text-neon-green'}`}>Safety Record Clean</p>
              </div>
            </div>
          </div>

          {/* Maintenance */}
          <div className={`rounded-2xl p-5 border transition-all hover:scale-[1.01] ${isDay ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
            <div className="flex items-center gap-3 mb-3">
              <Wrench className={`w-4 h-4 ${isDay ? 'text-amber-600' : 'text-neon-amber'}`} />
              <span className={`text-[10px] font-black uppercase tracking-widest ${isDay ? 'text-slate-500' : 'opacity-60'}`}>Maintenance Status</span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Operational', count: operationalCount, color: 'bg-neon-green' },
                { label: 'Warning', count: warningCount, color: 'bg-neon-amber' },
                { label: 'Critical', count: criticalCount, color: 'bg-neon-red' },
              ].map(({ label, count, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${color}`} />
                    <span className={`text-xs font-medium ${isDay ? 'text-slate-600' : 'text-gray-300'}`}>{label}</span>
                  </div>
                  <span className={`text-sm font-black ${isDay ? 'text-slate-900' : 'text-white'}`}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <Card title="Active Alerts" className={`${isDay ? '' : 'bg-black/20'}`}>
            <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
              {criticalAlerts.length > 0 ? (
                criticalAlerts.slice(0, 4).map(alert => (
                  <div key={alert.id} className={`p-3 rounded-lg border flex gap-2.5 ${
                    isDay ? 'bg-red-50 border-red-100 text-red-900' : 'bg-red-500/15 border-red-500/25 text-gray-200'
                  }`}>
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-neon-red" />
                    <div>
                      <p className="text-[10px] font-bold leading-snug">{alert.message}</p>
                      <p className={`text-[9px] mt-0.5 opacity-60 font-mono`}>{alert.unitId} • {alert.timestamp}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-4 opacity-30">
                  <Activity className="w-8 h-8 mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No Deviations</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
