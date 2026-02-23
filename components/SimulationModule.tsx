
import React, { useState } from 'react';
import { Card } from './ui/Card';
import { FlaskConical, PlayCircle, BarChart3, Settings2, X, TrendingUp, Zap } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

interface SimParams {
  [key: string]: string;
}

interface ScenarioType {
  id: string;
  name: string;
  category: 'Economic' | 'Energy';
  description: string;
  requiredParams: { id: string; label: string; unit: string; default: string }[];
}

const SCENARIO_TYPES: ScenarioType[] = [
  { 
    id: 'ECO_DSL', 
    name: 'CDU Max Diesel Mode', 
    category: 'Economic', 
    description: 'Optimize Crude Unit fractionation for maximum Diesel yield at the expense of Kerosene.',
    requiredParams: [
        { id: 'feed_rate', label: 'Crude Feed Rate', unit: 'm³/h', default: '0' },
        { id: 'diesel_draw', label: 'Target Diesel Draw', unit: 'm³/h', default: '0' },
        { id: 'kero_draw', label: 'Min Kero Draw', unit: 'm³/h', default: '0' },
        { id: 'furnace_temp', label: 'Furnace Outlet Temp', unit: '°C', default: '0' }
    ]
  },
  { 
    id: 'ECO_ATK', 
    name: 'CDU Max Jet/ATK Mode', 
    category: 'Economic', 
    description: 'Optimize fractionation to maximize Jet Fuel production for high market demand.',
    requiredParams: [
        { id: 'feed_rate', label: 'Crude Feed Rate', unit: 'm³/h', default: '0' },
        { id: 'kero_draw', label: 'Target Kero Draw', unit: 'm³/h', default: '0' },
        { id: 'flash_point', label: 'Flash Point Spec', unit: '°C', default: '0' }
    ]
  },
  { 
    id: 'CRUDE_BASRAH', 
    name: 'Basrah Medium Mode', 
    category: 'Economic', 
    description: 'Simulate full Basrah Medium crude slate impact on SRU load and Preheat Train.',
    requiredParams: [
        { id: 'basrah_pct', label: 'Basrah Blend %', unit: '%', default: '0' },
        { id: 'desalter_temp', label: 'Desalter Temp', unit: '°C', default: '0' }
    ]
  },
  { 
    id: 'NRG_EFF', 
    name: 'Energy Efficiency Mode', 
    category: 'Energy', 
    description: 'Optimize Steam/Power balance to minimize fuel gas consumption.',
    requiredParams: [
        { id: 'gt_load', label: 'GT Base Load', unit: 'MW', default: '0' },
        { id: 'steam_demand', label: 'Est Steam Demand', unit: 'T/h', default: '0' }
    ]
  }
];

interface SimulationModuleProps {
    user: { name: string; id: string; role: string };
}

