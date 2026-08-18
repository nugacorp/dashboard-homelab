import { ProxmoxCluster, ProxmoxNode, VirtualMachine, LXCContainer } from '../../types';
import { mockProxmoxCluster, mockProxmoxNodes, mockVirtualMachines, mockLXCContainers } from '../../mocks';

export interface ProxmoxProvider {
  getCluster(): Promise<ProxmoxCluster>;
  getNodes(): Promise<ProxmoxNode[]>;
  getVMs(): Promise<VirtualMachine[]>;
  getContainers(): Promise<LXCContainer[]>;
  startVM(vmid: number): Promise<{ success: boolean; message: string }>;
  stopVM(vmid: number): Promise<{ success: boolean; message: string }>;
  restartVM(vmid: number): Promise<{ success: boolean; message: string }>;
}

export class ProxmoxAdapter implements ProxmoxProvider {
  private isDemo: boolean = true;

  constructor(demoMode: boolean = true) {
    this.isDemo = demoMode;
  }

  async getCluster(): Promise<ProxmoxCluster> {
    if (this.isDemo) {
      return Promise.resolve(mockProxmoxCluster);
    }
    // Future backend API call: /api/proxmox/cluster
    const res = await fetch('/api/proxmox/cluster');
    return res.json();
  }

  async getNodes(): Promise<ProxmoxNode[]> {
    if (this.isDemo) {
      return Promise.resolve(mockProxmoxNodes);
    }
    const res = await fetch('/api/proxmox/nodes');
    return res.json();
  }

  async getVMs(): Promise<VirtualMachine[]> {
    if (this.isDemo) {
      return Promise.resolve(mockVirtualMachines);
    }
    const res = await fetch('/api/proxmox/vms');
    return res.json();
  }

  async getContainers(): Promise<LXCContainer[]> {
    if (this.isDemo) {
      return Promise.resolve(mockLXCContainers);
    }
    const res = await fetch('/api/proxmox/containers');
    return res.json();
  }

  async startVM(vmid: number): Promise<{ success: boolean; message: string }> {
    return Promise.resolve({ success: true, message: `VM ${vmid} start command dispatched successfully.` });
  }

  async stopVM(vmid: number): Promise<{ success: boolean; message: string }> {
    return Promise.resolve({ success: true, message: `VM ${vmid} graceful shutdown initiated.` });
  }

  async restartVM(vmid: number): Promise<{ success: boolean; message: string }> {
    return Promise.resolve({ success: true, message: `VM ${vmid} reboot queued.` });
  }
}

export const proxmoxService = new ProxmoxAdapter(true);
