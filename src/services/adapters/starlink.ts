import { StarlinkTelemetry } from '../../types';
import { mockStarlink } from '../../mocks';

export interface StarlinkProvider {
  getTelemetry(): Promise<StarlinkTelemetry>;
  stowDish(): Promise<{ success: boolean; message: string }>;
  rebootDish(): Promise<{ success: boolean; message: string }>;
}

export class StarlinkAdapter implements StarlinkProvider {
  private isDemo: boolean = true;

  constructor(demoMode: boolean = true) {
    this.isDemo = demoMode;
  }

  async getTelemetry(): Promise<StarlinkTelemetry> {
    if (this.isDemo) {
      return Promise.resolve(mockStarlink);
    }
    const res = await fetch('/api/starlink/status');
    return res.json();
  }

  async stowDish(): Promise<{ success: boolean; message: string }> {
    return Promise.resolve({ success: true, message: 'Dish stow sequence initiated.' });
  }

  async rebootDish(): Promise<{ success: boolean; message: string }> {
    return Promise.resolve({ success: true, message: 'Starlink Dishy reboot scheduled.' });
  }
}

export const starlinkService = new StarlinkAdapter(true);
