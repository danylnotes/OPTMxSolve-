
import React, { useState, useEffect, useRef } from 'react';
import { Card } from './ui/Card';
import { RefineryUnit } from '../types';
import { Save, AlertCircle, CheckCircle, Database, ChevronRight, Sparkles, UserCircle, KeyRound, LogOut, Zap, Flame, Wind, Activity, Snowflake, Factory, Droplet, LayoutGrid, ChevronDown, CloudUpload, Upload, FileText, Loader2 } from 'lucide-react';
import { parseNaturalLanguageLog, parseMultimodalData } from '../services/geminiService';
import { getUtilityOverrides } from '../services/mockDataService';
import { loggingService } from '../services/loggingService';

interface OperationsDataEntryProps {
  units: RefineryUnit[];
  onSave: (data: Record<string, any>, meta?: { name: string, id: string }) => Promise<void>;
  user: { name: string; id: string; role: string };
}

interface FormField {
  id: string;
  label: string;
  unit: string;
  type: string;
  options?: string[];
  placeholder?: string;
}

interface FormSection {
  title: string;
  fields: FormField[];
}

interface CustomForm {
  id: string;
  name: string;
  category: 'Process' | 'Utility' | 'Energy';
  icon?: React.ReactNode;
  fields?: FormField[];
  sections?: FormSection[];
}

