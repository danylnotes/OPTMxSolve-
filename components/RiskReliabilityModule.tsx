
import React, { useState } from 'react';
import { Card } from './ui/Card';
import { 
    ShieldCheck, AlertTriangle, Activity, CheckCircle, Search, 
    FileText, HardHat, ClipboardCheck, GraduationCap, 
    Ambulance, AlertOctagon, XOctagon, TrendingUp,
    Wrench, Plus, Save, Trash2, X, CheckSquare, Square, Calculator, Sparkles, Brain
} from 'lucide-react';
import { 
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { getPredictiveMaintenanceReport } from '../services/geminiService';
import { marked } from 'marked';

// --- Types ---
interface ReliabilityMetric {
    id: string;
    asset: string;
    location: string;
    runningHours: number;
    downtime: number; 
    mtbf: number; 
    mttf: number; 
    redundantRate: number; 
    utilization: number; 
    reliabilityIndex: number; 
}

interface CalculatorInputs {
    asset: string;
    location: string;
    periodHours: number;
    runningHours: number;
    downtimeHours: number;
    failures: number;
    totalUnits: number;
    requiredUnits: number;
}

// --- Mock Data ---
const TREND_DATA = [
    { month: 'Jul', incidents: 0, nearmiss: 0, audits: 0 },
    { month: 'Aug', incidents: 0, nearmiss: 0, audits: 0 },
    { month: 'Sep', incidents: 0, nearmiss: 0, audits: 0 },
    { month: 'Oct', incidents: 0, nearmiss: 0, audits: 0 },
    { month: 'Nov', incidents: 0, nearmiss: 0, audits: 0 },
    { month: 'Dec', incidents: 0, nearmiss: 0, audits: 0 },
];

const INCIDENT_BREAKDOWN = [
    { name: 'Slip/Trip/Fall', value: 0 },
    { name: 'Machinery/Equip', value: 0 },
    { name: 'Chemical Handling', value: 0 },
    { name: 'Process Safety', value: 0 },
    { name: 'Manual Handling', value: 0 },
];

const PERFORMANCE_TARGETS = [
    { category: 'Audits', actual: 0, target: 150 },
    { category: 'Toolbox Talks', actual: 0, target: 400 },
    { category: 'Hazards Reported', actual: 0, target: 100 },
    { category: 'Training Hrs', actual: 0, target: 2000 },
];

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

// ZEROED OUT METRICS
const MOCK_RELIABILITY_METRICS: ReliabilityMetric[] = [
    { id: '1', asset: 'P-101A', location: 'CDU Area', runningHours: 0, downtime: 0, mtbf: 0, mttf: 0, redundantRate: 0, utilization: 0, reliabilityIndex: 0 },
    { id: '2', asset: 'K-101', location: 'FCC Area', runningHours: 0, downtime: 0, mtbf: 0, mttf: 0, redundantRate: 0, utilization: 0, reliabilityIndex: 0 },
    { id: '3', asset: 'GTG-B', location: 'Power Plant', runningHours: 0, downtime: 0, mtbf: 0, mttf: 0, redundantRate: 0, utilization: 0, reliabilityIndex: 0 },
    { id: '4', asset: 'T-301', location: 'ISOM Area', runningHours: 0, downtime: 0, mtbf: 0, mttf: 0, redundantRate: 0, utilization: 0, reliabilityIndex: 0 },
    { id: '5', asset: 'P-405', location: 'CCR Area', runningHours: 0, downtime: 0, mtbf: 0, mttf: 0, redundantRate: 0, utilization: 0, reliabilityIndex: 0 },
];

export const RiskReliabilityModule: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'Risk' | 'Reliability'>('Risk');
    const [metrics, setMetrics] = useState<ReliabilityMetric[]>(MOCK_RELIABILITY_METRICS);
    const [isSaving, setIsSaving] = useState(false);
    
    // Predictive Feature State
    const [isPredicting, setIsPredicting] = useState(false);
    const [predictiveReport, setPredictiveReport] = useState<string | null>(null);

    // Create/Delete State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [calcInputs, setCalcInputs] = useState<CalculatorInputs>({
        asset: '', location: '', periodHours: 8760, runningHours: 0, downtimeHours: 0, failures: 0, totalUnits: 1, requiredUnits: 1
    });
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const runPrediction = async () => {
        setIsPredicting(true);
        const report = await getPredictiveMaintenanceReport(metrics);
        setPredictiveReport(report);
        setIsPredicting(false);
    };

    const handleOpenCreate = () => {
        setCalcInputs({
            asset: '',
            location: '',
            periodHours: 8760,
            runningHours: 0,
            downtimeHours: 0,
            failures: 0,
            totalUnits: 1,
            requiredUnits: 1
        });
        setIsCreateModalOpen(true);
    };

    const handleApplyCreate = () => {
        if (!calcInputs.asset || !calcInputs.location) {
            alert("Asset Name and Location are required.");
            return;
        }
        const failures = calcInputs.failures > 0 ? calcInputs.failures : 1;
        const mtbf = calcInputs.runningHours / failures;
        const mttr = calcInputs.downtimeHours / failures;
        const mttf = mtbf - mttr;
        const period = calcInputs.periodHours > 0 ? calcInputs.periodHours : 8760;
        const utilization = Math.min((calcInputs.runningHours / period) * 100, 100);
        const reqUnits = calcInputs.requiredUnits > 0 ? calcInputs.requiredUnits : 1;
        const redundancy = Math.max(((calcInputs.totalUnits - reqUnits) / reqUnits) * 100, 0);
        const availability = (calcInputs.runningHours / (calcInputs.runningHours + calcInputs.downtimeHours)) * 100;
        const reliabilityIndex = Math.min(Math.max((availability * 0.6 + utilization * 0.4) - (failures * 2), 0), 100);

        const newRecord: ReliabilityMetric = {
            id: (Date.now()).toString(),
            asset: calcInputs.asset,
            location: calcInputs.location,
            runningHours: calcInputs.runningHours,
            downtime: calcInputs.downtimeHours,
            mtbf: Math.round(mtbf),
            mttf: Math.round(mttf),
            redundantRate: Math.round(redundancy),
            utilization: parseFloat(utilization.toFixed(1)),
            reliabilityIndex: Math.round(reliabilityIndex)
        };
        setMetrics([...metrics, newRecord]);
        setIsCreateModalOpen(false);
    };

    const handleDeleteClick = () => {
        if (isDeleteMode) {
            if (selectedIds.size > 0) setMetrics(prev => prev.filter(m => !selectedIds.has(m.id)));
            setIsDeleteMode(false);
            setSelectedIds(new Set());
        } else {
            setIsDeleteMode(true);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-industrial-700 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--text-main)] tracking-tight flex items-center gap-3">
                        <ShieldCheck className="text-neon-blue" />
                        Risk & Reliability
                    </h2>
                    <p className="text-[var(--text-main)] opacity-60 text-sm mt-1">HSE Performance, Process Safety Management & Asset Integrity</p>
                </div>
                <div className="flex bg-industrial-800 rounded p-1 border border-industrial-700">
                    <button onClick={() => setActiveTab('Risk')} className={`px-4 py-1.5 text-sm rounded transition-colors flex items-center gap-2 ${activeTab === 'Risk' ? 'bg-neon-blue text-white' : 'text-gray-400'}`}>
                        <AlertTriangle className="w-3 h-3" /> Risk (HSE)
                    </button>
                    <button onClick={() => setActiveTab('Reliability')} className={`px-4 py-1.5 text-sm rounded transition-colors flex items-center gap-2 ${activeTab === 'Reliability' ? 'bg-neon-green text-white' : 'text-gray-400'}`}>
                        <Activity className="w-3 h-3" /> Reliability
                    </button>
                </div>
            </div>

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl border border-industrial-600 bg-industrial-900 shadow-2xl overflow-hidden">
                        <div className="p-4 border-b border-industrial-700 flex justify-between items-center bg-industrial-800">
                            <h3 className="font-bold text-white flex items-center gap-2"><Calculator className="w-4 h-4 text-neon-blue" /> Asset Reliability Calculator</h3>
                            <button onClick={() => setIsCreateModalOpen(false)}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="text-xs uppercase font-bold text-gray-500 mb-1 block">Asset Name / ID</label>
                                    <input type="text" value={calcInputs.asset} onChange={(e) => setCalcInputs({...calcInputs, asset: e.target.value})} className="w-full bg-black border border-industrial-600 rounded p-2 text-white focus:border-neon-blue focus:outline-none" />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="text-xs uppercase font-bold text-gray-500 mb-1 block">Location / Area</label>
                                    <input type="text" value={calcInputs.location} onChange={(e) => setCalcInputs({...calcInputs, location: e.target.value})} className="w-full bg-black border border-industrial-600 rounded p-2 text-white focus:border-neon-blue focus:outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs uppercase font-bold text-gray-500 mb-1 block">Total Running Hours</label>
                                    <input type="number" value={calcInputs.runningHours} onChange={(e) => setCalcInputs({...calcInputs, runningHours: parseFloat(e.target.value) || 0})} className="w-full bg-black border border-industrial-600 rounded p-2 text-white font-mono" />
                                </div>
                                <div>
                                    <label className="text-xs uppercase font-bold text-gray-500 mb-1 block">Number of Failures</label>
                                    <input type="number" value={calcInputs.failures} onChange={(e) => setCalcInputs({...calcInputs, failures: parseFloat(e.target.value) || 0})} className="w-full bg-black border border-industrial-600 rounded p-2 text-white font-mono" />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-industrial-700 bg-industrial-800/50 flex justify-end gap-3">
                            <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                            <button onClick={handleApplyCreate} className="bg-neon-blue hover:bg-blue-600 text-white px-6 py-2 rounded font-bold shadow-lg">Calculate & Save</button>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'Risk' ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-gradient-to-br from-industrial-800 to-industrial-900 border-l-4 border-l-neon-green">
                            <span className="text-xs uppercase text-gray-500 font-bold mb-1">Compliance Rate</span>
                            <div className="flex justify-between items-end">
                                <span className="text-2xl font-bold text-white">0%</span>
                                <CheckCircle className="text-neon-green w-6 h-6 opacity-30" />
                            </div>
                        </Card>
                        <Card className="bg-gradient-to-br from-industrial-800 to-industrial-900 border-l-4 border-l-neon-blue">
                             <span className="text-xs uppercase text-gray-500 font-bold mb-1">LTI Free Days</span>
                             <div className="flex justify-between items-end">
                                 <span className="text-2xl font-bold text-white">0</span>
                                 <ShieldCheck className="text-neon-green w-6 h-6 opacity-30" />
                             </div>
                        </Card>
                        <Card className="bg-gradient-to-br from-industrial-800 to-industrial-900 border-l-4 border-l-neon-amber">
                            <span className="text-xs uppercase text-gray-500 font-bold mb-1">Incidents (YTD)</span>
                            <div className="flex justify-between items-end">
                                <span className="text-2xl font-bold text-white">0</span>
                                <AlertTriangle className="text-neon-amber w-6 h-6 opacity-30" />
                            </div>
                        </Card>
                        <Card className="bg-gradient-to-br from-industrial-800 to-industrial-900 border-l-4 border-l-neon-purple">
                            <span className="text-xs uppercase text-gray-500 font-bold mb-1">Safety Audits</span>
                            <div className="flex justify-between items-end">
                                <span className="text-2xl font-bold text-white">0</span>
                                <ClipboardCheck className="text-neon-purple w-6 h-6 opacity-30" />
                            </div>
                        </Card>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card title="Incident Breakdown" className="h-[300px]">
                            {INCIDENT_BREAKDOWN.every(d => d.value === 0) ? (
                                <div className="h-full flex items-center justify-center text-gray-500 text-sm">No Incident Data</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={INCIDENT_BREAKDOWN} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {INCIDENT_BREAKDOWN.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </Card>
                        <Card title="Leading Indicators" className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={PERFORMANCE_TARGETS} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                    <XAxis type="number" stroke="var(--text-main)" fontSize={12} opacity={0.5} />
                                    <YAxis dataKey="category" type="category" stroke="var(--text-main)" fontSize={12} width={100} />
                                    <Tooltip />
                                    <Bar dataKey="actual" name="Actual" fill="#3b82f6" />
                                    <Bar dataKey="target" name="Target" fill="#334155" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         <Card className="col-span-full md:col-span-1 bg-gradient-to-br from-indigo-950/40 to-industrial-900 border-l-4 border-l-neon-purple">
                            <div className="flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-white font-black text-lg">AI Predictive Maintenance</h3>
                                        <p className="text-xs text-indigo-300 opacity-70">Detect anomalies before they cause downtime.</p>
                                    </div>
                                    <div className="p-2 bg-indigo-500/20 rounded-xl">
                                        <Brain className="w-6 h-6 text-indigo-400" />
                                    </div>
                                </div>
                                <button 
                                    onClick={runPrediction}
                                    disabled={isPredicting}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/40 disabled:opacity-50"
                                >
                                    {isPredicting ? <Activity className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    {isPredicting ? 'Analyzing Streams...' : 'Run Predictive Analysis'}
                                </button>
                            </div>
                        </Card>
                        
                        {predictiveReport && (
                            <Card className={`col-span-full md:col-span-2 border-t-2 border-indigo-500/30 animate-in slide-in-from-top-4 duration-500 ${predictiveReport.startsWith('ERROR:') ? 'bg-red-500/10' : 'bg-indigo-900/5'}`}>
                                <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                                    <h4 className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${predictiveReport.startsWith('ERROR:') ? 'text-red-400' : 'text-indigo-400'}`}>
                                        {predictiveReport.startsWith('ERROR:') ? <AlertTriangle className="w-4 h-4"/> : <ShieldCheck className="w-4 h-4" />} 
                                        {predictiveReport.startsWith('ERROR:') ? 'Prediction Failed' : 'Gemini Prediction Report'}
                                    </h4>
                                    <button onClick={() => setPredictiveReport(null)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
                                </div>
                                {predictiveReport.startsWith('ERROR:') ? (
                                    <p className="text-sm text-red-300">{predictiveReport.replace('ERROR:', '').trim()}</p>
                                ) : (
                                    <div 
                                        className="prose prose-invert prose-xs max-w-none text-sky-100/80 leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: marked.parse(predictiveReport) }}
                                    />
                                )}
                            </Card>
                        )}
                    </div>

                    <Card title="Reliability Meter (Asset Performance)">
                        <div className="flex justify-end gap-3 mb-4">
                            <button onClick={handleOpenCreate} className="bg-industrial-700 hover:bg-industrial-600 text-white text-[10px] px-4 py-2 rounded-lg font-black uppercase tracking-wider flex items-center gap-2 transition-colors border border-white/5">
                                <Plus className="w-4 h-4" /> New Asset
                            </button>
                            <button onClick={handleDeleteClick} className={`text-[10px] px-4 py-2 rounded-lg font-black uppercase tracking-wider flex items-center gap-2 transition-colors border ${isDeleteMode ? 'bg-red-600 text-white' : 'bg-red-900/20 text-red-400 border-red-900/50'}`}>
                                <Trash2 className="w-4 h-4" /> {isDeleteMode ? `Delete (${selectedIds.size})` : 'Delete Mode'}
                            </button>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/20">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-industrial-900 text-[10px] uppercase text-sky-400/60 font-black tracking-widest">
                                    <tr>
                                        {isDeleteMode && <th className="p-4 w-10"></th>}
                                        <th className="p-4 border-b border-white/5">Asset ID</th>
                                        <th className="p-4 border-b border-white/5">Location</th>
                                        <th className="p-4 border-b border-white/5 text-right">MTBF (h)</th>
                                        <th className="p-4 border-b border-white/5 text-right">MTTF (h)</th>
                                        <th className="p-4 border-b border-white/5 text-right">Util %</th>
                                        <th className="p-4 border-b border-white/5 text-center">Health</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {metrics.map((row) => (
                                        <tr key={row.id} className={`hover:bg-white/5 transition-colors ${row.reliabilityIndex < 60 ? 'bg-red-500/5' : ''}`}>
                                            {isDeleteMode && (
                                                <td className="p-4 text-center">
                                                    <button onClick={() => {
                                                        const next = new Set(selectedIds);
                                                        if (next.has(row.id)) next.delete(row.id); else next.add(row.id);
                                                        setSelectedIds(next);
                                                    }}>
                                                        {selectedIds.has(row.id) ? <CheckSquare className="w-4 h-4 text-sky-400" /> : <Square className="w-4 h-4 text-white/20" />}
                                                    </button>
                                                </td>
                                            )}
                                            <td className="p-4 font-black text-sky-300">{row.asset}</td>
                                            <td className="p-4 text-white/60">{row.location}</td>
                                            <td className="p-4 text-right font-mono text-white/40">{row.mtbf.toLocaleString()}</td>
                                            <td className="p-4 text-right font-mono text-white/40">{row.mttf.toLocaleString()}</td>
                                            <td className="p-4 text-right font-mono text-white/80">{row.utilization}%</td>
                                            <td className="p-4 text-center">
                                                <div className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-black w-12 ${
                                                    row.reliabilityIndex > 90 ? 'bg-emerald-500/20 text-emerald-400' :
                                                    row.reliabilityIndex > 70 ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-red-500/20 text-red-400'
                                                }`}>
                                                    {row.reliabilityIndex}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {metrics.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-gray-500 text-sm">No Assets Monitored</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
