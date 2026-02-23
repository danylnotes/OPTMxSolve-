
import { RefineryUnit, Sensor, UnitStatus, Alert, SensorData, EnergyState, SteamAsset, SteamHeaderData, EconomicState, UtilityMetric, UtilityConsumer, Tank, Generator, CrudeAssay, ProductComponent, Additive } from '../types';
import { MOCK_UNITS_DATA, CRUDE_ASSAYS } from '../constants';

// Helper to generate zeroed sensor history
const generateHistory = (baseValue: number, variance: number, points: number = 20): SensorData[] => {
  const history: SensorData[] = [];
  const now = new Date();
  for (let i = points; i > 0; i--) {
    const time = new Date(now.getTime() - i * 60000); // 1 minute intervals
    history.push({
      timestamp: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: 0 // Force zero history initially
    });
  }
  return history;
};

// --- MOCK TANK DATA (Zeroed) ---
export const TANKS_DATA: Tank[] = [
    // CRUDE
    { id: 'TK-101A', name: 'Basrah Crude A', product: 'Crude Oil', level: 0, maxLevel: 18.0, volume: 0, maxVolume: 108000, temperature: 0, status: 'Static', destUnit: 'CDU-01' },
    { id: 'TK-101B', name: 'Basrah Crude B', product: 'Crude Oil', level: 0, maxLevel: 18.0, volume: 0, maxVolume: 108000, temperature: 0, status: 'Static', destUnit: 'CDU-01' },
    { id: 'TK-101C', name: 'Misrif Crude', product: 'Crude Oil', level: 0, maxLevel: 18.0, volume: 0, maxVolume: 108000, temperature: 0, status: 'Static', destUnit: 'CDU-01' },
    
    // INTERMEDIATES
    { id: 'TK-204A', name: 'Sour Naphtha A', product: 'Sour Naphtha', level: 0, maxLevel: 15, volume: 0, maxVolume: 15000, temperature: 0, status: 'Static', sourceUnit: 'CDU-01', destUnit: 'NHT-02' },
    { id: 'TK-204B', name: 'Sour Naphtha B', product: 'Sour Naphtha', level: 0, maxLevel: 15, volume: 0, maxVolume: 15000, temperature: 0, status: 'Static' },
    { id: 'TK-201A', name: 'Sweet Naphtha', product: 'Naphtha', level: 0, maxLevel: 14, volume: 0, maxVolume: 28000, temperature: 0, status: 'Static', sourceUnit: 'NHT-02' },
    
    // PRODUCTS
    { id: 'TK-301A', name: 'Isomerate A', product: 'Isomerate', level: 0, maxLevel: 12, volume: 0, maxVolume: 11500, temperature: 0, status: 'Static', sourceUnit: 'ISOM-03' },
    { id: 'TK-302A', name: 'Reformate A', product: 'Reformate', level: 0, maxLevel: 15, volume: 0, maxVolume: 16000, temperature: 0, status: 'Static', sourceUnit: 'CCR-04' },
    
    { id: 'TK-305A', name: 'Kerosene A', product: 'Jet A1', level: 0, maxLevel: 16, volume: 0, maxVolume: 12000, temperature: 0, status: 'Static', sourceUnit: 'KHT-05' },
    { id: 'TK-306A', name: 'Diesel A', product: 'ULSD', level: 0, maxLevel: 18, volume: 0, maxVolume: 35000, temperature: 0, status: 'Static', sourceUnit: 'DHT-06' },
    
    { id: 'TK-408A', name: 'Fuel Oil A', product: 'HFO', level: 0, maxLevel: 15, volume: 0, maxVolume: 55000, temperature: 0, status: 'Static', sourceUnit: 'VDU-01' },
];

