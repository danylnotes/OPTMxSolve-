import React, { useState, useEffect } from 'react';
import { UnitStatus } from '../types';

interface ProcessUnit {
  id: string;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  status: UnitStatus;
  feed?: number;
  design?: number;
  licensor?: string;
  color?: 'blue' | 'yellow' | 'red' | 'gray' | 'purple';
}

interface Flow {
  from: string;
  to: string;
  label?: string;
  value?: number;
}

const UNIT_COLORS = {
  blue:   { fill: '#1e3a5f', stroke: '#3b82f6', text: '#93c5fd' },
  yellow: { fill: '#3b2f00', stroke: '#f59e0b', text: '#fbbf24' },
  red:    { fill: '#3b0f0f', stroke: '#ef4444', text: '#fca5a5' },
  gray:   { fill: '#1f2937', stroke: '#6b7280', text: '#9ca3af' },
  purple: { fill: '#2d1b5e', stroke: '#8b5cf6', text: '#c4b5fd' },
};

const STATUS_GLOW: Record<UnitStatus, string> = {
  [UnitStatus.OPERATIONAL]: '#22c55e',
  [UnitStatus.WARNING]:     '#f59e0b',
  [UnitStatus.CRITICAL]:    '#ef4444',
  [UnitStatus.MAINTENANCE]: '#6b7280',
};

interface PlantStatusSchematicProps {
  units: import('../types').RefineryUnit[];
  isDay: boolean;
  onSelectUnit?: (id: string) => void;
}

