import React, { useState } from 'react';
import { RefineryUnit } from '../types';

interface SankeyNode {
  id: string;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
  color: string;
}

interface SankeyLink {
  from: string;
  to: string;
  value: number;
  color: string;
  label?: string;
}

interface MaterialBalanceSankeyProps {
  units: RefineryUnit[];
  isDay: boolean;
  crudeFeedBpd?: number;
}

const COLORS = {
  crude:    '#6366f1',
  cdu:      '#3b82f6',
  vdu:      '#8b5cf6',
  naphtha:  '#f59e0b',
  kero:     '#06b6d4',
  diesel:   '#10b981',
  vgo:      '#f97316',
  residue:  '#ef4444',
  gas:      '#84cc16',
  nht:      '#f59e0b',
  isom:     '#fbbf24',
  ccr:      '#fcd34d',
  kht:      '#06b6d4',
  dht:      '#10b981',
  vgoht:    '#f97316',
  fcc:      '#ef4444',
  bitumen:  '#78716c',
  product:  '#22c55e',
};

export const MaterialBalanceSankey: React.FC<MaterialBalanceSankeyProps> = ({
  units, isDay, crudeFeedBpd = 140000,
}) => {
  const [hovered, setHovered] = useState<string | null>(null);

  const scale = crudeFeedBpd / 140000;

  // CDU cut fractions
  const LPG_GAS    = Math.round(crudeFeedBpd * 0.020);
  const NAPHTHA    = Math.round(crudeFeedBpd * 0.255);
  const KEROSENE   = Math.round(crudeFeedBpd * 0.143);
  const DIESEL     = Math.round(crudeFeedBpd * 0.200);
  const VGO_CDU    = Math.round(crudeFeedBpd * 0.250);
  const RESIDUE    = Math.round(crudeFeedBpd * 0.132);

  // Downstream processing
  const NHT_FEED   = Math.round(NAPHTHA * 0.95);
  const NHT_OUT    = Math.round(NHT_FEED * 0.98);
  const ISOM_FEED  = Math.round(NHT_OUT * 0.35);
  const CCR_FEED   = Math.round(NHT_OUT * 0.60);
  const ISOM_OUT   = Math.round(ISOM_FEED * 0.97);
  const CCR_OUT    = Math.round(CCR_FEED * 0.93);

  const KHT_FEED   = KEROSENE;
  const KHT_OUT    = Math.round(KHT_FEED * 0.98);

  const DHT_FEED   = DIESEL;
  const DHT_OUT    = Math.round(DHT_FEED * 0.97);

  // VDU splits VGO_CDU residue
  const VDU_FEED   = RESIDUE;
  const VGO_VDU    = Math.round(VDU_FEED * 0.55);
  const BITUMEN    = Math.round(VDU_FEED * 0.38);
  const VDU_GAS    = Math.round(VDU_FEED * 0.07);

  const VGOHT_FEED = Math.round((VGO_CDU + VGO_VDU) * 0.50);
  const FCC_FEED   = Math.round((VGO_CDU + VGO_VDU) * 0.50);
  const VGOHT_OUT  = Math.round(VGOHT_FEED * 0.92);
  const FCC_PRODUCTS = Math.round(FCC_FEED * 0.95);

  const W = 900;
  const H = 580;

  // Column X positions
  const X0 = 30;   // Crude feed
  const X1 = 130;  // CDU
  const X2 = 270;  // Fractions
  const X3 = 420;  // Processing units
  const X4 = 580;  // Intermediate products
  const X5 = 740;  // Final products

  const BAR_W = 90;
  const fmt = (v: number) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : `${v}`;
  const fmtBpd = (v: number) => `${v.toLocaleString()} BPD`;

  // Bar height proportional to flow value (max 480px for 140k BPD)
  const bh = (v: number) => Math.max(14, Math.round((v / crudeFeedBpd) * 480));

  // Node definitions
  const nodes: SankeyNode[] = [
    { id: 'crude',   label: 'Crude',    sublabel: fmtBpd(crudeFeedBpd), x: X0,  y: 60,  width: 70,   height: bh(crudeFeedBpd), value: crudeFeedBpd, color: COLORS.crude },
    { id: 'cdu',     label: 'CDU',      sublabel: '140k BPSD',          x: X1,  y: 60,  width: BAR_W, height: bh(crudeFeedBpd), value: crudeFeedBpd, color: COLORS.cdu   },
    { id: 'gas',     label: 'LPG/Gas',  sublabel: fmtBpd(LPG_GAS),      x: X2,  y: 30,  width: BAR_W, height: bh(LPG_GAS),      value: LPG_GAS,      color: COLORS.gas   },
    { id: 'naph',    label: 'Naphtha',  sublabel: fmtBpd(NAPHTHA),       x: X2,  y: 30 + bh(LPG_GAS) + 10, width: BAR_W, height: bh(NAPHTHA), value: NAPHTHA, color: COLORS.naphtha },
    { id: 'kero',    label: 'Kerosene', sublabel: fmtBpd(KEROSENE),      x: X2,  y: 30 + bh(LPG_GAS) + 10 + bh(NAPHTHA) + 10, width: BAR_W, height: bh(KEROSENE), value: KEROSENE, color: COLORS.kero },
    { id: 'diesel',  label: 'Diesel',   sublabel: fmtBpd(DIESEL),        x: X2,  y: 30 + bh(LPG_GAS) + 10 + bh(NAPHTHA) + 10 + bh(KEROSENE) + 10, width: BAR_W, height: bh(DIESEL), value: DIESEL, color: COLORS.diesel },
    { id: 'vgo_c',   label: 'VGO',      sublabel: fmtBpd(VGO_CDU),       x: X2,  y: 30 + bh(LPG_GAS) + 10 + bh(NAPHTHA) + 10 + bh(KEROSENE) + 10 + bh(DIESEL) + 10, width: BAR_W, height: bh(VGO_CDU), value: VGO_CDU, color: COLORS.vgo },
    { id: 'resid',   label: 'Residue',  sublabel: fmtBpd(RESIDUE),       x: X2,  y: 30 + bh(LPG_GAS) + 10 + bh(NAPHTHA) + 10 + bh(KEROSENE) + 10 + bh(DIESEL) + 10 + bh(VGO_CDU) + 10, width: BAR_W, height: bh(RESIDUE), value: RESIDUE, color: COLORS.residue },
    { id: 'nht',     label: 'NHT',      sublabel: fmtBpd(NHT_FEED),      x: X3,  y: 30,  width: BAR_W, height: bh(NHT_FEED),    value: NHT_FEED,  color: COLORS.nht    },
    { id: 'kht',     label: 'KHT',      sublabel: fmtBpd(KHT_FEED),      x: X3,  y: 30 + bh(NHT_FEED) + 80,  width: BAR_W, height: bh(KHT_FEED), value: KHT_FEED, color: COLORS.kht },
    { id: 'dht',     label: 'DHT',      sublabel: fmtBpd(DHT_FEED),      x: X3,  y: 30 + bh(NHT_FEED) + 80 + bh(KHT_FEED) + 20, width: BAR_W, height: bh(DHT_FEED), value: DHT_FEED, color: COLORS.dht },
    { id: 'vdu',     label: 'VDU',      sublabel: fmtBpd(VDU_FEED),      x: X3,  y: 30 + bh(NHT_FEED) + 80 + bh(KHT_FEED) + 20 + bh(DHT_FEED) + 20, width: BAR_W, height: bh(VDU_FEED), value: VDU_FEED, color: COLORS.vdu },
    { id: 'vgoht',   label: 'VGO-HT',   sublabel: fmtBpd(VGOHT_FEED),    x: X3,  y: 30 + bh(NHT_FEED) + 80 + bh(KHT_FEED) + 20 + bh(DHT_FEED) + 20 + bh(VDU_FEED) + 20, width: BAR_W, height: bh(VGOHT_FEED), value: VGOHT_FEED, color: COLORS.vgoht },
    { id: 'fcc',     label: 'FCC',      sublabel: fmtBpd(FCC_FEED),      x: X3,  y: 30 + bh(NHT_FEED) + 80 + bh(KHT_FEED) + 20 + bh(DHT_FEED) + 20 + bh(VDU_FEED) + 20 + bh(VGOHT_FEED) + 20, width: BAR_W, height: bh(FCC_FEED), value: FCC_FEED, color: COLORS.fcc },
  ];

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  // Get center Y of a node
  const cy = (id: string) => {
    const n = nodeMap[id];
    return n ? n.y + n.height / 2 : 0;
  };

  // Bezier link path
  const linkPath = (fromNode: SankeyNode, toNode: SankeyNode, _value: number): string => {
    const x1 = fromNode.x + fromNode.width;
    const x2 = toNode.x;
    const y1 = fromNode.y + fromNode.height / 2;
    const y2 = toNode.y + toNode.height / 2;
    const mx = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
  };

  const isD = !isDay;
  const bgClass = isD ? 'bg-gray-950/50' : 'bg-white/70';
  const textClass = isD ? 'text-gray-100' : 'text-gray-800';
  const subClass = isD ? 'text-gray-400' : 'text-gray-500';
  const borderClass = isD ? 'border-white/10' : 'border-gray-200';

  return (
    <div className={`rounded-2xl border glass-panel p-5 ${bgClass} ${borderClass}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className={`text-lg font-bold ${textClass}`}>Material Balance Sankey</h2>
          <p className={`text-xs mt-0.5 ${subClass}`}>Crude → Products flow at {crudeFeedBpd.toLocaleString()} BPD</p>
        </div>
        <div className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${isD ? 'bg-blue-950/50 border-blue-500/30 text-blue-300' : 'bg-sky-50 border-sky-200 text-sky-700'}`}>
          Scale: {(scale * 100).toFixed(0)}%
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg width={W} height={H} className="font-mono select-none">
          <defs>
            {nodes.map(n => (
              <linearGradient key={`g-${n.id}`} id={`g-${n.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={n.color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={n.color} stopOpacity="0.6" />
              </linearGradient>
            ))}
          </defs>

          {/* Column headers */}
          {[
            { x: X0 + 35, label: 'Feed' },
            { x: X1 + 45, label: 'Distillation' },
            { x: X2 + 45, label: 'Fractions' },
            { x: X3 + 45, label: 'Processing' },
            { x: X5 + 20, label: 'Products' },
          ].map(h => (
            <text key={h.label} x={h.x} y={16} textAnchor="middle"
              fill={isD ? '#6b7280' : '#9ca3af'} fontSize="10" fontWeight="600" letterSpacing="1">
              {h.label.toUpperCase()}
            </text>
          ))}

          {/* Sankey links — CDU to fractions */}
          {['gas','naph','kero','diesel','vgo_c','resid'].map(id => {
            const tn = nodeMap[id];
            const from = nodeMap['cdu'];
            if (!tn || !from) return null;
            const x1 = from.x + from.width;
            const x2 = tn.x;
            const y1 = from.y + from.height / 2;
            const y2 = tn.y + tn.height / 2;
            const bw = Math.max(2, bh(tn.value) / 2);
            const mx = (x1 + x2) / 2;
            return (
              <path key={`link-cdu-${id}`}
                d={`M ${x1} ${y1 - bw/2} C ${mx} ${y1 - bw/2}, ${mx} ${y2 - bw/2}, ${x2} ${y2 - bw/2} L ${x2} ${y2 + bw/2} C ${mx} ${y2 + bw/2}, ${mx} ${y1 + bw/2}, ${x1} ${y1 + bw/2} Z`}
                fill={tn.color} fillOpacity={hovered === id ? 0.5 : 0.2}
                stroke={tn.color} strokeOpacity={0.4} strokeWidth="0.5"
              />
            );
          })}

          {/* Links — naph to NHT */}
          {[
            { from: 'naph', to: 'nht', val: NHT_FEED, col: COLORS.nht },
            { from: 'kero', to: 'kht', val: KHT_FEED, col: COLORS.kht },
            { from: 'diesel', to: 'dht', val: DHT_FEED, col: COLORS.dht },
            { from: 'resid', to: 'vdu', val: VDU_FEED, col: COLORS.vdu },
            { from: 'vgo_c', to: 'vgoht', val: VGOHT_FEED, col: COLORS.vgoht },
            { from: 'vgo_c', to: 'fcc', val: FCC_FEED, col: COLORS.fcc },
          ].map(lk => {
            const fn = nodeMap[lk.from];
            const tn = nodeMap[lk.to];
            if (!fn || !tn) return null;
            const x1 = fn.x + fn.width;
            const x2 = tn.x;
            const y1 = fn.y + fn.height / 2;
            const y2 = tn.y + tn.height / 2;
            const bw = Math.max(2, bh(lk.val) / 3);
            const mx = (x1 + x2) / 2;
            return (
              <path key={`link-${lk.from}-${lk.to}`}
                d={`M ${x1} ${y1 - bw/2} C ${mx} ${y1 - bw/2}, ${mx} ${y2 - bw/2}, ${x2} ${y2 - bw/2} L ${x2} ${y2 + bw/2} C ${mx} ${y2 + bw/2}, ${mx} ${y1 + bw/2}, ${x1} ${y1 + bw/2} Z`}
                fill={lk.col} fillOpacity={0.2}
                stroke={lk.col} strokeOpacity={0.5} strokeWidth="0.5"
              />
            );
          })}

          {/* Draw nodes */}
          {nodes.map(n => (
            <g key={n.id}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={n.x} y={n.y} width={n.width} height={n.height}
                rx="5" ry="5"
                fill={`url(#g-${n.id})`}
                stroke={n.color}
                strokeWidth={hovered === n.id ? 2 : 1}
                strokeOpacity={hovered === n.id ? 1 : 0.6}
                opacity={hovered && hovered !== n.id ? 0.4 : 1}
              />
              {/* Highlight bar */}
              <rect
                x={n.x} y={n.y} width={6} height={n.height}
                rx="3" ry="3"
                fill={n.color} opacity="0.8"
              />
              {n.height > 24 && (
                <>
                  <text x={n.x + n.width / 2 + 3} y={n.y + n.height / 2 - 6}
                    textAnchor="middle" fill="white" fontSize="9" fontWeight="700">
                    {n.label}
                  </text>
                  <text x={n.x + n.width / 2 + 3} y={n.y + n.height / 2 + 8}
                    textAnchor="middle" fill="white" fontSize="8" opacity="0.7">
                    {fmt(n.value)}
                  </text>
                </>
              )}
              {n.height <= 24 && (
                <text x={n.x + n.width + 4} y={n.y + n.height / 2 + 4}
                  textAnchor="start" fill={n.color} fontSize="8" fontWeight="600">
                  {n.label} {fmt(n.value)}
                </text>
              )}
            </g>
          ))}

          {/* Crude feed arrow */}
          <g>
            <rect x={X0} y={60} width={70} height={bh(crudeFeedBpd)} rx="5" fill={COLORS.crude} opacity="0.85" />
            <text x={X0+35} y={60 + bh(crudeFeedBpd)/2 - 6} textAnchor="middle" fill="white" fontSize="9" fontWeight="700">CRUDE</text>
            <text x={X0+35} y={60 + bh(crudeFeedBpd)/2 + 8} textAnchor="middle" fill="white" fontSize="8" opacity="0.8">{fmt(crudeFeedBpd)}</text>
          </g>

          {/* Crude → CDU link */}
          <path
            d={`M ${X0+70} ${60 + bh(crudeFeedBpd)/2} L ${X1} ${60 + bh(crudeFeedBpd)/2}`}
            stroke={COLORS.crude} strokeWidth="4" strokeOpacity="0.5" markerEnd="url(#arrow)"
          />

          {/* Product outputs (rightmost) */}
          {[
            { label: 'LPG/Gas', val: LPG_GAS, y: 38, col: COLORS.gas },
            { label: 'Gasoline 90', val: Math.round(ISOM_OUT), y: 105, col: COLORS.isom },
            { label: 'Gasoline 95', val: Math.round(CCR_OUT), y: 145, col: COLORS.ccr },
            { label: 'Jet A-1/ATK', val: KHT_OUT, y: 220, col: COLORS.kero },
            { label: 'Ultra-Low S Diesel', val: DHT_OUT, y: 290, col: COLORS.diesel },
            { label: 'Diesel (VGO-HT)', val: VGOHT_OUT, y: 360, col: COLORS.vgoht },
            { label: 'FCC Products', val: FCC_PRODUCTS, y: 420, col: COLORS.fcc },
            { label: 'Paving Bitumen', val: BITUMEN, y: 490, col: COLORS.bitumen },
          ].map(p => (
            <g key={p.label}>
              <rect x={X5} y={p.y} width={140} height={24} rx="4" fill={p.col} fillOpacity="0.2" stroke={p.col} strokeOpacity="0.5" strokeWidth="1" />
              <rect x={X5} y={p.y} width={4} height={24} rx="2" fill={p.col} />
              <text x={X5 + 12} y={p.y + 10} fill="white" fontSize="8" fontWeight="700">{p.label}</text>
              <text x={X5 + 12} y={p.y + 20} fill={p.col} fontSize="8" opacity="0.9">{fmtBpd(p.val)}</text>
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3">
        {[
          { label: 'Crude/Feed', col: COLORS.crude },
          { label: 'Naphtha Train', col: COLORS.naphtha },
          { label: 'Kero Train', col: COLORS.kero },
          { label: 'Diesel Train', col: COLORS.diesel },
          { label: 'VGO Train', col: COLORS.vgo },
          { label: 'Vacuum Train', col: COLORS.vdu },
          { label: 'FCC Train', col: COLORS.fcc },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: l.col }} />
            <span className={`text-[10px] font-medium ${subClass}`}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
