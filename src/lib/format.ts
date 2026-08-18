/**
 * Formatting helpers.
 *
 * House rule: `null` renders as "n/d" (no disponible), never as 0 and never as
 * a plausible-looking placeholder. If the upstream did not report it, the UI
 * says so.
 */

export const NOT_AVAILABLE = 'n/d';

export function formatBytes(bytes: number | null | undefined, fractionDigits = 1): string {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes)) return NOT_AVAILABLE;
  if (bytes === 0) return '0 B';
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
  const exponent = Math.min(Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : fractionDigits)} ${units[exponent]}`;
}

/** Compact form for tables: "12.4 GiB" -> "12.4G". */
export function formatBytesShort(bytes: number | null | undefined): string {
  const full = formatBytes(bytes, 1);
  if (full === NOT_AVAILABLE) return full;
  return full.replace(' KiB', 'K').replace(' MiB', 'M').replace(' GiB', 'G').replace(' TiB', 'T').replace(' B', 'B');
}

export function formatPct(value: number | null | undefined, fractionDigits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return NOT_AVAILABLE;
  return `${value.toFixed(fractionDigits)}%`;
}

export function formatUptime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds < 0) {
    return NOT_AVAILABLE;
  }
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/** Ratio as a 0-100 percentage, or null when either side is unknown. */
export function ratioPct(used: number | null | undefined, total: number | null | undefined): number | null {
  if (used === null || used === undefined || total === null || total === undefined) return null;
  if (!Number.isFinite(used) || !Number.isFinite(total) || total <= 0) return null;
  return Math.min(100, Math.max(0, (used / total) * 100));
}

export function formatClock(iso: string | null | undefined): string {
  if (!iso) return NOT_AVAILABLE;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return NOT_AVAILABLE;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return NOT_AVAILABLE;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return NOT_AVAILABLE;
  const deltaSec = Math.round((Date.now() - date.getTime()) / 1000);
  if (deltaSec < 5) return 'ahora mismo';
  if (deltaSec < 60) return `hace ${deltaSec}s`;
  const minutes = Math.floor(deltaSec / 60);
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return NOT_AVAILABLE;
  return value.toLocaleString();
}
