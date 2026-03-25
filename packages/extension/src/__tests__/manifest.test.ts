import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('manifest.json validation', () => {
  const manifestPath = resolve(__dirname, '../../manifest.json');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let manifest: any;

  beforeAll(() => {
    const raw = readFileSync(manifestPath, 'utf-8');
    manifest = JSON.parse(raw);
  });

  it('should have manifest_version 3', () => {
    expect(manifest.manifest_version).toBe(3);
  });

  it('should have a name', () => {
    expect(typeof manifest.name).toBe('string');
    expect(manifest.name.length).toBeGreaterThan(0);
  });

  it('should have required permissions', () => {
    expect(manifest.permissions).toContain('storage');
    expect(manifest.permissions).toContain('tabs');
  });

  it('should have content_scripts targeting claude.ai', () => {
    expect(manifest.content_scripts).toBeDefined();
    expect(manifest.content_scripts.length).toBeGreaterThan(0);
    const cs = manifest.content_scripts[0];
    expect(cs.matches.some((m: string) => m.includes('claude.ai'))).toBe(true);
  });

  it('should have a background service worker', () => {
    expect(manifest.background).toBeDefined();
    expect(manifest.background.service_worker).toBeDefined();
  });

  it('should have host_permissions for claude.ai', () => {
    expect(manifest.host_permissions).toBeDefined();
    expect(manifest.host_permissions.some((p: string) => p.includes('claude.ai'))).toBe(true);
  });
});