const customForms: CustomForm[] = [
  {
    id: 'U44-RFU',
    name: 'U44 (Refinery Fuel System)',
    category: 'Utility',
    icon: <Flame className="w-4 h-4 text-orange-500" />,
    fields: [
      { id: 'U44_FUG_PRESS', label: 'Fuel Gas Header Press', unit: 'kg/cm²', type: 'number' },
      { id: 'U44_FUG_DENS', label: 'Fuel Gas Density', unit: 'kg/m³', type: 'number' },
      { id: 'U44_WOBBE', label: 'Wobbe Index', unit: 'kcal/Nm³', type: 'number' },
      { id: 'U44_FG_DIST', label: 'Fuel Gas to Dist.', unit: 'Nm³/h', type: 'number' },
      { id: 'U44_NG_FLOW', label: 'NG Makeup Flow', unit: 'Nm³/h', type: 'number' },
      { id: 'U44_OFF_GAS', label: 'Off Gas to Fuel', unit: 'Nm³/h', type: 'number' },
      { id: 'U44_LPG_LIQ', label: 'LPG Liquid to Fuel', unit: 'm³/hr', type: 'number' },
      { id: 'U44_LPG_GAS', label: 'LPG Gas Flow', unit: 'Nm³/hr', type: 'number', placeholder: '----' },
      { id: 'U44_FUO_PRESS', label: 'Fuel Oil Header Press', unit: 'kg/cm²', type: 'number' },
      { id: 'U44_FUO_CONS', label: 'Fuel Oil Consumption', unit: 'm³/hr', type: 'number' },
      { id: 'U44_DIESEL_REC', label: 'Diesel Receiving', unit: 'Status', type: 'select', options: ['STOP', 'RECEIVING'] }
    ]
  },
  {
    id: 'U45-NGU',
    name: 'U45 (Natural Gas Unit)',
    category: 'Utility',
    icon: <Wind className="w-4 h-4 text-sky-400" />,
    fields: [
      { id: 'U45_NG_STR_A', label: 'Stream A Status', unit: '', type: 'select', options: ['STANDBY', 'SERVICE'] },
      { id: 'U45_NG_STR_B', label: 'Stream B Status', unit: '', type: 'select', options: ['SERVICE', 'STANDBY'] },
      { id: 'U45_NG_PRESS_BL', label: 'NG Pressure B.L', unit: 'kg/cm²', type: 'number' },
      { id: 'U45_NG_DS_PRESS', label: 'Downstream Pressure', unit: 'kg/cm²', type: 'number' },
      { id: 'U45_NG_MAIN_FLOW', label: 'NG Main Flow', unit: 'Nm³/hr', type: 'number' },
      { id: 'U45_FILT_DP', label: 'Filter DP', unit: 'kg/cm²', type: 'number' },
    ]
  },
  {
    id: 'UTIL-AIR-N2',
    name: 'General Utilities (Air & N2)',
    category: 'Utility',
    icon: <Wind className="w-4 h-4 text-gray-300" />,
    fields: [
        { id: 'UTIL_N2_PRESS', label: 'Nitrogen Header Press', unit: 'kg/cm²', type: 'number' },
        { id: 'UTIL_N2_PROD', label: 'Nitrogen Production', unit: 'Nm³/h', type: 'number' },
        { id: 'UTIL_IA_PRESS', label: 'Inst. Air Header Press', unit: 'kg/cm²', type: 'number' },
        { id: 'UTIL_IA_PROD', label: 'Inst. Air Flow', unit: 'Nm³/h', type: 'number' },
        { id: 'UTIL_PA_PRESS', label: 'Plant Air Header Press', unit: 'kg/cm²', type: 'number' },
    ]
  },
  {
    id: 'U33-CWS',
    name: 'U33 (Cooling Water)',
    category: 'Utility',
    icon: <Snowflake className="w-4 h-4 text-cyan-400" />,
    fields: [
      { id: 'U33_CWS_PRESS', label: 'CWS Pressure', unit: 'kg/cm²', type: 'number' },
      { id: 'U33_CWR_PRESS', label: 'CWR Pressure', unit: 'kg/cm²', type: 'number' },
      { id: 'U33_CWS_TEMP', label: 'CWS Temp', unit: '°C', type: 'number' },
      { id: 'U33_CWR_TEMP', label: 'CWR Temp', unit: '°C', type: 'number' },
      { id: 'U33_CWS_FLOW', label: 'CWS Flow', unit: 'm³/h', type: 'number' },
      { id: 'U33_CWR_FLOW', label: 'CWR Flow', unit: 'm³/h', type: 'number' },
      { id: 'U33_LT1', label: 'Basin Level 1', unit: '%', type: 'number' },
      { id: 'U33_PH', label: 'pH Value', unit: '', type: 'number' },
      { id: 'U33_COND', label: 'Conductivity', unit: 'μS/cm', type: 'number' },
      { id: 'U33_FCL', label: 'Free Chlorine', unit: 'ppm', type: 'number' },
      { id: 'U33_TURB', label: 'Turbidity', unit: 'NTU', type: 'number' },
      { id: 'U33_TOC', label: 'Total Organic Carbon', unit: 'ppm', type: 'number' },
      { id: 'U33_TSS', label: 'Total Susp Solids', unit: 'ppm', type: 'number' },
    ]
  },
  {
    id: 'EMS',
    name: 'Energy Management (EMS)',
    category: 'Energy',
    icon: <Zap className="w-4 h-4 text-yellow-400" />,
    sections: [
        {
            title: 'Gas Turbine Generators (GTG)',
            fields: [
                { id: 'EMS_GT_A_LOAD', label: 'GTG-A Load', unit: 'MW', type: 'number' },
                { id: 'EMS_GT_A_MODE', label: 'GTG-A Mode', unit: '', type: 'select', options: ['Maintenance', 'PMS Sharing', 'PMS Fixed', 'Manual'] },
                { id: 'EMS_GT_B_LOAD', label: 'GTG-B Load', unit: 'MW', type: 'number' },
                { id: 'EMS_GT_B_MODE', label: 'GTG-B Mode', unit: '', type: 'select', options: ['PMS Sharing', 'PMS Fixed', 'Manual'] },
                { id: 'EMS_GT_C_LOAD', label: 'GTG-C Load', unit: 'MW', type: 'number' },
                { id: 'EMS_GT_C_MODE', label: 'GTG-C Mode', unit: '', type: 'select', options: ['PMS Fixed', 'PMS Sharing', 'Manual'] },
                { id: 'EMS_GT_D_LOAD', label: 'GTG-D Load', unit: 'MW', type: 'number' },
                { id: 'EMS_GT_D_MODE', label: 'GTG-D Mode', unit: '', type: 'select', options: ['PMS Sharing', 'PMS Fixed', 'Manual'] },
            ]
        },
        {
            title: 'Steam Turbine Generators',
            fields: [
                { id: 'EMS_STG_A_LOAD', label: 'STG-A Load', unit: 'MW', type: 'number' },
                { id: 'EMS_STG_A_MODE', label: 'STG-A Mode', unit: '', type: 'select', options: ['PMS Sharing', 'PMS Fixed'] },
                { id: 'EMS_STG_B_LOAD', label: 'STG-B Load', unit: 'MW', type: 'number' },
                { id: 'EMS_STG_B_MODE', label: 'STG-B Mode', unit: '', type: 'select', options: ['PMS Sharing', 'PMS Fixed'] },
                { id: 'EMS_STG_C_LOAD', label: 'STG-C Load', unit: 'MW', type: 'number' },
                { id: 'EMS_STG_C_MODE', label: 'STG-C Mode', unit: '', type: 'select', options: ['PMS Sharing', 'PMS Fixed'] },
                { id: 'EMS_STG_D_LOAD', label: 'STG-D Load', unit: 'MW', type: 'number' },
                { id: 'EMS_STG_D_MODE', label: 'STG-D Mode', unit: '', type: 'select', options: ['PMS Sharing', 'PMS Fixed'] },
            ]
        },
        {
            title: 'Steam Generation (Boilers)',
            fields: [
                { id: 'EMS_BLR_A_LOAD', label: 'Boiler A Load', unit: 'TPH', type: 'number' },
                { id: 'EMS_BLR_B_LOAD', label: 'Boiler B Load', unit: 'TPH', type: 'number' },
                { id: 'EMS_BLR_C_LOAD', label: 'Boiler C Load', unit: 'TPH', type: 'number' },
                { id: 'EMS_SGU_FLOW', label: 'Aux Boiler Flow', unit: 'TPH', type: 'number' },
                { id: 'EMS_SGU_PRESS', label: 'Drum Pressure', unit: 'kg/cm²', type: 'number' },
                { id: 'EMS_SGU_TEMP', label: 'Steam Temp', unit: '°C', type: 'number' },
                { id: 'EMS_SGU_STATUS', label: 'Aux Status', unit: '', type: 'select', options: ['Operational', 'Banked', 'Maintenance'] }
            ]
        },
        {
            title: 'Steam & Compression',
            fields: [
                { id: 'EMS_HRSG_A_FLOW', label: 'HRSG-A Steam', unit: 'TPH', type: 'number' },
                { id: 'EMS_HRSG_B_FLOW', label: 'HRSG-B Steam', unit: 'TPH', type: 'number' },
                { id: 'EMS_HRSG_C_FLOW', label: 'HRSG-C Steam', unit: 'TPH', type: 'number' },
                { id: 'EMS_NGC_B_LOAD', label: 'NGC-B Load', unit: '%', type: 'number' },
                { id: 'EMS_NGC_B_DP', label: 'NGC-B Suction DP', unit: 'mmH2O', type: 'number' },
                { id: 'EMS_NGC_A_STAT', label: 'NGC-A Status', unit: '', type: 'select', options: ['Standby', 'Running', 'Trip'] },
            ]
        }
    ]
  }
];

