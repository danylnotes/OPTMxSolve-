import React, { useState, useRef, useEffect } from 'react';
import { RefineryUnit, ChatMessage, Sensor } from '../types';
import { runOperatorChat } from '../services/geminiService';
import { updateSensorSetpoint } from '../services/mockDataService';
import { Card } from './ui/Card';
import { Radio, Send, Activity, Terminal, ChevronLeft, ChevronRight } from 'lucide-react';

// Controller Faceplate Component
const Faceplate: React.FC<{ sensor: Sensor, onUpdate: (val: number) => void }> = ({ sensor, onUpdate }) => {
    const range = sensor.threshold.max - sensor.threshold.min;
    const pct = Math.min(Math.max((sensor.value - (sensor.threshold.min - range*0.2)) / (range * 1.4) * 100, 0), 100);
    const spPct = Math.min(Math.max((sensor.setpoint - (sensor.threshold.min - range*0.2)) / (range * 1.4) * 100, 0), 100);

    const [isEditing, setIsEditing] = useState(false);
    const [tempSp, setTempSp] = useState(sensor.setpoint.toString());

    const handleSet = () => {
        const val = parseFloat(tempSp);
        if (!isNaN(val)) {
            onUpdate(val);
            setIsEditing(false);
        }
    };

    return (
        <div className="bg-black/40 border-2 border-industrial-600 rounded p-4 flex flex-col gap-3 w-full shadow-inner relative overflow-hidden group min-h-[220px]">
            <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-1">
                <span className="font-mono font-bold text-sm text-neon-blue">{sensor.id}</span>
                <span className="text-xs text-gray-400 uppercase truncate max-w-[100px]" title={sensor.name}>{sensor.name}</span>
            </div>
            
            <div className="flex h-36 gap-4 justify-center relative bg-industrial-900/50 p-2 rounded">
                {/* PV Bar */}
                <div className="w-6 bg-industrial-800 rounded-sm relative flex flex-col justify-end">
                    <div className={`w-full transition-all duration-500 ${
                        sensor.status === 'Critical' ? 'bg-neon-red' : sensor.status === 'Warning' ? 'bg-neon-amber' : 'bg-neon-green'
                    }`} style={{ height: `${pct}%` }}></div>
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-400">PV</span>
                </div>
                 {/* SP Bar */}
                 <div className="w-1.5 bg-industrial-700 relative flex flex-col justify-end mx-1">
                    <div className="w-full bg-white relative" style={{ bottom: `${spPct}%`, height: '3px' }}>
                        <div className="absolute -right-2 -top-1.5 w-0 h-0 border-t-[5px] border-t-transparent border-r-[5px] border-r-white border-b-[5px] border-b-transparent"></div>
                    </div>
                </div>
                 {/* OP Bar (Simulated) */}
                 <div className="w-6 bg-industrial-800 rounded-sm relative flex flex-col justify-end">
                    <div className="w-full bg-neon-purple transition-all duration-700 opacity-60" style={{ height: `${pct}%` }}></div>
                     <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-400">OP</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-y-2 gap-x-1 mt-2 text-right font-mono">
                <div className="text-xs text-gray-400 text-left self-center font-bold">PV</div>
                <div className={`text-2xl font-bold ${
                     sensor.status === 'Critical' ? 'text-neon-red animate-pulse' : sensor.status === 'Warning' ? 'text-neon-amber' : 'text-neon-green'
                }`}>{sensor.value.toFixed(1)}</div>
                
                <div className="text-xs text-gray-400 text-left self-center font-bold">SP</div>
                
                {isEditing ? (
                    <div className="flex items-center gap-1 justify-end">
                        <input 
                            type="text" 
                            className="w-16 bg-industrial-900 border border-neon-blue text-sm p-1 text-right text-white"
                            value={tempSp}
                            onChange={(e) => setTempSp(e.target.value)}
                        />
                        <button onClick={handleSet} className="text-xs bg-neon-blue text-white px-1.5 py-1 rounded font-bold">GO</button>
                    </div>
                ) : (
                    <div 
                        className="text-xl font-bold text-neon-blue cursor-pointer hover:underline decoration-dashed decoration-gray-500"
                        onClick={() => setIsEditing(true)}
                        title="Click to adjust"
                    >
                        {sensor.setpoint.toFixed(1)}
                    </div>
                )}
                
                <div className="text-xs text-gray-400 text-left self-center font-bold">OUT</div>
                <div className="text-sm text-neon-purple font-bold">{(pct).toFixed(0)}%</div>
            </div>

            <div className="mt-2 flex justify-between items-center text-xs text-gray-500 border-t border-gray-700 pt-2">
                <div className="flex gap-1">
                    <div className="px-1.5 py-0.5 bg-neon-green/20 text-neon-green rounded border border-neon-green/30 font-bold">AUTO</div>
                    <div className="px-1.5 py-0.5 bg-industrial-800 rounded border border-industrial-700">CAS</div>
                </div>
                <span className="font-medium">{sensor.unit}</span>
            </div>
        </div>
    );
};

interface OperatorConsoleProps {
  units: RefineryUnit[];
  user: { name: string; id: string; role: string };
}

