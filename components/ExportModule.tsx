
import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Download, FileText, FileSpreadsheet, Calendar, Filter, RefreshCw, CheckSquare, Square, Loader2 } from 'lucide-react';
import { loggingService } from '../services/loggingService';
import { exportService } from '../services/exportService';
import { ParameterLog } from '../types';

export const ExportModule: React.FC = () => {
    const isDay = document.documentElement.getAttribute('data-theme') === 'light';
    
    // State
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [availableKeys, setAvailableKeys] = useState<string[]>([]);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [logs, setLogs] = useState<ParameterLog[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    
    // Export State
    const [exportType, setExportType] = useState<'PDF' | 'EXCEL' | 'CSV' | null>(null);
    const [progress, setProgress] = useState(0);

    // Initial Data Load
    useEffect(() => {
        loadMetadata();
    }, []);

    const loadMetadata = async () => {
        const keys = await loggingService.getAvailableParameters();
        setAvailableKeys(keys);
        // Default select top 5
        setSelectedKeys(new Set(keys.slice(0, 5)));
        setTotalCount(loggingService.getCount());
        
        // Set default dates (Last 7 days)
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        setEndDate(end.toISOString().split('T')[0]);
        setStartDate(start.toISOString().split('T')[0]);
    };

    const handleKeyToggle = (key: string) => {
        const newSet = new Set(selectedKeys);
        if (newSet.has(key)) newSet.delete(key);
        else newSet.add(key);
        setSelectedKeys(newSet);
    };

    const handleSelectAll = () => {
        if (selectedKeys.size === availableKeys.length) setSelectedKeys(new Set());
        else setSelectedKeys(new Set(availableKeys));
    };

    const handleExport = async (type: 'PDF' | 'EXCEL' | 'CSV') => {
        if (selectedKeys.size === 0) {
            alert("Please select at least one parameter.");
            return;
        }

        setExportType(type);
        setProgress(0);
        setIsLoading(true);

        try {
            // 1. Fetch Data
            const data = await loggingService.getLogs(
                startDate ? new Date(startDate) : undefined,
                endDate ? new Date(endDate) : undefined
            );

            if (data.length === 0) {
                alert("No data found for the selected range.");
                setIsLoading(false);
                setExportType(null);
                return;
            }

            // 2. Route to Export Engine
            const keysArray = Array.from(selectedKeys) as string[];
            
            if (type === 'CSV') {
                await exportService.generateCSV(data, keysArray, setProgress);
            } else if (type === 'EXCEL') {
                await exportService.generateExcel(data, keysArray, setProgress);
            } else if (type === 'PDF') {
                await exportService.generatePDF(data, keysArray, setProgress);
            }

        } catch (e) {
            console.error(e);
            alert("Export Failed.");
        } finally {
            setIsLoading(false);
            setExportType(null);
            setProgress(0);
        }
    };

    return (
        <Card title="Repository & Data Export" className={`animate-in fade-in`}>
            <div className="flex flex-col gap-6">
                
                {/* 1. Statistics Bar */}
                <div className={`p-4 rounded-lg flex justify-between items-center ${isDay ? 'bg-slate-50 border border-slate-200' : 'bg-industrial-900 border border-industrial-700'}`}>
                    <div className="flex gap-4">
                        <div>
                            <span className="text-[10px] uppercase font-bold opacity-50 block">Total Archived Logs</span>
                            <span className={`text-2xl font-mono font-black ${isDay ? 'text-slate-900' : 'text-white'}`}>{totalCount.toLocaleString()}</span>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase font-bold opacity-50 block">Parameters Tracked</span>
                            <span className={`text-2xl font-mono font-black ${isDay ? 'text-brand-sky' : 'text-neon-blue'}`}>{availableKeys.length}</span>
                        </div>
                    </div>
                    <button onClick={loadMetadata} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Refresh Metadata">
                        <RefreshCw className="w-4 h-4 opacity-50" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* 2. Filters Section */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold flex items-center gap-2 border-b pb-2 opacity-80">
                            <Calendar className="w-4 h-4" /> Date Range
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold opacity-60 mb-1 block">From</label>
                                <input 
                                    type="date" 
                                    value={startDate} 
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className={`w-full p-2 rounded text-sm border ${isDay ? 'bg-white border-slate-300' : 'bg-black border-industrial-600 text-white'}`} 
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold opacity-60 mb-1 block">To</label>
                                <input 
                                    type="date" 
                                    value={endDate} 
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className={`w-full p-2 rounded text-sm border ${isDay ? 'bg-white border-slate-300' : 'bg-black border-industrial-600 text-white'}`} 
                                />
                            </div>
                        </div>

                        <h4 className="text-sm font-bold flex items-center gap-2 border-b pb-2 opacity-80 mt-6">
                            <Filter className="w-4 h-4" /> Parameters
                        </h4>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs opacity-60">{selectedKeys.size} selected</span>
                            <button onClick={handleSelectAll} className="text-xs font-bold text-neon-blue hover:underline">
                                {selectedKeys.size === availableKeys.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        <div className={`h-48 overflow-y-auto p-2 rounded border custom-scrollbar ${isDay ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-industrial-700'}`}>
                            <div className="grid grid-cols-2 gap-2">
                                {availableKeys.map(key => (
                                    <button 
                                        key={key} 
                                        onClick={() => handleKeyToggle(key)}
                                        className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded transition-all text-left ${
                                            selectedKeys.has(key) 
                                            ? (isDay ? 'bg-sky-100 text-sky-800 font-bold' : 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30') 
                                            : 'opacity-60 hover:opacity-100 hover:bg-white/5'
                                        }`}
                                    >
                                        {selectedKeys.has(key) ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                                        <span className="truncate">{key}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 3. Actions Section */}
                    <div className="flex flex-col justify-between">
                        <div>
                            <h4 className="text-sm font-bold flex items-center gap-2 border-b pb-2 opacity-80">
                                <Download className="w-4 h-4" /> Export Actions
                            </h4>
                            <p className="text-xs opacity-60 mt-2 mb-6">
                                Generate reports based on the selected date range and parameters. Large datasets will be processed in chunks to ensure stability.
                            </p>

                            <div className="space-y-3">
                                <button 
                                    onClick={() => handleExport('PDF')}
                                    disabled={isLoading}
                                    className={`w-full py-3 px-4 rounded-lg flex items-center justify-between transition-all border ${
                                        isDay 
                                        ? 'bg-white border-slate-200 hover:border-red-400 hover:bg-red-50 text-slate-700' 
                                        : 'bg-industrial-800 border-industrial-600 hover:border-red-500 hover:bg-red-900/10 text-white'
                                    }`}
                                >
                                    <span className="flex items-center gap-3 font-bold text-sm">
                                        <FileText className="w-5 h-5 text-red-500" /> Download PDF Report
                                    </span>
                                    {exportType === 'PDF' && isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                </button>

                                <button 
                                    onClick={() => handleExport('EXCEL')}
                                    disabled={isLoading}
                                    className={`w-full py-3 px-4 rounded-lg flex items-center justify-between transition-all border ${
                                        isDay 
                                        ? 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-700' 
                                        : 'bg-industrial-800 border-industrial-600 hover:border-emerald-500 hover:bg-emerald-900/10 text-white'
                                    }`}
                                >
                                    <span className="flex items-center gap-3 font-bold text-sm">
                                        <FileSpreadsheet className="w-5 h-5 text-emerald-500" /> Export Excel (.xls)
                                    </span>
                                    {exportType === 'EXCEL' && isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                </button>

                                <button 
                                    onClick={() => handleExport('CSV')}
                                    disabled={isLoading}
                                    className={`w-full py-3 px-4 rounded-lg flex items-center justify-between transition-all border ${
                                        isDay 
                                        ? 'bg-white border-slate-200 hover:border-brand-sky hover:bg-sky-50 text-slate-700' 
                                        : 'bg-industrial-800 border-industrial-600 hover:border-neon-blue hover:bg-blue-900/10 text-white'
                                    }`}
                                >
                                    <span className="flex items-center gap-3 font-bold text-sm">
                                        <FileSpreadsheet className="w-5 h-5 text-blue-500" /> Download CSV
                                    </span>
                                    {exportType === 'CSV' && isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                </button>
                            </div>
                        </div>

                        {/* Progress Status */}
                        {isLoading && (
                            <div className="mt-6 animate-in slide-in-from-bottom-2">
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-neon-blue flex items-center gap-2">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Processing {exportType}...
                                    </span>
                                    <span>{progress.toFixed(0)}%</span>
                                </div>
                                <div className={`w-full h-2 rounded-full overflow-hidden ${isDay ? 'bg-slate-200' : 'bg-black'}`}>
                                    <div 
                                        className={`h-full transition-all duration-300 ${isDay ? 'bg-brand-sky' : 'bg-neon-blue'} striped-bar`}
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <p className="text-[10px] opacity-50 mt-1 text-center">Streaming data from repository...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <style>{`
                .striped-bar {
                    background-image: linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent);
                    background-size: 1rem 1rem;
                    animation: stripe-move 1s linear infinite;
                }
                @keyframes stripe-move {
                    0% { background-position: 0 0; }
                    100% { background-position: 1rem 1rem; }
                }
            `}</style>
        </Card>
    );
};
