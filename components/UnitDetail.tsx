
import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Activity, AlertOctagon, CheckCircle, Cpu, Thermometer, Wind, Waves, FlaskConical, Scale, Gauge } from 'lucide-react';
import { RefineryUnit, UnitStatus } from '../types';
import { Card } from './ui/Card';
import { analyzeUnitStatus } from '../services/geminiService';
import { marked } from 'marked';

interface UnitDetailProps {
  unit: RefineryUnit;
}

export const UnitDetail: React.FC<UnitDetailProps> = ({ unit }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const isDay = document.documentElement.getAttribute('data-theme') === 'light';

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const result = await analyzeUnitStatus(unit);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const getSensorIcon = (type: string) => {
    switch (type) {
        case 'Temperature': return <Thermometer className="w-4 h-4" />;
        case 'Pressure': return <Wind className="w-4 h-4" />;
        case 'Flow': return <Waves className="w-4 h-4" />;
        case 'Vibration': return <Activity className="w-4 h-4" />;
        case 'Level': return <Scale className="w-4 h-4" />;
        case 'Analysis': return <FlaskConical className="w-4 h-4" />;
        default: return <Cpu className="w-4 h-4" />;
    }
  };

  const getLicensorColor = (licensor: string) => {
      switch(licensor) {
          case 'Technip': return isDay ? 'bg-sky-50/80 text-sky-700 border-sky-200' : 'bg-sky-500/20 text-sky-400 border-sky-500/30';
          case 'UOP': return isDay ? 'bg-amber-50/80 text-amber-700 border-amber-200' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
          case 'Axens': return isDay ? 'bg-rose-50/80 text-rose-700 border-rose-200' : 'bg-rose-500/20 text-rose-400 border-rose-500/30';
          case 'Poerner': return isDay ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
          case 'Haldor Topsoe': return isDay ? 'bg-slate-50/80 text-slate-700 border-slate-200' : 'bg-slate-500/20 text-slate-300 border-slate-500/30';
          case 'KTI': return isDay ? 'bg-purple-50/80 text-purple-700 border-purple-200' : 'bg-purple-500/20 text-purple-400 border-purple-500/30';
          default: return 'bg-gray-50 text-gray-700 border-gray-200';
      }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className={`flex flex-col md:flex-row justify-between gap-4 p-8 rounded-xl border relative overflow-hidden ${
          isDay ? 'bg-white/60 backdrop-blur-xl border-white/50 shadow-lg' : 'bg-industrial-800 border-industrial-700'
      }`}>
        {isDay && <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />}
        
        <div className={`absolute top-0 left-0 w-1.5 h-full ${
            unit.status === UnitStatus.OPERATIONAL ? 'bg-emerald-600' :
            unit.status === UnitStatus.WARNING ? 'bg-amber-500' : 'bg-red-500'
        }`} />
        
        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-3">
             <h2 className={`text-4xl font-black tracking-tight ${isDay ? 'text-slate-900' : 'text-white'}`}>{unit.name}</h2>
             <span className={`text-xl font-mono ${isDay ? 'text-slate-500' : 'opacity-40'}`}>#{unit.id.split('-')[1] || '00'}</span>
          </div>
          
          <div className="flex flex-wrap gap-3 items-center">
             <span className={`text-xs px-2.5 py-1 rounded-full border uppercase tracking-wider font-black ${
                unit.status === UnitStatus.OPERATIONAL 
                    ? (isDay ? 'border-emerald-200 bg-emerald-50/80 text-emerald-700' : 'border-neon-green/30 bg-neon-green/10 text-neon-green') :
                unit.status === UnitStatus.WARNING 
                    ? (isDay ? 'border-amber-200 bg-amber-50/80 text-amber-700' : 'border-neon-amber/30 bg-neon-amber/10 text-neon-amber') :
                    (isDay ? 'border-red-200 bg-red-50/80 text-red-700' : 'border-neon-red/30 bg-neon-red/10 text-neon-red')
             }`}>
               {unit.status}
             </span>
             
             {unit.licensor && (
                 <span className={`text-xs px-2.5 py-1 rounded-full border uppercase tracking-wider font-black ${getLicensorColor(unit.licensor)}`}>
                    {unit.licensor} Tech
                 </span>
             )}
          </div>
          
          <div className="flex gap-4 mt-2">
              {unit.capacity && (
                 <div className={`flex flex-col px-4 py-2 rounded-lg border ${isDay ? 'bg-white/50 border-white/60 shadow-sm' : 'bg-industrial-900/50 border-industrial-600'}`}>
                     <span className={`text-[10px] uppercase tracking-widest font-black flex items-center gap-1.5 ${isDay ? 'text-slate-500' : 'opacity-60'}`}>
                        <Scale className="w-3.5 h-3.5" /> Design Capacity
                     </span>
                     <span className={`text-base font-mono font-bold ${isDay ? 'text-slate-900' : 'text-white'}`}>{unit.capacity}</span>
                 </div>
              )}
              {unit.currentLoad && (
                 <div className={`flex flex-col px-4 py-2 rounded-lg border ${isDay ? 'bg-white/50 border-white/60 shadow-sm' : 'bg-industrial-900/50 border-industrial-600'}`}>
                     <span className={`text-[10px] uppercase tracking-widest font-black flex items-center gap-1.5 ${isDay ? 'text-slate-500' : 'opacity-60'}`}>
                        <Gauge className={`w-3.5 h-3.5 ${isDay ? 'text-brand-sky' : 'text-neon-blue'}`} /> Current Load
                     </span>
                     <span className={`text-base font-mono font-bold ${isDay ? 'text-brand-sky' : 'text-white'}`}>{unit.currentLoad}</span>
                 </div>
              )}
          </div>
          <p className={`text-sm max-w-2xl mt-1 font-medium ${isDay ? 'text-slate-600' : 'opacity-70'}`}>{unit.description}</p>
        </div>

        <div className="flex flex-col items-end gap-4 min-w-[200px] relative z-10">
             <div className={`text-right p-4 rounded-xl border w-full ${isDay ? 'bg-sky-50/50 border-sky-100/60' : 'bg-industrial-900/50 border-industrial-700'}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest ${isDay ? 'text-slate-500' : 'opacity-60'}`}>Real-time Efficiency</p>
                <p className={`text-4xl font-black font-mono ${isDay ? 'text-industrial-900' : 'text-neon-blue'}`}>{unit.efficiency}%</p>
             </div>
             
             <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all text-sm font-black uppercase tracking-widest disabled:opacity-50 shadow-lg ${
                    isDay ? 'bg-brand-sky hover:bg-sky-700 text-white shadow-sky-900/20' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-900/20'
                }`}
             >
                {isAnalyzing ? (
                    <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                    </>
                ) : (
                    <>
                    <Cpu className="w-4 h-4" />
                    Gemini Analysis
                    </>
                )}
             </button>
        </div>
      </div>

      {/* Analysis Result Panel */}
      {analysis && (
        <div className={`border rounded-xl p-8 animate-in fade-in slide-in-from-top-2 relative ${
            isDay ? 'bg-indigo-50/80 backdrop-blur-md border-indigo-100/50 shadow-md' : 'bg-indigo-900/20 border-indigo-500/30'
        }`}>
            {analysis.startsWith('ERROR:') ? (
                <div className="flex items-center gap-4 text-red-500">
                    <AlertOctagon className="w-8 h-8 flex-shrink-0" />
                    <div>
                        <h4 className="font-bold text-lg">Analysis Unavailable</h4>
                        <p className="text-sm opacity-90">{analysis.replace('ERROR:', '').trim()}</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50" />
                    <h3 className={`font-black uppercase tracking-widest text-sm mb-4 flex items-center gap-2 ${isDay ? 'text-indigo-900' : 'text-indigo-300'}`}>
                        <Cpu className="w-5 h-5" /> Gemini Operational Report
                    </h3>
                    <div 
                        className={`prose prose-sm max-w-none font-medium ${isDay ? 'text-slate-700' : 'prose-invert text-gray-300'}`}
                        dangerouslySetInnerHTML={{ __html: marked.parse(analysis) }}
                    />
                </>
            )}
        </div>
      )}

      {/* Sensor Grid */}
      <h3 className={`text-lg font-black uppercase tracking-[0.2em] border-b pb-2 ${isDay ? 'text-slate-500 border-slate-200/60' : 'text-white border-industrial-700'}`}>Sensor Telemetry</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {unit.sensors.map((sensor) => (
          <Card 
            key={sensor.id} 
            className={`min-h-[300px] ${isDay ? 'bg-white/60 backdrop-blur-xl border-white/50' : ''}`} 
            title={`${sensor.name} (${sensor.id})`}
          >
            <div className="flex justify-between items-end mb-6">
                <div>
                   <div className={`flex items-center gap-2 text-sm mb-1 font-bold ${isDay ? 'text-slate-500' : 'opacity-60'}`}>
                      {getSensorIcon(sensor.type)}
                      {sensor.type}
                   </div>
                   <div className={`text-3xl font-black font-mono ${isDay ? 'text-industrial-900' : 'text-white'}`}>
                      {sensor.value} <span className={`text-sm font-normal ${isDay ? 'text-slate-400' : 'opacity-40'}`}>{sensor.unit}</span>
                   </div>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-widest ${
                    sensor.value > sensor.threshold.max || sensor.value < sensor.threshold.min 
                    ? 'text-red-600' 
                    : (isDay ? 'text-emerald-700' : 'text-neon-green')
                }`}>
                    {sensor.value > sensor.threshold.max || sensor.value < sensor.threshold.min 
                     ? <AlertOctagon className="w-4 h-4" /> 
                     : <CheckCircle className="w-4 h-4" />
                    }
                    {sensor.value > sensor.threshold.max || sensor.value < sensor.threshold.min ? 'Out of Range' : 'Operational'}
                </div>
            </div>
            
            <div className={`h-[180px] w-full rounded-xl p-3 border ${isDay ? 'bg-white/50 border-white/60 shadow-inner' : 'bg-industrial-900/30 border-industrial-700/50'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensor.history}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDay ? "#cbd5e1" : "#334155"} vertical={false} opacity={0.5} />
                  <XAxis 
                    dataKey="timestamp" 
                    hide={true} 
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    stroke={isDay ? "#64748b" : "#475569"} 
                    tick={{fill: isDay ? "#1e293b" : "#94a3b8", fontSize: 10, fontWeight: 700}}
                    width={40}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                        backgroundColor: isDay ? 'rgba(255, 255, 255, 0.9)' : '#1e293b', 
                        borderColor: isDay ? '#e2e8f0' : '#334155', 
                        color: isDay ? '#0f172a' : '#f0f9ff', 
                        fontSize: '12px',
                        fontWeight: '700',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        backdropFilter: 'blur(8px)'
                    }}
                    itemStyle={{ color: '#0284c7' }}
                  />
                  <Line 
                    type="step" 
                    dataKey="value" 
                    stroke={
                        sensor.value > sensor.threshold.max || sensor.value < sensor.threshold.min 
                        ? '#dc2626' 
                        : '#0284c7'
                    }
                    strokeWidth={3} 
                    dot={false}
                    activeDot={{ r: 5, fill: isDay ? '#0f172a' : '#ffffff', strokeWidth: 0 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
                <div className={`flex justify-between items-center px-3 py-2 rounded-lg border ${isDay ? 'bg-white/60 border-white/60' : 'bg-industrial-900/50 border-white/5'}`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isDay ? 'text-slate-400' : 'opacity-40'}`}>Min Limit</span>
                    <span className={`font-mono font-bold text-xs ${isDay ? 'text-slate-900' : 'opacity-80'}`}>{sensor.threshold.min}</span>
                </div>
                <div className={`flex justify-between items-center px-3 py-2 rounded-lg border ${isDay ? 'bg-white/60 border-white/60' : 'bg-industrial-900/50 border-white/5'}`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isDay ? 'text-slate-400' : 'opacity-40'}`}>Max Limit</span>
                    <span className={`font-mono font-bold text-xs ${isDay ? 'text-slate-900' : 'opacity-80'}`}>{sensor.threshold.max}</span>
                </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
