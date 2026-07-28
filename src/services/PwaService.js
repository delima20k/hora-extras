export class PwaService {
  constructor(storage) { this.storage = storage; this.promptEvent = null; }
  async register() { if ('serviceWorker' in navigator) { try { await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`); } catch { /* PWA remains optional */ } } }
  listen(onAvailable) { window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); if (!this.storage.get('installDismissed')) { this.promptEvent = event; onAvailable(); } }, { once: true }); }
  async install() { if (!this.promptEvent) return false; this.promptEvent.prompt(); const result = await this.promptEvent.userChoice; this.promptEvent = null; return result.outcome === 'accepted'; }
  dismiss() { this.storage.set('installDismissed', { at: Date.now() }); this.promptEvent = null; }
}
