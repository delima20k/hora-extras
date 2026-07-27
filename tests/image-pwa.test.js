import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { ImageService } from '../src/services/ImageService.js';

describe('ImageService', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp'])('aceita %s', (type) => expect(new ImageService().validate(new File(['x'], 'image', { type }))).toBeTruthy());
  it('rejeita arquivo inválido ou maior que 5 MB', () => { const service = new ImageService(); expect(() => service.validate(new File(['x'], 'arquivo.txt', { type: 'text/plain' }))).toThrow(); expect(() => service.validate(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'grande.png', { type: 'image/png' }))).toThrow(); });
  it('revoga URLs temporárias', () => { const service = new ImageService(); const revoke = vi.fn(); vi.stubGlobal('URL', { ...URL, revokeObjectURL: revoke }); service.revokePreview('blob:temporaria'); expect(revoke).toHaveBeenCalledWith('blob:temporaria'); vi.unstubAllGlobals(); });
});

describe('PWA assets', () => {
  it('declara manifesto, service worker e fallback da SPA', () => { const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8')); const worker = readFileSync('public/sw.js', 'utf8'); expect(manifest.icons).toHaveLength(2); expect(worker).toContain("caches.match('/index.html')"); expect(worker).toContain('CACHE_VERSION'); });
});
