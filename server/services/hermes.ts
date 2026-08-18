/**
 * Hermes integration - FEATURE GATED, off by default.
 *
 * The Hermes agent (v0.20.3, running on VM110) has not been pointed at this
 * dashboard yet, so `HERMES_ENABLED` defaults to false. When the flag is off
 * this service is never constructed and the routes answer `disabled`. Nothing
 * in this file fabricates a reply: if the upstream is missing, unreachable or
 * answers in a shape we do not recognise, that surfaces as an error.
 *
 * The wire contract below is the one this dashboard will speak. It is written
 * defensively (several common reply field names are accepted) precisely because
 * it has not been validated against the real agent yet.
 */
import { z } from 'zod';
import type { HermesChatResponseDto, HermesStatusDto } from '../../shared/api.js';
import type { HermesConfig } from '../config.js';
import { UpstreamError } from '../errors.js';
import { probe, requestJson, type ProbeResult } from '../http.js';

const LABEL = 'Hermes';

/** Upper bound on a prompt, enforced before anything leaves this process. */
export const MAX_MESSAGE_LENGTH = 4000;

const healthSchema = z
  .object({
    version: z.string().nullish(),
    status: z.string().nullish(),
  })
  .passthrough();

/**
 * Accepts the field names most agent APIs use for the assistant turn. If none
 * are present we raise UPSTREAM_INVALID_RESPONSE rather than returning "".
 */
const chatSchema = z
  .object({
    reply: z.string().nullish(),
    response: z.string().nullish(),
    message: z.string().nullish(),
    text: z.string().nullish(),
    content: z.string().nullish(),
    conversation_id: z.string().nullish(),
    conversationId: z.string().nullish(),
  })
  .passthrough();

export class HermesService {
  readonly #config: HermesConfig;
  readonly #timeoutMs: number;

  constructor(config: HermesConfig, timeoutMs: number) {
    this.#config = config;
    this.#timeoutMs = timeoutMs;
  }

  get #headers(): Record<string, string> {
    return this.#config.apiKey ? { authorization: `Bearer ${this.#config.apiKey}` } : {};
  }

  async probe(): Promise<ProbeResult> {
    return probe(`${this.#config.baseUrl}/health`, this.#timeoutMs);
  }

  async getStatus(): Promise<HermesStatusDto> {
    try {
      const raw = await requestJson(`${this.#config.baseUrl}/health`, {
        method: 'GET',
        headers: this.#headers,
        timeoutMs: this.#timeoutMs,
        label: LABEL,
      });
      const parsed = healthSchema.safeParse(raw);
      return {
        enabled: true,
        reachable: true,
        version: parsed.success ? (parsed.data.version ?? null) : null,
      };
    } catch {
      return { enabled: true, reachable: false, version: null };
    }
  }

  async chat(message: string): Promise<HermesChatResponseDto> {
    const raw = await requestJson(`${this.#config.baseUrl}/chat`, {
      method: 'POST',
      headers: this.#headers,
      json: { message },
      timeoutMs: this.#timeoutMs,
      label: LABEL,
    });

    const parsed = chatSchema.safeParse(raw);
    if (!parsed.success) {
      throw new UpstreamError('UPSTREAM_INVALID_RESPONSE', `${LABEL} returned an unexpected payload.`);
    }
    const d = parsed.data;
    const reply = d.reply ?? d.response ?? d.message ?? d.text ?? d.content ?? null;
    if (!reply) {
      throw new UpstreamError(
        'UPSTREAM_INVALID_RESPONSE',
        `${LABEL} responded without a recognisable reply field.`,
      );
    }

    return {
      reply,
      conversationId: d.conversation_id ?? d.conversationId ?? null,
      receivedAt: new Date().toISOString(),
    };
  }
}
