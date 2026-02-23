
import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { 
    Calculator, Settings, Wind, Droplet, Cylinder, 
    Gauge, BookOpen, Download, Printer, Search, ChevronRight, Activity 
} from 'lucide-react';

type CalculationType = 'PUMP' | 'VALVE' | 'PSV' | 'SEPARATOR' | 'LIBRARY';

const PCMModule: React.FC = () => {
    const isDay = document.documentElement.getAttribute('data-theme') === 'light';
    const activeColor = isDay ? 'text-brand-olive' : 'text-neon-blue';
    const [activeTool, setActiveTool] = useState<CalculationType>('PUMP');
    
    // --- GENERIC INPUT STATE ---
    const [inputs, setInputs] = useState({
        tag: '',
        service: '',
        fluid: '',
        temp: 0,
        pressureIn: 0,
        pressureOut: 0,
        flow: 0,
        sg: 0,
        viscosity: 0,
        vaporPress: 0,
        safetyFactor: 0,
        // Separator specifics
        gasFlow: 0,
        liquidFlow: 0,
        opPressure: 0,
        retentionTime: 0,
    });

    // --- CALCULATED RESULTS STATE ---
    const [results, setResults] = useState<any>({});

    const handleInputChange = (field: string, value: string | number) => {
        setInputs(prev => ({ ...prev, [field]: value }));
    };

    // --- CALCULATION LOGIC (Simulated Instant Engineering) ---
    useEffect(() => {
        // Safe defaults if inputs are zero
        if (activeTool === 'PUMP') {
            if (inputs.sg <= 0 || inputs.flow <= 0) {
                setResults({});
                return;
            }
            const head = (inputs.pressureOut - inputs.pressureIn) * 10.197 / inputs.sg;
            const hydPower = (inputs.flow * head * inputs.sg) / 367;
            const efficiency = 0.75; // Assumed
            const brakePower = hydPower / efficiency;
            const motorSize = brakePower * 1.15; // 15% margin
            
            setResults({
                diffHead: head.toFixed(1),
                hydPower: hydPower.toFixed(1),
                brakePower: brakePower.toFixed(1),
                motorRating: Math.ceil(motorSize / 5) * 5, // Round up to nearest 5
                npshA: (inputs.pressureIn * 10.197 / inputs.sg + 10 - inputs.vaporPress * 10.197 / inputs.sg).toFixed(1) // Simplified
            });
        } 
        else if (activeTool === 'VALVE') {
            const dp = inputs.pressureIn - inputs.pressureOut;
            if (dp <= 0 || inputs.sg <= 0) {
                setResults({ dp: dp.toFixed(2), cvCalc: '0.0', bodySize: '-', percentOpen: '0.0' });
                return;
            }
            const cv = inputs.flow * Math.sqrt(inputs.sg / (Math.max(dp, 0.1)));
            let bodySize = 2;
            if (cv > 50) bodySize = 3;
            if (cv > 100) bodySize = 4;
            if (cv > 200) bodySize = 6;
            if (cv > 500) bodySize = 8;

            setResults({
                dp: dp.toFixed(2),
                cvCalc: cv.toFixed(1),
                cvSelected: (cv * 1.4).toFixed(1),
                bodySize: bodySize,
                trimSize: bodySize,
                percentOpen: (Math.random() * 20 + 40).toFixed(1)
            });
        }
        else if (activeTool === 'PSV') {
            if (inputs.flow <= 0 || inputs.sg <= 0) {
                setResults({});
                return;
            }
            // Simplified API 520 liquid sizing
            const q = inputs.flow * 4.4; // gpm
            const g = inputs.sg;
            const p1 = inputs.pressureIn * 14.5; // psig (set pressure)
            const p2 = inputs.pressureOut * 14.5; // psig (back pressure)
            const dp = p1 - p2;
            const requiredArea = (q * Math.sqrt(g)) / (38 * 0.62 * 1.0 * 1.0 * Math.sqrt(Math.max(dp, 1)));
            
            // Letter Selection
            const letters = [
                {l: 'D', a: 0.11}, {l: 'E', a: 0.196}, {l: 'F', a: 0.307}, 
                {l: 'G', a: 0.503}, {l: 'H', a: 0.785}, {l: 'J', a: 1.287},
                {l: 'K', a: 1.838}, {l: 'L', a: 2.853}, {l: 'M', a: 3.6},
                {l: 'N', a: 4.34}, {l: 'P', a: 6.38}, {l: 'Q', a: 11.05},
                {l: 'R', a: 16.0}, {l: 'T', a: 26.0}
            ];
            const selection = letters.find(l => l.a >= requiredArea) || {l: 'T+', a: 99};

            setResults({
                reqArea: requiredArea.toFixed(3),
                selArea: selection.a,
                designation: selection.l,
                capacity: (selection.a / requiredArea * inputs.flow).toFixed(1)
            });
        }
        else if (activeTool === 'SEPARATOR') {
            if (inputs.opPressure <= 0 || inputs.sg <= 0) {
                setResults({});
                return;
            }
            // Very simplified K-value sizing
            const k = 0.1; // Std for vertical
            const rhoL = inputs.sg * 1000;
            const rhoG = (inputs.opPressure * 28) / (8.314 * (inputs.temp + 273)); // Ideal gas approx
            const vTerm = k * Math.sqrt((rhoL - rhoG) / rhoG);
            const qGas = inputs.gasFlow / 3600; // m3/s
            const minArea = qGas / vTerm;
            const minD = Math.sqrt(4 * minArea / Math.PI) * 1000; // mm
            
            setResults({
                rhoG: rhoG.toFixed(2),
                vTerm: vTerm.toFixed(2),
                minDiameter: Math.ceil(minD / 100) * 100, // Round to nearest 100mm
                seamHeight: (Math.ceil(minD / 100) * 100 * 3).toFixed(0) // L/D = 3
            });
        }
    }, [inputs, activeTool]);

    // --- UI HELPERS ---
    const InputRow = ({ label, id, unit }: { label: string, id: string, unit: string }) => (
        <div className="flex items-center justify-between group">
            <label className={`text-xs uppercase font-bold tracking-wider ${isDay ? 'text-slate-500' : 'text-gray-400'} group-hover:${activeColor} transition-colors`}>{label}</label>
            <div className="relative w-32">
                <input 
                    type="number" 
                    value={(inputs as any)[id]} 
                    onChange={(e) => handleInputChange(id, parseFloat(e.target.value))}
                    className={`w-full text-right px-2 py-1 rounded border text-sm font-mono focus:outline-none focus:ring-1 focus:ring-current transition-all ${
                        isDay 
                        ? 'bg-white border-slate-200 text-slate-800 focus:border-brand-olive' 
                        : 'bg-black/30 border-white/10 text-white focus:border-neon-blue'
                    }`}
                />
                <span className={`absolute right-full mr-2 top-1.5 text-[10px] ${isDay ? 'text-slate-400' : 'text-gray-600'}`}>{unit}</span>
            </div>
        </div>
    );

    const TextInputRow = ({ label, id }: { label: string, id: string }) => (
        <div className="flex items-center justify-between">
            <label className={`text-xs uppercase font-bold tracking-wider ${isDay ? 'text-slate-500' : 'text-gray-400'}`}>{label}</label>
            <input 
                type="text" 
                value={(inputs as any)[id]} 
                onChange={(e) => handleInputChange(id, e.target.value)}
                className={`w-32 text-right px-2 py-1 rounded border text-sm font-medium focus:outline-none focus:ring-1 focus:ring-current ${
                    isDay 
                    ? 'bg-white border-slate-200 text-slate-800 focus:border-brand-olive' 
                    : 'bg-black/30 border-white/10 text-white focus:border-neon-blue'
                }`}
            />
        </div>
    );

    const ResultRow = ({ label, val, unit, highlight = false }: { label: string, val: string | number, unit?: string, highlight?: boolean }) => (
        <div className={`flex justify-between items-center border-b border-dashed ${isDay ? 'border-slate-200' : 'border-white/10'} py-1`}>
            <span className="text-xs font-medium opacity-70">{label}</span>
            <span className={`font-mono text-sm font-bold ${highlight ? (isDay ? 'text-brand-olive' : 'text-neon-blue') : ''}`}>
                {val} <span className="text-[10px] opacity-50 font-normal ml-1">{unit}</span>
            </span>
        </div>
    );

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col gap-4 animate-in fade-in duration-500">
            {/* Header */}
            <div className={`flex justify-between items-center border-b pb-4 ${isDay ? 'border-slate-200' : 'border-industrial-700'}`}>
                <div>
                    <h2 className={`text-2xl font-bold tracking-tight flex items-center gap-3 ${isDay ? 'text-slate-900' : 'text-white'}`}>
                        <Calculator className={isDay ? "text-brand-olive" : "text-neon-blue"} />
                        PCM Module
                    </h2>
                    <p className={`text-sm mt-1 ${isDay ? 'text-slate-500' : 'text-gray-400'}`}>Process Calculation Manager • Instant Engineering Datasheets</p>
                </div>
                <div className={`px-3 py-1 rounded border flex items-center gap-2 text-xs font-mono ${isDay ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-neon-green/10 border-neon-green/30 text-neon-green'}`}>
                    <Activity className="w-3 h-3 animate-pulse" />
                    ENGINE_READY
                </div>
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden">
                
                {/* 1. LEFT PANE: Toolbox Navigation */}
                <div className="w-64 flex flex-col gap-2">
                    {[
                        { id: 'PUMP', label: 'Pump Sizing', icon: Settings },
                        { id: 'VALVE', label: 'Control Valve', icon: Gauge },
                        { id: 'PSV', label: 'Safety Relief (PSV)', icon: Droplet },
                        { id: 'SEPARATOR', label: 'Separator / Drum', icon: Cylinder },
                        { id: 'LIBRARY', label: 'Engineering Library', icon: BookOpen },
                    ].map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => setActiveTool(tool.id as CalculationType)}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 group ${
                                activeTool === tool.id
                                ? (isDay ? 'bg-brand-olive text-white shadow-lg scale-105 border-transparent' : 'bg-neon-blue text-white shadow-lg shadow-blue-900/40 scale-105 border-neon-blue')
                                : (isDay ? 'bg-white border-slate-200 text-slate-600 hover:border-brand-olive' : 'glass-panel text-gray-400 hover:text-white hover:bg-white/5 border-white/10')
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                {React.createElement(tool.icon, { className: "w-5 h-5" })}
                                <span className="font-bold text-sm">{tool.label}</span>
                            </div>
                            {activeTool === tool.id && <ChevronRight className="w-4 h-4 animate-pulse" />}
                        </button>
                    ))}
                </div>

                {/* 2. CENTER PANE: Input Matrix (The "Excel" Part) */}
                <div className="flex-1 flex flex-col gap-4 min-w-[300px]">
                    <Card title="Operating Conditions" className="h-full flex flex-col overflow-hidden">
                        {activeTool === 'LIBRARY' ? (
                            <div className="flex flex-col items-center justify-center h-full text-center opacity-60 space-y-4">
                                <Search className="w-12 h-12" />
                                <p>Search Standards, Piping Classes, and Fluid Properties.</p>
                                <div className="w-full max-w-md relative">
                                    <input type="text" placeholder="Type material name or standard code..." className={`w-full p-3 rounded border ${isDay ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-white/10'}`} />
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto p-2 space-y-6 custom-scrollbar">
                                <div className="space-y-4">
                                    <h4 className={`text-xs uppercase font-black border-b pb-2 ${isDay ? 'text-slate-900 border-slate-200' : 'text-neon-blue border-white/10'}`}>General Data</h4>
                                    <TextInputRow id="tag" label="Equipment Tag" />
                                    <TextInputRow id="service" label="Service Description" />
                                    <TextInputRow id="fluid" label="Fluid Name" />
                                </div>

                                <div className="space-y-4">
                                    <h4 className={`text-xs uppercase font-black border-b pb-2 ${isDay ? 'text-slate-900 border-slate-200' : 'text-neon-blue border-white/10'}`}>Process Data</h4>
                                    
                                    {/* Dynamic inputs based on tool */}
                                    {activeTool === 'SEPARATOR' ? (
                                        <>
                                            <InputRow id="gasFlow" label="Gas Flow Rate" unit="kg/h" />
                                            <InputRow id="liquidFlow" label="Liquid Flow Rate" unit="m³/h" />
                                            <InputRow id="opPressure" label="Operating Pressure" unit="bar" />
                                            <InputRow id="temp" label="Temperature" unit="°C" />
                                            <InputRow id="retentionTime" label="Retention Time" unit="min" />
                                        </>
                                    ) : (
                                        <>
                                            <InputRow id="flow" label="Flow Rate" unit="m³/h" />
                                            <InputRow id="pressureIn" label="Inlet Pressure" unit="bar g" />
                                            <InputRow id="pressureOut" label={activeTool === 'PSV' ? 'Back Pressure' : 'Outlet Pressure'} unit="bar g" />
                                            <InputRow id="temp" label="Temperature" unit="°C" />
                                            <InputRow id="sg" label="Spec. Gravity" unit="-" />
                                            <InputRow id="viscosity" label="Viscosity" unit="cP" />
                                            {activeTool === 'PUMP' && <InputRow id="vaporPress" label="Vapor Pressure" unit="bar a" />}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className={`mt-auto pt-4 border-t ${isDay ? 'border-slate-200' : 'border-white/10'} text-[10px] opacity-50 flex items-center gap-2`}>
                            <Activity className="w-3 h-3" /> Auto-calc enabled. Results update on change.
                        </div>
                    </Card>
                </div>

                {/* 3. RIGHT PANE: The Datasheet Preview */}
                <div className="flex-1 min-w-[400px]">
                    <div className={`h-full rounded-xl border relative overflow-hidden flex flex-col ${isDay ? 'bg-white border-slate-200 shadow-xl' : 'bg-white text-black border-white/20'}`}>
                        {/* Paper Texture Effect */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-10 pointer-events-none"></div>
                        
                        {/* Toolbar */}
                        <div className="bg-gray-100 p-2 flex justify-end gap-2 border-b border-gray-300">
                            <button className="p-1 hover:bg-gray-200 rounded text-gray-600"><Printer className="w-4 h-4" /></button>
                            <button className="p-1 hover:bg-gray-200 rounded text-gray-600"><Download className="w-4 h-4" /></button>
                        </div>

                        {/* Datasheet Content */}
                        <div className="flex-1 p-8 overflow-y-auto font-serif text-black">
                            {/* Header */}
                            <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
                                <div>
                                    <h1 className="text-2xl font-bold uppercase tracking-wider">{activeTool} DATASHEET</h1>
                                    <p className="text-xs uppercase">RefOPx Engineering Standard 2.0</p>
                                </div>
                                <div className="text-right text-xs">
                                    <div>Date: {new Date().toLocaleDateString()}</div>
                                    <div>Rev: A</div>
                                </div>
                            </div>

                            {/* Tag Block */}
                            <div className="bg-gray-100 p-4 border border-gray-300 mb-6 grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-gray-500">Item No</div>
                                    <div className="font-mono font-bold text-lg">{inputs.tag || '---'}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-gray-500">Service</div>
                                    <div className="font-bold">{inputs.service || '---'}</div>
                                </div>
                            </div>

                            {/* Technical Specs Table */}
                            {activeTool === 'PUMP' && (
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                    <ResultRow label="Fluid" val={inputs.fluid || '---'} />
                                    <ResultRow label="Pumping Temp" val={inputs.temp} unit="°C" />
                                    <ResultRow label="Spec Gravity" val={inputs.sg} unit="" />
                                    <ResultRow label="Viscosity" val={inputs.viscosity} unit="cP" />
                                    <div className="col-span-2 border-b border-black my-2"></div>
                                    <ResultRow label="Rated Flow" val={inputs.flow} unit="m³/h" />
                                    <ResultRow label="Diff. Head" val={results.diffHead || '-'} unit="m" highlight />
                                    <ResultRow label="Suct. Pressure" val={inputs.pressureIn} unit="bar g" />
                                    <ResultRow label="Disch. Pressure" val={inputs.pressureOut} unit="bar g" />
                                    <ResultRow label="NPSH Available" val={results.npshA || '-'} unit="m" />
                                    <div className="col-span-2 border-b border-black my-2"></div>
                                    <ResultRow label="Hydraulic Power" val={results.hydPower || '-'} unit="kW" />
                                    <ResultRow label="Brake Power" val={results.brakePower || '-'} unit="kW" />
                                    <ResultRow label="Est Motor Rating" val={results.motorRating || '-'} unit="kW" highlight />
                                </div>
                            )}

                            {activeTool === 'VALVE' && (
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                    <ResultRow label="Design Flow" val={inputs.flow} unit="m³/h" />
                                    <ResultRow label="Inlet Pressure" val={inputs.pressureIn} unit="bar g" />
                                    <ResultRow label="Pressure Drop" val={results.dp || '-'} unit="bar" highlight />
                                    <ResultRow label="Calculated Cv" val={results.cvCalc || '-'} unit="" />
                                    <ResultRow label="Selected Cv" val={results.cvSelected || '-'} unit="" />
                                    <div className="col-span-2 border-b border-black my-2"></div>
                                    <div className="col-span-2 font-bold bg-gray-200 p-1">VALVE BODY SPEC</div>
                                    <ResultRow label="Body Size" val={results.bodySize ? `${results.bodySize}"` : '-'} unit="" />
                                    <ResultRow label="Trim Size" val={results.trimSize ? `${results.trimSize}"` : '-'} unit="" />
                                    <ResultRow label="Body Material" val="A216 WCB" unit="" />
                                    <ResultRow label="Bonnet Type" val="Standard Ext." unit="" />
                                    <ResultRow label="Trim Material" val="316SS / Stell" unit="" />
                                    <ResultRow label="Leakage Class" val="IV" unit="" />
                                </div>
                            )}

                            {activeTool === 'PSV' && (
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                    <ResultRow label="Set Pressure" val={inputs.pressureIn} unit="bar g" />
                                    <ResultRow label="Back Pressure" val={inputs.pressureOut} unit="bar g" />
                                    <ResultRow label="Relieving Temp" val={inputs.temp} unit="°C" />
                                    <ResultRow label="Required Flow" val={inputs.flow} unit="kg/h" />
                                    <div className="col-span-2 border-b border-black my-2"></div>
                                    <ResultRow label="Required Area" val={results.reqArea || '-'} unit="cm²" />
                                    <ResultRow label="Selected Area" val={results.selArea || '-'} unit="cm²" />
                                    <ResultRow label="API Designation" val={results.designation || '-'} unit="" highlight />
                                    <ResultRow label="Rated Capacity" val={results.capacity || '-'} unit="kg/h" />
                                    <div className="col-span-2 mt-4 font-bold text-center border-2 border-black p-2">
                                        ORIFICE: {results.designation || '-'}
                                    </div>
                                </div>
                            )}

                            {activeTool === 'SEPARATOR' && (
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                    <ResultRow label="Gas Flow" val={inputs.gasFlow} unit="kg/h" />
                                    <ResultRow label="Liquid Flow" val={inputs.liquidFlow} unit="m³/h" />
                                    <ResultRow label="Op Pressure" val={inputs.opPressure} unit="bar" />
                                    <div className="col-span-2 border-b border-black my-2"></div>
                                    <ResultRow label="Terminal Vel" val={results.vTerm || '-'} unit="m/s" />
                                    <ResultRow label="Min Diameter" val={results.minDiameter || '-'} unit="mm" highlight />
                                    <ResultRow label="Tan-Tan Height" val={results.seamHeight || '-'} unit="mm" highlight />
                                    <ResultRow label="L/D Ratio" val="3.0" unit="" />
                                    <ResultRow label="Volume" val={results.minDiameter ? ((Math.PI * Math.pow(results.minDiameter/2000, 2) * results.seamHeight/1000)).toFixed(1) : '-'} unit="m³" />
                                </div>
                            )}

                            {activeTool === 'LIBRARY' && (
                                <div className="text-center text-gray-500 mt-10 italic">
                                    Select a specific material or equipment code from the left to view data sheet.
                                </div>
                            )}

                            {/* Footer */}
                            <div className="mt-auto pt-10 border-t-2 border-black text-[10px] flex justify-between">
                                <div>Approved By: _________________</div>
                                <div>PCM Generated Document</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export { PCMModule };
