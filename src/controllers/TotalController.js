import { TimeCalculationService } from '../services/TimeCalculationService.js';

const emptyBreakdown = () => ({ minutes65: 0, minutes100: 0, value65: 0, value100: 0, totalMinutes: 0, totalPay: 0 });

export class TotalController {
  constructor({ state, entryRepository, timeCalculationService = new TimeCalculationService() }) { this.state = state; this.entryRepository = entryRepository; this.timeCalculationService = timeCalculationService; this.view = null; this.requestId = 0; }
  async open(view) { const requestId = ++this.requestId; this.view = view; this.view.renderLoading(this.view.container); await this.refresh(requestId); }
  close() { this.requestId += 1; this.view = null; }
  addToBreakdown(breakdown, entry) {
    const multiplier = this.timeCalculationService.getOvertimeMultiplier(entry.date);
    const value = this.timeCalculationService.calculateOvertimePay(entry.durationMinutes, entry.date, this.state.payrollSettings);
    breakdown.totalMinutes += entry.durationMinutes; breakdown.totalPay += value;
    if (multiplier === 2) { breakdown.minutes100 += entry.durationMinutes; breakdown.value100 += value; } else { breakdown.minutes65 += entry.durationMinutes; breakdown.value65 += value; }
  }
  summarize(entries) { return entries.reduce((summary, entry) => { this.addToBreakdown(summary, entry); return summary; }, emptyBreakdown()); }
  async refresh(requestId = this.requestId) {
    if (!this.view) return;
    try {
      const employeeId = this.state.employee?.id;
      const entries = employeeId ? await this.entryRepository.findAll(employeeId) : [];
      const reports = new Map();
      for (const source of entries) {
        const entry = { ...source, pay: this.timeCalculationService.calculateOvertimePay(source.durationMinutes, source.date, this.state.payrollSettings) };
        const monthKey = entry.date.slice(0, 7);
        if (!reports.has(monthKey)) reports.set(monthKey, { key: monthKey, entries: [], pending: emptyBreakdown(), received: emptyBreakdown(), total: emptyBreakdown() });
        const report = reports.get(monthKey); report.entries.push(entry); this.addToBreakdown(report.total, entry); this.addToBreakdown(entry.paymentStatus === 'received' ? report.received : report.pending, entry);
      }
      const months = [...reports.values()].sort((left, right) => right.key.localeCompare(left.key));
      const total = this.summarize(entries);
      const received = this.summarize(entries.filter((entry) => entry.paymentStatus === 'received'));
      const pending = this.summarize(entries.filter((entry) => entry.paymentStatus !== 'received'));
      if (requestId !== this.requestId || !this.view) return;
      this.view.render(this.view.container, this.state, { months, total, received, pending, message: employeeId ? '' : 'Cadastre seu perfil para gerar o relatÃ³rio.' }, { onPaymentChange: (entry, paymentStatus) => this.setPaymentStatus(entry, paymentStatus) });
    } catch (error) {
      if (requestId !== this.requestId || !this.view) return;
      this.view.render(this.view.container, this.state, { months: [], total: emptyBreakdown(), received: emptyBreakdown(), pending: emptyBreakdown(), message: error.message || 'NÃ£o foi possÃ­vel carregar o relatÃ³rio.' });
    }
  }
  async setPaymentStatus(entry, paymentStatus) {
    try { await this.entryRepository.setPaymentStatus(entry, paymentStatus); await this.refresh(); }
    catch (error) { if (this.view) this.view.renderMessage(error.message || 'NÃ£o foi possÃ­vel atualizar o pagamento.'); }
  }
}
