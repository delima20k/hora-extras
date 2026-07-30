import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { ImageService } from '../src/services/ImageService.js';
import { PwaService } from '../src/services/PwaService.js';

describe('ImageService', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp'])('aceita %s', (type) => expect(new ImageService().validate(new File(['x'], 'image', { type }))).toBeTruthy());
  it('rejeita arquivo inválido ou maior que 5 MB', () => { const service = new ImageService(); expect(() => service.validate(new File(['x'], 'arquivo.txt', { type: 'text/plain' }))).toThrow(); expect(() => service.validate(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'grande.png', { type: 'image/png' }))).toThrow(); });
  it('revoga URLs temporárias', () => { const service = new ImageService(); const revoke = vi.fn(); vi.stubGlobal('URL', { ...URL, revokeObjectURL: revoke }); service.revokePreview('blob:temporaria'); expect(revoke).toHaveBeenCalledWith('blob:temporaria'); vi.unstubAllGlobals(); });
});

describe('PWA assets', () => {
  it('declara manifesto, metadados Apple, service worker e fallback da SPA', () => { const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8')); const worker = readFileSync('public/sw.js', 'utf8'); const html = readFileSync('index.html', 'utf8'); expect(manifest.icons).toHaveLength(2); expect(manifest.start_url).toBe('./#today'); expect(manifest.icons[0].src).toBe('icons/icon-192.png'); expect(html).toContain('apple-mobile-web-app-capable'); expect(html).toContain('apple-touch-icon'); expect(worker).toContain("caches.match(appUrl('index.html'))"); expect(worker).toContain('CACHE_VERSION'); });
  it('oferece instruções de instalação no iOS fora do modo standalone', () => {
    const storage = { get: vi.fn(() => null), set: vi.fn() };
    const windowRef = { addEventListener: vi.fn(), removeEventListener: vi.fn(), matchMedia: vi.fn(() => ({ matches: false })) };
    const navigatorRef = { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', platform: 'iPhone', maxTouchPoints: 1 };
    const service = new PwaService(storage, { windowRef, navigatorRef }); const available = vi.fn();
    service.listen(available);
    expect(available).toHaveBeenCalledWith({ platform: 'ios' }); expect(windowRef.addEventListener).not.toHaveBeenCalled();
  });
  it('não mostra instruções se o web app iOS já está instalado', () => {
    const storage = { get: vi.fn(() => null), set: vi.fn() };
    const windowRef = { addEventListener: vi.fn(), removeEventListener: vi.fn(), matchMedia: vi.fn(() => ({ matches: true })) };
    const navigatorRef = { userAgent: 'iPhone', platform: 'iPhone', maxTouchPoints: 1, standalone: true };
    const service = new PwaService(storage, { windowRef, navigatorRef }); const available = vi.fn();
    service.listen(available);
    expect(available).not.toHaveBeenCalled();
  });
});
