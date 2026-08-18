import { CameraStream, FrigateStats } from '../../types';
import { mockCameras, mockFrigate } from '../../mocks';

export interface FrigateProvider {
  getCameras(): Promise<CameraStream[]>;
  getStats(): Promise<FrigateStats>;
  triggerSnapshot(cameraId: string): Promise<string>;
}

export class FrigateAdapter implements FrigateProvider {
  private isDemo: boolean = true;

  constructor(demoMode: boolean = true) {
    this.isDemo = demoMode;
  }

  async getCameras(): Promise<CameraStream[]> {
    if (this.isDemo) {
      return Promise.resolve(mockCameras);
    }
    const res = await fetch('/api/frigate/cameras');
    return res.json();
  }

  async getStats(): Promise<FrigateStats> {
    if (this.isDemo) {
      return Promise.resolve(mockFrigate);
    }
    const res = await fetch('/api/frigate/stats');
    return res.json();
  }

  async triggerSnapshot(cameraId: string): Promise<string> {
    return Promise.resolve(`Snapshot captured for ${cameraId}`);
  }
}

export const frigateService = new FrigateAdapter(true);
