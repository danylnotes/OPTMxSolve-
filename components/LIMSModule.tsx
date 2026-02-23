
import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Microscope, Filter, Plus, FileSpreadsheet, CheckCircle, AlertOctagon, Clock, Search, FlaskConical, Droplet, Flame, Wind, TestTube } from 'lucide-react';

// --- Types ---
type SampleStatus = 'Registered' | 'Received' | 'Testing' | 'Completed' | 'Approved';

interface TestMethod {
    code: string;
    name: string;
    characteristics: {
        name: string;
        unit: string;
        min?: number;
        max?: number;
    }[];
}

interface TestResult {
    testCode: string;
    characteristic: string;
    unit: string;
    specMin?: number;
    specMax?: number;
    value: string;
    status: 'Pending' | 'Pass' | 'Fail';
}

interface LabSample {
    id: string;
    date: string;
    time: string;
    unit: string;
    stream: string;
    type: 'Process' | 'Utility';
    sampler: string;
    status: SampleStatus;
    results: TestResult[];
}

// --- Constants & Catalogs ---
const AVAILABLE_TESTS: TestMethod[] = [
    {
        code: 'ASTM D1298', name: 'Density @ 15°C',
        characteristics: [{ name: 'Density', unit: 'kg/m³', min: 0, max: 1000 }]
    },
    {
        code: 'ASTM D86', name: 'Distillation',
        characteristics: [
            { name: 'IBP', unit: '°C' },
            { name: '5% Rec', unit: '°C' },
            { name: '10% Rec', unit: '°C' },
            { name: '50% Rec', unit: '°C' },
            { name: '90% Rec', unit: '°C' },
            { name: '95% Rec', unit: '°C' },
            { name: 'FBP', unit: '°C' },
        ]
    },
    {
        code: 'ASTM D93', name: 'Flash Point (PMCC)',
        characteristics: [{ name: 'Flash Point', unit: '°C' }]
    },
    {
        code: 'ASTM D4294', name: 'Sulfur Content',
        characteristics: [{ name: 'Total Sulfur', unit: 'wt%' }]
    },
    {
        code: 'ASTM D445', name: 'Kinematic Viscosity',
        characteristics: [{ name: 'Viscosity @ 40°C', unit: 'cSt' }]
    },
    {
        code: 'UOP 163', name: 'Mercaptan Sulfur',
        characteristics: [{ name: 'R-SH', unit: 'ppm' }]
    },
    // Utility Tests
    {
        code: 'WATER-PH', name: 'pH Value',
        characteristics: [{ name: 'pH', unit: '' }]
    },
    {
        code: 'WATER-COND', name: 'Conductivity',
        characteristics: [{ name: 'Conductivity', unit: 'µS/cm' }]
    },
    {
        code: 'WATER-HARD', name: 'Total Hardness',
        characteristics: [{ name: 'CaCO3', unit: 'ppm' }]
    }
];

// Mock Data - ALL RESET TO BLANK
const MOCK_SAMPLES: LabSample[] = [
    {
        id: 'L-240015', date: '2025-12-10', time: '06:00', unit: 'CDU-01', stream: 'Naphtha Stabilizer Btms', type: 'Process', sampler: 'J. Doe', status: 'Registered',
        results: [
            { testCode: 'ASTM D1298', characteristic: 'Density', unit: 'kg/m³', specMin: 720, specMax: 760, value: '', status: 'Pending' },
            { testCode: 'ASTM D86', characteristic: 'IBP', unit: '°C', specMin: 35, specMax: 45, value: '', status: 'Pending' },
            { testCode: 'ASTM D86', characteristic: 'FBP', unit: '°C', specMax: 180, value: '', status: 'Pending' },
        ]
    },
    {
        id: 'L-240018', date: '2025-12-10', time: '06:30', unit: 'DHT-06', stream: 'Product Diesel', type: 'Process', sampler: 'A. Smith', status: 'Received',
        results: [
             { testCode: 'ASTM D93', characteristic: 'Flash Point', unit: '°C', specMin: 60, value: '', status: 'Pending' },
             { testCode: 'ASTM D4294', characteristic: 'Total Sulfur', unit: 'wt%', specMax: 0.001, value: '', status: 'Pending' },
        ]
    },
    {
        id: 'L-240022', date: '2025-12-10', time: '08:00', unit: '38-SGU', stream: 'Boiler Feed Water', type: 'Utility', sampler: 'K. Lee', status: 'Registered',
        results: [
             { testCode: 'WATER-PH', characteristic: 'pH', unit: '', specMin: 8.5, specMax: 9.5, value: '', status: 'Pending' },
             { testCode: 'WATER-COND', characteristic: 'Conductivity', unit: 'µS/cm', specMax: 20, value: '', status: 'Pending' },
        ]
    }
];

