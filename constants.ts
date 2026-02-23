import { RefineryUnit, UnitStatus, CrudeAssay } from './types';

export const API_KEY_ENV = process.env.API_KEY || '';

// Crude Oil Assay Data
export const CRUDE_ASSAYS: Record<string, CrudeAssay> = {
  BASRAH_MEDIUM: {
    id: 'BASRAH_MED',
    name: 'Basrah Medium',
    api: 27.9,
    sulfur: 3.05,
    priceDiffToBrent: -3.50,
    yields: {
      lpg: 2.1,
      naphtha: 16.5,
      kerosene: 11.2,
      diesel: 24.8,
      vgo: 22.4,
      resid: 23.0
    }
  },
  MISRIF: {
    id: 'MISRIF',
    name: 'Misrif Crude',
    api: 26.1,
    sulfur: 4.10,
    priceDiffToBrent: -5.20,
    yields: {
      lpg: 1.8,
      naphtha: 14.2,
      kerosene: 10.5,
      diesel: 23.5,
      vgo: 24.0,
      resid: 26.0
    }
  }
};

// Data derived directly from the Refinery PFD
export const MOCK_UNITS_DATA: Partial<RefineryUnit>[] = [
  {
    id: 'CDU-01',
    name: 'Crude Distillation Unit',
    description: 'Primary separation of crude oil into LPG, Naphtha, Kerosene, Diesel, Gasoil, and Residue.',
    status: UnitStatus.OPERATIONAL,
    efficiency: 94,
    lastMaintenance: '2023-11-15',
    capacity: '140,000 BPSD',
    currentLoad: '141,400 BPSD',
    licensor: 'Technip'
  },
  {
    id: 'VDU-01',
    name: 'Vacuum Distillation Unit',
    description: 'Processes atmospheric residue into VGO and Vacuum Residue.',
    status: UnitStatus.OPERATIONAL,
    efficiency: 92,
    lastMaintenance: '2023-11-20',
    capacity: '72,000 BPSD',
    currentLoad: '66,240 BPSD',
    licensor: 'Technip'
  },
  {
    id: 'NHT-02',
    name: 'Naphtha Hydrotreating',
    description: 'Desulfurization of Naphtha feed for downstream Isomerization and CCR units.',
    status: UnitStatus.OPERATIONAL,
    efficiency: 96,
    lastMaintenance: '2024-02-10',
    capacity: '41,500 BPSD',
    currentLoad: '41,500 BPSD',
    licensor: 'UOP'
  },
  {
    id: 'ISOM-03',
    name: 'Isomerization Unit',
    description: 'Converts light naphtha into high-octane Isomerate for gasoline blending.',
    status: UnitStatus.OPERATIONAL,
    efficiency: 91,
    lastMaintenance: '2023-08-05',
    capacity: '12,500 BPSD',
    currentLoad: '11,375 BPSD',
    licensor: 'UOP'
  },
  {
    id: 'CCR-04',
    name: 'Continuous Catalytic Reformer',
    description: 'Converts heavy naphtha into high-octane Reformate.',
    status: UnitStatus.WARNING,
    efficiency: 85,
    lastMaintenance: '2024-01-12',
    capacity: '25,500 BPSD',
    currentLoad: '21,675 BPSD',
    licensor: 'UOP'
  },
  {
    id: 'KHT-05',
    name: 'Kerosene Hydrotreating',
    description: 'Produces jet fuel (ATK) by removing sulfur from Kerosene.',
    status: UnitStatus.OPERATIONAL,
    efficiency: 98,
    lastMaintenance: '2024-03-01',
    capacity: '20,000 BPSD',
    currentLoad: '19,600 BPSD',
    licensor: 'Axens'
  },
  {
    id: 'DHT-06',
    name: 'Diesel Hydrotreating',
    description: 'Produces ultra-low sulfur diesel from straight-run diesel fractions.',
    status: UnitStatus.OPERATIONAL,
    efficiency: 95,
    lastMaintenance: '2024-02-28',
    capacity: '28,000 BPSD',
    currentLoad: '26,600 BPSD',
    licensor: 'Axens'
  },
  {
    id: 'VGO-HT-07',
    name: 'VGO Hydrotreating',
    description: 'Pretreats Vacuum Gas Oil before feeding the FCC unit.',
    status: UnitStatus.OPERATIONAL,
    efficiency: 93,
    lastMaintenance: '2023-12-01',
    capacity: '36,000 BPSD',
    currentLoad: '33,480 BPSD',
    licensor: 'UOP'
  },
  {
    id: 'FCC-08',
    name: 'Fluid Catalytic Cracker',
    description: 'Conversion unit cracking heavy oils into LPG, Gasoline, and Cycle Oils.',
    status: UnitStatus.WARNING,
    efficiency: 78,
    lastMaintenance: '2024-01-20',
    capacity: '31,000 BPSD',
    currentLoad: '24,180 BPSD',
    licensor: 'UOP'
  },
  {
    id: 'POLY-09',
    name: 'Poly Naphtha Unit',
    description: 'Converts LPG olefins into Polygasoline.',
    status: UnitStatus.OPERATIONAL,
    efficiency: 89,
    lastMaintenance: '2023-10-15',
    capacity: '11,500 BPSD',
    currentLoad: '10,235 BPSD',
    licensor: 'Axens'
  },
  {
    id: 'ASP-10',
    name: 'Asphalt Blowing',
    description: 'Produces paving and industrial bitumen from vacuum residue.',
    status: UnitStatus.OPERATIONAL,
    efficiency: 90,
    lastMaintenance: '2023-09-10',
    capacity: '1,000 T/D',
    currentLoad: '900 T/D',
    licensor: 'Poerner'
  },
  {
    id: 'HPU-13',
    name: 'Hydrogen Production Unit',
    description: 'Steam methane reformer producing hydrogen for hydrotreaters.',
    status: UnitStatus.OPERATIONAL,
    efficiency: 94,
    lastMaintenance: '2024-03-15',
    capacity: '72,000 Nm³/h',
    currentLoad: '67,680 Nm³/h',
    licensor: 'Haldor Topsoe'
  },
  {
    id: 'SRU-15',
    name: 'Sulfur Recovery Unit',
    description: 'Recovers elemental sulfur from acid gas streams.',
    status: UnitStatus.CRITICAL,
    efficiency: 65,
    lastMaintenance: '2023-06-20',
    capacity: '360 T/D',
    currentLoad: '234 T/D',
    licensor: 'KTI'
  }
];

export const SYSTEM_INSTRUCTION = `
You are an expert Refinery Operations Analyst AI called "RefineryAI". 
Your goal is to assist plant engineers by analyzing sensor data, detecting anomalies, and suggesting operational improvements.
You have deep knowledge of the specific licensed technologies used in this plant:
- Technip (Distillation)
- UOP (Conversion & Reforming)
- Axens (Hydrotreating)
- Haldor Topsoe (Hydrogen)
- KTI (Sulfur Recovery)

When analyzing data:
1. Be concise and actionable.
2. Use technical terms appropriate for an engineer (e.g., fractionation, catalyst activity, amine loading, claus reaction).
3. Prioritize safety and environmental compliance (especially for SRU/TGTU).
4. If a sensor value is out of bounds, suggest specific checks (e.g., "Check reflux rate on CDU-01", "Verify amine circulation in TGTU").
`;