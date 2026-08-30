import { once } from 'node:events';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { startApp, type RunningApp } from './helpers/server.js';

interface RequestRecord {
  method: string;
  path: string;
  authorization: string | undefined;
  body: unknown;
}

interface FakeHermes {
  baseUrl: string;
  requests: RequestRecord[];
  close(): Promise<void>;
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  let raw = '';

  for await (const chunk of req) {
    raw += chunk.toString();
  }

  if (!raw) return null;
  return JSON.parse(raw) as unknown;
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

async function startFakeHermes(): Promise<FakeHermes> {
  const requests: RequestRecord[] = [];

  const server = createServer(async (req, res) => {
    const path = req.url ?? '/';
    const authorization = req.headers.authorization;
    const body = req.method === 'POST' ? await readJsonBody(req) : null;

    requests.push({
      method: req.method ?? 'GET',
      path,
      authorization,
      body,
    });

    if (authorization !== 'Bearer hermes-test-secret') {
      json(res, 401, { error: 'unauthorized' });
      return;
    }

    if (req.method === 'GET' && path === '/health/detailed') {
      json(res, 200, {
        status: 'ok',
        readiness: { status: 'ok', checks: {} },
        platform: 'hermes-agent',
        version: '0.20.3',
        gateway_state: 'running',
        platforms: {
          telegram: { state: 'connected' },
          homeassistant: { state: 'connected' },
          api_server: { state: 'connected' },
        },
        active_agents: 0,
        gateway_busy: false,
      });
      return;
    }

    if (req.method === 'GET' && path === '/v1/models') {
      json(res, 200, {
        object: 'list',
        data: [
          {
            id: 'hermes-agent',
            object: 'model',
            owned_by: 'hermes',
          },
        ],
      });
      return;
    }

    if (req.method === 'GET' && path === '/api/model/options') {
      json(res, 200, {
        providers: [
          {
            slug: 'minimax-oauth',
            name: 'MiniMax (minimax.io)',
            is_current: true,
            authenticated: true,
            models: [
              'MiniMax-M3',
              'MiniMax-M2.7',
              'MiniMax-M2.7-highspeed',
            ],
            total_models: 3,
            key_env: 'SHOULD_NOT_REACH_BROWSER',
            warning: 'SHOULD_NOT_REACH_BROWSER',
          },
          {
            slug: 'unconfigured-provider',
            name: 'Unconfigured',
            is_current: false,
            authenticated: false,
            models: [],
            total_models: 0,
            key_env: 'SECRET_SETUP_METADATA',
          },
        ],
        model: 'MiniMax-M2.7',
        provider: 'minimax-oauth',
      });
      return;
    }

    if (req.method === 'POST' && path === '/api/sessions') {
      json(res, 201, {
        id: 'api_test_session',
        source: 'nuga_home',
      });
      return;
    }

    if (
      req.method === 'POST' &&
      path === '/api/sessions/api_test_session/chat'
    ) {
      const chatBody = body as { message?: unknown } | null;
      const reply =
        chatBody?.message === 'Realízalo de nuevo'
          ? 'NUGA_CONTEXT_OK'
          : 'NUGA_TEST_OK';

      json(res, 200, {
        object: 'hermes.session.chat.completion',
        session_id: 'api_test_session',
        message: {
          role: 'assistant',
          content: reply,
        },
        usage: {
          prompt_tokens: 10,
          completion_tokens: 2,
          total_tokens: 12,
        },
        runtime: {
          model: 'MiniMax-M2.7',
        },
      });
      return;
    }

    json(res, 404, { error: 'not found' });
  });

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    requests,
    close: async () => {
      server.close();
      await once(server, 'close');
    },
  };
}