export const LIMSModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Process' | 'Utility'>('Process');
  const [samples, setSamples] = useState<LabSample[]>(MOCK_SAMPLES);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(MOCK_SAMPLES[0].id);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  const selectedSample = samples.find(s => s.id === selectedSampleId);
  const filteredSamples = samples.filter(s => s.type === activeTab);

  const handleResultChange = (index: number, val: string) => {
      if (!selectedSample) return;

      const newSamples = [...samples];
      const sampleIndex = newSamples.findIndex(s => s.id === selectedSampleId);
      const result = newSamples[sampleIndex].results[index];
      
      result.value = val;

      // Basic Validation
      const numVal = parseFloat(val);
      if (!isNaN(numVal)) {
          if ((result.specMin !== undefined && numVal < result.specMin) || 
              (result.specMax !== undefined && numVal > result.specMax)) {
              result.status = 'Fail';
          } else {
              result.status = 'Pass';
          }
      } else {
          result.status = 'Pending';
      }

      // Update Sample Status
      const allDone = newSamples[sampleIndex].results.every(r => r.value !== '');
      if (allDone) newSamples[sampleIndex].status = 'Completed';
      else if (newSamples[sampleIndex].results.some(r => r.value !== '')) newSamples[sampleIndex].status = 'Testing';

      setSamples(newSamples);
  };

  const handleAddTest = (testCode: string) => {
      if (!selectedSample) return;
      const method = AVAILABLE_TESTS.find(t => t.code === testCode);
      if (!method) return;

      const newResults: TestResult[] = method.characteristics.map(c => ({
          testCode: method.code,
          characteristic: c.name,
          unit: c.unit,
          specMin: c.min,
          specMax: c.max,
          value: '',
          status: 'Pending'
      }));

      const newSamples = [...samples];
      const sampleIndex = newSamples.findIndex(s => s.id === selectedSampleId);
      newSamples[sampleIndex].results = [...newSamples[sampleIndex].results, ...newResults];
      // Keep status logic simple for now
      if (newSamples[sampleIndex].status === 'Registered') newSamples[sampleIndex].status = 'Received';
      
      setSamples(newSamples);
      setIsTestModalOpen(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-500">
        
        {/* Module Header */}
        <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-2xl font-bold text-[var(--text-main)] flex items-center gap-3">
                    <Microscope className="text-neon-blue" />
                    LIMS
                </h2>
                <p className="text-[var(--text-main)] opacity-60 text-sm mt-1">Laboratory Information Management System</p>
            </div>
            <div className="flex gap-2 bg-industrial-800 p-1 rounded border border-industrial-700">
                <button 
                    onClick={() => setActiveTab('Process')}
                    className={`px-4 py-2 rounded text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === 'Process' ? 'bg-neon-blue text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <Flame className="w-4 h-4" /> Process Streams
                </button>
                <button 
                    onClick={() => setActiveTab('Utility')}
                    className={`px-4 py-2 rounded text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === 'Utility' ? 'bg-neon-green text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <Droplet className="w-4 h-4" /> Utility & Env
                </button>
            </div>
        </div>

        <div className="flex flex-1 gap-6 overflow-hidden">
            
            {/* Left Pane: Sample List */}
            <Card className="w-80 flex flex-col p-0 overflow-hidden border-r border-industrial-700">
                <div className="p-4 border-b border-industrial-700 bg-industrial-800/50 flex justify-between items-center">
                    <h3 className="font-bold text-[var(--text-main)] flex items-center gap-2">
                        <TestTube className="w-4 h-4 text-neon-purple" /> Samples
                    </h3>
                    <div className="flex gap-2">
                         <button className="p-1.5 hover:bg-industrial-700 rounded text-gray-400"><Search className="w-4 h-4" /></button>
                         <button className="p-1.5 hover:bg-industrial-700 rounded text-gray-400"><Filter className="w-4 h-4" /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar bg-industrial-900/30">
                    {filteredSamples.map(sample => (
                        <div 
                            key={sample.id}
                            onClick={() => setSelectedSampleId(sample.id)}
                            className={`p-3 rounded-lg cursor-pointer border transition-all ${
                                selectedSampleId === sample.id 
                                ? 'bg-neon-blue/10 border-neon-blue' 
                                : 'bg-industrial-800/50 border-industrial-700 hover:border-gray-500'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`font-mono font-bold text-sm ${selectedSampleId === sample.id ? 'text-neon-blue' : 'text-[var(--text-main)]'}`}>{sample.id}</span>
                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                                    sample.status === 'Completed' ? 'bg-green-900/30 text-neon-green border-green-500/30' :
                                    sample.status === 'Testing' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30' :
                                    'bg-industrial-700 text-gray-400 border-gray-600'
                                }`}>{sample.status}</span>
                            </div>
                            <div className="text-xs text-[var(--text-main)] opacity-80 font-medium">{sample.stream}</div>
                            <div className="flex justify-between mt-2 text-[10px] text-gray-500">
                                <span>{sample.unit}</span>
                                <span>{sample.time}</span>
                            </div>
                        </div>
                    ))}
                    {filteredSamples.length === 0 && (
                        <div className="p-8 text-center text-gray-500 text-sm">No samples found for this category.</div>
                    )}
                </div>
            </Card>

            {/* Right Pane: Result Entry */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                {selectedSample ? (
                    <>
                        {/* Sample Header Info */}
                        <div className="bg-industrial-800 p-4 rounded-lg border border-industrial-700 flex justify-between items-start">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-2">
                                <div>
                                    <span className="text-[10px] uppercase text-gray-500 font-bold">Sample ID</span>
                                    <div className="text-lg font-mono font-bold text-white">{selectedSample.id}</div>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase text-gray-500 font-bold">Sampling Point</span>
                                    <div className="text-sm text-white">{selectedSample.unit} - {selectedSample.stream}</div>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase text-gray-500 font-bold">Date/Time</span>
                                    <div className="text-sm text-white">{selectedSample.date} {selectedSample.time}</div>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase text-gray-500 font-bold">Sampler</span>
                                    <div className="text-sm text-white flex items-center gap-2">
                                        {selectedSample.sampler}
                                        {selectedSample.status === 'Completed' && <CheckCircle className="w-4 h-4 text-neon-green" />}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="bg-industrial-700 hover:bg-industrial-600 text-white px-3 py-1.5 rounded text-xs font-medium border border-industrial-600">Print Label</button>
                                <button className="bg-neon-green hover:bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium shadow-lg">Approve</button>
                            </div>
                        </div>

                        {/* Result Grid */}
                        <Card className="flex-1 flex flex-col p-0 overflow-hidden">
                             <div className="p-3 border-b border-industrial-700 bg-industrial-800/80 flex justify-between items-center">
                                 <h4 className="font-bold text-[var(--text-main)] text-sm">Test Results</h4>
                                 <button 
                                    onClick={() => setIsTestModalOpen(true)}
                                    className="text-xs bg-neon-blue hover:bg-blue-600 text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
                                 >
                                     <Plus className="w-3 h-3" /> Add Test Method
                                 </button>
                             </div>
                             
                             <div className="flex-1 overflow-auto">
                                 <table className="w-full text-left text-sm">
                                     <thead className="bg-industrial-900 text-xs uppercase text-gray-400 font-semibold sticky top-0 z-10">
                                         <tr>
                                             <th className="p-3 border-b border-industrial-700 w-10">No.</th>
                                             <th className="p-3 border-b border-industrial-700">Test Method</th>
                                             <th className="p-3 border-b border-industrial-700">Characteristic</th>
                                             <th className="p-3 border-b border-industrial-700 text-center">Unit</th>
                                             <th className="p-3 border-b border-industrial-700 text-right">Min Spec</th>
                                             <th className="p-3 border-b border-industrial-700 text-right">Max Spec</th>
                                             <th className="p-3 border-b border-industrial-700 w-32">Result</th>
                                             <th className="p-3 border-b border-industrial-700 text-center w-24">Status</th>
                                         </tr>
                                     </thead>
                                     <tbody className="divide-y divide-industrial-800/50">
                                         {selectedSample.results.map((result, idx) => (
                                             <tr key={idx} className="hover:bg-industrial-800/30">
                                                 <td className="p-3 text-gray-500 font-mono text-xs">{idx + 1}</td>
                                                 <td className="p-3 text-gray-300 font-medium">{result.testCode}</td>
                                                 <td className="p-3 text-gray-400">{result.characteristic}</td>
                                                 <td className="p-3 text-center text-gray-500">{result.unit}</td>
                                                 <td className="p-3 text-right font-mono text-gray-500">{result.specMin ?? '-'}</td>
                                                 <td className="p-3 text-right font-mono text-gray-500">{result.specMax ?? '-'}</td>
                                                 <td className="p-3">
                                                     <input 
                                                         type="text"
                                                         value={result.value}
                                                         onChange={(e) => handleResultChange(idx, e.target.value)}
                                                         className={`w-full bg-industrial-900 border px-2 py-1 rounded font-mono text-right focus:outline-none focus:ring-1 focus:ring-neon-blue ${
                                                             result.status === 'Fail' ? 'border-red-500 text-red-400 bg-red-900/10' :
                                                             result.value === '' ? 'border-yellow-500/50 bg-yellow-900/10' : // Highlight empty/pending
                                                             'border-industrial-600 text-white'
                                                         }`}
                                                     />
                                                 </td>
                                                 <td className="p-3 text-center">
                                                     {result.status === 'Pass' && <span className="text-neon-green text-xs font-bold px-2 py-0.5 bg-green-900/20 rounded border border-green-900/50">OK</span>}
                                                     {result.status === 'Fail' && <span className="text-neon-red text-xs font-bold px-2 py-0.5 bg-red-900/20 rounded border border-red-900/50">OOS</span>}
                                                     {result.status === 'Pending' && <span className="text-yellow-500 text-[10px] uppercase">Wait</span>}
                                                 </td>
                                             </tr>
                                         ))}
                                         {selectedSample.results.length === 0 && (
                                             <tr>
                                                 <td colSpan={8} className="p-8 text-center text-gray-500 opacity-60">
                                                     <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                     No tests assigned. Click "Add Test Method".
                                                 </td>
                                             </tr>
                                         )}
                                     </tbody>
                                 </table>
                             </div>
                        </Card>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        Select a sample to view details
                    </div>
                )}
            </div>
        </div>

        {/* Add Test Modal Overlay */}
        {isTestModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-industrial-900 border border-industrial-600 rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-industrial-700 bg-industrial-800">
                        <h3 className="font-bold text-white flex items-center gap-2">Select Test Method</h3>
                    </div>
                    <div className="p-2 max-h-[400px] overflow-y-auto">
                        {AVAILABLE_TESTS.map(test => (
                            <button
                                key={test.code}
                                onClick={() => handleAddTest(test.code)}
                                className="w-full text-left p-3 hover:bg-industrial-800 rounded flex justify-between items-center group transition-colors border-b border-industrial-800 last:border-0"
                            >
                                <div>
                                    <div className="font-bold text-neon-blue group-hover:text-blue-400">{test.code}</div>
                                    <div className="text-sm text-gray-400">{test.name}</div>
                                </div>
                                <Plus className="w-4 h-4 text-gray-600 group-hover:text-white" />
                            </button>
                        ))}
                    </div>
                    <div className="p-3 bg-industrial-950/50 border-t border-industrial-700 flex justify-end">
                        <button 
                            onClick={() => setIsTestModalOpen(false)}
                            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};
