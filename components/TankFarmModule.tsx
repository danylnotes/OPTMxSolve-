import React, { useState } from 'react';
import { Card } from './ui/Card';
import { TANKS_DATA } from '../services/mockDataService';
import { Tank } from '../types';
import { Droplet, ArrowRight, Activity, Thermometer, Waves, Database, TrendingUp } from 'lucide-react';

interface TankFarmProps {
  onNavigateToUnit: (unitId: string) => void;
}

const TankGraphic: React.FC<{ tank: Tank; onClick: () => void }> = ({ tank, onClick }) => {
  const fillPct = Math.min((tank.level / tank.maxLevel) * 100, 100);
  const isDay = document.documentElement.getAttribute('data-theme') === 'light';

  let liquidColor = 'bg-blue-500';
  if (tank.product.includes('Crude')) liquidColor = 'bg-slate-600';
  else if (tank.product.includes('Naphtha')) liquidColor = 'bg-yellow-300/80';
  else if (tank.product.includes('Diesel') || tank.product.includes('ULSD')) liquidColor = 'bg-amber-600/80';
  else if (tank.product.includes('HFO') || tank.product.includes('Fuel')) liquidColor = 'bg-slate-900';
  else if (tank.product.includes('Reformate')) liquidColor = 'bg-orange-400/80';
  else if (tank.product.includes('Jet') || tank.product.includes('Kero')) liquidColor = 'bg-sky-300/80';
  else if (tank.product.includes('Isomate') || tank.product.includes('Isomerate')) liquidColor = 'bg-lime-400/80';

  const statusColors: Record<Tank['status'], string> = {
    Filling: 'text-neon-green',
    Emptying: 'text-neon-amber',
    Static: 'text-gray-400',
    Maintenance: 'text-neon-red',
  };

  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center gap-2 cursor-pointer group w-[90px] flex-shrink-0 hover:scale-105 transition-transform"
    >
      <div className={`relative w-14 h-20 border-2 rounded-sm overflow-hidden shadow-lg group-hover:border-neon-blue transition-colors ${isDay ? 'border-slate-300 bg-slate-100' : 'border-industrial-500 bg-industrial-800/50'}`}>
        <div
          className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ${liquidColor}`}
          style={{ height: fillPct > 0 ? `${fillPct}%` : '0%' }}
        >
          {fillPct > 5 && <div className="absolute top-0 w-full h-0.5 bg-white/30 animate-pulse" />}
        </div>

        <div className={`absolute right-0 top-0 h-full w-1.5 border-l flex flex-col justify-between py-0.5 ${isDay ? 'border-slate-300' : 'border-industrial-600/50'}`}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`w-1 h-[1px] ${isDay ? 'bg-slate-400' : 'bg-industrial-400'}`} />
          ))}
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className={`text-[10px] font-bold drop-shadow-md ${isDay ? 'text-slate-700' : 'text-white'}`}>
            {fillPct > 0 ? `${fillPct.toFixed(0)}%` : '—'}
          </span>
        </div>
      </div>

      <div className="text-center">
        <div className={`text-[9px] font-bold px-1 rounded mb-0.5 truncate max-w-[80px] ${isDay ? 'bg-slate-200 text-slate-700' : 'bg-industrial-700/50 border border-industrial-600 text-gray-300'}`}>
          {tank.id}
        </div>
        <div className={`text-[8px] leading-tight max-w-[80px] truncate ${isDay ? 'text-slate-500' : 'text-gray-400'}`}>
          {tank.product}
        </div>
        <div className={`text-[9px] font-mono ${statusColors[tank.status]}`}>
          {tank.level > 0 ? `${tank.level.toFixed(2)}m` : 'Empty'}
        </div>
      </div>
    </div>
  );
};

const StatBadge: React.FC<{ label: string; value: string | number; unit?: string; color?: string }> = ({ label, value, unit, color = 'text-neon-blue' }) => {
  const isDay = document.documentElement.getAttribute('data-theme') === 'light';
  return (
    <div className={`p-3 rounded-lg border ${isDay ? 'bg-white/50 border-slate-200' : 'bg-black/20 border-white/5'}`}>
      <div className={`text-[9px] uppercase font-bold mb-1 opacity-60 ${isDay ? 'text-slate-500' : 'text-gray-400'}`}>{label}</div>
      <div className={`text-base font-mono font-bold ${color}`}>
        {value}<span className="text-xs opacity-60 ml-1">{unit}</span>
      </div>
    </div>
  );
};

export const TankFarmModule: React.FC<TankFarmProps> = ({ onNavigateToUnit }) => {
  const [filter, setFilter] = useState<'All' | 'Crude' | 'Intermediate' | 'Product'>('All');
  const [selectedTank, setSelectedTank] = useState<Tank | null>(null);
  const isDay = document.documentElement.getAttribute('data-theme') === 'light';

  const M3_TO_BBL = 6.2898;

  const categorize = (tank: Tank): 'Crude' | 'Intermediate' | 'Product' => {
    if (tank.product.includes('Crude')) return 'Crude';
    if (tank.product.includes('Naphtha') || tank.product.includes('VGO')) return 'Intermediate';
    return 'Product';
  };

  const filteredTanks = TANKS_DATA.filter(t => {
    if (filter === 'All') return true;
    return categorize(t) === filter;
  });

  const crudeTanks = TANKS_DATA.filter(t => t.product.includes('Crude'));
  const intermediateTanks = TANKS_DATA.filter(t => categorize(t) === 'Intermediate');
  const productTanks = TANKS_DATA.filter(t => categorize(t) === 'Product');

  const totalInventoryBbl = TANKS_DATA.reduce((sum, t) => sum + t.volume * M3_TO_BBL, 0);
  const totalCapacityBbl = TANKS_DATA.reduce((sum, t) => sum + t.maxVolume * M3_TO_BBL, 0);
  const avgUtilization = totalCapacityBbl > 0 ? ((totalInventoryBbl / totalCapacityBbl) * 100) : 0;
  const activeTanks = TANKS_DATA.filter(t => t.status === 'Filling' || t.status === 'Emptying').length;

  const formatBbl = (bbl: number) =>
    bbl >= 1000000 ? `${(bbl / 1000000).toFixed(2)}M` : bbl >= 1000 ? `${(bbl / 1000).toFixed(1)}k` : bbl.toFixed(0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b ${isDay ? 'border-slate-200' : 'border-industrial-700'}`}>
        <div>
          <h2 className={`text-2xl font-bold tracking-tight flex items-center gap-3 ${isDay ? 'text-slate-900' : 'text-white'}`}>
            <Waves className={isDay ? 'text-brand-sky' : 'text-neon-blue'} />
            Tank Farm Management
          </h2>
          <p className={`text-sm mt-1 ${isDay ? 'text-slate-500' : 'text-gray-400'}`}>
            Real-time inventory, transfer status, and process lineage.
          </p>
        </div>

        <div className={`flex rounded-lg p-1 border ${isDay ? 'bg-slate-100 border-slate-200' : 'bg-industrial-800 border-industrial-700'}`}>
          {(['All', 'Crude', 'Intermediate', 'Product'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${
                filter === f
                  ? isDay ? 'bg-brand-sky text-white shadow' : 'bg-neon-blue text-white shadow'
                  : isDay ? 'text-slate-500 hover:text-slate-900' : 'text-gray-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatBadge label="Total Inventory" value={formatBbl(totalInventoryBbl)} unit="bbl" color={isDay ? 'text-brand-sky' : 'text-neon-blue'} />
        <StatBadge label="Utilization" value={avgUtilization.toFixed(1)} unit="%" color={avgUtilization > 85 ? 'text-neon-red' : avgUtilization > 60 ? 'text-neon-amber' : 'text-neon-green'} />
        <StatBadge label="Active Transfers" value={activeTanks} unit="tanks" color={isDay ? 'text-emerald-600' : 'text-neon-green'} />
        <StatBadge label="Total Tanks" value={TANKS_DATA.length} unit="units" color={isDay ? 'text-slate-700' : 'text-gray-300'} />
      </div>

      {/* Process Flow Diagram */}
      {filter === 'All' && (
        <Card title="Process Flow & Tank Lineage">
          <div className="overflow-x-auto">
            <div className="min-w-[900px] p-6 flex items-start justify-between gap-4">
              {/* Crude */}
              <div className="flex flex-col items-center gap-3">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${isDay ? 'bg-slate-100 border-slate-300 text-slate-500' : 'bg-industrial-800 border-industrial-600 text-gray-400'}`}>
                  Crude Receipt
                </span>
                <div className="flex flex-wrap justify-center gap-4">
                  {crudeTanks.map(t => (
                    <TankGraphic key={t.id} tank={t} onClick={() => { setSelectedTank(t); onNavigateToUnit('CDU-01'); }} />
                  ))}
                </div>
              </div>

              <div className="flex items-center self-center mt-6">
                <ArrowRight className={`w-6 h-6 ${isDay ? 'text-slate-400' : 'text-industrial-500'}`} />
              </div>

              {/* CDU-01 Box */}
              <div className="flex flex-col items-center self-center mt-6">
                <div
                  onClick={() => onNavigateToUnit('CDU-01')}
                  className={`px-4 py-3 rounded-lg border-2 cursor-pointer font-bold text-sm text-center min-w-[100px] hover:scale-105 transition-transform ${isDay ? 'border-brand-sky bg-sky-50 text-brand-sky' : 'border-neon-blue bg-neon-blue/10 text-neon-blue'}`}
                >
                  CDU-01<br />
                  <span className="text-[10px] font-normal opacity-70">Crude Distillation</span>
                </div>
              </div>

              <div className="flex items-center self-center mt-6">
                <ArrowRight className={`w-6 h-6 ${isDay ? 'text-slate-400' : 'text-industrial-500'}`} />
              </div>

              {/* Intermediates */}
              <div className="flex flex-col items-center gap-3">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${isDay ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-neon-amber/10 border-neon-amber/30 text-neon-amber'}`}>
                  Intermediates
                </span>
                <div className="flex flex-wrap justify-center gap-4">
                  {intermediateTanks.map(t => (
                    <TankGraphic key={t.id} tank={t} onClick={() => setSelectedTank(t)} />
                  ))}
                </div>
              </div>

              <div className="flex items-center self-center mt-6">
                <ArrowRight className={`w-6 h-6 ${isDay ? 'text-slate-400' : 'text-industrial-500'}`} />
              </div>

              {/* Products */}
              <div className="flex flex-col items-center gap-3">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${isDay ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-neon-green/10 border-neon-green/30 text-neon-green'}`}>
                  Finished Products
                </span>
                <div className="flex flex-wrap justify-center gap-4">
                  {productTanks.map(t => (
                    <TankGraphic key={t.id} tank={t} onClick={() => setSelectedTank(t)} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tank Inventory Table */}
      <Card title={`Tank Inventory — ${filter} (${filteredTanks.length} tanks)`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-[10px] uppercase font-bold tracking-widest border-b ${isDay ? 'text-slate-500 border-slate-200' : 'text-gray-500 border-industrial-700'}`}>
                <th className="text-left py-3 px-3">Tank ID</th>
                <th className="text-left py-3 px-3">Product</th>
                <th className="text-right py-3 px-3">Level (m)</th>
                <th className="text-right py-3 px-3">Fill %</th>
                <th className="text-right py-3 px-3">Volume (m³)</th>
                <th className="text-right py-3 px-3">Volume (bbl)</th>
                <th className="text-right py-3 px-3">Temp (°C)</th>
                <th className="text-left py-3 px-3">Status</th>
                <th className="text-left py-3 px-3">Source Unit</th>
                <th className="text-left py-3 px-3">Dest Unit</th>
              </tr>
            </thead>
            <tbody>
              {filteredTanks.map((tank, i) => {
                const fillPct = tank.maxLevel > 0 ? (tank.level / tank.maxLevel) * 100 : 0;
                const statusColor: Record<Tank['status'], string> = {
                  Filling: isDay ? 'text-emerald-600 bg-emerald-50' : 'text-neon-green bg-neon-green/10',
                  Emptying: isDay ? 'text-amber-600 bg-amber-50' : 'text-neon-amber bg-neon-amber/10',
                  Static: isDay ? 'text-slate-500 bg-slate-100' : 'text-gray-400 bg-white/5',
                  Maintenance: isDay ? 'text-red-600 bg-red-50' : 'text-neon-red bg-neon-red/10',
                };
                return (
                  <tr
                    key={tank.id}
                    onClick={() => setSelectedTank(tank)}
                    className={`border-b cursor-pointer transition-colors ${
                      isDay
                        ? `${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-slate-100 hover:bg-sky-50`
                        : `${i % 2 === 0 ? 'bg-transparent' : 'bg-white/2'} border-industrial-800 hover:bg-white/5`
                    }`}
                  >
                    <td className={`py-3 px-3 font-mono font-bold text-xs ${isDay ? 'text-slate-700' : 'text-gray-300'}`}>{tank.id}</td>
                    <td className={`py-3 px-3 text-xs ${isDay ? 'text-slate-600' : 'text-gray-300'}`}>{tank.product}</td>
                    <td className={`py-3 px-3 text-right font-mono ${isDay ? 'text-slate-800' : 'text-white'}`}>{tank.level.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className={`w-16 h-1.5 rounded-full ${isDay ? 'bg-slate-200' : 'bg-white/10'}`}>
                          <div
                            className={`h-full rounded-full ${fillPct > 85 ? 'bg-neon-red' : fillPct > 60 ? 'bg-neon-amber' : 'bg-neon-green'}`}
                            style={{ width: `${Math.min(fillPct, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-mono ${isDay ? 'text-slate-700' : 'text-gray-300'}`}>{fillPct.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className={`py-3 px-3 text-right font-mono text-xs ${isDay ? 'text-slate-700' : 'text-gray-300'}`}>{tank.volume.toLocaleString()}</td>
                    <td className={`py-3 px-3 text-right font-mono text-xs ${isDay ? 'text-brand-sky' : 'text-neon-blue'}`}>{(tank.volume * M3_TO_BBL).toFixed(0)}</td>
                    <td className={`py-3 px-3 text-right font-mono text-xs ${isDay ? 'text-slate-700' : 'text-gray-300'}`}>{tank.temperature > 0 ? tank.temperature.toFixed(1) : '—'}</td>
                    <td className="py-3 px-3">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusColor[tank.status]}`}>{tank.status}</span>
                    </td>
                    <td className={`py-3 px-3 text-xs font-mono ${isDay ? 'text-slate-500' : 'text-gray-500'}`}>{tank.sourceUnit || '—'}</td>
                    <td className={`py-3 px-3 text-xs font-mono ${isDay ? 'text-slate-500' : 'text-gray-500'}`}>{tank.destUnit || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Tank Detail Panel */}
      {selectedTank && (
        <Card title={`Tank Detail — ${selectedTank.id}`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <StatBadge label="Product" value={selectedTank.product} color={isDay ? 'text-slate-800' : 'text-white'} />
            <StatBadge
              label="Level"
              value={selectedTank.level.toFixed(2)}
              unit={`/ ${selectedTank.maxLevel}m`}
              color={isDay ? 'text-brand-sky' : 'text-neon-blue'}
            />
            <StatBadge
              label="Volume"
              value={selectedTank.volume.toLocaleString()}
              unit={`/ ${selectedTank.maxVolume.toLocaleString()} m³`}
              color={isDay ? 'text-amber-600' : 'text-neon-amber'}
            />
            <StatBadge
              label="Capacity (bbl)"
              value={formatBbl(selectedTank.volume * M3_TO_BBL)}
              unit="bbl"
              color={isDay ? 'text-emerald-600' : 'text-neon-green'}
            />
          </div>

          <div className={`p-4 rounded-lg border text-sm ${isDay ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-black/20 border-white/5 text-gray-400'}`}>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <div><span className="opacity-60">Status:</span> <span className="font-bold ml-2">{selectedTank.status}</span></div>
              <div><span className="opacity-60">Temperature:</span> <span className="font-bold ml-2">{selectedTank.temperature > 0 ? `${selectedTank.temperature.toFixed(1)} °C` : 'N/A'}</span></div>
              {selectedTank.sourceUnit && <div><span className="opacity-60">Filled from:</span> <span className="font-mono font-bold ml-2">{selectedTank.sourceUnit}</span></div>}
              {selectedTank.destUnit && <div><span className="opacity-60">Feeds to:</span> <span className="font-mono font-bold ml-2">{selectedTank.destUnit}</span></div>}
            </div>
          </div>

          <button
            onClick={() => setSelectedTank(null)}
            className={`mt-3 text-xs font-bold ${isDay ? 'text-slate-400 hover:text-slate-700' : 'text-gray-500 hover:text-white'}`}
          >
            Dismiss
          </button>
        </Card>
      )}
    </div>
  );
};
