
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { UnitDetail } from './components/UnitDetail';
import { AIAnalyst } from './components/AIAnalyst';
import { EnergyModule } from './components/EnergyModule';
import { EconomicAnalysis } from './components/EconomicAnalysis';
import { OperationsDataEntry } from './components/OperationsDataEntry';
import { SimulationModule } from './components/SimulationModule';
import { Settings } from './components/Settings';
import { RiskReliabilityModule } from './components/RiskReliabilityModule';
import { TankFarmModule } from './components/TankFarmModule';
import { OperatorConsole } from './components/OperatorConsole';
import { Logo } from './components/Logo';
import { generateInitialState, updateReadings, updateUtilityOverride } from './services/mockDataService';
import { RefineryUnit, Alert, UnitStatus } from './types';
import { Menu, KeyRound, LogIn, AlertTriangle, ShieldCheck, Gauge, Layers, Wrench, Calendar, Activity } from 'lucide-react';
import { LIMSModule } from './components/LIMSModule';
import { ExportModule } from './components/ExportModule';

const STAFF_REGISTRY: Record<string, { name: string, role: string }> = {
  "MD001": { name: "Kwame Mensah", role: "Managing Director" },
  "VPP001": { name: "Nana Yaw Boateng", role: "VP Operations" },
  "VPS002": { name: "Akosua Osei-Owusu", role: "VP Strategy" },
  "EMF001": { name: "Samuel Kojo Addo", role: "Executive Manager (Finance)" },
  "EMC002": { name: "Ama Acheampong", role: "Executive Manager (Commercial)" },
  "EMT003": { name: "Kofi Appiah", role: "Executive Manager (Technical)" },
  "EMM004": { name: "Abena Danso", role: "Executive Manager (Management)" },
  "EMP005": { name: "Kwesi Agyapong", role: "Executive Manager (Projects)" },
  "RSC001": { name: "Yaw Frimpong", role: "Refinery Shift Controller" },
  "RSC002": { name: "Efua Gyamfi", role: "Refinery Shift Controller" },
  "RSC003": { name: "Kodjo Tetteh", role: "Refinery Shift Controller" },
  "UM001": { name: "Kwabena Asare", role: "Unit Manager" },
  "UM002": { name: "Afia Konadu", role: "Unit Manager" },
  "UM003": { name: "Jojo Quansah", role: "Unit Manager" },
  "UM004": { name: "Araba Kwarteng", role: "Unit Manager" },
  "UM005": { name: "Ekow Donkor", role: "Unit Manager" },
  "UM006": { name: "Baaba Oppong", role: "Unit Manager" },
  "EGQ001": { name: "Kofi Anane", role: "Engineering (Quality)" },
  "EGQ002": { name: "Akua Serwaa", role: "Engineering (Quality)" },
  "EGQ003": { name: "Kwaku Duah", role: "Engineering (Quality)" },
  "EGPS004": { name: "Yaa Amponsah", role: "Engineering (Process Safety)" },
  "EGPS005": { name: "Fiifi Nkrumah", role: "Engineering (Process Safety)" },
  "EGPS006": { name: "Adjoa Baffoe", role: "Engineering (Process Safety)" },
  "EGPP007": { name: "Kwamina Antwi", role: "Engineering (Planning)" },
  "EGPP008": { name: "Ama Serwah", role: "Engineering (Planning)" },
  "SS001": { name: "Kwadwo Adu", role: "Shift Supervisor" },
  "SS002": { name: "Abena Manu", role: "Shift Supervisor" },
  "SS003": { name: "Kweku Forson", role: "Shift Supervisor" },
  "SS004": { name: "Esi Botchway", role: "Shift Supervisor" },
  "SS005": { name: "Yaw Afful", role: "Shift Supervisor" },
  "SS006": { name: "Afua Kyei", role: "Shift Supervisor" },
  "SS007": { name: "Kojo Sarfo", role: "Shift Supervisor" },
  "SS008": { name: "Akosua Amankwah", role: "Shift Supervisor" },
  "SS009": { name: "Kwame Takyi", role: "Shift Supervisor" },
  "SS010": { name: "Ama Nyarko", role: "Shift Supervisor" },
  "SS011": { name: "Kofi Dade", role: "Shift Supervisor" },
  "SS012": { name: "Akua Gyamfua", role: "Shift Supervisor" },
  "DCR001": { name: "Kwame Ofori", role: "DCS Operator" },
  "DCR002": { name: "Akosua Sarpong", role: "DCS Operator" },
  "DCR003": { name: "Yaw Opoku", role: "DCS Operator" },
  "FSP001": { name: "Kofi Boateng", role: "Field Support Personnel" },
  "TEP001": { name: "Esi Amponsah", role: "Tech Engineer (Process)" },
  "TEE001": { name: "Yaw Darko", role: "Tech Engineer (Elec)" },
  "TEM001": { name: "Kwame Osei", role: "Tech Engineer (Mech)" },
  "ADMIN": { name: "System Administrator", role: "Root Access" }
};

