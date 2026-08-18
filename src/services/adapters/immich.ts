import { ImmichStats } from '../../types';
import { mockImmich } from '../../mocks';

export interface ImmichProvider {
  getStats(): Promise<ImmichStats>;
  triggerBackup(): Promise<{ success: boolean; message: string }>;
}

export class ImmichAdapter implements ImmichProvider {
  private isDemo: boolean = true;

  constructor(demoMode: boolean = true) {
    this.isDemo = demoMode;
  }

  async getStats(): Promise<ImmichStats> {
    if (this.isDemo) {
      return Promise.resolve(mockImmich);
    }
    const res = await fetch('/api/immich/stats');
    return res.json();
  }

  async triggerBackup(): Promise<{ success: boolean; message: string }> {
    return Promise.resolve({ success: true, message: 'Immich database and library sync initiated to B2 storage.' });
  }
}

export const immichService = new ImmichAdapter(true);
