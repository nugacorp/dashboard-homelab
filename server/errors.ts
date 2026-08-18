/**
 * Upstream failure taxonomy.
 *
 * The point of this module is isolation: a failing Proxmox must not turn into a
 * 500 for the whole dashboard, and an upstream error message must never carry a
 * token into the browser. Every failure becomes an `UpstreamError` with a stable
 * code and a message that is safe to render.
 */
import type { ApiError } from '../shared/api.js';

export type UpstreamErrorCode =
  | 'UPSTREAM_TIMEOUT'
  | 'UPSTREAM_UNREACHABLE'
  | 'UPSTREAM_TLS'
  | 'UPSTREAM_AUTH'
  | 'UPSTREAM_FORBIDDEN'
  | 'UPSTREAM_HTTP'
  | 'UPSTREAM_INVALID_RESPONSE';

export class UpstreamError extends Error {
  readonly code: UpstreamErrorCode;
  /** HTTP status returned by the upstream, when there was one. */
  readonly upstreamStatus: number | null;

  constructor(code: UpstreamErrorCode, message: string, upstreamStatus: number | null = null) {
    super(message);
    this.name = 'UpstreamError';
    this.code = code;
    this.upstreamStatus = upstreamStatus;
  }

  toApiError(): ApiError {
    return { code: this.code, message: this.message };
  }
}

/**
 * Maps a thrown value onto an UpstreamError. Node/undici surface connection
 * problems as `cause.code`, so we inspect that rather than string-matching.
 */
export function toUpstreamError(err: unknown, label: string): UpstreamError {
  if (err instanceof UpstreamError) return err;

  if (err instanceof Error) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      return new UpstreamError('UPSTREAM_TIMEOUT', `${label} did not respond in time.`);
    }
    const cause = (err as { cause?: unknown }).cause;
    const code =
      cause && typeof cause === 'object' && 'code' in cause
        ? String((cause as { code: unknown }).code)
        : undefined;

    if (code) {
      if (code.startsWith('CERT_') || code.startsWith('DEPTH_ZERO') || code.startsWith('SELF_SIGNED') ||
          code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || code === 'ERR_TLS_CERT_ALTNAME_INVALID') {
        return new UpstreamError(
          'UPSTREAM_TLS',
          `${label} TLS certificate could not be verified (${code}). ` +
            'Install the cluster CA and set PVE_CA_CERT_PATH / PVE_TLS_SERVERNAME.',
        );
      }
      if (['ECONNREFUSED', 'EHOSTUNREACH', 'ENETUNREACH', 'ENOTFOUND', 'EAI_AGAIN', 'ECONNRESET'].includes(code)) {
        return new UpstreamError('UPSTREAM_UNREACHABLE', `${label} is unreachable (${code}).`);
      }
      if (code === 'UND_ERR_CONNECT_TIMEOUT' || code === 'UND_ERR_HEADERS_TIMEOUT' || code === 'UND_ERR_BODY_TIMEOUT') {
        return new UpstreamError('UPSTREAM_TIMEOUT', `${label} did not respond in time (${code}).`);
      }
      return new UpstreamError('UPSTREAM_UNREACHABLE', `${label} request failed (${code}).`);
    }
  }

  return new UpstreamError('UPSTREAM_UNREACHABLE', `${label} request failed.`);
}

/** Turns an upstream HTTP status into the right code, without echoing the body. */
export function fromHttpStatus(status: number, label: string): UpstreamError {
  if (status === 401) {
    return new UpstreamError('UPSTREAM_AUTH', `${label} rejected the credentials (401).`, status);
  }
  if (status === 403) {
    return new UpstreamError(
      'UPSTREAM_FORBIDDEN',
      `${label} denied access (403). The API token is likely missing a required privilege.`,
      status,
    );
  }
  return new UpstreamError('UPSTREAM_HTTP', `${label} responded with HTTP ${status}.`, status);
}