// --- UTILITY CONSUMERS (Zeroed) ---
export const UTILITY_CONSUMERS_DATA: UtilityConsumer[] = [
    { unit: '01', description: 'CDU/VDU', n2: 0, ia: 0, pa: 0 },
    { unit: '02', description: 'NHT', n2: 0, ia: 0, pa: 0 },
    { unit: '03', description: 'ISO', n2: 0, ia: 0, pa: 0 },
    { unit: '04', description: 'CCR', n2: 0, ia: 0, pa: 0, remarks: 'LPN/APN' },
    { unit: '05', description: 'KHT', n2: 0, ia: 0, pa: 0 },
    { unit: '06', description: 'DHT', n2: 0, ia: 0, pa: 0 },
    { unit: '07', description: 'VGO', n2: 0, ia: 0, pa: 0 },
    { unit: '08', description: 'FCC', n2: 0, ia: 0, pa: 0 },
    { unit: '09', description: 'PNU', n2: 0, ia: 0, pa: 0 },
    { unit: '10', description: 'ABU', n2: 0, ia: 0, pa: 0 },
    { unit: '11', description: 'LPG', n2: 0, ia: 0, pa: 0 },
    { unit: '13-15', description: 'HPU', n2: 0, ia: 0, pa: 0 },
    { unit: '16', description: 'ARU', n2: 0, ia: 0, pa: 0 },
    { unit: '17', description: 'SWS', n2: 0, ia: 0, pa: 0 },
    { unit: '18-20', description: 'SRU', n2: 0, ia: 0, pa: 0 },
    { unit: '35/36', description: 'CCT/SGU', n2: 0, ia: 0, pa: 0 },
    { unit: '51', description: 'WWT', n2: 0, ia: 0, pa: 0 },
    { unit: '52', description: 'TF (Tank Farm)', n2: 0, ia: 0, pa: 0 },
    { unit: '99', description: 'Others', n2: 0, ia: 0, pa: 0 },
];

const setpointOverrides = new Map<string, number>();
const utilityOverrides = new Map<string, any>();

export const updateSensorSetpoint = (sensorId: string, value: number) => {
    setpointOverrides.set(sensorId, value);
};

export const updateUtilityOverride = (key: string, value: any) => {
    utilityOverrides.set(key, value);
};

export const getUtilityOverrides = () => {
    return Object.fromEntries(utilityOverrides);
}

export const simulateGoogleSheetsExport = async (data: Record<string, number>, meta?: { name: string, id: string }) => {
    // In a real app, this would send data to an API
    return Promise.resolve();
};

export const generateExtensiveCrudeLibrary = (): CrudeAssay[] => {
    return [
        {
            id: 'CRUDE-BONGA', name: 'Bonga', api: 30.5, sulfur: 0.25, priceDiffToBrent: 1.0,
            yields: { lpg: 2.5, naphtha: 18.0, kerosene: 14.0, diesel: 32.0, vgo: 24.5, resid: 9.0 }
        },
        {
            id: 'CRUDE-BRASS', name: 'Brass River', api: 36.5, sulfur: 0.12, priceDiffToBrent: 1.8,
            yields: { lpg: 3.5, naphtha: 24.0, kerosene: 16.0, diesel: 34.0, vgo: 18.0, resid: 4.5 }
        },
        {
            id: 'CRUDE-FORC', name: 'Forcados', api: 29.8, sulfur: 0.19, priceDiffToBrent: 0.5,
            yields: { lpg: 2.0, naphtha: 15.0, kerosene: 13.0, diesel: 35.0, vgo: 26.0, resid: 9.0 }
        },
        {
            id: 'CRUDE-ERHA', name: 'Erha', api: 31.8, sulfur: 0.21, priceDiffToBrent: 0.8,
            yields: { lpg: 2.8, naphtha: 19.0, kerosene: 14.5, diesel: 33.0, vgo: 23.0, resid: 7.7 }
        },
        {
            id: 'CRUDE-MISH', name: 'Mishrif', api: 26.1, sulfur: 3.80, priceDiffToBrent: -4.5,
            yields: { lpg: 1.5, naphtha: 13.5, kerosene: 10.0, diesel: 22.0, vgo: 25.0, resid: 28.0 }
        },
        {
            id: 'CRUDE-BAS-M', name: 'Basrah Medium', api: 27.9, sulfur: 3.05, priceDiffToBrent: -3.5,
            yields: { lpg: 1.9, naphtha: 15.0, kerosene: 11.5, diesel: 24.0, vgo: 24.6, resid: 23.0 }
        }
    ];
};

