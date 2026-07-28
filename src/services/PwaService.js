const DISMISS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export class PwaService {
  constructor(storage) { this.storage = storage; this.promptEvent = null; this.beforeInstallHandler = null; }
  async register() { if ('serviceWorker' in navigator) { try { return await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`); } catch { return null; } } return null; }
  isDismissed() { const dismissed = this.storage.get('installDismissed'); return Number.isFinite(dismissed?.at) && Date.now() - dismissed.at < DISMISS_WINDOW_MS; }
  listen(onAvailable) {
    this.destroy();
    this.beforeInstallHandler = (event) => { event.preventDefault(); if (!this.isDismissed()) { this.promptEvent = event; onAvailable(); } };
    window.addEventListener('beforeinstallprompt', this.beforeInstallHandler, { once: true });
  }
  async install() { if (!this.promptEvent) return false; this.promptEvent.prompt(); const result = await this.promptEvent.userChoice; this.promptEvent = null; return result.outcome === 'accepted'; }
  dismiss() { this.storage.set('installDismissed', { at: Date.now() }); this.promptEvent = null; }
  destroy() { if (this.beforeInstallHandler) window.removeEventListener('beforeinstallprompt', this.beforeInstallHandler); this.beforeInstallHandler = null; this.promptEvent = null; }
}
