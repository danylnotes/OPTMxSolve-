import React, { useState } from 'react';
import { Card } from './ui/Card';
import { TANKS_DATA } from '../services/mockDataService';
import { Tank } from '../types';
import { Droplet, ArrowRight, Activity, Thermometer, Waves } from 'lucide-react';

interface TankFarmProps {
  onNavigateToUnit: (unitId: string) => void;
}

const TankGraphic: React.FC<{ tank: Tank, onClick: () => void }> = ({ tank, onClick }) => {
    // Calculate fill height
    const fillPct = Math.min((tank.level / tank.maxLevel) * 100, 100);
    const isFull = fillPct > 90;
    const isEmpty = fillPct < 10;
    
    // Color logic
    let liquidColor = 'bg-blue-500';
    if (tank.product.includes('Crude')) liquidColor = 'bg-gray-700';
    if (tank.product.includes('Naphtha')) liquidColor = 'bg-yellow-200/80';
    if (tank.product.includes('Diesel')) liquidColor = 'bg-amber-600/80';
    if (tank.product.includes('Fuel Oil')) liquidColor = 'bg-black';

    return (
        <div 
            onClick={onClick}
            className="flex flex-col items-center gap-2 cursor-pointer group w-[100px] flex-shrink-0"
        >
            <div className="relative w-16 h-24 border-2 border-industrial-500 rounded-sm bg-industrial-800/50 overflow-hidden shadow-lg group-hover:border-neon-blue transition-colors">
                {/* Liquid Level */}
                <div 
                    className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ${liquidColor} opacity-80`}
                    style={{ height: `${fillPct}%` }}
                >
                     <div className="absolute top-0 w-full h-1 bg-white/20 animate-pulse"></div>
                </div>
                
                {/* Tick marks */}
                <div className="absolute right-0 top-0 h-full w-2 border-l border-industrial-600/50 flex flex-col justify-between py-1 px-[1px]">
                    {[...Array(5)].map((_, i) => <div key={i} className="w-1 h-[1px] bg-industrial-400"></div>)}
                </div>

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold text-white drop-shadow-md">{fillPct.toFixed(0)}%</span>
                </div>
            </div>
            
            <div className="text-center">
                <div className="text-[10px] font-bold text-[var(--text-main)] bg-industrial-700/50 border border-industrial-600 px-1 rounded mb-0.5">{tank.id}</div>
                <div className="text-[9px] text-[var(--text-main)] opacity-60 leading-tight max-w-[80px] truncate">{tank.product}</div>
                <div className="text-[9px] font-mono text-neon-green">{tank.level.toFixed(2)}m</div>
            </div>
        </div>
    );
};

export const TankFarmModule: React.FC<TankFarmProps> = ({ onNavigateToUnit }) => {
    const [filter, setFilter] = useState<'All' | 'Crude' | 'Intermediate' | 'Product'>('All');
    const M3_TO_BBL = 6.2898;

    const filteredTanks = TANKS_DATA.filter(t => {
        if (filter === 'All') return true;
        if (filter === 'Crude' && t.product.includes('Crude')) return true;
        if (filter === 'Intermediate' && (t.product.includes('Naphtha') || t.product.includes('VGO'))) return true;
        if (filter === 'Product' && (t.product.includes('Diesel') || t.product.includes('Jet') || t.product.includes('Gasoline'))) return true;
        return false;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center border-b border-industrial-700 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--text-main)] tracking-tight flex items-center gap-3">
                        <Waves className="text-neon-blue" />
                        Tank Mgt System
                    </h2>
                    <p className="text-[var(--text-main)] opacity-60 text-sm mt-1">Real-time inventory, transfer status, and process lineage.</p>
                </div>
                
                <div className="flex bg-industrial-800 rounded p-1 border border-industrial-700">
                    {['All', 'Crude', 'Intermediate', 'Product'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-4 py-1.5 text-sm rounded transition-colors ${filter === f ? 'bg-neon-blue text-white' : 'text-[var(--text-main)] opacity-60 hover:opacity-100 hover:text-[var(--text-main)]'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Visual Process Flow Map */}
            <Card title="Process Flow & Tank Lineage" className="overflow-x-auto min-h-[400px] bg-industrial-900/50">
                <div className="min-w-[1000px] p-8 flex justify-between items-start relative">
                    
                    {/* FEED SECTION */}
                    <div className="flex flex-col gap-8 items-center">
                        <div className="text-sm font-bold text-[var(--text-main)] opacity-50 uppercase mb-4">Crude Receipt</div>
                        <div className="grid grid-cols-2 gap-8">
                             {TANKS_DATA.filter(t => t.product.includes('Crude')).map(t => (
                                 <TankGraphic key={t.id} tank={t} onClick={() => onNavigateToUnit('CDU-01')} />
                             ))}
                        </div>
                        {/* Connecting Line */}
                        <div className="h-16 w-1 bg-industrial-600 flex items-center justify-center">
                            <ArrowRight className="text