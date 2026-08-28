import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const publicDirectory = resolve(process.cwd(), 'site/public');
const immutableCache = 'public, max-age=31536000, immutable';
const permissions = 'camera=(), microphone=(), geolocation=()';

describe('static deployment response policy', () => {
  it('uses Azure Static Web Apps rules for immutable assets and privacy headers', async () => {
    const config = JSON.parse(await readFile(resolve(publicDirectory, 'staticwebapp.config.json'), 'utf8')) as {
      globalHeaders: Record<string, string>;
      routes: Array<{ route: string; headers: Record<string, string> }>;
    };

    expect(config.globalHeaders['Permissions-Policy']).toBe(permissions);
    expect(config.globalHeaders['X-Content-Type-Options']).toBe('nosniff');
    expect(config.globalHeaders['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(config.routes).toContainEqual({
      route: '/assets/*',
      headers: { 'Cache-Control': immutableCache }
    });
    expect(config.routes).toContainEqual({
      route: '/sw.js',
      headers: { 'Cache-Control': 'no-cache' }
    });
  });

  it('keeps the portable header manifest aligned with the Azure policy', async () => {
    const headers = await readFile(resolve(publicDirectory, '_headers'), 'utf8');

    expect(headers).toContain(`Cache-Control: ${immutableCache}`);
    expect(headers).toContain(`Permissions-Policy: ${permissions}`);
  });
});
