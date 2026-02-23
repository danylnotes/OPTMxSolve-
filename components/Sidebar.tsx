
import React from 'react';
import { 
  LayoutDashboard, Activity, Settings, Zap, 
  Droplet, CircleDollarSign, ShieldCheck, User,
  Database, PlayCircle, LogOut, MessageSquare, FileText
} from 'lucide-react';
import { Logo } from './Logo';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: { name: string; id: string; role: string };
  onLogout: () => void;
  theme?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, user, onLogout, theme = 'industrial' }) => {
  const isDay = theme === 'light';

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'units', label: 'Process Units', icon: Droplet },
    { id: 'analytics', label: 'Refinery AI', icon: MessageSquare },
    { id: 'ops-entry', label: 'Ops Data', icon: Database },
    { id: 'logging', label: 'Data Logging', icon: FileText },
    { id: 'energy', label: 'Energy', icon: Zap },
    { id: 'economics', label: 'Economics', icon: CircleDollarSign },
    { id: 'risk', label: 'Reliability', icon: ShieldCheck },
    { id: 'sim', label: 'Simulation', icon: PlayCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Role-Based Access Control (RBAC) Logic
  const filteredMenuItems = React.useMemo(() => {
    const rolePrefix = user.id.replace(/[0-9]/g, '');
    if (rolePrefix === 'FSP') return menuItems.filter(item => item.id === 'dashboard');
    const restrictedRoles = ['TEP', 'TEE', 'TEM', 'DCR', 'SS'];
    if (restrictedRoles.includes(rolePrefix)) {
      return menuItems.filter(item => item.id !== 'economics' && item.id !== 'risk');
    }
    return menuItems;
  }, [user.id]);

  return (
    <div className={`h-full flex flex-col border-r transition-all duration-300 w-[280px] glass-panel ${
      isDay ? 'bg-white/60 border-slate-200' : 'bg-black/20 border-white/5'
    }`}>
      {/* App Header (Logo & Name) */}
      <div className="p-6 flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-xl ${isDay ? 'bg-white/50' : 'bg-white/5'}`}>
             <Logo className={`w-8 h-8 ${isDay ? 'text-brand-sky' : 'text-neon-blue'}`} />
        </div>
        <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight">RefOPx</h1>
            <span className="text-[10px] uppercase tracking-widest opacity-50 font-bold">Intelligence</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 overflow-y-auto custom-scrollbar">
        <ul className="space-y-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            const activeClass = isDay 
                ? 'bg-brand-sky text-white shadow-lg shadow-sky-200' 
                : 'bg-neon-blue text-white shadow-lg shadow-blue-900/40 border border-blue-400/20';
            
            const inactiveClass = isDay 
                ? 'text-slate-600 hover:bg-white/50 hover:text-slate-900' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white';

            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${isActive ? activeClass : inactiveClass}`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
                  <span>{item.label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-glow"></div>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile Card (Bottom) */}
      <div className={`p-4 mx-4 mb-4 rounded-xl border ${isDay ? 'bg-white/40 border-slate-200' : 'bg-white/5 border-white/5'}`}>
         <div className="flex items-center gap-3">
             <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border ${
               isDay ? 'bg-slate-200 border-slate-300' : 'bg-industrial-800 border-industrial-600'
             }`}>
                 <User className={`w-5 h-5 ${isDay ? 'text-slate-500' : 'text-gray-400'}`} />
             </div>
             <div className="overflow-hidden flex-1">
                 <p className="text-sm font-bold truncate leading-snug">{user.name}</p>
                 <p className="text-[10px] truncate opacity-60 uppercase font-bold tracking-wider">{user.role}</p>
             </div>
             <button 
               onClick={onLogout}
               className={`p-2 rounded-lg transition-all ${
                 isDay ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-white/10 text-gray-400 hover:text-white'
               }`}
               title="Logout"
             >
               <LogOut className="w-4 h-4" />
             </button>
         </div>
      </div>
    </div>
  );
};