export const getProductComponentsLibrary = (): ProductComponent[] => {
    return [
        { id: 'REF-01', name: 'Reformate (High Sev)', type: 'Gasoline', ron: 102, mon: 90, rvp: 4.0, density: 0.78, sulfur: 1, cost: 95 },
        { id: 'REF-02', name: 'Reformate (Low Sev)', type: 'Gasoline', ron: 96, mon: 85, rvp: 5.5, density: 0.76, sulfur: 1, cost: 88 },
        { id: 'ISO-01', name: 'Light Isomerate', type: 'Gasoline', ron: 83, mon: 81, rvp: 13.0, density: 0.65, sulfur: 0.5, cost: 82 },
        { id: 'ALK-01', name: 'Alkylate', type: 'Gasoline', ron: 96, mon: 94, rvp: 5.0, density: 0.70, sulfur: 2, cost: 110 },
        { id: 'FCC-01', name: 'L. FCC Naphtha', type: 'Gasoline', ron: 92, mon: 80, rvp: 7.0, density: 0.73, sulfur: 30, cost: 85 },
        { id: 'FCC-02', name: 'H. FCC Naphtha', type: 'Gasoline', ron: 88, mon: 78, rvp: 2.0, density: 0.82, sulfur: 150, cost: 80 },
        { id: 'BUT-01', name: 'Butane', type: 'Gasoline', ron: 93, mon: 90, rvp: 52, density: 0.58, sulfur: 5, cost: 60 },
        { id: 'ULSD-01', name: 'Hydrotreated Diesel', type: 'Diesel', cetane: 52, density: 0.835, sulfur: 8, cost: 98 },
        { id: 'SR-DSL', name: 'Straight Run Diesel', type: 'Diesel', cetane: 55, density: 0.845, sulfur: 2500, cost: 85 },
        { id: 'LCO-01', name: 'Light Cycle Oil', type: 'Diesel', cetane: 25, density: 0.920, sulfur: 3500, cost: 75 },
        { id: 'KERO-01', name: 'Kerosene / Jet', type: 'Diesel', cetane: 45, density: 0.800, sulfur: 300, cost: 92 },
    ];
};

export const getAdditivesLibrary = (): Additive[] => {
    return [
        { id: 'MTBE', name: 'MTBE (Oxygenate)', type: 'Octane', impact: 2.5, unit: 'vol%' },
        { id: 'ETOH', name: 'Ethanol', type: 'Octane', impact: 3.0, unit: 'vol%' },
        { id: 'CET-IMP', name: '2-EHN (Cetane Improver)', type: 'Cetane', impact: 4.0, unit: 'ppm' },
    ];
};