describe('Hermes Agent real API contract mapping', () => {
  let running: RunningApp | null = null;
  let upstream: FakeHermes | null = null;

  afterEach(async () => {
    await running?.close();
    running = null;

    await upstream?.close();
    upstream = null;
  });

  it('normalises status, models and chat without exposing provider setup metadata', async () => {
    upstream = await startFakeHermes();

    running = await startApp({
      HERMES_ENABLED: 'true',
      HERMES_API_URL: upstream.baseUrl,
      HERMES_API_KEY: 'hermes-test-secret',
    });

    const statusRes = await fetch(`${running.baseUrl}/api/hermes/status`);
    expect(statusRes.status).toBe(200);

    const status = (await statusRes.json()) as any;
    expect(status.status).toBe('ok');
    expect(status.data).toMatchObject({
      enabled: true,
      reachable: true,
      version: '0.20.3',
      platform: 'hermes-agent',
      gatewayState: 'running',
      provider: 'minimax-oauth',
      model: 'MiniMax-M2.7',
      connectedPlatforms: [
        'telegram',
        'homeassistant',
        'api_server',
      ],
      activeAgents: 0,
      gatewayBusy: false,
    });

    const modelsRes = await fetch(`${running.baseUrl}/api/hermes/models`);
    expect(modelsRes.status).toBe(200);

    const models = (await modelsRes.json()) as any;
    expect(models.status).toBe('ok');
    expect(models.data.apiModels).toEqual(['hermes-agent']);
    expect(models.data.activeProvider).toBe('minimax-oauth');
    expect(models.data.activeModel).toBe('MiniMax-M2.7');
    expect(models.data.providers).toHaveLength(1);
    expect(models.data.providers[0]).toMatchObject({
      slug: 'minimax-oauth',
      authenticated: true,
      isCurrent: true,
      totalModels: 3,
    });

    const serializedModels = JSON.stringify(models);
    expect(serializedModels).not.toContain('SHOULD_NOT_REACH_BROWSER');
    expect(serializedModels).not.toContain('SECRET_SETUP_METADATA');

    const chatRes = await fetch(`${running.baseUrl}/api/hermes/chat`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Prueba NUGA',
      }),
    });

    expect(chatRes.status).toBe(200);

    const chat = (await chatRes.json()) as any;
    expect(chat.status).toBe('ok');
    expect(chat.data).toMatchObject({
      reply: 'NUGA_TEST_OK',
      conversationId: 'api_test_session',
      model: 'MiniMax-M2.7',
      finishReason: null,
      usage: {
        promptTokens: 10,
        completionTokens: 2,
        totalTokens: 12,
      },
    });

    expect(JSON.stringify(chat)).not.toContain('hermes-test-secret');

    const secondChatRes = await fetch(
      `${running.baseUrl}/api/hermes/chat`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Realízalo de nuevo',
          conversationId: chat.data.conversationId,
        }),
      },
    );

    expect(secondChatRes.status).toBe(200);

    const secondChat = (await secondChatRes.json()) as any;

    expect(secondChat.status).toBe('ok');
    expect(secondChat.data).toMatchObject({
      reply: 'NUGA_CONTEXT_OK',
      conversationId: 'api_test_session',
    });

    expect(JSON.stringify(secondChat)).not.toContain(
      'hermes-test-secret',
    );

    const sessionCreates = upstream.requests.filter(
      (request) => request.path === '/api/sessions',
    );

    expect(sessionCreates).toHaveLength(1);
    expect(sessionCreates[0]?.authorization).toBe(
      'Bearer hermes-test-secret',
    );
    expect(sessionCreates[0]?.body).toEqual({
      source: 'nuga_home',
    });

    const upstreamChats = upstream.requests.filter(
      (request) =>
        request.path ===
        '/api/sessions/api_test_session/chat',
    );

    expect(upstreamChats).toHaveLength(2);

    expect(upstreamChats[0]?.authorization).toBe(
      'Bearer hermes-test-secret',
    );
    expect(upstreamChats[0]?.body).toEqual({
      message: 'Prueba NUGA',
    });

    expect(upstreamChats[1]?.authorization).toBe(
      'Bearer hermes-test-secret',
    );
    expect(upstreamChats[1]?.body).toEqual({
      message: 'Realízalo de nuevo',
    });
  });

  it('fails closed when the Hermes bearer is rejected', async () => {
    upstream = await startFakeHermes();

    running = await startApp({
      HERMES_ENABLED: 'true',
      HERMES_API_URL: upstream.baseUrl,
      HERMES_API_KEY: 'wrong-key',
    });

    const res = await fetch(`${running.baseUrl}/api/hermes/status`);

    expect(res.status).toBe(503);

    const body = (await res.json()) as any;
    expect(body.status).toBe('unavailable');
    expect(body.error.code).toBe('UPSTREAM_AUTH');

    expect(JSON.stringify(body)).not.toContain('wrong-key');
  });
});
