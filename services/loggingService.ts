
import { ParameterLog } from '../types';

// In-Memory Database Simulation
// In a production environment, this would be a PostgreSQL or TimescaleDB connection.
let LOG_REPOSITORY: ParameterLog[] = [];

// Initialize with some historical mock data so the export feature isn't empty on load
const generateMockLogs = () => {
    const now = new Date();
    const mockData = [];
    const keys = ['TI-101', 'PI-104', 'FI-100', 'EMS_GT_A_LOAD', 'U44_FUG_PRESS'];
    
    // Generate 500 records over the last 30 days
    for (let i = 0; i < 500; i++) {
        const time = new Date(now.getTime() - (i * 90 * 60000)); // Every ~1.5 hours
        const entry: Record<string, number | string> = {};
        
        // Randomize some data
        keys.forEach(k => {
            if (k.includes('TI')) entry[k] = (350 + Math.random() * 20).toFixed(1);
            else if (k.includes('PI')) entry[k] = (1.5 + Math.random() * 0.3).toFixed(2);
            else if (k.includes('FI')) entry[k] = (850 + Math.random() * 100).toFixed(0);
            else if (k.includes('EMS')) entry[k] = (22 + Math.random() * 3).toFixed(1);
            else entry[k] = (4.2 + Math.random()).toFixed(2);
        });

        mockData.push({
            id: crypto.randomUUID(),
            timestamp: time.toISOString(),
            user: i % 10 === 0 ? 'SYSTEM_AUTO' : 'DCR001', // Simulate mostly manual, some auto
            data: entry
        });
    }
    LOG_REPOSITORY = mockData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// Run mock generation once
generateMockLogs();

export const loggingService = {
    /**
     * Archive a new log entry
     * @param data Key-Value pairs of parameters
     * @param userId ID of the operator
     */
    logData: async (data: Record<string, number | string>, userId: string): Promise<void> => {
        const newLog: ParameterLog = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            user: userId,
            data: data
        };
        // Prepend to top
        LOG_REPOSITORY.unshift(newLog);
        
        // Persist to local storage to survive refresh (optional enhancement)
        // localStorage.setItem('refopx_logs', JSON.stringify(LOG_REPOSITORY.slice(0, 1000)));
        
        console.log(`[Backend Library] Archived Log ${newLog.id} for ${userId}`);
        return Promise.resolve();
    },

    /**
     * Retrieve logs based on filters
     */
    getLogs: async (
        startDate?: Date, 
        endDate?: Date, 
        limit: number = 5000
    ): Promise<ParameterLog[]> => {
        let filtered = LOG_REPOSITORY;

        if (startDate) {
            filtered = filtered.filter(l => new Date(l.timestamp) >= startDate);
        }
        if (endDate) {
            // Set end date to end of day
            const eod = new Date(endDate);
            eod.setHours(23, 59, 59, 999);
            filtered = filtered.filter(l => new Date(l.timestamp) <= eod);
        }

        return Promise.resolve(filtered.slice(0, limit));
    },

    /**
     * Get all unique keys used in the logs for the filter UI
     */
    getAvailableParameters: async (): Promise<string[]> => {
        const keys = new Set<string>();
        // Scan last 100 logs to build key list to avoid performance hit on full scan
        const sample = LOG_REPOSITORY.slice(0, 100);
        sample.forEach(log => {
            Object.keys(log.data).forEach(k => keys.add(k));
        });
        return Promise.resolve(Array.from(keys).sort());
    },

    /**
     * Total count for stats
     */
    getCount: () => LOG_REPOSITORY.length
};
