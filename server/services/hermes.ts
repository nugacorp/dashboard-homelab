/**
 * Hermes Agent API integration.
 *
 * Browser -> NUGA HOME backend -> Hermes Agent.
 *
 * The Hermes bearer credential never reaches the browser. All upstream
 * payloads are validated here and normalised into application-owned DTOs.
 */

import { z } from 'zod';
import type {
  HermesChatResponseDto,
  HermesModelsDto,
  HermesProviderDto,
  HermesStatusDto,
} from '../../shared/api.js';
import type { HermesConfig } from '../config.js';
import { UpstreamError } from '../errors.js';
import { requestJson, type ProbeResult } from '../http.js';

const LABEL = 'Hermes';

/** Upper bound applied before a prompt leaves NUGA HOME. */
export const MAX_MESSAGE_LENGTH = 4000;

const platformStateSchema = z
  .object({
    state: z.string().nullish(),
  })
  .passthrough();

const detailedHealthSchema = z
  .object({
    status: z.string(),
    platform: z.string().nullish(),
    version: z.string().nullish(),
    gateway_state: z.string().nullish(),
    platforms: z.record(platformStateSchema).optional(),
    active_agents: z.number().int().nonnegative().nullish(),
    gateway_busy: z.boolean().nullish(),
  })
  .passthrough();

const modelListSchema = z
  .object({
    object: z.string().optional(),
    data: z.array(
      z
        .object({
          id: z.string(),
        })
        .passthrough(),
    ),
  })
  .passthrough();

const providerSchema = z
  .object({
    slug: z.string(),
    name: z.string(),
    is_current: z.boolean().optional(),
    authenticated: z.boolean().optional(),
    models: z.array(z.string()).optional(),
    total_models: z.number().int().nonnegative().optional(),
  })
  .passthrough();

const modelOptionsSchema = z
  .object({
    providers: z.array(providerSchema),
    model: z.string().nullish(),
    provider: z.string().nullish(),
  })
  .passthrough();

const sessionCreateSchema = z
  .object({
    id: z.string().optional(),
    session_id: z.string().optional(),
    session: z
      .object({
        id: z.string().optional(),
        session_id: z.string().optional(),
      })
      .passthrough()
      .nullish(),
    data: z
      .object({
        id: z.string().optional(),
        session_id: z.string().optional(),
      })
      .passthrough()
      .nullish(),
  })
  .passthrough();

