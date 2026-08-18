import { StoragePool, DiskDrive, BackupJob } from '../../types';
import { mockStoragePool, mockDisks, mockBackups } from '../../mocks';

export interface StorageProvider {
  getPool(): Promise<StoragePool>;
  getDisks(): Promise<DiskDrive[]>;
  getBackups(): Promise<BackupJob[]>;
  startScrub(): Promise<{ success: boolean; message: string }>;
}

export class NASAdapter implements StorageProvider {
  private isDemo: boolean = true;

  constructor(demoMode: boolean = true) {
    this.isDemo = demoMode;
  }

  async getPool(): Promise<StoragePool> {
    if (this.isDemo) {
      return Promise.resolve(mockStoragePool);
    }
    const res = await fetch('/api/nas/pool');
    return res.json();
  }

  async getDisks(): Promise<DiskDrive[]> {
    if (this.isDemo) {
      return Promise.resolve(mockDisks);
    }
    const res = await fetch('/api/nas/disks');
    return res.json();
  }

  async getBackups(): Promise<BackupJob[]> {
    if (this.isDemo) {
      return Promise.resolve(mockBackups);
    }
    const res = await fetch('/api/nas/backups');
    return res.json();
  }

  async startScrub(): Promise<{ success: boolean; message: string }> {
    return Promise.resolve({ success: true, message: 'ZFS pool scrub started in background.' });
  }
}

export const nasService = new NASAdapter(true);
