
import { Alert, EconomicState } from '../types';

const KEYS = {
  alerts: 'refopx_alerts',
  econHistory: 'refopx_econ_history',
  apiKey: 'refopx_anthropic_key',
};

export const storageService = {
  saveAlerts(alerts: Alert[]): void {
    try {
      const capped = alerts.slice(0, 100);
      localStorage.setItem(KEYS.alerts, JSON.stringify(capped));
    } catch {
    }
  },

  loadAlerts(): Alert[] {
    try {
      const raw = localStorage.getItem(KEYS.alerts);
      if (!raw) return [];
      return JSON.parse(raw) as Alert[];
    } catch {
      return [];
    }
  },

  saveEconomicHistory(history: EconomicState['history']): void {
    try {
      localStorage.setItem(KEYS.econHistory, JSON.stringify(history));
    } catch {
    }
  },

  loadEconomicHistory(): EconomicState['history'] {
    try {
      const raw = localStorage.getItem(KEYS.econHistory);
      if (!raw) return [];
      return JSON.parse(raw) as EconomicState['history'];
    } catch {
      return [];
    }
  },

  saveApiKey(key: string): void {
    try {
      localStorage.setItem(KEYS.apiKey, key);
    } catch {
    }
  },

  loadApiKey(): string {
    try {
      return localStorage.getItem(KEYS.apiKey) ?? '';
    } catch {
      return '';
    }
  },

  clearAll(): void {
    try {
      Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    } catch {
    }
  },
};