export const PlantStatusSchematic: React.FC<PlantStatusSchematicProps> = ({
  units, isDay, onSelectUnit,
}) => {
  const [tooltip, setTooltip] = useState<{ unit: ProcessUnit; x: number; y: number } | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 1200);
    return () => clearInterval(t);
  }, []);

  const getUnitStatus = (unitId: string): UnitStatus => {
    const found = units.find(u => u.id.toLowerCase().includes(unitId.toLowerCase()) ||
      unitId.toLowerCase().includes(u.id.toLowerCase()));
    return found?.status ?? UnitStatus.OPERATIONAL;
  };

  const processUnits: ProcessUnit[] = [
    // Row 1 — CDU/VDU
    { id: 'CDU-01', label: 'CDU', sublabel: '140,000 BPSD', x: 60,  y: 140, w: 110, h: 130, status: getUnitStatus('CDU'), feed: 140000, design: 140000, licensor: 'GS_SAEC', color: 'blue' },
    { id: 'VDU-01', label: 'VDU', sublabel: '72,000 BPSD',  x: 60,  y: 310, w: 110, h: 80,  status: getUnitStatus('VDU'), feed: 72000,  design: 72000,  licensor: 'GS_SAEC', color: 'blue' },

    // Row 2 — Naphtha train
    { id: 'NHT-02', label: 'NHT',  sublabel: '41,500 BPSD', x: 240, y: 60,  w: 100, h: 70, status: getUnitStatus('NHT'),  color: 'yellow' },
    { id: 'ISOM-03',label: 'ISOM', sublabel: '12,500 BPSD', x: 400, y: 40,  w: 100, h: 65, status: getUnitStatus('ISOM'), color: 'yellow' },
    { id: 'CCR-04', label: 'CCR',  sublabel: '25,500 BPSD', x: 400, y: 130, w: 100, h: 65, status: getUnitStatus('CCR'),  color: 'yellow' },

    // Row 3 — Distillate trains
    { id: 'KHT-05', label: 'KHT',  sublabel: '20,000 BPSD', x: 240, y: 165, w: 100, h: 60, status: getUnitStatus('KHT'), color: 'red' },
    { id: 'DHT-06', label: 'DHT',  sublabel: '28,000 BPSD', x: 240, y: 250, w: 100, h: 60, status: getUnitStatus('DHT'), color: 'red' },

    // Row 4 — Conversion
    { id: 'VGO-HT-07', label: 'VGO HT', sublabel: '36,000 BPSD', x: 240, y: 310, w: 100, h: 65, status: getUnitStatus('VGO'), color: 'yellow' },
    { id: 'FCC-08',    label: 'FCC',     sublabel: '31,000 BPSD', x: 400, y: 295, w: 100, h: 65, status: getUnitStatus('FCC'), color: 'yellow' },
    { id: 'PNU-09',    label: 'Poly Naph',sublabel: '11,500 BPSD',x: 560, y: 295, w: 100, h: 65, status: getUnitStatus('PNU'), color: 'red' },

    // Row 5 — Residue
    { id: 'ABU-10', label: 'Asphalt', sublabel: '1,000 T/D', x: 240, y: 405, w: 100, h: 60, status: getUnitStatus('ABU'), color: 'gray' },

    // Row 6 — Utilities
    { id: 'HPU-13', label: 'HPU',  sublabel: '2×36k Nm³/h', x: 60,  y: 490, w: 110, h: 60, status: getUnitStatus('HPU'), color: 'gray' },
    { id: 'GS-ARU', label: 'GS/ARU',sublabel: '13,500 Nm³/h',x: 240, y: 490, w: 110, h: 60, status: UnitStatus.OPERATIONAL, color: 'blue' },
    { id: 'SRU-18', label: 'SRU',  sublabel: '2×180 T/D',   x: 420, y: 490, w: 100, h: 60, status: UnitStatus.OPERATIONAL, color: 'purple' },
    { id: 'SWS-17', label: 'SWS',  sublabel: '126 Sm³/h',   x: 240, y: 570, w: 110, h: 55, status: UnitStatus.OPERATIONAL, color: 'blue' },
    { id: 'TGTU-20',label: 'TGTU', sublabel: '360 T/D',     x: 420, y: 570, w: 100, h: 55, status: UnitStatus.OPERATIONAL, color: 'purple' },
  ];

  const flows: Flow[] = [
    { from: 'CDU-01', to: 'NHT-02',    label: 'Naphtha',  value: 41500 },
    { from: 'CDU-01', to: 'KHT-05',    label: 'Kero',     value: 20000 },
    { from: 'CDU-01', to: 'DHT-06',    label: 'Diesel',   value: 28000 },
    { from: 'CDU-01', to: 'VDU-01',    label: 'Resid',    value: 72000 },
    { from: 'NHT-02', to: 'ISOM-03',   label: '',         value: 12500 },
    { from: 'NHT-02', to: 'CCR-04',    label: '',         value: 25500 },
    { from: 'VDU-01', to: 'VGO-HT-07', label: 'VGO',     value: 36000 },
    { from: 'VGO-HT-07', to: 'FCC-08', label: '',        value: 31000 },
    { from: 'FCC-08', to: 'PNU-09',    label: 'LPG',     value: 11500 },
    { from: 'VDU-01', to: 'ABU-10',    label: 'VR Resid', value: 0 },
    { from: 'HPU-13', to: 'NHT-02',    label: 'H₂',      value: 0 },
    { from: 'GS-ARU', to: 'SRU-18',    label: '',        value: 0 },
    { from: 'SRU-18', to: 'TGTU-20',   label: '',        value: 0 },
  ];

  const getCenter = (u: ProcessUnit) => ({
    x: u.x + u.w / 2,
    y: u.y + u.h / 2,
  });

  const getEdgePoint = (from: ProcessUnit, to: ProcessUnit) => {
    const fc = getCenter(from);
    const tc = getCenter(to);
    const dx = tc.x - fc.x;
    const dy = tc.y - fc.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      return { sx: dx > 0 ? from.x + from.w : from.x, sy: fc.y,
               ex: dx > 0 ? to.x : to.x + to.w,   ey: tc.y };
    }
    return { sx: fc.x, sy: dy > 0 ? from.y + from.h : from.y,
             ex: tc.x, ey: dy > 0 ? to.y : to.y + to.h };
  };

  const findUnit = (id: string) => processUnits.find(u => u.id === id);

  const bg  = isDay ? '#f0f4f8' : '#0a0e1a';
  const grid= isDay ? '#e2e8f0' : '#1a2030';

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox="0 0 760 660"
        width="100%"
        style={{ background: bg, borderRadius: 12, border: `1px solid ${isDay ? '#cbd5e1' : '#1e293b'}` }}
      >
        <defs>
          <filter id="glow-green"><feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#22c55e" floodOpacity="0.8"/></filter>
          <filter id="glow-red"><feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ef4444" floodOpacity="0.9"/></filter>
          <filter id="glow-amber"><feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.8"/></filter>
          <filter id="blur2"><feGaussianBlur stdDeviation="2"/></filter>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#4b5563"/>
          </marker>
          <marker id="arrow-neon" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#3b82f6"/>
          </marker>
          {/* Grid pattern */}
          <pattern id="grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke={grid} strokeWidth="0.5"/>
          </pattern>
        </defs>

        {/* Background grid */}
        <rect width="760" height="660" fill="url(#grid)"/>

        {/* Title */}
        <text x="380" y="22" textAnchor="middle" fill={isDay ? '#334155' : '#94a3b8'} fontSize="13" fontFamily="monospace" fontWeight="bold">
          PLANT STATUS — PROCESS FLOW SCHEMATIC
        </text>
        <text x="380" y="38" textAnchor="middle" fill={isDay ? '#64748b' : '#64748b'} fontSize="9" fontFamily="monospace">
          140,000 BPSD CRUDE CAPACITY  |  UNIT: BPSD
        </text>

        {/* Crude feed arrow */}
        <line x1="10" y1="205" x2="58" y2="205" stroke="#3b82f6" strokeWidth="2.5" markerEnd="url(#arrow-neon)"/>
        <text x="5" y="218" fill="#3b82f6" fontSize="8" fontFamily="monospace">CRUDE</text>

        {/* Product labels on right */}
        {[
          { y: 73,  label: '• LPG',              color: '#fbbf24' },
          { y: 100, label: '• Gasoline 90/95 RON', color: '#22c55e' },
          { y: 155, label: '• Kero (ATK)',         color: '#60a5fa' },
          { y: 228, label: '• Diesel',             color: '#60a5fa' },
          { y: 257, label: '• Gasoil',             color: '#60a5fa' },
          { y: 430, label: '• Paving Bitumen',     color: '#9ca3af' },
          { y: 450, label: '• Fuel Oil',           color: '#9ca3af' },
          { y: 600, label: '• Sulfur',             color: '#fbbf24' },
        ].map(({ y, label, color }) => (
          <text key={label} x="690" y={y} fill={color} fontSize="9" fontFamily="monospace">{label}</text>
        ))}

        {/* Flow lines */}
        {flows.map((f, i) => {
          const fromUnit = findUnit(f.from);
          const toUnit   = findUnit(f.to);
          if (!fromUnit || !toUnit) return null;
          const { sx, sy, ex, ey } = getEdgePoint(fromUnit, toUnit);
          const mx = (sx + ex) / 2;
          const my = (sy + ey) / 2;
          const isH2 = f.label === 'H₂';
          return (
            <g key={i}>
              <path
                d={`M${sx},${sy} C${mx},${sy} ${mx},${ey} ${ex},${ey}`}
                fill="none"
                stroke={isH2 ? '#22c55e' : '#4b5563'}
                strokeWidth={f.value && f.value > 30000 ? 2.5 : 1.5}
                strokeDasharray={isH2 ? '4,3' : undefined}
                markerEnd="url(#arrow)"
                opacity={0.7}
              />
              {f.label && (
                <text x={mx} y={my - 4} textAnchor="middle"
                  fill={isH2 ? '#22c55e' : (isDay ? '#64748b' : '#6b7280')}
                  fontSize="7" fontFamily="monospace">{f.label}</text>
              )}
            </g>
          );
        })}

        {/* Process units */}
        {processUnits.map((unit) => {
          const col   = UNIT_COLORS[unit.color ?? 'gray'];
          const glow  = STATUS_GLOW[unit.status];
          const isCrit = unit.status === UnitStatus.CRITICAL;
          const isWarn = unit.status === UnitStatus.WARNING;
          const utilPct = unit.feed && unit.design ? (unit.feed / unit.design) : 1.0;
          const filterId = isCrit ? 'glow-red' : isWarn ? 'glow-amber' : undefined;

          return (
            <g
              key={unit.id}
              onClick={() => onSelectUnit?.(unit.id)}
              style={{ cursor: 'pointer' }}
              filter={filterId ? `url(#${filterId})` : undefined}
              onMouseEnter={(e) => {
                const svg = (e.currentTarget as SVGGElement).closest('svg')!;
                const rect = svg.getBoundingClientRect();
                setTooltip({ unit, x: unit.x + unit.w + 8, y: unit.y });
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              {/* Glassmorphism background */}
              <rect
                x={unit.x} y={unit.y} width={unit.w} height={unit.h}
                rx="8" ry="8"
                fill={col.fill}
                fillOpacity={isDay ? 0.5 : 0.8}
                stroke={col.stroke}
                strokeWidth={isCrit && tick % 2 === 0 ? 2.5 : 1.5}
              />
              {/* Glass highlight */}
              <rect
                x={unit.x + 2} y={unit.y + 2} width={unit.w - 4} height={unit.h / 3}
                rx="6" ry="6"
                fill="white" fillOpacity={isDay ? 0.15 : 0.05}
              />
              {/* Status indicator */}
              <circle
                cx={unit.x + unit.w - 10} cy={unit.y + 10} r={4}
                fill={glow}
                opacity={isCrit && tick % 2 === 0 ? 0.4 : 1.0}
              />
              {/* Load bar */}
              <rect x={unit.x + 6} y={unit.y + unit.h - 8} width={unit.w - 12} height={3}
                fill="#1e293b" rx="1.5"/>
              <rect
                x={unit.x + 6} y={unit.y + unit.h - 8}
                width={(unit.w - 12) * Math.min(utilPct, 1.05)} height={3}
                fill={utilPct > 1.0 ? '#ef4444' : utilPct > 0.90 ? '#22c55e' : '#3b82f6'}
                rx="1.5"
              />
              {/* Unit ID */}
              <text x={unit.x + 6} y={unit.y + 18} fill={col.text}
                fontSize="10" fontFamily="monospace" fontWeight="bold">{unit.label}</text>
              {/* Sublabel */}
              {unit.sublabel && (
                <text x={unit.x + unit.w / 2} y={unit.y + unit.h / 2 + 5}
                  textAnchor="middle" fill={col.text} fontSize="8.5"
                  fontFamily="monospace" opacity={0.9}>{unit.sublabel}</text>
              )}
              {/* Licensor badge */}
              {unit.licensor && (
                <text x={unit.x + unit.w / 2} y={unit.y + unit.h - 14}
                  textAnchor="middle" fill={col.stroke} fontSize="7"
                  fontFamily="monospace" opacity={0.8}>{unit.licensor}</text>
              )}
            </g>
          );
        })}

        {/* Tooltip */}
        {tooltip && (
          <g>
            <rect x={tooltip.x} y={tooltip.y} width={155} height={75}
              rx="6" fill={isDay ? '#f8fafc' : '#1e293b'}
              stroke="#3b82f6" strokeWidth="1" opacity={0.95}/>
            <text x={tooltip.x + 8} y={tooltip.y + 16} fill="#3b82f6"
              fontSize="10" fontFamily="monospace" fontWeight="bold">{tooltip.unit.id}</text>
            <text x={tooltip.x + 8} y={tooltip.y + 30} fill={isDay ? '#475569' : '#94a3b8'}
              fontSize="9" fontFamily="monospace">{`Status: ${tooltip.unit.status}`}</text>
            {tooltip.unit.feed && (
              <text x={tooltip.x + 8} y={tooltip.y + 44} fill={isDay ? '#475569' : '#94a3b8'}
                fontSize="9" fontFamily="monospace">
                {`Feed: ${tooltip.unit.feed.toLocaleString()} BPSD`}
              </text>
            )}
            {tooltip.unit.licensor && (
              <text x={tooltip.x + 8} y={tooltip.y + 58} fill="#f59e0b"
                fontSize="8" fontFamily="monospace">
                {`Licensor: ${tooltip.unit.licensor}`}
              </text>
            )}
          </g>
        )}

        {/* Legend */}
        <g transform="translate(14, 590)">
          {[
            { color: UNIT_COLORS.blue.stroke,   label: 'GS_SAEC' },
            { color: UNIT_COLORS.yellow.stroke, label: 'UOP' },
            { color: UNIT_COLORS.red.stroke,    label: 'Axens' },
            { color: UNIT_COLORS.gray.stroke,   label: 'Other' },
            { color: UNIT_COLORS.purple.stroke, label: 'KTI' },
          ].map(({ color, label }, i) => (
            <g key={label} transform={`translate(${i * 68}, 0)`}>
              <rect x={0} y={0} width={12} height={8} rx="2" fill={color} fillOpacity="0.4" stroke={color} strokeWidth="1"/>
              <text x={16} y={8} fill={isDay ? '#64748b' : '#94a3b8'} fontSize="8" fontFamily="monospace">{label}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};