export const OperationsDataEntry: React.FC<OperationsDataEntryProps> = ({ units, onSave, user }) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'Process' | 'Utility' | 'Energy'>('Process');
  const [expandedUnit, setExpandedUnit] = useState<string>('CDU-01');
  const [nlInput, setNlInput] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Only load initial data on mount (snapshot). Do not depend on `units` to prevent overwriting user input.
    const initialData: Record<string, string> = {};
    units.forEach(u => { u.sensors.forEach(s => { initialData[s.id] = s.value.toString(); }); });
    customForms.forEach(form => {
        if(form.fields) form.fields.forEach(f => { initialData[f.id] = f.type === 'select' && f.options && f.options.length > 0 ? f.options[0] : '' });
        if(form.sections) form.sections.forEach(sec => sec.fields.forEach(f => { initialData[f.id] = f.type === 'select' && f.options && f.options.length > 0 ? f.options[0] : '' }));
    });
    const overrides = getUtilityOverrides();
    Object.entries(overrides).forEach(([key, val]) => { initialData[key] = String(val); });
    setFormData(initialData);
  }, []); // Intentionally empty dependencies to capture snapshot only on mount

  const handleInputChange = (id: string, value: string) => { setFormData(prev => ({ ...prev, [id]: value })); };

  const handleSubmit = async (overrideData?: Record<string, any>) => {
    setIsSubmitting(true);
    const dataToSubmit = overrideData ? { ...formData, ...overrideData } : formData;
    
    // Pass raw data (strings included) so mode statuses like "SERVICE" aren't coerced to NaN/0.
    // The backend `updateUtilityOverride` handles mixed types.
    
    // 1. Update Live System
    await onSave(dataToSubmit, user);

    // 2. Archive to Logging Service (Backend)
    await loggingService.logData(dataToSubmit, user.id);

    setLastSaved(new Date());
    setIsSubmitting(false);
  };

  // --- FILE UPLOAD HANDLING ---
  const handleFileSelect = () => {
      fileInputRef.current?.click();
  };

  const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
      });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      setAiFeedback("Analyzing document...");

      try {
          let extractedData: Record<string, string> | null = {};
          const schema = buildSchemaContext();

          if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
              // CSV Handling - Read as text
              const text = await file.text();
              extractedData = await parseNaturalLanguageLog(text, schema);
          } else {
              // PDF / Image / Excel (Attempt binary multimodal)
              const base64Data = await fileToBase64(file);
              const geminiFile = {
                  inlineData: {
                      data: base64Data.split(',')[1],
                      mimeType: file.type || 'application/octet-stream' // Fallback
                  }
              };
              extractedData = await parseMultimodalData(geminiFile, schema);
          }

          if (extractedData) {
              processExtractedData(extractedData);
          } else {
              throw new Error("Failed to extract data structure.");
          }
          
          if (fileInputRef.current) fileInputRef.current.value = '';

      } catch (err: any) {
          console.error(err);
          setAiFeedback(`Error: ${err.message || "Document processing failed"}`);
      } finally {
          setIsUploading(false);
      }
  };

  const handleAIProcess = async () => {
      if (!nlInput.trim()) return;
      setIsProcessingAI(true);
      setAiFeedback(null);
      try {
          const schema = buildSchemaContext();
          const extractedData = await parseNaturalLanguageLog(nlInput, schema);
          if (extractedData) {
              processExtractedData(extractedData);
          } else {
              setAiFeedback("AI Service Error: Could not process request.");
          }
      } catch (error: any) { 
          setAiFeedback(`Error: ${error.message || "Processing failed"}`); 
      }
      finally { setIsProcessingAI(false); }
  };

  const processExtractedData = async (extractedData: Record<string, string>) => {
    const keys = Object.keys(extractedData);
    if (keys.length > 0) {
        setFormData(prev => ({ ...prev, ...extractedData }));
        // Auto-submit extracted data to update modules immediately
        await handleSubmit(extractedData);
        setAiFeedback(`Extracted & Synced ${keys.length} points.`);
        setNlInput('');
    } else { setAiFeedback("No matching data points found."); }
  };

  const buildSchemaContext = () => {
      let schema = "";
      customForms.forEach(f => {
          if (f.fields) f.fields.forEach(field => schema += `${field.id} (${field.label} - ${f.name})\n`);
          if (f.sections) f.sections.forEach(sec => sec.fields.forEach(field => schema += `${field.id} (${field.label} - ${f.name})\n`));
      });
      units.forEach(u => u.sensors.forEach(s => schema += `${s.id} (${s.name} - ${u.name})\n`));
      return schema;
  };

  const processUnits = [
    ...units.map(u => ({ id: u.id, name: u.name, category: 'Process', icon: <Factory className="w-4 h-4 text-neon-blue" /> })),
    ...customForms.filter(f => f.category === 'Process')
  ];
  const utilityUnits = customForms.filter(f => f.category === 'Utility');
  const energyUnits = customForms.filter(f => f.category === 'Energy');
  const currentNavList = activeTab === 'Process' ? processUnits : activeTab === 'Utility' ? utilityUnits : energyUnits;
  const currentForm = customForms.find(f => f.id === expandedUnit);
  const currentStandardUnit = units.find(u => u.id === expandedUnit);

  const renderField = (field: FormField) => (
      <div key={field.id} className="space-y-0.5">
          <label className="text-[10px] font-bold text-[var(--text-main)] opacity-70 uppercase truncate">{field.label}</label>
          <div className="relative group">
              {field.type === 'select' ? (
                  <div className="relative">
                      <select value={formData[field.id] || ''} onChange={(e) => handleInputChange(field.id, e.target.value)} className="w-full bg-industrial-900 border border-industrial-600 rounded px-2 py-1.5 text-xs text-[var(--text-main)] appearance-none focus:border-neon-blue transition-all">
                          {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2 top-2 w-3 h-3 text-gray-500 pointer-events-none" />
                  </div>
              ) : (
                  <>
                      <input type="number" value={formData[field.id] || ''} onChange={(e) => handleInputChange(field.id, e.target.value)} className="w-full bg-industrial-900 border border-industrial-600 rounded px-2 py-1.5 text-xs font-mono text-neon-blue focus:border-neon-blue transition-all" />
                      <span className="absolute right-2 top-1.5 text-[10px] text-gray-500 pointer-events-none">{field.unit}</span>
                  </>
              )}
          </div>
      </div>
  );

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-140px)] animate-in fade-in slide-in-from-right-4">
        {/* Hidden File Input */}
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".csv, .pdf, .xls, .xlsx, image/*"
            onChange={handleFileUpload}
        />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-industrial-800 p-3 rounded-lg border border-industrial-700 shadow-md gap-3">
            <div>
                 <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                     <Database className="w-5 h-5 text-neon-blue" /> Ops Data Entry
                 </h2>
                 <p className="text-xs text-[var(--text-main)] opacity-50 font-mono uppercase tracking-tighter">Controller: {user.name} ({user.id})</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                <button onClick={() => handleSubmit()} disabled={isSubmitting} className="flex-1 bg-neon-blue hover:bg-blue-600 text-white px-6 py-2 rounded-md font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all">
                    {isSubmitting ? <Activity className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
                    {isSubmitting ? 'Syncing...' : 'Submit Data'}
                </button>
            </div>
        </div>

        <div className="w-full bg-industrial-900 border border-industrial-700 rounded-lg p-3 shadow-lg flex flex-col md:flex-row items-start gap-4 flex-shrink-0">
             <div className="hidden md:block p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg shadow-lg mt-1">
                 <Sparkles className="w-5 h-5 text-white" />
             </div>
             <div className="flex-1 w-full">
                 <div className="flex items-center justify-between mb-1">
                     <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">Rapid Entry <span className="text-[10px] bg-industrial-800 px-1.5 py-0.5 rounded text-gray-400 font-normal">AI Enabled</span></h3>
                        
                        <button 
                            onClick={handleFileSelect}
                            disabled={isUploading}
                            className="text-[10px] px-2 py-0.5 bg-industrial-800 hover:bg-industrial-700 border border-industrial-600 rounded flex items-center gap-1 text-neon-blue transition-colors disabled:opacity-50"
                        >
                            {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                            {isUploading ? 'Parsing...' : 'Upload Log/Sheet'}
                        </button>
                     </div>
                     {aiFeedback && <span className={`text-xs ${aiFeedback.startsWith('Error') ? 'text-neon-red' : 'text-neon-green'}`}>{aiFeedback}</span>}
                 </div>
                 <div className="relative">
                     <textarea rows={2} value={nlInput} onChange={(e) => setNlInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAIProcess())} placeholder='E.g. "Unit 44 pressure 4.5" or "Generator A load 15MW"' className="w-full bg-black/50 border border-industrial-600 rounded p-2 text-sm text-gray-200 focus:outline-none focus:border-neon-purple transition-all resize-none" />
                     <button onClick={handleAIProcess} disabled={isProcessingAI || !nlInput} className="absolute right-2 top-2 bottom-2 px-3 bg-industrial-800 text-neon-purple rounded disabled:opacity-50">
                         {isProcessingAI ? <Activity className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                     </button>
                 </div>
             </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
            <div className="w-full lg:w-64 flex flex-col gap-4">
                <Card className="flex-1 overflow-hidden flex flex-col p-0 max-h-[200px] lg:max-h-full">
                    <div className="p-4 border-b border-industrial-700 bg-industrial-800/50">
                        <div className="flex bg-industrial-900 rounded p-1 border border-industrial-700">
                             {['Process', 'Utility', 'Energy'].map(tab => (
                                 <button key={tab} onClick={() => { setActiveTab(tab as any); setExpandedUnit(''); }} className={`flex-1 py-1 text-[10px] font-bold uppercase rounded transition-colors ${activeTab === tab ? 'bg-industrial-700 text-white shadow' : 'text-gray-500'}`}> {tab} </button>
                             ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {currentNavList.map(item => (
                            <button key={item.id} onClick={() => setExpandedUnit(item.id)} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center justify-between transition-colors ${expandedUnit === item.id ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/30' : 'text-[var(--text-main)] opacity-60 hover:bg-industrial-800'}`}>
                                <span className="flex items-center gap-2 truncate">{'icon' in item ? item.icon : <Activity className="w-4 h-4" />} {item.name} </span>
                                {expandedUnit === item.id && <ChevronRight className="w-4 h-4" />}
                            </button>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                 <div className="flex justify-between items-center bg-industrial-800 p-3 rounded-lg border border-industrial-700">
                    <h2 className="text-md font-bold text-[var(--text-main)]">{currentForm?.name || currentStandardUnit?.name || 'Select Unit'}</h2>
                    <p className="text-xs text-neon-green flex items-center gap-1">{lastSaved ? 'Synced' : 'Pending'}</p>
                 </div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar relative pr-2">
                     {currentForm ? (
                        currentForm.sections ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                                {currentForm.sections.map((section, idx) => (
                                    <Card key={idx} title={section.title} className="flex flex-col h-full">
                                        <div className="grid grid-cols-2 gap-4"> {section.fields.map(renderField)} </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="h-full">
                                {currentForm.fields && <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"> {currentForm.fields.map(renderField)} </div>}
                            </Card>
                        )
                     ) : currentStandardUnit ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                             {['Temperature', 'Pressure', 'Flow', 'Level', 'Analysis'].map(type => {
                                 const typeSensors = currentStandardUnit.sensors.filter(s => s.type === type);
                                 if (typeSensors.length === 0) return null;
                                 return (
                                     <Card key={type} className="h-full">
                                         <div className="flex items-center gap-2 mb-4 border-b border-industrial-700 pb-2"> <Activity className="w-4 h-4 text-gray-400" /> <h3 className="font-bold text-[var(--text-main)] text-sm">{type}</h3> </div>
                                         <div className="grid grid-cols-2 gap-4">
                                             {typeSensors.map(sensor => (
                                                <div key={sensor.id} className="space-y-0.5">
                                                    <label className="text-[10px] font-bold text-[var(--text-main)] opacity-70 uppercase truncate block">{sensor.name}</label>
                                                    <div className="relative">
                                                        <input type="number" value={formData[sensor.id] || ''} onChange={(e) => handleInputChange(sensor.id, e.target.value)} className="w-full bg-industrial-900 border border-industrial-600 rounded px-2 py-1.5 text-xs font-mono text-neon-blue" />
                                                        <span className="absolute right-2 top-1.5 text-[10px] text-gray-500">{sensor.unit}</span>
                                                    </div>
                                                </div>
                                             ))}
                                         </div>
                                     </Card>
                                 );
                             })}
                        </div>
                     ) : <div className="flex items-center justify-center h-full text-gray-500">Select unit</div>}
                 </div>
            </div>
        </div>
    </div>
  );
};
