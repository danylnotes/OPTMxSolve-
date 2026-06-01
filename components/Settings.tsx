
import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Moon, Sun, Monitor, Check, Key, Eye, EyeOff, Save, Trash2 } from 'lucide-react';
import { RefineryUnit } from '../types';
import { storageService } from '../services/storageService';

interface SettingsProps {
  units: RefineryUnit[];
  onImportData: (data: Record<string, number>) => void;
  onThemeChange?: (theme: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ units, onImportData, onThemeChange }) => {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const isDay = currentTheme === 'light';
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savedKey, setSavedKey] = useState(false);

  useEffect(() => {
    setApiKey(storageService.loadApiKey());
  }, []);

  const handleSaveKey = () => {
    storageService.saveApiKey(apiKey.trim());
    setSavedKey(true);
    setTimeout(() => setSavedKey(false), 2000);
  };

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

      <Card title="Claude AI Configuration">
        <div className="space-y-4">
          <p className={`text-sm ${isDay ? 'text-slate-600' : 'text-gray-400'}`}>
            Enter your Anthropic API key to enable the AI Analyst, predictive maintenance, and operator chat features.
          </p>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Key className={`w-4 h-4 ${isDay ? 'text-slate-400' : 'text-gray-500'}`} />
            </div>
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className={`w-full pl-10 pr-24 py-3 rounded-xl border font-mono text-sm focus:outline-none focus:ring-2 transition-all ${
                isDay
                  ? 'bg-white border-slate-200 text-slate-800 focus:border-brand-sky focus:ring-sky-100'
                  : 'bg-black/20 border-white/10 text-white focus:border-neon-blue focus:ring-neon-blue/20'
              }`}
            />
            <div className="absolute inset-y-0 right-3 flex items-center gap-2">
              <button onClick={() => setShowKey(s => !s)} className={`p-1 rounded ${isDay ? 'text-slate-400 hover:text-slate-700' : 'text-gray-500 hover:text-white'}`}>
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSaveKey}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                savedKey
                  ? (isDay ? 'bg-emerald-500 text-white' : 'bg-neon-green text-black')
                  : (isDay ? 'bg-brand-sky text-white hover:bg-sky-600' : 'bg-neon-blue text-white hover:bg-blue-600')
              }`}
            >
              <Save className="w-4 h-4" />
              {savedKey ? 'Saved!' : 'Save API Key'}
            </button>
            <button
              onClick={() => { storageService.clearAll(); setApiKey(''); }}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${isDay ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600' : 'bg-white/5 text-gray-400 hover:bg-neon-red/10 hover:text-neon-red'}`}
            >
              <Trash2 className="w-4 h-4" /> Clear
            </button>
          </div>
          <p className={`text-[10px] ${isDay ? 'text-slate-400' : 'text-gray-600'}`}>
            Key is stored in browser localStorage. Never sent to any server other than api.anthropic.com.
          </p>
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
