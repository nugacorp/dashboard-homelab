/**
 * /api/proxmox - read-only surface.
 *
 * The write endpoints below exist so the UI gets a truthful, machine-readable
 * "no" (HTTP 403 NOT_ENABLED) instead of a fabricated success. They never touch
 * the Proxmox API.
 */
import { Router } from 'express';
import type { ServerContext } from '../context.js';
import { notConfigured, notEnabled, serve } from '../respond.js';

const NOT_CONFIGURED_MESSAGE =
  'Proxmox is not configured. Set PVE_API_URL, PVE_TOKEN_ID and PVE_TOKEN_SECRET.';

const READ_ONLY_MESSAGE =
  'Guest power operations are not enabled in this release. NUGA HOME talks to Proxmox with a read-only token.';

export function createProxmoxRouter(ctx: ServerContext): Router {
  const router = Router();

  router.get('/cluster', (_req, res) => {
    if (!ctx.proxmox) return notConfigured(res, 'proxmox', NOT_CONFIGURED_MESSAGE);
    return void serve(res, 'proxmox', ctx.logger, async () => (await ctx.proxmox!.getSnapshot()).cluster);
  });

  router.get('/nodes', (_req, res) => {
    if (!ctx.proxmox) return notConfigured(res, 'proxmox', NOT_CONFIGURED_MESSAGE);
    return void serve(res, 'proxmox', ctx.logger, async () => (await ctx.proxmox!.getSnapshot()).nodes);
  });

  router.get('/vms', (_req, res) => {
    if (!ctx.proxmox) return notConfigured(res, 'proxmox', NOT_CONFIGURED_MESSAGE);
    return void serve(res, 'proxmox', ctx.logger, async () =>
      (await ctx.proxmox!.getGuests()).filter((g) => g.type === 'qemu'),
    );
  });

  router.get('/containers', (_req, res) => {
    if (!ctx.proxmox) return notConfigured(res, 'proxmox', NOT_CONFIGURED_MESSAGE);
    return void serve(res, 'proxmox', ctx.logger, async () =>
      (await ctx.proxmox!.getGuests()).filter((g) => g.type === 'lxc'),
    );
  });

  router.get('/storage', (_req, res) => {
    if (!ctx.proxmox) return notConfigured(res, 'proxmox', NOT_CONFIGURED_MESSAGE);
    return void serve(res, 'proxmox', ctx.logger, () => ctx.proxmox!.getStorage());
  });

  // --- Intentionally unimplemented mutations -------------------------------
  // Enumerated explicitly (rather than a catch-all) so the contract is visible
  // in the code and in any generated route listing.
  const blocked: Array<[('post' | 'delete'), string]> = [
    ['post', '/vms/:vmid/start'],
    ['post', '/vms/:vmid/stop'],
    ['post', '/vms/:vmid/reboot'],
    ['post', '/vms/:vmid/shutdown'],
    ['post', '/containers/:vmid/start'],
    ['post', '/containers/:vmid/stop'],
    ['post', '/containers/:vmid/reboot'],
    ['post', '/nodes/:node/reboot'],
    ['delete', '/vms/:vmid'],
    ['delete', '/containers/:vmid'],
  ];
  for (const [method, path] of blocked) {
    router[method](path, (_req, res) => notEnabled(res, READ_ONLY_MESSAGE));
  }

  return router;
}