const calculateCapacity = (current: string, design: string) => {
  const getNum = (s: string) => parseFloat(s.replace(/,/g, '').split(' ')[0]);
  const c = getNum(current);
  const d = getNum(design);
  if (isNaN(c) || isNaN(d) || d === 0) return 0;
  return Math.round((c / d) * 100);
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [units, setUnits] = useState<RefineryUnit[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loginId, setLoginId] = useState('');
  const [user, setUser] = useState<{ name: string; id: string; role: string } | null>(null);
  const [error, setError] = useState('');
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    const { units: initialUnits, alerts: initialAlerts } = generateInitialState();
    setUnits(initialUnits);
    setAlerts(initialAlerts);

    const interval = setInterval(() => {
      setUnits(prevUnits => {
        const { units: updatedUnits, newAlerts } = updateReadings(prevUnits);
        if (newAlerts.length > 0) {
          setAlerts(prev => [...newAlerts, ...prev].slice(0, 50));
        }
        return updatedUnits;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'industrial';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'industrial') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, []);

  const handleLogin = () => {
    const id = loginId.trim().toUpperCase();
    if (STAFF_REGISTRY[id]) {
      setUser({ ...STAFF_REGISTRY[id], id });
      setError('');
    } else {
      setError('Invalid ID. Access Denied.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setLoginId('');
    setActiveTab('dashboard');
  };

  const handleDataImport = (importedData: Record<string, number>) => {
    console.log("Imported:", importedData);
  };

  const handleOperationsSave = async (data: Record<string, any>, meta?: { name: string, id: string }) => {
      setUnits(prev => prev.map(u => {
          const updatedSensors = u.sensors.map(s => {
              if (data[s.id] !== undefined) {
                  return { ...s, value: Number(data[s.id]) };
              }
              return s;
          });
          return { ...u, sensors: updatedSensors };
      }));
      
      Object.entries(data).forEach(([key, val]) => {
          updateUtilityOverride(key, val);
      });

      setDataVersion(v => v + 1);
      return Promise.resolve();
  };

  const currentTheme = document.documentElement.getAttribute('data-theme') || 'industrial';
  const isDay = currentTheme === 'light';

  // Login Screen
  if (!user) {
    return (
      <div className={`min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans ${isDay ? 'liquid-bg-light' : 'liquid-bg-industrial'}`}>
        <div className={`relative z-10 w-full max-w-[500px] rounded-2xl shadow-2xl overflow-hidden glass-panel p-8`}>
            <div className="flex flex-col items-center justify-center mb-8">
                <Logo className={`w-20 h-20 mb-4 ${isDay ? 'text-brand-sky' : 'text-neon-blue'}`} />
                <h1 className="text-2xl font-bold tracking-tight mb-1">RefOPx Terminal</h1>
                <p className="text-sm opacity-60">Secure Refinery Operations Access</p>
            </div>
            
            <div className="space-y-6">
                <div className="group relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <KeyRound className={`h-5 w-5 ${isDay ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                    <input 
                        type="text"
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        placeholder="ENTER OPERATOR ID"
                        className={`w-full py-3 pl-10 pr-4 rounded-lg outline-none transition-all font-mono tracking-wider border bg-black/10 border-white/10 focus:border-neon-blue focus:bg-black/20 text-center ${isDay ? 'text-gray-800' : 'text-white'}`}
                        autoFocus
                    />
                </div>

                <button 
                    onClick={handleLogin}
                    className={`w-full font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] ${
                        isDay 
                        ? 'bg-brand-sky hover:bg-sky-600 text-white' 
                        : 'bg-neon-blue hover:bg-blue-600 text-white'
                    }`}
                >
                    <LogIn className="w-4 h-4" /> <span>AUTHENTICATE</span>
                </button>
            </div>
            
            {error && (
                <div className="mt-6 flex items-center justify-center gap-2 text-neon-red text-xs font-bold animate-pulse">
                    <AlertTriangle className="w-3 h-3" /> {error}
                </div>
            )}
            
            <div className="mt-8 text-center text-[10px] opacity-40 font-mono">
                SYSTEM V2.26.4 | SECURE CONNECTION ESTABLISHED
            </div>
        </div>
      </div>
    );
  }

  // --- Main App Layout ---
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard units={units} alerts={alerts} onSelectUnit={(id) => { setSelectedUnitId(id); setActiveTab('units'); }} onNavigate={setActiveTab} dataVersion={dataVersion} />;
      case 'units':
        if (selectedUnitId) {
            const unit = units.find(u => u.id === selectedUnitId);
            if (unit) {
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <button onClick={() => setSelectedUnitId(null)} className={`text-xs font-bold flex items-center gap-1 ${isDay ? 'text-slate-500 hover:text-slate-900' : 'text-gray-400 hover:text-white'}`}>
                             ← Back to Overview
                        </button>
                        <UnitDetail unit={unit} />
                    </div>
                );
            }
        }
        // Unit List View
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
                {units.map(unit => {
                    const capacityPct = calculateCapacity(unit.currentLoad, unit.capacity);
                    return (
                    <div 
                        key={unit.id}
                        onClick={() => setSelectedUnitId(unit.id)}
                        className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 group relative overflow-hidden border glass-panel hover:scale-[1.01] hover:shadow-neon`}
                    >
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <h3 className={`font-bold text-lg ${isDay ? 'text-slate-900' : 'text-white'}`}>{unit.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${isDay ? 'bg-slate-200 text-slate-600' : 'bg-white/10 text-gray-400'}`}>{unit.id}</span>
                                </div>
                            </div>
                            <div className={`p-2 rounded-full shadow-inner ${
                                unit.status === UnitStatus.OPERATIONAL 
                                ? (isDay ? 'bg-emerald-100 text-emerald-600' : 'bg-neon-green/10 text-neon-green') 
                                : (isDay ? 'bg-amber-100 text-amber-600' : 'bg-neon-amber/10 text-neon-amber')
                            }`}>
                                <Gauge className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            {/* Capacity Utilization Bar */}
                            <div>
                                <div className="flex justify-between text-[10px] uppercase font-bold mb-1 opacity-70">
                                    <span>Load</span>
                                    <span>{unit.currentLoad}</span>
                                </div>
                                <div className={`w-full h-1.5 rounded-full ${isDay ? 'bg-slate-200' : 'bg-white/10'}`}>
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${
                                            capacityPct > 105 ? 'bg-neon-red' : capacityPct > 90 ? 'bg-neon-green' : 'bg-neon-blue'
                                        }`} 
                                        style={{width: `${Math.min(capacityPct, 100)}%`}}
                                    ></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className={`p-3 rounded-xl border ${isDay ? 'bg-white/50 border-slate-200' : 'bg-black/20 border-white/5'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Activity className={`w-3.5 h-3.5 ${isDay ? 'text-brand-sky' : 'text-neon-blue'}`} />
                                        <span className="text-[10px] uppercase font-bold opacity-60">Eff</span>
                                    </div>
                                    <span className={`text-lg font-mono font-medium ${isDay ? 'text-slate-900' : 'text-white'}`}>{unit.efficiency}%</span>
                                </div>
                                
                                <div className={`p-3 rounded-xl border ${isDay ? 'bg-white/50 border-slate-200' : 'bg-black/20 border-white/5'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Wrench className={`w-3.5 h-3.5 ${isDay ? 'text-amber-600' : 'text-neon-amber'}`} />
                                        <span className="text-[10px] uppercase font-bold opacity-60">Maint</span>
                                    </div>
                                    <span className={`text-xs font-mono font-medium ${isDay ? 'text-slate-900' : 'text-white'}`}>{unit.lastMaintenance}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )})}
            </div>
        );
      case 'analytics':
        return <AIAnalyst units={units} />;
      case 'energy':
        return <EnergyModule dataVersion={dataVersion} />;
      case 'economics':
        return <EconomicAnalysis />;
      case 'ops-entry':
        return <OperationsDataEntry units={units} onSave={handleOperationsSave} user={user} />;
      case 'logging':
        return <ExportModule />;
      case 'sim':
        return <SimulationModule user={user} />;
      case 'risk':
        return <RiskReliabilityModule />;
      case 'settings':
        return <Settings units={units} onImportData={handleDataImport} onThemeChange={(t) => document.documentElement.setAttribute('data-theme', t)} />;
      case 'tank-farm': 
         return <TankFarmModule onNavigateToUnit={(id) => { setSelectedUnitId(id); setActiveTab('units'); }} />;
      case 'lims': 
         return <LIMSModule />;
      default:
        return <Dashboard units={units} alerts={alerts} onSelectUnit={(id) => { setSelectedUnitId(id); setActiveTab('units'); }} onNavigate={setActiveTab} dataVersion={dataVersion} />;
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden ${isDay ? 'liquid-bg-light' : 'liquid-bg-industrial'}`}>
      
      {/* Sidebar - Desktop */}
      <div className="hidden md:block flex-shrink-0 h-full z-20">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={handleLogout} theme={currentTheme} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative backdrop-blur-[2px]">
        {/* Mobile Header */}
        <div className="md:hidden p-4 flex justify-between items-center border-b glass-panel">
           <Logo className={`w-8 h-8 ${isDay ? 'text-brand-sky' : 'text-neon-blue'}`} />
           <button onClick={() => document.getElementById('mobile-menu')?.classList.toggle('hidden')} className="text-gray-400">
             <Menu className="w-6 h-6" />
           </button>
        </div>
        
        {/* Mobile Menu Overlay */}
        <div id="mobile-menu" className="hidden absolute inset-0 z-50 bg-black/95 md:hidden p-4">
             <div className="flex justify-end mb-4">
                 <button onClick={() => document.getElementById('mobile-menu')?.classList.add('hidden')} className="text-white p-2">Close</button>
             </div>
             <Sidebar activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); document.getElementById('mobile-menu')?.classList.add('hidden'); }} user={user} onLogout={handleLogout} theme={currentTheme} />
        </div>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar scroll-smooth">
          <div className="max-w-[1600px] mx-auto min-h-full pb-10">
             {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