export const generateInitialState = (): { units: RefineryUnit[], alerts: Alert[] } => {
  const units: RefineryUnit[] = MOCK_UNITS_DATA.map(baseUnit => {
    let sensors: Sensor[] = [];
    
    // Create zeroed sensors for all units
    const createZeroSensor = (id: string, name: string, type: any, unit: string, min: number, max: number): Sensor => ({
        id, name, type, unit, value: 0, setpoint: 0, history: generateHistory(0, 0), status: UnitStatus.OPERATIONAL, threshold: { min, max }
    });

    switch(baseUnit.id) {
        case 'CDU-01':
            sensors = [
                createZeroSensor('FI-100', 'Crude Feed Rate', 'Flow', 'm³/h', 850, 1000),
                createZeroSensor('TI-101', 'Transfer Line Temp', 'Temperature', '°C', 350, 370),
                createZeroSensor('TI-102', 'Tower T-101 Top Temp', 'Temperature', '°C', 150, 170),
                createZeroSensor('TI-103', 'Bottom Temp', 'Temperature', '°C', 340, 360),
                createZeroSensor('PI-104', 'Top Pressure', 'Pressure', 'bar', 1.2, 1.8),
                createZeroSensor('TI-105', 'Kero D/o Temp', 'Temperature', '°C', 205, 220),
                createZeroSensor('TI-106', 'Diesel D/o Temp', 'Temperature', '°C', 285, 300),
                createZeroSensor('FI-107', 'Reflux Rate', 'Flow', 'm³/h', 260, 290),
                createZeroSensor('FI-108', 'Overflash Rate', 'Flow', 'm³/h', 50, 70),
                createZeroSensor('FI-109', 'Naphtha Product', 'Flow', 'm³/h', 210, 240),
                createZeroSensor('FI-110', 'Kero Product', 'Flow', 'm³/h', 105, 125),
                createZeroSensor('FI-111', 'Diesel Product', 'Flow', 'm³/h', 180, 210),
                createZeroSensor('FI-112', 'Kero PA Flow', 'Flow', 'm³/h', 600, 630),
                createZeroSensor('FI-113', 'Diesel PA Flow', 'Flow', 'm³/h', 720, 760),
            ];
            break;
        case 'VDU-01':
             sensors = [
                createZeroSensor('FI-200', 'VDU Feed Rate', 'Flow', 'm³/h', 450, 500),
                createZeroSensor('TI-201', 'Transfer Line Temp', 'Temperature', '°C', 360, 380),
                createZeroSensor('TI-202', 'Tower T-051 Top Temp', 'Temperature', '°C', 80, 90),
                createZeroSensor('TI-203', 'Bottom Temp', 'Temperature', '°C', 310, 330),
                createZeroSensor('FI-204', 'Reflux Rate', 'Flow', 'm³/h', 140, 160),
                createZeroSensor('TI-205', 'LVGO D/o Temp', 'Temperature', '°C', 140, 155),
                createZeroSensor('TI-206', 'HVGO D/o Temp', 'Temperature', '°C', 255, 275),
                createZeroSensor('FI-207', 'Overflash Rate', 'Flow', 'm³/h', 50, 70),
                createZeroSensor('FI-208', 'LVGO Product', 'Flow', 'm³/h', 45, 60),
                createZeroSensor('FI-209', 'HVGO Product', 'Flow', 'm³/h', 170, 190),
                createZeroSensor('FI-210', 'VR Product', 'Flow', 'm³/h', 240, 265),
                createZeroSensor('PI-211', 'Tower Pressure', 'Pressure', 'bar', -1.0, -0.9),
            ];
            break;
        case 'NHT-02':
             sensors = [
                 createZeroSensor('FI-201-F', 'Sour Naphtha (CDU)', 'Flow', 'm³/h', 125, 275),
                 createZeroSensor('FI-202-F', 'Naphtha (VGO)', 'Flow', 'm³/h', 0, 10),
                 createZeroSensor('FI-203-F', 'Full Range Naphtha (TK-201)', 'Flow', 'm³/h', 0, 100),
                 createZeroSensor('FI-204-TOTAL', 'Feed to Reactor', 'Flow', 'm³/h', 150, 300),
                 createZeroSensor('FI-205-LNA', 'L.Na Inj (TK-202)', 'Flow', 'm³/h', 0, 20),
                 createZeroSensor('FI-206-HNA', 'H.Na Inj (TK-203)', 'Flow', 'm³/h', 0, 30),
                 createZeroSensor('TI-301', 'Inlet R-001', 'Temperature', '°C', 315, 330),
                 createZeroSensor('TI-302', 'Outlet R-001', 'Temperature', '°C', 315, 330),
                 createZeroSensor('PI-303', 'Reactor Pressure', 'Pressure', 'bar', 25, 30),
                 createZeroSensor('DP-304', 'ΔP Reactor', 'Pressure', 'bar', 0.1, 1.0),
                 createZeroSensor('FI-305', 'Recycle Gas Flow', 'Flow', 'Nm³/h', 29000, 30000),
                 createZeroSensor('FI-306', 'H2 Make-Up', 'Flow', 'Nm³/h', 500, 1000),
                 createZeroSensor('TI-307', 'Splitter Top Temp', 'Temperature', '°C', 80, 88),
                 createZeroSensor('TI-308', 'Splitter Bot Temp', 'Temperature', '°C', 162, 168),
                 createZeroSensor('PI-309', 'Splitter Pressure', 'Pressure', 'bar', 1.5, 1.7),
                 createZeroSensor('FI-310', 'Reflux Flow', 'Flow', 'm³/h', 120, 135),
                 createZeroSensor('PI-311', 'HPS Pressure', 'Pressure', 'bar', 41.5, 43),
                 createZeroSensor('FI-401', 'LPG to Unit 11', 'Flow', 'm³/h', 20, 35),
                 createZeroSensor('FI-402', 'Off Gas to Unit 16', 'Flow', 'Nm³/h', 500, 1200),
                 createZeroSensor('FI-403', 'H.Naphtha to CCR', 'Flow', 'm³/h', 100, 150),
                 createZeroSensor('FI-404', 'H.Naphtha to TK', 'Flow', 'm³/h', 0, 50),
                 createZeroSensor('FI-405', 'L.Naphtha to ISOM', 'Flow', 'm³/h', 40, 76),
                 createZeroSensor('FI-406', 'L.Naphtha to TK', 'Flow', 'm³/h', 0, 30),
             ];
             break;
        case 'CCR-04':
             sensors = [
                createZeroSensor('AI-401', 'Reformate RON', 'Analysis', '', 99.0, 102.0),
                createZeroSensor('FI-405', 'Recycle Gas Flow', 'Flow', 'Nm³/h', 40000, 50000),
             ];
             break;
        case 'FCC-08':
             sensors = [
                createZeroSensor('TI-801', 'Riser Outlet Temp', 'Temperature', '°C', 510, 540),
                createZeroSensor('LI-805', 'Regen Cat Level', 'Level', '%', 40, 75),
                createZeroSensor('VI-809', 'Slide Valve Vib', 'Vibration', 'mm/s', 0, 6),
             ];
             break;
        case 'HPU-13':
             sensors = [
                createZeroSensor('TI-1301', 'Reformer Tube Temp', 'Temperature', '°C', 850, 910),
                createZeroSensor('AI-1305', 'H2 Purity', 'Analysis', '%', 99.5, 100),
             ];
             break;
        case 'SRU-15':
             sensors = [
                createZeroSensor('TI-1501', 'Reaction Furnace Temp', 'Temperature', '°C', 1050, 1250),
                createZeroSensor('AI-1502', 'Tail Gas H2S/SO2', 'Analysis', 'Ratio', 1.8, 2.2),
             ];
             break;
        default:
             sensors = [
                createZeroSensor(`TI-${baseUnit.id}1`, 'Reactor Temp', 'Temperature', '°C', 300, 380),
                createZeroSensor(`FI-${baseUnit.id}2`, 'Feed Rate', 'Flow', 'm³/h', 100, 200),
             ];
    }

    return { 
        ...baseUnit, 
        sensors, 
        status: UnitStatus.OPERATIONAL, 
        efficiency: 0, 
        currentLoad: '0 BPSD' // Force zero load
    } as RefineryUnit;
  });

  const alerts: Alert[] = []; // Clear all alerts

  return { units, alerts };
};