export const OperatorConsole: React.FC<OperatorConsoleProps> = ({ units, user }) => {
  const [selectedUnitId, setSelectedUnitId] = useState<string>(units[0]?.id || '');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'model',
      text: `DCS Online. Operator ${user.name} active on console. System healthy.`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const unitScrollRef = useRef<HTMLDivElement>(null);

  const selectedUnit = units.find(u => u.id === selectedUnitId);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: input,
        timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    const response = await runOperatorChat(userMsg.text, messages, units);

    const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response,
        timestamp: new Date()
    };
    setMessages(prev => [...prev, botMsg]);
    setIsProcessing(false);
  };

  const handleManualUpdate = (sensorId: string, newVal: number) => {
      updateSensorSetpoint(sensorId, newVal);
      const logMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'model',
          text: `[SYSTEM] Manual Override: ${sensorId} SP set to ${newVal}`,
          timestamp: new Date()
      };
      setMessages(prev => [...prev, logMsg]);
  };

  const scrollUnits = (dir: 'left' | 'right') => {
      if (unitScrollRef.current) {
          unitScrollRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
      }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex gap-4 animate-in fade-in duration-300">
      {/* Left Panel: DCS Boards */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-industrial-900 border border-industrial-700 p-2 rounded flex gap-2 items-center relative group min-h-[60px]">
            <button onClick={() => scrollUnits('left')} className="p-2 bg-industrial-800 hover:bg-industrial-700 text-gray-400 rounded-l absolute left-2 z-10 shadow-lg border border-industrial-600">
                <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 flex gap-3 overflow-x-auto scrollbar-hide px-10 items-center" ref={unitScrollRef}>
                <div className="flex gap-3">
                    {units.map(u => (
                        <button
                            key={u.id}
                            onClick={() => setSelectedUnitId(u.id)}
                            className={`px-5 py-2.5 rounded text-base font-bold font-mono transition-colors whitespace-nowrap shadow-sm ${
                                selectedUnitId === u.id 
                                ? 'bg-industrial-700 text-[var(--text-main)] border-b-4 border-neon-blue' 
                                : 'bg-industrial-800 text-[var(--text-main)] opacity-50 hover:opacity-80 border-b-4 border-transparent'
                            }`}
                        >
                            {u.id}
                        </button>
                    ))}
                </div>
            </div>
            <button onClick={() => scrollUnits('right')} className="p-2 bg-industrial-800 hover:bg-industrial-700 text-gray-400 rounded-r absolute right-2 z-10 shadow-lg border border-industrial-600">
                <ChevronRight className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 px-4 border-l border-industrial-700 ml-2">
                <span className="text-[10px] text-gray-500 uppercase font-black">Operator</span>
                <span className="text-xs font-mono text-neon-green font-bold">{user.id}</span>
            </div>
        </div>

        <div className="flex-1 bg-industrial-800/50 border border-industrial-700 rounded-lg p-6 overflow-y-auto custom-scrollbar">
            {selectedUnit ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                    {selectedUnit.sensors.map(sensor => (
                        <Faceplate 
                            key={sensor.id} 
                            sensor={sensor} 
                            onUpdate={(val) => handleManualUpdate(sensor.id, val)} 
                        />
                    ))}
                </div>
            ) : (
                <div className="h-full flex items-center justify-center text-gray-500 text-lg">Select a Unit to View Controls</div>
            )}
        </div>
      </div>

      {/* Right Panel: Operator Chat */}
      <div className="w-[420px] flex flex-col bg-black border border-industrial-700 rounded-lg shadow-2xl overflow-hidden hidden lg:flex">
        <div className="bg-industrial-900 border-b border-industrial-700 p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <Radio className="text-neon-red animate-pulse w-5 h-5" />
                <span className="font-mono text-base font-bold text-gray-200">OPS CHANNEL 1</span>
            </div>
            <div className="px-3 py-1 bg-neon-green/20 text-neon-green text-xs rounded border border-neon-green/30 font-bold tracking-wider">
                LIVE
            </div>
        </div>

        <div className="flex-1 p-5 overflow-y-auto font-mono text-base space-y-5 bg-industrial-950" ref={scrollRef}>
            {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[90%] p-4 rounded-lg border leading-relaxed shadow-md ${
                        msg.role === 'user' 
                        ? 'bg-industrial-800 border-industrial-600 text-gray-200 rounded-tr-none' 
                        : 'bg-green-900/10 border-green-900/30 text-green-400 rounded-tl-none'
                    }`}>
                        <div className="flex items-center gap-2 mb-2 opacity-50 text-xs uppercase tracking-wider font-bold">
                            {msg.role === 'user' ? 'Field Operator' : 'DCS Control (AI)'}
                            <span>{msg.timestamp.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div>{msg.text}</div>
                    </div>
                </div>
            ))}
            {isProcessing && (
                 <div className="flex items-start">
                    <div className="max-w-[85%] p-4 rounded-lg border bg-green-900/10 border-green-900/30 text-green-400 rounded-tl-none">
                         <div className="flex items-center gap-2">
                             <Activity className="w-4 h-4 animate-spin" />
                             <span className="text-sm">Processing command...</span>
                         </div>
                    </div>
                 </div>
            )}
        </div>

        <div className="p-4 bg-industrial-900 border-t border-industrial-700">
            <div className="flex gap-3">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="cmd: set TI-101 to 365"
                    className="flex-1 bg-black border border-industrial-600 rounded px-4 py-3 text-green-500 font-mono text-base focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green shadow-inner"
                    autoComplete="off"
                />
                <button 
                    onClick={handleSend}
                    disabled={isProcessing}
                    className="bg-industrial-800 hover:bg-industrial-700 text-gray-300 border border-industrial-600 px-5 rounded flex items-center justify-center disabled:opacity-50"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
            <div className="mt-3 text-xs text-gray-500 flex justify-between px-1 font-medium">
                <span>Try: "Reduce heater temp by 5 degrees"</span>
                <span className="text-neon-red flex items-center gap-1"><Terminal className="w-3 h-3" /> ROOT ACCESS</span>
            </div>
        </div>
      </div>
    </div>
  );
};