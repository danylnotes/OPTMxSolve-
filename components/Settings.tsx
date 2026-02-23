
import React from 'react';
import { Card } from './ui/Card';
import { Moon, Sun, Monitor, Check } from 'lucide-react';
import { RefineryUnit } from '../types';

interface SettingsProps {
  units: RefineryUnit[];
  onImportData: (data: Record<string, number>) => void;
  onThemeChange?: (theme: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ units, onImportData, onThemeChange }) => {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const isDay = currentTheme === 'light';

  const setTheme = (theme: string) => {
    document.documentElement.setAttribute('data-theme', theme);
    
    if (theme === 'light') {
        document.documentElement.classList.remove('dark');
    } else {
        document.documentElement.classList.add('dark');
    }
    
    if (onThemeChange) onThemeChange(theme);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3 mb-2">
        <h2 className={`text-3xl font-black tracking-tight ${isDay ? 'text-slate-900' : 'text-white'}`}>System Configuration</h2>
      </div>

      {/* Theme Settings */}
      <Card title="Interface Theme">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <button 
                onClick={() => setTheme('industrial')} 
                className={`flex flex-col items-center gap-2 p-6 rounded-2xl border-2 transition-all relative overflow-hidden group ${
                    currentTheme === 'industrial' 
                    ? 'bg-industrial-900 border-neon-blue shadow-lg' 
                    : 'bg-slate-100 border-transparent opacity-60 hover:opacity-100'
                }`}
            >
                {currentTheme === 'industrial' && <div className="absolute top-2 right-2"><Check className="w-5 h-5 text-neon-blue" /></div>}
                <div className="w-14 h-14 rounded-full bg-industrial-950 flex items-center justify-center border border-industrial-800 mb-2">
                    <Moon className="w-7 h-7 text-neon-blue" />
                </div>
                <span className={`text-sm font-black uppercase tracking-widest ${currentTheme === 'industrial' ? 'text-white' : 'text-slate-600'}`}>Industrial Mode</span>
                <p className={`text-[10px] text-center mt-1 font-bold ${currentTheme === 'industrial' ? 'text-slate-400' : 'text-slate-500'}`}>High-performance terminal layout for low light ops.</p>
            </button>

            <button 
                onClick={() => setTheme('light')} 
                className={`flex flex-col items-center gap-2 p-6 rounded-2xl border-2 transition-all relative overflow-hidden group ${
                    currentTheme === 'light' 
                    ? 'bg-white border-brand-sky shadow-xl' 
                    : 'bg-industrial-800 border-transparent opacity-60 hover:opacity-100'
                }`}
            >
                {currentTheme === 'light' && <div className="absolute top-2 right-2"><Check className="w-5 h-5 text-brand-sky" /></div>}
                <div className="w-14 h-14 rounded-full bg-sky-50 flex items-center justify-center border border-sky-100 mb-2">
                    <Sun className="w-7 h-7 text-brand-sky" />
                </div>
                <span className={`text-sm font-black uppercase tracking-widest ${currentTheme === 'light' ? 'text-slate-900' : 'text-white'}`}>Day Mode</span>
                <p className={`text-[10px] text-center mt-1 font-bold ${currentTheme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>High-contrast "Paper White" layout for day shifts.</p>
            </button>

            <button className={`flex flex-col items-center gap-2 p-6 rounded-2xl border-2 border-dashed border-slate-300 opacity-30 cursor-not-allowed hidden sm:flex`}>
                <Monitor className="w-7 h-7 text-slate-400" />
                <span className="text-sm font-black uppercase tracking-widest text-slate-400">Auto Sync</span>
            </button>
        </div>
      </Card>

      <Card title="Station Info">
        <div className="space-y-4">
            <div className={`p-5 rounded-xl border flex justify-between items-center ${isDay ? 'bg-slate-50 border-slate-200' : 'bg-industrial-800/50 border-industrial-700'}`}>
                <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isDay ? 'text-slate-400' : 'text-gray-500'}`}>System Version</p>
                    <p className={`text-lg font-mono font-black ${isDay ? 'text-slate-900' : 'text-white'}`}>2.5.1-Stable</p>
                </div>
                <div className="text-right">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isDay ? 'text-slate-400' : 'text-gray-500'}`}>Connectivity</p>
                    <p className={`font-black text-lg flex items-center gap-2 ${isDay ? 'text-emerald-700' : 'text-neon-green'}`}>
                        <div className={`w-3 h-3 rounded-full animate-pulse ${isDay ? 'bg-emerald-600' : 'bg-neon-green'}`}></div>
                        OPERATIONAL
                    </p>
                </div>
            </div>
        </div>
      </Card>
    </div>
  );
};