export const generateEnergyState = (): EnergyState => {
  // STRICTLY Use Overrides or Default to 0. No random generation.
  const getVal = (key: string) => utilityOverrides.get(key) !== undefined ? Number(utilityOverrides.get(key)) : 0;
  const getMode = (key: string) => utilityOverrides.get(key) || 'Standby';

  const generators: Generator[] = [
      { id: 'GTG-A', name: 'Gas Turbine A', type: 'GTG', load: getVal('EMS_GT_A_LOAD'), capacity: 25.0, status: UnitStatus.OPERATIONAL, mode: getMode('EMS_GT_A_MODE') },
      { id: 'GTG-B', name: 'Gas Turbine B', type: 'GTG', load: getVal('EMS_GT_B_LOAD'), capacity: 25.0, status: UnitStatus.OPERATIONAL, mode: getMode('EMS_GT_B_MODE') },
      { id: 'GTG-C', name: 'Gas Turbine C', type: 'GTG', load: getVal('EMS_GT_C_LOAD'), capacity: 25.0, status: UnitStatus.OPERATIONAL, mode: getMode('EMS_GT_C_MODE') },
      { id: 'GTG-D', name: 'Gas Turbine D', type: 'GTG', load: getVal('EMS_GT_D_LOAD'), capacity: 25.0, status: UnitStatus.OPERATIONAL, mode: getMode('EMS_GT_D_MODE') },
      { id: 'STG-A', name: 'Steam Turbine A', type: 'STG', load: getVal('EMS_STG_A_LOAD'), capacity: 15.0, status: UnitStatus.OPERATIONAL, mode: getMode('EMS_STG_A_MODE') },
      { id: 'STG-B', name: 'Steam Turbine B', type: 'STG', load: getVal('EMS_STG_B_LOAD'), capacity: 15.0, status: UnitStatus.OPERATIONAL, mode: getMode('EMS_STG_B_MODE') },
      { id: 'STG-C', name: 'Steam Turbine C', type: 'STG', load: getVal('EMS_STG_C_LOAD'), capacity: 15.0, status: UnitStatus.OPERATIONAL, mode: getMode('EMS_STG_C_MODE') },
      { id: 'STG-D', name: 'Steam Turbine D', type: 'STG', load: getVal('EMS_STG_D_LOAD'), capacity: 15.0, status: UnitStatus.OPERATIONAL, mode: getMode('EMS_STG_D_MODE') },
  ];

  const totalGen = generators.reduce((acc, g) => acc + g.load, 0);

  return {
    kpis: {
      totalGeneration: totalGen, 
      boilerEfficiency: 0,
      co2Emissions: 0, 
      powerGeneration: totalGen,
      powerDemand: 0, // In a real app this would be sum of loads
      systemStrength: 0 
    },
    generators,
    compressors: [
      { id: 'NGC-A', name: 'NG Comp A', status: getMode('EMS_NGC_A_STAT'), load: 0, suctionDP: 0 },
      { id: 'NGC-B', name: 'NG Comp B', status: 'Standby', load: getVal('EMS_NGC_B_LOAD'), suctionDP: getVal('EMS_NGC_B_DP') }
    ],
    headers: [
      { id: 'HPS', name: 'High Pressure Steam', pressure: 0, temperature: 0, totalFlow: 0, designFlow: 350 },
      { id: 'MPS', name: 'Medium Pressure Steam', pressure: 0, temperature: 0, totalFlow: 0, designFlow: 220 },
      { id: 'LPS', name: 'Low Pressure Steam', pressure: 0, temperature: 0, totalFlow: 0, designFlow: 200 },
    ],
    assets: [
      { id: 'HRSG-A', name: 'HRSG A', type: 'Producer', hps: getVal('EMS_HRSG_A_FLOW'), mps: 0, lps: 0, status: UnitStatus.OPERATIONAL },
      { id: 'HRSG-B', name: 'HRSG B', type: 'Producer', hps: getVal('EMS_HRSG_B_FLOW'), mps: 0, lps: 0, status: UnitStatus.OPERATIONAL },
      { id: 'HRSG-C', name: 'HRSG C', type: 'Producer', hps: getVal('EMS_HRSG_C_FLOW'), mps: 0, lps: 0, status: UnitStatus.OPERATIONAL },
      { id: '38-SGU', name: 'Steam Gen Unit', type: 'Producer', hps: getVal('EMS_SGU_FLOW'), mps: 0, lps: 0, status: UnitStatus.OPERATIONAL },
      { id: 'BLR-A', name: 'Boiler A', type: 'Producer', hps: getVal('EMS_BLR_A_LOAD'), mps: 0, lps: 0, status: UnitStatus.OPERATIONAL },
      { id: 'BLR-B', name: 'Boiler B', type: 'Producer', hps: getVal('EMS_BLR_B_LOAD'), mps: 0, lps: 0, status: UnitStatus.OPERATIONAL },
      { id: 'BLR-C', name: 'Boiler C', type: 'Producer', hps: getVal('EMS_BLR_C_LOAD'), mps: 0, lps: 0, status: UnitStatus.OPERATIONAL },
      
      { id: '37-STG', name: 'Steam Turbine Gen', type: 'Generator', hps: 0, mps: 0, lps: 0, status: UnitStatus.OPERATIONAL },
      { id: '01-CDU', name: 'CDU-01', type: 'Consumer', hps: 0, mps: 0, lps: 0, status: UnitStatus.OPERATIONAL }, 
      { id: '08-FCC', name: 'FCC-08', type: 'Consumer', hps: 0, mps: 0, lps: 0, status: UnitStatus.OPERATIONAL },
      { id: '04-CCR', name: 'CCR-04', type: 'Consumer', hps: 0, mps: 0, lps: 0, status: UnitStatus.OPERATIONAL },
      { id: '02-NHT', name: 'NHT-02', type: 'Consumer', hps: 0, mps: 0, lps: 0, status: UnitStatus.OPERATIONAL },
      { id: '07-VGO', name: 'VGO-07', type: 'Consumer', hps: 0, mps: 0, lps: 0, status: UnitStatus.OPERATIONAL },
      { id: '20-SRU', name: 'SRU-20', type: 'Consumer', hps: 0, mps: 0, lps: 0, status: UnitStatus.OPERATIONAL },
    ]
  };
};