const sessionChatSchema = z
  .object({
    session_id: z.string().min(1),
    message: z
      .object({
        role: z.string().optional(),
        content: z.string().nullish(),
      })
      .passthrough(),
    usage: z
      .object({
        prompt_tokens: z.number().int().nonnegative().optional(),
        completion_tokens: z.number().int().nonnegative().optional(),
        total_tokens: z.number().int().nonnegative().optional(),
        input_tokens: z.number().int().nonnegative().optional(),
        output_tokens: z.number().int().nonnegative().optional(),
      })
      .passthrough()
      .optional(),
    runtime: z
      .object({
        model: z.string().nullish(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

function createdSessionId(
  value: z.infer<typeof sessionCreateSchema>,
): string | null {
  return (
    value.session?.id ??
    value.session?.session_id ??
    value.data?.id ??
    value.data?.session_id ??
    value.id ??
    value.session_id ??
    null
  );
}

function invalidPayload(detail: string): UpstreamError {
  return new UpstreamError(
    'UPSTREAM_INVALID_RESPONSE',
    `${LABEL} returned an unexpected ${detail} payload.`,
  );
}

export class HermesService {
  readonly #config: HermesConfig;
  readonly #timeoutMs: number;
  readonly #chatTimeoutMs: number;

  constructor(
    config: HermesConfig,
    timeoutMs: number,
    chatTimeoutMs: number,
  ) {
    this.#config = config;
    this.#timeoutMs = timeoutMs;
    this.#chatTimeoutMs = chatTimeoutMs;
  }

  get #headers(): Record<string, string> {
    return {
      authorization: `Bearer ${this.#config.apiKey}`,
    };
  }

  async #getDetailedHealth() {
    const raw = await requestJson(`${this.#config.baseUrl}/health/detailed`, {
      method: 'GET',
      headers: this.#headers,
      timeoutMs: this.#timeoutMs,
      label: LABEL,
    });

    const parsed = detailedHealthSchema.safeParse(raw);
    if (!parsed.success) throw invalidPayload('health');
    return parsed.data;
  }

  async #getModelOptions() {
    const raw = await requestJson(`${this.#config.baseUrl}/api/model/options`, {
      method: 'GET',
      headers: this.#headers,
      timeoutMs: this.#timeoutMs,
      label: LABEL,
    });

    const parsed = modelOptionsSchema.safeParse(raw);
    if (!parsed.success) throw invalidPayload('model options');
    return parsed.data;
  }

  /**
   * Readiness probe uses the authenticated endpoint. A 200 from /health alone
   * proves network reachability but would not prove the configured bearer works.
   */
  async probe(): Promise<ProbeResult> {
    const started = Date.now();

    try {
      await this.#getDetailedHealth();

      return {
        reachable: true,
        httpStatus: 200,
        latencyMs: Date.now() - started,
      };
    } catch (err) {
      return {
        reachable: false,
        httpStatus: err instanceof UpstreamError ? err.upstreamStatus : null,
        latencyMs: Date.now() - started,
      };
    }
  }

  async getStatus(): Promise<HermesStatusDto> {
    const [health, options] = await Promise.all([
      this.#getDetailedHealth(),
      this.#getModelOptions(),
    ]);

    const connectedPlatforms = Object.entries(health.platforms ?? {})
      .filter(([, value]) => value.state === 'connected')
      .map(([name]) => name);

    return {
      enabled: true,
      reachable: true,
      version: health.version ?? null,
      platform: health.platform ?? null,
      gatewayState: health.gateway_state ?? null,
      provider: options.provider ?? null,
      model: options.model ?? null,
      connectedPlatforms,
      activeAgents: health.active_agents ?? null,
      gatewayBusy: health.gateway_busy ?? null,
    };
  }

  async getModels(): Promise<HermesModelsDto> {
    const [modelsRaw, options] = await Promise.all([
      requestJson(`${this.#config.baseUrl}/v1/models`, {
        method: 'GET',
        headers: this.#headers,
        timeoutMs: this.#timeoutMs,
        label: LABEL,
      }),
      this.#getModelOptions(),
    ]);

    const models = modelListSchema.safeParse(modelsRaw);
    if (!models.success) throw invalidPayload('models');

    /*
     * Do not proxy the raw model-options object. It contains provider setup
     * metadata such as key_env/warning fields that the browser does not need.
     */
    const providers: HermesProviderDto[] = options.providers
      .filter((provider) => provider.authenticated === true || provider.is_current === true)
      .map((provider) => ({
        slug: provider.slug,
        name: provider.name,
        isCurrent: provider.is_current ?? false,
        authenticated: provider.authenticated ?? false,
        models: provider.models ?? [],
        totalModels: provider.total_models ?? provider.models?.length ?? 0,
      }));

    return {
      activeProvider: options.provider ?? null,
      activeModel: options.model ?? null,
      apiModels: models.data.data.map((model) => model.id),
      providers,
    };
  }

  async chat(
    message: string,
    conversationId: string | null = null,
  ): Promise<HermesChatResponseDto> {
    let sessionId = conversationId?.trim() || null;

    /*
     * A NUGA HOME conversation is a real persisted Hermes session.
     * The browser never receives the Hermes bearer credential; it only keeps
     * the opaque session id returned through our application-owned DTO.
     */
    if (!sessionId) {
      const createdRaw = await requestJson(
        `${this.#config.baseUrl}/api/sessions`,
        {
          method: 'POST',
          headers: this.#headers,
          json: {
            source: 'nuga_home',
          },
          timeoutMs: this.#chatTimeoutMs,
          label: LABEL,
        },
      );

      const created = sessionCreateSchema.safeParse(createdRaw);

      if (!created.success) {
        throw invalidPayload('session creation');
      }

      sessionId = createdSessionId(created.data);

      if (!sessionId) {
        throw invalidPayload('session creation');
      }
    }

    const raw = await requestJson(
      `${this.#config.baseUrl}/api/sessions/${encodeURIComponent(sessionId)}/chat`,
      {
        method: 'POST',
        headers: this.#headers,
        json: {
          message,
        },
        timeoutMs: this.#chatTimeoutMs,
        label: LABEL,
      },
    );

    const parsed = sessionChatSchema.safeParse(raw);

    if (!parsed.success) {
      throw invalidPayload('session chat');
    }

    const reply = parsed.data.message.content?.trim();

    if (!reply) {
      throw invalidPayload('session chat');
    }

    const usage = parsed.data.usage;
    const promptTokens =
      usage?.prompt_tokens ??
      usage?.input_tokens ??
      null;
    const completionTokens =
      usage?.completion_tokens ??
      usage?.output_tokens ??
      null;

    const totalTokens =
      usage?.total_tokens ??
      (
        promptTokens !== null && completionTokens !== null
          ? promptTokens + completionTokens
          : null
      );

    return {
      reply,
      conversationId: parsed.data.session_id,
      model: parsed.data.runtime?.model ?? null,
      finishReason: null,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
      },
      receivedAt: new Date().toISOString(),
    };
  }
}
