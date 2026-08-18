import { UniFiNetwork } from '../../types';
import { mockUniFi } from '../../mocks';

export interface UniFiProvider {
  getNetwork(): Promise<UniFiNetwork>;
  rebootDevice(deviceId: string): Promise<boolean>;
}

export class UniFiAdapter implements UniFiProvider {
  private isDemo: boolean = true;

  constructor(demoMode: boolean = true) {
    this.isDemo = demoMode;
  }

  async getNetwork(): Promise<UniFiNetwork> {
    if (this.isDemo) {
      return Promise.resolve(mockUniFi);
    }
    const res = await fetch('/api/unifi/status');
    return res.json();
  }

  async rebootDevice(deviceId: string): Promise<boolean> {
    console.log(`[UniFi Adapter] Rebooting device ${deviceId}`);
    return Promise.resolve(true);
  }
}

export const unifiService = new UniFiAdapter(true);