export const generateUtilityData = (): UtilityMetric[] => {
    const createTrend = (base: number) => Array.from({length: 24}, (_, i) => ({
        time: `${i}:00`,
        prod: 0,
        cons: 0
    }));
    
    // Check Overrides - Default to 0
    const getVal = (key: string) => utilityOverrides.get(key) !== undefined ? Number(utilityOverrides.get(key)) : 0;
    const getStr = (key: string) => utilityOverrides.get(key) || '0';

    return [
        {
            id: 'N2-MAIN', name: 'Nitrogen System (Main)', type: 'Nitrogen', unit: 'Nm³/h',
            productionRate: getVal('UTIL_N2_PROD'),
            consumptionRate: 0, dailyProduction: 0, dailyConsumption: 0,
            pressure: getVal('UTIL_N2_PRESS'),
            temperature: 0,
            status: UnitStatus.OPERATIONAL, history: createTrend(0)
        },
        {
            id: 'INST-AIR', name: 'Instrument Air (41-V-002)', type: 'Air', unit: 'Nm³/h',
            productionRate: getVal('UTIL_IA_PROD'),
            consumptionRate: 0, dailyProduction: 0, dailyConsumption: 0,
            pressure: getVal('UTIL_IA_PRESS'),
            temperature: 0,
            status: UnitStatus.OPERATIONAL, history: createTrend(0),
            details: [
                 { label: 'Plant Air Pressure', value: getVal('UTIL_PA_PRESS'), unit: 'kg/cm²' }
            ]
        },
        {
            id: 'U44-RFU', name: 'Refinery Fuel Unit (U44)', type: 'Gas', unit: 'Nm³/h',
            productionRate: getVal('U44_FG_DIST'), 
            consumptionRate: getVal('U44_NG_FLOW') + getVal('U44_OFF_GAS'), 
            dailyProduction: 0, dailyConsumption: 0,
            pressure: getVal('U44_FUG_PRESS'),
            status: UnitStatus.OPERATIONAL, 
            history: createTrend(0),
            details: [
                { label: 'FUG Density', value: getVal('U44_FUG_DENS'), unit: 'kg/m³' },
                { label: 'Wobbe Index', value: getVal('U44_WOBBE'), unit: 'kcal/Nm³' },
                { label: 'NG Feed Flow', value: getVal('U44_NG_FLOW'), unit: 'Nm³/h' },
                { label: 'Off Gas Flow', value: getVal('U44_OFF_GAS'), unit: 'Nm³/h' },
                { label: 'LPG Liquid Flow', value: getVal('U44_LPG_LIQ'), unit: 'm³/h' },
                { label: 'LPG Gas Flow', value: getStr('U44_LPG_GAS'), unit: 'Nm³/h' }
            ]
        },
        {
            id: 'U33-CWS', name: 'Cooling Water System (U33)', type: 'Water', unit: 'm³/h',
            productionRate: getVal('U33_CWS_FLOW'),
            consumptionRate: getVal('U33_CWR_FLOW'),
            dailyProduction: 0, dailyConsumption: 0,
            pressure: getVal('U33_CWS_PRESS'), 
            temperature: getVal('U33_CWS_TEMP'),
            status: UnitStatus.OPERATIONAL,
            history: createTrend(0),
            details: [
                { label: 'CWR Press/Temp', value: `${getVal('U33_CWR_PRESS')} kg / ${getVal('U33_CWR_TEMP')}°C`, unit: '' },
                { label: 'Pumps Running', value: '-', unit: '' },
                { label: 'Basin Level (1)', value: `${getVal('U33_LT1')}`, unit: '%' },
                { label: 'Analyzers', value: `pH ${getVal('U33_PH')} / Cond ${getVal('U33_COND')}`, unit: '', highlight: true },
                { label: 'Free Chlorine', value: getVal('U33_FCL'), unit: 'ppm' },
                { label: 'Turbidity', value: getVal('U33_TURB'), unit: 'NTU' },
                { label: 'TOC', value: getVal('U33_TOC'), unit: 'ppm' },
                { label: 'TSS', value: getVal('U33_TSS'), unit: 'ppm' }
            ]
        }
    ];
};

