import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, Cpu, Database, Radio, Terminal as TerminalIcon,
  Lock, Wifi, Battery, Signal, ChevronRight, ChevronLeft,
  Activity, AlertTriangle, CheckCircle2, Clock, RefreshCw,
  HardDrive, Server, Layers, Key, Eye, BarChart3, TrendingUp,
  Smartphone, Settings2, Zap, Globe, FileCode2, Package,
  ShieldCheck, XCircle, Info, Download, Upload, X, Home,
  ArrowUpRight, Fingerprint, Box, Network, Binary
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────
type AppId = 'launcher' | 'dihub' | 'buildenv' | 'datavault' | 'mdm' | 'phase' | 'terminal';

interface AppDef {
  id: AppId;
  label: string;
  icon: React.ReactNode;
  color: string;
  glow: string;
  bg: string;
}

// ─── Static Data ──────────────────────────────────────────────────────────────
const decisionData = [
  { t: '08:00', value: 42, risk: 18 }, { t: '09:00', value: 65, risk: 22 },
  { t: '10:00', value: 58, risk: 30 }, { t: '11:00', value: 71, risk: 15 },
  { t: '12:00', value: 83, risk: 28 }, { t: '13:00', value: 79, risk: 20 },
  { t: '14:00', value: 91, risk: 12 }, { t: '15:00', value: 76, risk: 35 },
  { t: '16:00', value: 88, risk: 18 }, { t: '17:00', value: 95, risk: 9 },
];

const syncData = [
  { name: 'Sun', push: 40, pull: 24 }, { name: 'Mon', push: 80, pull: 65 },
  { name: 'Tue', push: 60, pull: 45 }, { name: 'Wed', push: 92, pull: 78 },
  { name: 'Thu', push: 55, pull: 40 }, { name: 'Fri', push: 88, pull: 72 },
  { name: 'Sat', push: 30, pull: 22 },
];

const buildPhases = [
  { id: 0, name: 'Hardware Procurement', status: 'done', detail: 'ODM selected: Rockchip RK3588 · 8 GB · 256 GB UFS 3.1', icon: <Smartphone size={14}/> },
  { id: 1, name: 'Build Environment', status: 'done', detail: 'Ubuntu 22.04 · 128 GB RAM · 32 cores · ccache 50 GB', icon: <Server size={14}/> },
  { id: 2, name: 'AOSP Fork', status: 'done', detail: 'android-17.0.0_r1 · GMS removed · FirmIdentity injected', icon: <Layers size={14}/> },
  { id: 3, name: 'Kernel Hardening', status: 'active', detail: 'SELinux: enforcing · Drivers: integrating GPU blob', icon: <Cpu size={14}/> },
  { id: 4, name: 'Data Layer', status: 'pending', detail: 'FBE enabled · SQLCipher · Firm sync protocol', icon: <Database size={14}/> },
  { id: 5, name: 'MDM Infrastructure', status: 'pending', detail: 'OTA server · Remote wipe · Device attestation', icon: <Radio size={14}/> },
  { id: 6, name: 'DI App Layer', status: 'pending', detail: 'DIHub · FirmAuth · FirmLauncher deployment', icon: <BarChart3 size={14}/> },
  { id: 7, name: 'Signing & Release', status: 'pending', detail: 'Key ceremony · Image signing · Release pipeline', icon: <Key size={14}/> },
];

const auditLog = [
  { id: 'AUD-0091', user: 'OP-MD001', action: 'READ', resource: 'decisions:session-2026-Q2', ts: '17:42:01', synced: true },
  { id: 'AUD-0090', user: 'OP-VPP001', action: 'WRITE', resource: 'kpi:throughput-h17', ts: '17:39:54', synced: true },
  { id: 'AUD-0089', user: 'OP-EMT003', action: 'EXPORT', resource: 'report:monthly-q2', ts: '17:31:10', synced: false },
  { id: 'AUD-0088', user: 'OP-RSC001', action: 'READ', resource: 'risk:matrix-v3', ts: '17:18:29', synced: true },
  { id: 'AUD-0087', user: 'OP-EGPP007', action: 'DELETE', resource: 'draft:plan-b', ts: '16:55:47', synced: true },
];

const fleetDevices = [
  { id: 'DEV-001', name: 'Field Unit Alpha', user: 'RSC001', status: 'online', battery: 87, lastSeen: '2m ago', enrolled: true, fbe: true },
  { id: 'DEV-002', name: 'Field Unit Beta', user: 'RSC002', status: 'online', battery: 62, lastSeen: '4m ago', enrolled: true, fbe: true },
  { id: 'DEV-003', name: 'Exec Tablet-01', user: 'MD001', status: 'online', battery: 91, lastSeen: '1m ago', enrolled: true, fbe: true },
  { id: 'DEV-004', name: 'Exec Tablet-02', user: 'VPP001', status: 'idle', battery: 44, lastSeen: '18m ago', enrolled: true, fbe: true },
  { id: 'DEV-005', name: 'Engineering Unit-01', user: 'EMT003', status: 'offline', battery: 12, lastSeen: '3h ago', enrolled: true, fbe: false },
  { id: 'DEV-006', name: 'Workshop Kiosk', user: 'SYSTEM', status: 'online', battery: 100, lastSeen: 'live', enrolled: false, fbe: false },
];

