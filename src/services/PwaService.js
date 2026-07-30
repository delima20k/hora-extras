const DISMISS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export class PwaService {
  constructor(storage, { windowRef = window, navigatorRef = navigator } = {}) { this.storage = storage; this.window = windowRef; this.navigator = navigatorRef; this.promptEvent = null; this.beforeInstallHandler = null; }
  async register() { if ('serviceWorker' in this.navigator) { try { return await this.navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`); } catch { return null; } } return null; }
  isDismissed() { const dismissed = this.storage.get('installDismissed'); return Number.isFinite(dismissed?.at) && Date.now() - dismissed.at < DISMISS_WINDOW_MS; }
  isIos() { return /iphone|ipad|ipod/i.test(this.navigator.userAgent || '') || (this.navigator.platform === 'MacIntel' && this.navigator.maxTouchPoints > 1); }
  isStandalone() { return this.navigator.standalone === true || Boolean(this.window.matchMedia?.('(display-mode: standalone)').matches); }
  listen(onAvailable) {
    this.destroy();
    if (this.isIos() && !this.isStandalone() && !this.isDismissed()) { onAvailable({ platform: 'ios' }); return; }
    this.beforeInstallHandler = (event) => { event.preventDefault(); if (!this.isDismissed()) { this.promptEvent = event; onAvailable(); } };
    this.window.addEventListener('beforeinstallprompt', this.beforeInstallHandler, { once: true });
  }
  async install() { if (!this.promptEvent) return false; this.promptEvent.prompt(); const result = await this.promptEvent.userChoice; this.promptEvent = null; return result.outcome === 'accepted'; }
  dismiss() { this.storage.set('installDismissed', { at: Date.now() }); this.promptEvent = null; }
  destroy() { if (this.beforeInstallHandler) this.window.removeEventListener('beforeinstallprompt', this.beforeInstallHandler); this.beforeInstallHandler = null; this.promptEvent = null; }
}
