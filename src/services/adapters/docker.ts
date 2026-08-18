import { DockerContainer, HomelabService } from '../../types';
import { mockDockerContainers, mockServices } from '../../mocks';

export interface DockerProvider {
  getContainers(): Promise<DockerContainer[]>;
  getServices(): Promise<HomelabService[]>;
  restartContainer(id: string): Promise<{ success: boolean; message: string }>;
  stopContainer(id: string): Promise<{ success: boolean; message: string }>;
}

export class DockerAdapter implements DockerProvider {
  private isDemo: boolean = true;

  constructor(demoMode: boolean = true) {
    this.isDemo = demoMode;
  }

  async getContainers(): Promise<DockerContainer[]> {
    if (this.isDemo) {
      return Promise.resolve(mockDockerContainers);
    }
    const res = await fetch('/api/docker/containers');
    return res.json();
  }

  async getServices(): Promise<HomelabService[]> {
    if (this.isDemo) {
      return Promise.resolve(mockServices);
    }
    const res = await fetch('/api/docker/services');
    return res.json();
  }

  async restartContainer(id: string): Promise<{ success: boolean; message: string }> {
    return Promise.resolve({ success: true, message: `Container ${id} restarted successfully.` });
  }

  async stopContainer(id: string): Promise<{ success: boolean; message: string }> {
    return Promise.resolve({ success: true, message: `Container ${id} stopped.` });
  }
}

export const dockerService = new DockerAdapter(true);
