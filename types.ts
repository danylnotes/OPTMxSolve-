
export enum UnitStatus {
  OPERATIONAL = 'Operational',
  WARNING = 'Warning',
  CRITICAL = 'Critical',
  MAINTENANCE = 'Maintenance'
}

export interface SensorData {
  timestamp: string;
  value: number;
}

export interface Sensor {
  id: string;
  name: string;
  type: 'Temperature' | 'Pressure' | 'Flow' | 'Vibration' | 'Level' | 'Analysis';
  unit: string; // e.g., °C, PSI, m³/h
  value: number;
  setpoint: number; // The target value (SP)
  history: SensorData[];
  status: UnitStatus;
  threshold: {
    min: number;
    max: number;
  };
}

export interface RefineryUnit {
  id: string;
  name: string;
  description: string;
  status: UnitStatus;
  efficiency: number; // Percentage
  lastMaintenance: string;
  sensors: Sensor[];
  capacity: string;
  currentLoad: string; // Real-time feed or load description
  licensor: 'Technip' | 'UOP' | 'Axens' | 'Poerner' | 'Haldor Topsoe' | 'KTI' | 'Other';
}

export interface Tank {
  id: string;
  name: string;
  product: string;
  level: number; // meters or %
  maxLevel: number;
  volume: number; // m3
  maxVolume: number;
  temperature: number;
  status: 'Filling' | 'Emptying' | 'Static' | 'Maintenance';
  sourceUnit?: string; // ID of unit feeding this tank
  destUnit?: string; // ID of unit drawing from this tank
}

export interface Alert {
  id: string;
  unitId: string;
  sensorId: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  analyzed: boolean; // If Gemini has analyzed it
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
}

// Energy Module Types
export interface SteamHeaderData {
  id: 'HPS' | 'MPS' | 'LPS';
  name: string;
  pressure: number; // bar
  temperature: number; // C
  totalFlow: number; // T/h
  designFlow: number;
}

export interface SteamAsset {
  id: string;
  name: string;
  type: 'Producer' | 'Consumer' | 'Generator';
  hps: number; // Positive = Production, Negative = Consumption
  mps: number;
  lps: number;
  status: UnitStatus;
  description?: string;
}

export interface Generator {
  id: string;
  name: string;
  type: 'GTG' | 'STG';
  load: number; // MW
  capacity: number; // MW
  status: UnitStatus;
  mode?: string;
}

export interface Compressor {
    id: string;
    name: string;
    status: string;
    load?: number;
    suctionDP?: number;
}

export interface EnergyState {
  headers: SteamHeaderData[];
  assets: SteamAsset[];
  generators: Generator[];
  compressors?: Compressor[];
  kpis: {
    totalGeneration: number;
    boilerEfficiency: number;
    co2Emissions: number;
    powerGeneration: number; // MW
    powerDemand: number; // MW
    systemStrength: number; // Reserve Capacity %
  };
}

// Utility Module Types
export interface UtilityDetail {
    label: string;
    value: string | number;
    unit?: string;
    highlight?: boolean;
}

export interface UtilityMetric {
  id: string;
  name: string;
  type: 'Nitrogen' | 'Air' | 'Gas' | 'Fuel' | 'Water';
  unit: string;
  productionRate: number; // Current flow
  consumptionRate: number; // Current flow
  dailyProduction: number; // Total for 24h
  dailyConsumption: number; // Total for 24h
  pressure?: number; // Real-time pressure
  temperature?: number; // Real-time temp
  status: UnitStatus;
  history: {
    time: string;
    prod: number;
    cons: number;
  }[];
  details?: UtilityDetail[];
}

export interface UtilityConsumer {
    unit: string;
    description: string;
    n2: number; // Nitrogen
    ia: number; // Inst Air
    pa: number; // Plant Air
    remarks?: string;
}

// Economic Analysis Types
export interface MarketPrice {
  name: string;
  price: number; // $ per unit
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number; // percentage
}

export interface CrudeAssay {
  id: string;
  name: string;
  api: number;
  sulfur: number; // wt%
  priceDiffToBrent: number; // $ discount/premium
  yields: {
    lpg: number;
    naphtha: number;
    kerosene: number;
    diesel: number;
    vgo: number;
    resid: number;
  }
}

// Product Blending Types
export interface ProductComponent {
    id: string;
    name: string;
    type: 'Gasoline' | 'Diesel';
    ron?: number; // Research Octane Number (Gasoline)
    mon?: number; // Motor Octane Number (Gasoline)
    rvp?: number; // Reid Vapor Pressure psi (Gasoline)
    cetane?: number; // Cetane Index (Diesel)
    density: number; // SG
    sulfur: number; // ppm
    cost: number; // $/bbl
}

export interface Additive {
    id: string;
    name: string;
    type: 'Octane' | 'Cetane' | 'Stability' | 'Flow';
    impact: number; // Boost per unit
    unit: 'ppm' | 'vol%';
}

export interface EconomicState {
  marketData: MarketPrice[];
  kpis: {
    grossRefineryMargin: number; // $/bbl
    netMargin: number; // $/bbl
    dailyRevenue: number; // $
    dailyOpEx: number; // $
    feedstockCost: number; // $
  };
  breakdown: {
    category: string;
    value: number; // $
  }[];
  history: {
    timestamp: string;
    grm: number;
    netMargin: number;
  }[];
}

// --- DATA LOGGING TYPES ---
export interface ParameterLog {
    id: string;
    timestamp: string; // ISO 8601
    user: string;
    // Flexible Key-Value Pair System
    data: Record<string, number | string>;
}

// Settings / Import Types
export interface SettingsProps {
  units: RefineryUnit[];
  onImportData: (data: Record<string, number>) => void;
  onThemeChange?: (theme: string) => void;
}