export const SimulationModule: React.FC<SimulationModuleProps> = ({ user }) => {
  const [step, setStep] = useState<'SELECT' | 'CONFIG' | 'RESULT'>('SELECT');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType | null>(null);
  const [params, setParams] = useState<SimParams>({});
  const [simResults, setSimResults] = useState<any[]>([]);

  const handleSelect = (scenario: ScenarioType) => {
      setSelectedScenario(scenario);
      const defaults: SimParams = {};
      scenario.requiredParams.forEach(p => defaults[p.id] = p.default);
      setParams(defaults);
      setStep('CONFIG');
  };

  const handleSimulate = () => {
      const target = 100 + (Math.random() * 15 - 2); 
      setSimResults([
          { name: 'Margin ($/bbl)', Base: 12.5, Simulated: 12.5 * (target/100) },
          { name: 'Energy Idx', Base: 95, Simulated: 95 * (1.05 - (target/1000)) },
          { name: 'Yield %', Base: 45, Simulated: 45 * (target/100) }
      ]);
      setStep('RESULT');
  };

  const isDay = document.documentElement.getAttribute('data-theme') === 'light';

  return (
    <div className="relative min-h-[calc(100vh-140px)] animate-in fade-in duration-500">
        
        {step === 'RESULT' && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className={`w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 border ${isDay ? 'bg-white border-slate-200' : 'bg-industrial-900 border-industrial-600'}`}>
                    <div className={`p-4 border-b flex justify-between items-center ${isDay ? 'bg-slate-50 border-slate-200' : 'bg-industrial-800 border-industrial-700'}`}>
                        <div className="flex items-center gap-3">
                            <BarChart3 className={`w-6 h-6 ${isDay ? 'text-brand-sky' : 'text-neon-green'}`} />
                            <div>
                                <h3 className={`text-xl font-bold ${isDay ? 'text-slate-900' : 'text-white'}`}>Results: {selectedScenario?.name}</h3>
                                <p className={`text-xs ${isDay ? 'text-slate-500' : 'text-gray-400'}`}>Run by {user.name} ({user.id})</p>
                            </div>
                        </div>
                        <button onClick={() => setStep('CONFIG')} className="text-gray-400 hover:text-current p-2"><X className="w-6 h-6" /></button>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className={`md:col-span-2 p-4 rounded border h-[300px] ${isDay ? 'bg-slate-50 border-slate-200' : 'bg-industrial-950/50 border-industrial-800'}`}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={simResults}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDay ? "#e2e8f0" : "#334155"} opacity={0.5} />
                                    <XAxis dataKey="name" stroke={isDay ? "#64748b" : "#9ca3af"} fontSize={12} />
                                    <YAxis stroke={isDay ? "#64748b" : "#9ca3af"} fontSize={12} />
                                    <Tooltip contentStyle={{ backgroundColor: isDay ? '#ffffff' : '#1e293b', borderColor: isDay ? '#e2e8f0' : '#334155', color: isDay ? '#0f172a' : '#ffffff' }} />
                                    <Legend />
                                    <Bar dataKey="Base" fill="#64748b" />
                                    <Bar dataKey="Simulated" fill={isDay ? '#0284c7' : '#10b981'} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-4">
                            <div className={`p-4 rounded border-l-4 ${isDay ? 'bg-slate-50 border-l-emerald-500' : 'bg-industrial-800 border-l-neon-green'}`}>
                                <h5 className={`text-[10px] uppercase font-black tracking-widest ${isDay ? 'text-slate-500' : 'text-gray-500'}`}>Projected Margin</h5>
                                <div className={`text-2xl font-black mt-1 ${isDay ? 'text-slate-900' : 'text-white'}`}>${simResults[0]?.Simulated.toFixed(2)}</div>
                                <div className={`text-xs mt-1 flex items-center gap-1 font-bold ${isDay ? 'text-emerald-600' : 'text-neon-green'}`}>
                                    <TrendingUp className="w-3 h-3" /> +{((simResults[0]?.Simulated - simResults[0]?.Base) / simResults[0]?.Base * 100).toFixed(1)}%
                                </div>
                            </div>
                            <button onClick={() => setStep('SELECT')} className={`w-full py-2 rounded text-xs font-bold transition-colors ${isDay ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-industrial-700 hover:bg-industrial-600 text-white'}`}>New Scenario</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className={`text-2xl font-bold flex items-center gap-3 ${isDay ? 'text-slate-900' : 'text-[var(--text-main)]'}`}>
                    <FlaskConical className={isDay ? "text-purple-600" : "text-neon-purple"} /> Simulation Sandbox
                </h2>
                <p className={`text-xs font-mono mt-1 ${isDay ? 'text-slate-500' : 'text-gray-500'}`}>Authorized Session: Operator {user.id}</p>
            </div>
        </div>

        {step === 'SELECT' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className={`col-span-full border-l-4 p-6 ${isDay ? 'bg-gradient-to-r from-white to-purple-50 border-l-purple-500 shadow-sm' : 'bg-gradient-to-r from-industrial-900 to-industrial-800 border-l-neon-purple'}`}>
                    <h3 className={`text-lg font-bold mb-2 ${isDay ? 'text-slate-900' : 'text-white'}`}>Scenario Analysis Engine</h3>
                    <p className={`text-sm max-w-2xl ${isDay ? 'text-slate-600' : 'text-gray-400'}`}>Adjust critical process parameters and simulate refinery performance before implementation.</p>
                </Card>
                {SCENARIO_TYPES.map(scenario => (
                    <div key={scenario.id} onClick={() => handleSelect(scenario)} className="group cursor-pointer">
                        <Card className={`h-full transition-all duration-300 hover:scale-[1.02] ${isDay ? 'hover:border-purple-300 hover:shadow-md' : 'hover:border-neon-purple hover:bg-industrial-800'}`}>
                            <h4 className={`font-bold text-lg transition-colors ${isDay ? 'text-slate-800 group-hover:text-purple-700' : 'text-white group-hover:text-neon-purple'}`}>{scenario.name}</h4>
                            <p className={`text-xs mt-2 mb-4 ${isDay ? 'text-slate-500' : 'text-gray-500'}`}>{scenario.description}</p>
                            <div className={`flex items-center text-xs font-black uppercase tracking-wider ${isDay ? 'text-purple-600' : 'text-neon-purple'}`}>
                                Configure <Settings2 className="w-3 h-3 ml-1" />
                            </div>
                        </Card>
                    </div>
                ))}
            </div>
        )}

        {step === 'CONFIG' && selectedScenario && (
             <div className="max-w-2xl mx-auto">
                 <Card title={`Simulation Parameters: ${selectedScenario.name}`}>
                     <div className="space-y-6">
                         <div className={`p-4 rounded border ${isDay ? 'bg-slate-50 border-slate-200' : 'bg-industrial-900/50 border-industrial-700'}`}>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 {selectedScenario.requiredParams.map(param => (
                                     <div key={param.id}>
                                         <label className={`text-xs uppercase font-black mb-1 block ${isDay ? 'text-slate-500' : 'text-gray-600'}`}>{param.label}</label>
                                         <div className="relative">
                                             <input 
                                                 type="number" 
                                                 value={params[param.id]} 
                                                 onChange={(e) => setParams({...params, [param.id]: e.target.value})}
                                                 className={`w-full rounded p-2 font-mono focus:outline-none focus:ring-1 focus:ring-current ${isDay ? 'bg-white border border-slate-300 text-slate-900 focus:border-purple-500' : 'bg-black border border-industrial-600 text-neon-blue focus:border-neon-purple'}`}
                                             />
                                             <span className={`absolute right-3 top-2 text-[10px] font-bold uppercase ${isDay ? 'text-slate-400' : 'text-gray-600'}`}>{param.unit}</span>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         </div>
                         <div className="flex gap-4">
                             <button onClick={() => setStep('SELECT')} className={`flex-1 py-3 rounded font-bold transition-colors ${isDay ? 'bg-slate-200 hover:bg-slate-300 text-slate-600' : 'bg-industrial-800 hover:bg-industrial-700 text-gray-300'}`}>Cancel</button>
                             <button onClick={handleSimulate} className={`flex-[2] py-3 rounded font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${isDay ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200' : 'bg-neon-purple hover:bg-purple-600 text-white shadow-purple-900/20'}`}>
                                 <PlayCircle className="w-5 h-5" /> Run Logic Run
                             </button>
                         </div>
                     </div>
                 </Card>
             </div>
        )}
    </div>
  );
};