const APPS: AppDef[] = [
  { id: 'dihub', label: 'DIHub', icon: <BarChart3 size={22}/>, color: '#00d2ff', glow: 'rgba(0,210,255,0.4)', bg: 'linear-gradient(135deg, #0073ff 0%, #00d2ff 100%)' },
  { id: 'buildenv', label: 'BuildEnv', icon: <FileCode2 size={22}/>, color: '#a855f7', glow: 'rgba(168,85,247,0.4)', bg: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' },
  { id: 'datavault', label: 'DataVault', icon: <Database size={22}/>, color: '#10b981', glow: 'rgba(16,185,129,0.4)', bg: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' },
  { id: 'mdm', label: 'MDM', icon: <Shield size={22}/>, color: '#f59e0b', glow: 'rgba(245,158,11,0.4)', bg: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)' },
  { id: 'phase', label: 'Phase Guide', icon: <Layers size={22}/>, color: '#ec4899', glow: 'rgba(236,72,153,0.4)', bg: 'linear-gradient(135deg, #be185d 0%, #ec4899 100%)' },
  { id: 'terminal', label: 'Terminal', icon: <TerminalIcon size={22}/>, color: '#64748b', glow: 'rgba(100,116,139,0.4)', bg: 'linear-gradient(135deg, #334155 0%, #64748b 100%)' },
];

// ─── Shared Glass Classes ─────────────────────────────────────────────────────
const G = {
  panel: `rounded-2xl border border-white/[0.07] bg-white/[0.04] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]`,
  card: `rounded-xl border border-white/[0.06] bg-white/[0.05] backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.3)]`,
  deep: `rounded-xl border border-white/[0.04] bg-black/30 backdrop-blur-sm`,
  badge: `text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono tracking-widest`,
};

// ─── Status Bar ───────────────────────────────────────────────────────────────
const StatusBar: React.FC<{ onHome: () => void; activeApp: AppId }> = ({ onHome, activeApp }) => {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-black/40 backdrop-blur-xl select-none z-50">
      <div className="flex items-center gap-3 min-w-[120px]">
        {activeApp !== 'launcher' && (
          <button onClick={onHome} className="flex items-center gap-1.5 text-white/60 hover:text-white/90 transition-colors text-[10px] font-bold">
            <Home size={11} />
          </button>
        )}
        <span className="text-[10px] font-mono font-bold text-white/80 tracking-widest">DI-OS v17.0</span>
      </div>
      <div className="text-[11px] font-mono font-bold text-white/90 tracking-widest">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="flex items-center gap-2.5 min-w-[120px] justify-end">
        <Signal size={12} className="text-white/70" />
        <Wifi size={12} className="text-white/70" />
        <Battery size={12} className="text-white/70" />
        <div className="text-[9px] font-mono text-white/50">87%</div>
      </div>
    </div>
  );
};

// ─── App Launcher ─────────────────────────────────────────────────────────────
const AppLauncher: React.FC<{ onOpen: (id: AppId) => void }> = ({ onOpen }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 py-6 gap-8">
      {/* OS Identity */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0073ff, #00d2ff)', boxShadow: '0 0 40px rgba(0,210,255,0.4)' }}>
            <Fingerprint size={32} className="text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-black flex items-center justify-center">
            <CheckCircle2 size={10} className="text-white" />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">Decision Intelligence OS</h2>
          <p className="text-[10px] text-white/40 font-mono tracking-widest mt-0.5">ANDROID 17 · AOSP FORK · SECURE BUILD</p>
        </div>
      </div>

      {/* Quick status bar */}
      <div className="flex gap-3 w-full max-w-sm">
        {[
          { label: 'Encrypted', icon: <Lock size={10}/>, ok: true },
          { label: 'SELinux', icon: <ShieldCheck size={10}/>, ok: true },
          { label: 'GMS Free', icon: <XCircle size={10}/>, ok: true },
          { label: 'Synced', icon: <RefreshCw size={10}/>, ok: true },
        ].map(s => (
          <div key={s.label} className={`${G.deep} flex-1 flex flex-col items-center gap-1 py-2 px-1`}>
            <span className={s.ok ? 'text-green-400' : 'text-red-400'}>{s.icon}</span>
            <span className="text-[8px] font-bold text-white/50 tracking-wide">{s.label}</span>
          </div>
        ))}
      </div>

      {/* App grid */}
      <div className="grid grid-cols-3 gap-5 w-full max-w-sm">
        {APPS.map(app => (
          <button
            key={app.id}
            onClick={() => onOpen(app.id)}
            className="flex flex-col items-center gap-2 group"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all duration-200 group-hover:scale-110 group-active:scale-95"
              style={{ background: app.bg, boxShadow: `0 4px 20px ${app.glow}` }}
            >
              {app.icon}
            </div>
            <span className="text-[10px] font-semibold text-white/70 group-hover:text-white/90 transition-colors">{app.label}</span>
          </button>
        ))}
      </div>

      {/* Bottom dock */}
      <div className={`${G.panel} flex gap-6 px-6 py-3 mt-2`}>
        {[
          { icon: <Wifi size={18}/>, label: 'WPA2-E', ok: true },
          { icon: <Globe size={18}/>, label: 'Firm Net', ok: true },
          { icon: <Binary size={18}/>, label: 'FBE', ok: true },
        ].map(d => (
          <div key={d.label} className="flex flex-col items-center gap-1">
            <span className={d.ok ? 'text-green-400' : 'text-red-400'}>{d.icon}</span>
            <span className="text-[8px] text-white/40 font-mono">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── DIHub App ────────────────────────────────────────────────────────────────
const DIHubApp: React.FC = () => {
  const kpis = [
    { label: 'Active Decisions', value: '47', delta: '+3', icon: <Activity size={14}/>, accent: '#00d2ff' },
    { label: 'Pending Reviews', value: '12', delta: '-2', icon: <Clock size={14}/>, accent: '#a855f7' },
    { label: 'Risk Score', value: '2.4', delta: '-0.3', icon: <AlertTriangle size={14}/>, accent: '#f59e0b' },
    { label: 'Sync Health', value: '98.7%', delta: '+0.2%', icon: <RefreshCw size={14}/>, accent: '#10b981' },
  ];

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar pr-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide">Decision Intelligence Hub</h2>
          <p className="text-[10px] text-white/40 font-mono mt-0.5">LIVE · CREDENTIAL-ENCRYPTED · NO TELEMETRY</p>
        </div>
        <span className="flex items-center gap-1.5 text-[9px] font-bold text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>LIVE
        </span>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3">
        {kpis.map(k => (
          <div key={k.label} className={`${G.card} p-3 relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-5 rounded-xl" style={{ background: `radial-gradient(circle at 70% 50%, ${k.accent}, transparent)` }}/>
            <div className="relative z-10 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span style={{ color: k.accent }}>{k.icon}</span>
                <span className="text-[9px] font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-full">{k.delta}</span>
              </div>
              <div className="text-xl font-bold text-white font-mono">{k.value}</div>
              <div className="text-[9px] text-white/50 font-medium">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Decision activity chart */}
      <div className={`${G.panel} p-4`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-white/80">Decision Activity</span>
          <span className="text-[9px] text-white/40 font-mono">TODAY · LOCAL STORE</span>
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <AreaChart data={decisionData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
            <defs>
              <linearGradient id="diGrad1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00d2ff" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="diGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="t" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 8 }} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 10 }}/>
            <Area type="monotone" dataKey="value" stroke="#00d2ff" strokeWidth={1.5} fill="url(#diGrad1)" name="Decisions"/>
            <Area type="monotone" dataKey="risk" stroke="#f59e0b" strokeWidth={1.5} fill="url(#diGrad2)" name="Risk Events"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Sync metrics */}
      <div className={`${G.panel} p-4`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-white/80">Firm Sync (TLS 1.3)</span>
          <span className="text-[9px] text-white/40 font-mono">sync.firmserver.com</span>
        </div>
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={syncData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }} barSize={6} barGap={2}>
            <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 8 }} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 10 }}/>
            <Bar dataKey="push" fill="#00d2ff" radius={2} name="Push (KB)"/>
            <Bar dataKey="pull" fill="#a855f7" radius={2} name="Pull (KB)"/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent decisions */}
      <div className={`${G.panel} p-4`}>
        <div className="text-xs font-bold text-white/80 mb-3">Recent Decisions</div>
        <div className="space-y-2">
          {[
            { id: 'DEC-0412', title: 'Q3 Throughput Increase', owner: 'MD001', priority: 'high', status: 'approved' },
            { id: 'DEC-0411', title: 'Vendor Contract Renewal', owner: 'EMC002', priority: 'med', status: 'pending' },
            { id: 'DEC-0410', title: 'Risk Matrix Update v3', owner: 'EGPS005', priority: 'high', status: 'review' },
          ].map(d => (
            <div key={d.id} className={`${G.deep} p-2.5 flex items-center gap-3`}>
              <div className={`w-1 h-8 rounded-full ${d.priority === 'high' ? 'bg-red-400' : 'bg-amber-400'}`}/>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-white/80 truncate">{d.title}</div>
                <div className="text-[9px] text-white/40 font-mono">{d.id} · {d.owner}</div>
              </div>
              <span className={`${G.badge} ${
                d.status === 'approved' ? 'bg-green-400/15 text-green-400 border border-green-400/20' :
                d.status === 'pending' ? 'bg-amber-400/15 text-amber-400 border border-amber-400/20' :
                'bg-blue-400/15 text-blue-400 border border-blue-400/20'
              }`}>{d.status.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Build Environment App ────────────────────────────────────────────────────
const BuildEnvApp: React.FC = () => {
  const done = buildPhases.filter(p => p.status === 'done').length;
  const pct = Math.round((done / buildPhases.length) * 100);

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar pr-1">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Build Environment</h2>
          <p className="text-[10px] text-white/40 font-mono mt-0.5">ANDROID 17.0.0_r1 · REPRODUCIBLE BUILD</p>
        </div>
        <div className={`${G.card} px-3 py-2 text-center`}>
          <div className="text-lg font-bold text-purple-400 font-mono">{pct}%</div>
          <div className="text-[8px] text-white/40">complete</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className={`${G.panel} p-4`}>
        <div className="flex justify-between text-[9px] text-white/50 font-mono mb-2">
          <span>BUILD PIPELINE</span>
          <span>{done}/{buildPhases.length} PHASES</span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #7c3aed, #a855f7, #ec4899)' }}
          />
        </div>
      </div>

      {/* Phase list */}
      <div className={`${G.panel} p-4 flex flex-col gap-2`}>
        {buildPhases.map((phase, i) => {
          const isActive = phase.status === 'active';
          const isDone = phase.status === 'done';
          return (
            <div key={phase.id} className={`${G.deep} p-3 flex items-start gap-3 ${isActive ? 'border-purple-500/30 border' : ''}`}>
              {/* Step number / icon */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold font-mono ${
                isDone ? 'bg-green-500/20 text-green-400' :
                isActive ? 'bg-purple-500/30 text-purple-300' :
                'bg-white/5 text-white/30'
              }`}>
                {isDone ? <CheckCircle2 size={14}/> : isActive ? <Activity size={14} className="animate-pulse"/> : i}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] font-bold ${isDone ? 'text-white/70' : isActive ? 'text-purple-300' : 'text-white/30'}`}>
                    {phase.name}
                  </span>
                  {isActive && (
                    <span className="text-[8px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full border border-purple-500/30 font-bold animate-pulse">
                      IN PROGRESS
                    </span>
                  )}
                </div>
                <p className={`text-[9px] font-mono ${isDone ? 'text-white/40' : isActive ? 'text-white/50' : 'text-white/20'}`}>
                  {phase.detail}
                </p>
              </div>
              <span className={`text-white/40 flex-shrink-0`}>{phase.icon}</span>
            </div>
          );
        })}
      </div>

      {/* Build command reference */}
      <div className={`${G.panel} p-4`}>
        <div className="text-xs font-bold text-white/70 mb-3 flex items-center gap-2">
          <TerminalIcon size={12} className="text-purple-400"/>
          Build Commands
        </div>
        <div className="space-y-2 text-[9px] font-mono text-green-400/80">
          {[
            'source build/envsetup.sh',
            'lunch decision_os-userdebug',
            'm -j$(nproc) 2>&1 | tee build.log',
            'ls out/target/product/<device>/*.img',
          ].map((cmd, i) => (
            <div key={i} className={`${G.deep} px-3 py-2 flex items-center gap-2`}>
              <span className="text-white/20">$</span>
              <span>{cmd}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Data Vault App ───────────────────────────────────────────────────────────
const DataVaultApp: React.FC = () => {
  const storageItems = [
    { label: 'Credential Encrypted', used: 18.4, total: 64, color: '#10b981' },
    { label: 'Device Encrypted', used: 42.1, total: 128, color: '#00d2ff' },
    { label: 'Audit DB (SQLCipher)', used: 3.2, total: 8, color: '#a855f7' },
  ];

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar pr-1">
      <div>
        <h2 className="text-base font-bold text-white">Data Vault</h2>
        <p className="text-[10px] text-white/40 font-mono mt-0.5">FBE · SQLCIPHER · CERT-PINNED SYNC</p>
      </div>

      {/* Encryption status */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'FBE', desc: 'AES-256-CTS', ok: true, icon: <HardDrive size={14}/> },
          { label: 'SQLCipher', desc: 'v4.5.4', ok: true, icon: <Database size={14}/> },
          { label: 'TLS 1.3', desc: 'Cert Pinned', ok: true, icon: <Lock size={14}/> },
        ].map(s => (
          <div key={s.label} className={`${G.card} p-3 flex flex-col items-center gap-1.5`}>
            <span className="text-green-400">{s.icon}</span>
            <span className="text-[10px] font-bold text-white/80">{s.label}</span>
            <span className="text-[8px] text-white/40 font-mono">{s.desc}</span>
            <CheckCircle2 size={10} className="text-green-400"/>
          </div>
        ))}
      </div>

      {/* Storage metrics */}
      <div className={`${G.panel} p-4`}>
        <div className="text-xs font-bold text-white/70 mb-3 flex items-center gap-2">
          <HardDrive size={12} className="text-green-400"/>Storage Partitions
        </div>
        <div className="space-y-3">
          {storageItems.map(s => {
            const pct = Math.round((s.used / s.total) * 100);
            return (
              <div key={s.label}>
                <div className="flex justify-between text-[9px] font-mono mb-1.5">
                  <span className="text-white/60">{s.label}</span>
                  <span style={{ color: s.color }}>{s.used} / {s.total} GB</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: s.color, boxShadow: `0 0 8px ${s.color}60` }}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sync protocol status */}
      <div className={`${G.panel} p-4`}>
        <div className="text-xs font-bold text-white/70 mb-3 flex items-center gap-2">
          <Network size={12} className="text-blue-400"/>Firm Sync Protocol
        </div>
        <div className="space-y-2">
          {[
            { endpoint: 'POST /api/v1/sync/push', status: 'OK', latency: '42ms', color: 'text-green-400' },
            { endpoint: 'GET /api/v1/sync/pull', status: 'OK', latency: '38ms', color: 'text-green-400' },
            { endpoint: 'POST /api/v1/sync/resolve', status: 'OK', latency: '61ms', color: 'text-green-400' },
            { endpoint: 'DELETE /api/v1/sync/device', status: 'STANDBY', latency: '—', color: 'text-amber-400' },
          ].map(ep => (
            <div key={ep.endpoint} className={`${G.deep} p-2.5 flex items-center justify-between`}>
              <span className="text-[9px] font-mono text-white/50 truncate">{ep.endpoint}</span>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className="text-[9px] font-mono text-white/30">{ep.latency}</span>
                <span className={`text-[8px] font-bold ${ep.color}`}>{ep.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit log */}
      <div className={`${G.panel} p-4`}>
        <div className="text-xs font-bold text-white/70 mb-3 flex items-center gap-2">
          <Eye size={12} className="text-purple-400"/>Audit Log (Last 5)
        </div>
        <div className="space-y-1.5">
          {auditLog.map(e => (
            <div key={e.id} className={`${G.deep} p-2 flex items-center gap-2`}>
              <span className={`${G.badge} flex-shrink-0 ${
                e.action === 'DELETE' ? 'bg-red-400/15 text-red-400 border border-red-400/20' :
                e.action === 'EXPORT' ? 'bg-amber-400/15 text-amber-400 border border-amber-400/20' :
                e.action === 'WRITE' ? 'bg-blue-400/15 text-blue-400 border border-blue-400/20' :
                'bg-green-400/15 text-green-400 border border-green-400/20'
              }`}>{e.action}</span>
              <span className="text-[9px] text-white/50 font-mono truncate flex-1">{e.resource}</span>
              <span className="text-[8px] text-white/30 font-mono flex-shrink-0">{e.ts}</span>
              {e.synced
                ? <Upload size={9} className="text-green-400/60 flex-shrink-0"/>
                : <Download size={9} className="text-amber-400/60 flex-shrink-0"/>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── MDM Console ──────────────────────────────────────────────────────────────
const MDMApp: React.FC = () => {
  const [wipeTarget, setWipeTarget] = useState<string | null>(null);

  const statusColor = (s: string) =>
    s === 'online' ? 'text-green-400' : s === 'idle' ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar pr-1">
      <div>
        <h2 className="text-base font-bold text-white">MDM Console</h2>
        <p className="text-[10px] text-white/40 font-mono mt-0.5">FLEET · OTA · REMOTE WIPE · ATTESTATION</p>
      </div>

      {/* Fleet summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Online', value: fleetDevices.filter(d => d.status === 'online').length, color: 'text-green-400', bg: 'bg-green-400/10' },
          { label: 'Idle', value: fleetDevices.filter(d => d.status === 'idle').length, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Offline', value: fleetDevices.filter(d => d.status === 'offline').length, color: 'text-red-400', bg: 'bg-red-400/10' },
        ].map(s => (
          <div key={s.label} className={`${G.card} p-3 flex flex-col items-center gap-1`}>
            <span className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</span>
            <span className="text-[9px] text-white/50">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Device fleet */}
      <div className={`${G.panel} p-4`}>
        <div className="text-xs font-bold text-white/70 mb-3 flex items-center gap-2">
          <Smartphone size={12} className="text-amber-400"/>Device Fleet
        </div>
        <div className="space-y-2">
          {fleetDevices.map(dev => (
            <div key={dev.id} className={`${G.deep} p-3 flex items-center gap-3`}>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                dev.status === 'online' ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]' :
                dev.status === 'idle' ? 'bg-amber-400' : 'bg-red-400'
              }`}/>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-white/80 truncate">{dev.name}</span>
                  {dev.fbe && <span className="text-[7px] bg-green-400/10 text-green-400 px-1 py-0.5 rounded font-bold border border-green-400/20">FBE</span>}
                  {!dev.enrolled && <span className="text-[7px] bg-red-400/10 text-red-400 px-1 py-0.5 rounded font-bold border border-red-400/20">UNENROLLED</span>}
                </div>
                <div className="text-[8px] text-white/30 font-mono">{dev.id} · {dev.user} · {dev.lastSeen}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Battery size={10} className="text-white/30"/>
                <span className={`text-[9px] font-mono ${dev.battery < 20 ? 'text-red-400' : 'text-white/50'}`}>{dev.battery}%</span>
                <button
                  onClick={() => setWipeTarget(dev.id)}
                  className="text-[8px] bg-red-400/10 text-red-400/60 hover:text-red-400 hover:bg-red-400/20 px-1.5 py-0.5 rounded border border-red-400/10 transition-all font-bold"
                >
                  WIPE
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* OTA status */}
      <div className={`${G.panel} p-4`}>
        <div className="text-xs font-bold text-white/70 mb-3 flex items-center gap-2">
          <Download size={12} className="text-blue-400"/>OTA Update Status
        </div>
        <div className="space-y-2">
          {[
            { build: 'decision_os-v1.3.2-user', channel: 'stable', devices: 4, status: 'deployed' },
            { build: 'decision_os-v1.4.0-userdebug', channel: 'qa', devices: 2, status: 'staged' },
          ].map(ota => (
            <div key={ota.build} className={`${G.deep} p-3`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-white/70 font-mono">{ota.build}</span>
                <span className={`${G.badge} ${ota.status === 'deployed' ? 'bg-green-400/15 text-green-400 border border-green-400/20' : 'bg-amber-400/15 text-amber-400 border border-amber-400/20'}`}>
                  {ota.status.toUpperCase()}
                </span>
              </div>
              <div className="text-[8px] text-white/30 font-mono">{ota.channel} · {ota.devices} devices · ota.firmserver.com</div>
            </div>
          ))}
        </div>
      </div>

      {/* Wipe confirmation */}
      {wipeTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className={`${G.panel} p-6 max-w-xs w-full`}>
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertTriangle size={32} className="text-red-400"/>
              <h3 className="text-sm font-bold text-white">Remote Wipe</h3>
              <p className="text-[10px] text-white/50">This will permanently erase <span className="text-white font-bold">{wipeTarget}</span>. This action cannot be undone.</p>
              <div className="flex gap-3 w-full mt-1">
                <button onClick={() => setWipeTarget(null)} className="flex-1 py-2 rounded-lg bg-white/10 text-white/60 text-xs font-bold hover:bg-white/15 transition-all">Cancel</button>
                <button onClick={() => setWipeTarget(null)} className="flex-1 py-2 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-all">WIPE NOW</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Phase Guide App ──────────────────────────────────────────────────────────
const PhaseGuideApp: React.FC = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const details: Record<number, { title: string; bullets: string[]; cmd?: string }> = {
    0: { title: 'Hardware Procurement', bullets: ['Unlock bootloader — contractual commitment', 'GPL kernel source from ODM (cite GPL v2 §3)', 'EDL/Fastboot access for brick recovery', 'No hidden telemetry (contractual audit right)', 'Recommended: Qualcomm SM6375 or better'], cmd: 'adb shell uname -r # verify kernel version matches source' },
    1: { title: 'Build Environment', bullets: ['Ubuntu 22.04 LTS · 64–128 GB RAM', 'AOSP android-17.0.0_r1 branch', 'ccache 50 GB for fast rebuilds', 'Local manifest for device tree overlay', 'OpenJDK 17'], cmd: 'repo init -u https://android.googlesource.com/platform/manifest -b android-17.0.0_r1' },
    2: { title: 'AOSP Fork', bullets: ['Remove GmsCore, GoogleServicesFramework, Phonesky', 'Replace GoogleAccountManager → FirmAccountManager', 'Strip Chrome, Gmail, Maps, NFC stack', 'Add custom product definition (decision_os.mk)', 'Commit local_manifests/ to private repo'] },
    3: { title: 'Kernel Hardening', bullets: ['androidboot.selinux=enforcing (never permissive)', 'Integrate OEM driver blobs (GPU, camera, WiFi)', 'Audit all out-of-tree modules', 'Disable unused kernel configs', 'Match kernel version to running device uname -r'] },
    4: { title: 'Data Layer', bullets: ['File-Based Encryption (FBE) enforced', 'SQLCipher 4.5.4 for all DI databases', 'OkHttp cert pinning to sync.firmserver.com', 'iptables whitelist — firm IPs only', 'AuditLogger: READ/WRITE/DELETE/EXPORT events'] },
    5: { title: 'MDM Infrastructure', bullets: ['OTA server: ota.firmserver.com', 'Signed update packages (zip-aligned)', 'Remote wipe via DELETE /api/v1/sync/device', 'Device attestation at enrollment', 'FCM-free push: use firm WebSocket or polling'] },
    6: { title: 'DI App Layer', bullets: ['Room DB + WorkManager offline-first sync', 'SQLCipher per-device key from attestation', 'Firm SSO: SAML2/OIDC custom authenticator', 'No Firebase, Mixpanel, Amplitude — firm OTA only', 'Chaquopy or WebView for embedded analytics'] },
    7: { title: 'Signing & Release', bullets: ['Generate keys on air-gapped machine', 'Store in HSM — never in CI/CD', 'releasekey, platformkey, mediakey, sharedkey', 'sign_target_files_apks.py for full signing', 'QA image → staged → production pipeline'] },
  };

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar pr-1">
      <div>
        <h2 className="text-base font-bold text-white">Phase Navigator</h2>
        <p className="text-[10px] text-white/40 font-mono mt-0.5">AOSP OS BUILD LIFECYCLE · 8 PHASES</p>
      </div>

      <div className={`${G.panel} p-4`}>
        <div className="text-[9px] text-white/40 font-mono mb-3">SELECT PHASE TO VIEW GUIDE</div>
        <div className="grid grid-cols-4 gap-2">
          {buildPhases.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(selected === p.id ? null : p.id)}
              className={`${G.deep} p-2.5 flex flex-col items-center gap-1 transition-all border ${
                selected === p.id ? 'border-pink-500/40 bg-pink-500/10' : 'border-transparent hover:border-white/10'
              }`}
            >
              <span className={`${
                p.status === 'done' ? 'text-green-400' :
                p.status === 'active' ? 'text-purple-400 animate-pulse' :
                'text-white/30'
              }`}>{p.icon}</span>
              <span className="text-[8px] font-bold text-white/50 text-center leading-tight">{p.name.split(' ').slice(0,2).join(' ')}</span>
              <span className="text-[7px] text-white/25 font-mono">P{p.id}</span>
            </button>
          ))}
        </div>
      </div>

      {selected !== null && details[selected] && (
        <div className={`${G.panel} p-4 border-pink-500/20`} style={{ borderColor: 'rgba(236,72,153,0.2)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <span className="text-pink-400">{buildPhases[selected].icon}</span>
              Phase {selected}: {details[selected].title}
            </span>
            <button onClick={() => setSelected(null)}><X size={12} className="text-white/40 hover:text-white/70"/></button>
          </div>
          <ul className="space-y-1.5 mb-3">
            {details[selected].bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-[10px] text-white/60">
                <ChevronRight size={10} className="text-pink-400 flex-shrink-0 mt-0.5"/>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          {details[selected].cmd && (
            <div className={`${G.deep} px-3 py-2 text-[9px] font-mono text-green-400/80 break-all`}>
              $ {details[selected].cmd}
            </div>
          )}
        </div>
      )}

      {/* Decision tree */}
      <div className={`${G.panel} p-4`}>
        <div className="text-xs font-bold text-white/70 mb-3">Quick Decision Tree</div>
        <div className="space-y-1.5 text-[9px] font-mono text-white/50">
          {[
            { q: 'Starting fresh / no hardware?', a: '→ Phase 0', p: 0 },
            { q: 'Have hardware, setting up build?', a: '→ Phase 1', p: 1 },
            { q: 'AOSP compiling, stripping GMS?', a: '→ Phase 2', p: 2 },
            { q: 'Kernel or driver issues?', a: '→ Phase 3', p: 3 },
            { q: 'Need data separation / encryption?', a: '→ Phase 4', p: 4 },
            { q: 'Need OTA / device management?', a: '→ Phase 5', p: 5 },
            { q: 'Deploying DI apps?', a: '→ Phase 6', p: 6 },
            { q: 'Ready to sign and ship?', a: '→ Phase 7', p: 7 },
          ].map(item => (
            <button
              key={item.q}
              onClick={() => setSelected(item.p)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.03] hover:border-pink-500/20 transition-all text-left"
            >
              <span className="text-white/50">{item.q}</span>
              <span className="text-pink-400 font-bold flex-shrink-0 ml-2">{item.a}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Terminal App ─────────────────────────────────────────────────────────────
const TerminalApp: React.FC = () => {
  const sections = [
    { title: 'GMS Removal', cmds: [
      '# device.mk → remove Google services',
      'PRODUCT_PACKAGES_DEBUG := \\',
      '    -GmsCore \\',
      '    -GoogleServicesFramework \\',
      '    -Phonesky \\',
      '    -PrebuiltGmsSdk',
      '',
      'rm -rf vendor/google/',
    ]},
    { title: 'SELinux Enforcing', cmds: [
      '# BoardConfig.mk',
      'BOARD_KERNEL_CMDLINE += \\',
      '    androidboot.selinux=enforcing',
      '',
      '# NEVER ship with permissive!',
      '# androidboot.selinux=permissive ← REMOVE',
    ]},
    { title: 'First Full Build', cmds: [
      'source build/envsetup.sh',
      'lunch decision_os-userdebug',
      'm -j$(nproc) 2>&1 | tee build.log',
      '',
      '# Flash via fastboot:',
      'fastboot flash system system.img',
      'fastboot flash vendor vendor.img',
      'fastboot flash boot boot.img',
      'fastboot reboot',
    ]},
    { title: 'OTA Server Config', cmds: [
      '<!-- config.xml -->',
      '<string name="config_updateServerUrl">',
      '  https://ota.firmserver.com/updates',
      '</string>',
    ]},
  ];

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar pr-1">
      <div>
        <h2 className="text-base font-bold text-white">Command Reference</h2>
        <p className="text-[10px] text-white/40 font-mono mt-0.5">AOSP BUILD · FLASH · CONFIG SNIPPETS</p>
      </div>
      {sections.map(sec => (
        <div key={sec.title} className={`${G.panel} p-4`}>
          <div className="text-[10px] font-bold text-white/60 mb-2 flex items-center gap-1.5">
            <TerminalIcon size={10} className="text-slate-400"/>{sec.title}
          </div>
          <div className="rounded-lg bg-black/50 border border-white/[0.04] p-3 space-y-0.5">
            {sec.cmds.map((line, i) => (
              <div key={i} className={`text-[9px] font-mono leading-relaxed ${line.startsWith('#') || line.startsWith('<!--') ? 'text-white/30' : line === '' ? 'h-2' : 'text-green-400/80'}`}>
                {line !== '' && (line.startsWith('#') || line.startsWith('<!--') ? line : <><span className="text-white/20">$ </span>{line}</>)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const AOSPDecisionOS: React.FC = () => {
  const [activeApp, setActiveApp] = useState<AppId>('launcher');

  const openApp = useCallback((id: AppId) => setActiveApp(id), []);
  const goHome = useCallback(() => setActiveApp('launcher'), []);

  const renderApp = () => {
    switch (activeApp) {
      case 'dihub': return <DIHubApp />;
      case 'buildenv': return <BuildEnvApp />;
      case 'datavault': return <DataVaultApp />;
      case 'mdm': return <MDMApp />;
      case 'phase': return <PhaseGuideApp />;
      case 'terminal': return <TerminalApp />;
      default: return <AppLauncher onOpen={openApp} />;
    }
  };

  const currentApp = APPS.find(a => a.id === activeApp);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      {/* Device frame */}
      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: '100%',
          maxWidth: 420,
          height: '85vh',
          maxHeight: 820,
          borderRadius: 36,
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.6), 0 40px 80px rgba(0,0,0,0.7), 0 0 80px rgba(0,120,255,0.08)',
          background: 'rgba(2, 4, 12, 0.97)',
        }}
      >
        {/* Dynamic background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ borderRadius: 36 }}>
          <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full opacity-20 blur-3xl"
            style={{ background: currentApp ? currentApp.color : '#0073ff', transition: 'background 0.6s ease' }}/>
          <div className="absolute -bottom-20 -right-20 w-48 h-48 rounded-full opacity-15 blur-3xl"
            style={{ background: currentApp ? currentApp.color : '#a855f7', transition: 'background 0.6s ease' }}/>
        </div>

        {/* Status Bar */}
        <StatusBar onHome={goHome} activeApp={activeApp} />

        {/* App title bar (when inside an app) */}
        {activeApp !== 'launcher' && currentApp && (
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04]"
            style={{ background: `linear-gradient(90deg, ${currentApp.color}12, transparent)` }}>
            <button onClick={goHome} className="text-white/40 hover:text-white/70 transition-colors">
              <ChevronLeft size={16}/>
            </button>
            <span style={{ color: currentApp.color }}>{currentApp.icon}</span>
            <span className="text-xs font-bold text-white/80">{currentApp.label}</span>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto custom-scrollbar p-4">
            {renderApp()}
          </div>
        </div>

        {/* Bottom nav bar */}
        <div className="flex items-center justify-center gap-8 py-4 border-t border-white/[0.04] bg-black/20 backdrop-blur-sm">
          <button onClick={goHome} className={`w-2.5 h-2.5 rounded-full transition-all ${activeApp === 'launcher' ? 'bg-white scale-125' : 'bg-white/30 hover:bg-white/50'}`}/>
          <div className="w-24 h-1 rounded-full bg-white/20"/>
        </div>
      </div>

      {/* Ambient glow behind device */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 50%, ${currentApp ? currentApp.color + '08' : 'rgba(0,115,255,0.05)'} 0%, transparent 70%)`, transition: 'background 0.6s ease' }}/>
    </div>
  );
};