export const updateReadings = (currentUnits: RefineryUnit[]): { units: RefineryUnit[], newAlerts: Alert[] } => {
    const newAlerts: Alert[] = [];
    
    const units = currentUnits.map(unit => {
        let unitStatus = UnitStatus.OPERATIONAL;
        
        const sensors = unit.sensors.map(sensor => {
             const sp = setpointOverrides.has(sensor.id) ? setpointOverrides.get(sensor.id)! : sensor.setpoint;
             
             let newValue = sensor.value; // Keep current value by default (which starts at 0)
             
             // Check override from Ops Data Entry
             if (utilityOverrides.has(sensor.id)) {
                 const overrideVal = Number(utilityOverrides.get(sensor.id));
                 if (!isNaN(overrideVal)) {
                     newValue = overrideVal;
                 }
             }
             
             // Update History
             const newHistory = [...sensor.history.slice(1), {
                 timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                 value: newValue
             }];
             
             // Check Status (Only if non-zero)
             let status: UnitStatus = UnitStatus.OPERATIONAL;
             if (newValue > 0) {
                 if (newValue < sensor.threshold.min * 0.9 || newValue > sensor.threshold.max * 1.1) {
                     status = UnitStatus.CRITICAL;
                 } else if (newValue < sensor.threshold.min || newValue > sensor.threshold.max) {
                     status = UnitStatus.WARNING;
                 }
             }

             return { ...sensor, value: newValue, setpoint: sp, history: newHistory, status };
        });

        if (sensors.some(s => s.status === UnitStatus.CRITICAL)) unitStatus = UnitStatus.CRITICAL;
        else if (sensors.some(s => s.status === UnitStatus.WARNING)) unitStatus = UnitStatus.WARNING;
        
        return { ...unit, sensors, status: unitStatus, efficiency: 0 };
    });

    return { units, newAlerts };
};

export const generateEconomicData = (): EconomicState => {
    // Generate Zeroed history
    const history = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        history.push({
            timestamp: d.toLocaleDateString(),
            grm: 0,
            netMargin: 0
        });
    }

    return {
        marketData: [
            { name: 'Brent Crude', price: 0, unit: '$/bbl', trend: 'stable', change: 0 },
            { name: 'Natural Gas', price: 0, unit: '$/MMBtu', trend: 'stable', change: 0 },
            { name: 'Diesel', price: 0, unit: '$/bbl', trend: 'stable', change: 0 },
            { name: 'Naphtha', price: 0, unit: '$/bbl', trend: 'stable', change: 0 },
            { name: 'Electricity', price: 0, unit: '$/MWh', trend: 'stable', change: 0 }
        ],
        kpis: {
            grossRefineryMargin: 0,
            netMargin: 0,
            dailyRevenue: 0,
            dailyOpEx: 0,
            feedstockCost: 0
        },
        breakdown: [
            { category: 'Crude Oil', value: 0 },
            { category: 'Energy', value: 0 },
            { category: 'Chemicals', value: 0 },
            { category: 'Maintenance', value: 0 },
            { category: 'Labor', value: 0 }
        ],
        history
    };
};
