import { SmartHomeSummary, RoomData, SmartDevice } from '../../types';
import { mockSmartHomeSummary, mockRooms } from '../../mocks';

export interface HomeAssistantProvider {
  getSummary(): Promise<SmartHomeSummary>;
  getRooms(): Promise<RoomData[]>;
  toggleLight(entityId: string): Promise<boolean>;
  setClimateTemperature(entityId: string, temp: number): Promise<boolean>;
  toggleLock(entityId: string): Promise<boolean>;
  callService(domain: string, service: string, data?: Record<string, unknown>): Promise<boolean>;
}

export class HomeAssistantAdapter implements HomeAssistantProvider {
  private isDemo: boolean = true;

  constructor(demoMode: boolean = true) {
    this.isDemo = demoMode;
  }

  async getSummary(): Promise<SmartHomeSummary> {
    if (this.isDemo) {
      return Promise.resolve(mockSmartHomeSummary);
    }
    const res = await fetch('/api/ha/summary');
    return res.json();
  }

  async getRooms(): Promise<RoomData[]> {
    if (this.isDemo) {
      return Promise.resolve(mockRooms);
    }
    const res = await fetch('/api/ha/rooms');
    return res.json();
  }

  async toggleLight(entityId: string): Promise<boolean> {
    console.log(`[HA Adapter] Toggling light: ${entityId}`);
    return Promise.resolve(true);
  }

  async setClimateTemperature(entityId: string, temp: number): Promise<boolean> {
    console.log(`[HA Adapter] Set climate ${entityId} to ${temp}°C`);
    return Promise.resolve(true);
  }

  async toggleLock(entityId: string): Promise<boolean> {
    console.log(`[HA Adapter] Toggle lock: ${entityId}`);
    return Promise.resolve(true);
  }

  async callService(domain: string, service: string, data?: Record<string, unknown>): Promise<boolean> {
    console.log(`[HA Adapter] Call service ${domain}.${service}`, data);
    return Promise.resolve(true);
  }
}

export const homeAssistantService = new HomeAssistantAdapter(true);
