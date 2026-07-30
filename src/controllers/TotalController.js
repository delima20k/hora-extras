import { TimeCalculationService } from '../services/TimeCalculationService.js';
import { PayrollPeriodService } from '../services/PayrollPeriodService.js';

const emptyBreakdown = () => ({ minutes65: 0, minutes100: 0, value65: 0, value100: 0, nightMinutes: 0, nightPay: 0, totalMinutes: 0, totalPay: 0 });

export class TotalController {
  constructor({ state, entryRepository, closureRepository, payrollPeriodService = new PayrollPeriodService(), payrollClosureService, dateService, timeCalculationService = new TimeCalculationService() }) { this.state = state; this.entryRepository = entryRepository; this.closureRepository = closureRepository; this.payrollPeriodService = payrollPeriodService; this.payrollClosureService = payrollClosureService; this.dateService = dateService; this.timeCalculationService = timeCalculationService; this.view = null; this.requestId = 0; }
  async open(view) { const requestId = ++this.requestId; this.view = view; this.view.renderLoading(this.view.container); await this.refresh(requestId); }
  close() { this.requestId += 1; this.view = null; }
  addToBreakdown(breakdown, entry) {
    const multiplier = this.timeCalculationService.getOvertimeMultiplier(entry.date, this.state.workSchedule);
    const nightMinutes = this.timeCalculationService.calculateNightMinutes(entry.startTime, entry.endTime);
    const nightPay = this.timeCalculationService.calculateOvertimePay(0, entry.date, this.state.payrollSettings, nightMinutes, this.state.workSchedule);
    const value = this.timeCalculationService.calculateOvertimePay(entry.durationMinutes, entry.date, this.state.payrollSettings, nightMinutes, this.state.workSchedule);
    breakdown.totalMinutes += entry.durationMinutes; breakdown.totalPay += value;
    breakdown.nightMinutes += nightMinutes; breakdown.nightPay += nightPay;
    if (multiplier === 2) { breakdown.minutes100 += entry.durationMinutes; breakdown.value100 += value - nightPay; } else { breakdown.minutes65 += entry.durationMinutes; breakdown.value65 += value - nightPay; }
  }
  summarize(entries) { return entries.reduce((summary, entry) => { this.addToBreakdown(summary, entry); return summary; }, emptyBreakdown()); }
  async refresh(requestId = this.requestId) {
    if (!this.view) return;
    try {
      const employeeId = this.state.employee?.id;
      const entries = employeeId ? await this.entryRepository.findAll(employeeId) : [];
      const now = this.dateService?.now?.() || new Date();
      const closures = employeeId && this.closureRepository ? await (this.payrollClosureService ? this.payrollClosureService.sync({ employeeId, entries, payrollSettings: this.state.payrollSettings, workSchedule: this.state.workSchedule, closureRepository: this.closureRepository, now }) : this.closureRepository.findAll(employeeId)) : [];
      const currentPeriod = this.payrollPeriodService.getCurrentPeriod(this.state.payrollSettings, now);
      const currentEntries = currentPeriod ? entries.filter((entry) => this.payrollPeriodService.getPeriodForDate(entry.date, this.state.payrollSettings)?.endDate === currentPeriod.endDate) : entries;
      const reports = new Map();
      for (const source of entries) {
        const nightMinutes = this.timeCalculationService.calculateNightMinutes(source.startTime, source.endTime);
        const entry = { ...source, nightMinutes, nightPay: this.timeCalculationService.calculateOvertimePay(0, source.date, this.state.payrollSettings, nightMinutes, this.state.workSchedule), pay: this.timeCalculationService.calculateOvertimePay(source.durationMinutes, source.date, this.state.payrollSettings, nightMinutes, this.state.workSchedule), isClosed: this.payrollPeriodService.isClosed(source.date, this.state.payrollSettings, now) };
        const monthKey = entry.date.slice(0, 7);
        if (!reports.has(monthKey)) reports.set(monthKey, { key: monthKey, entries: [], pending: emptyBreakdown(), received: emptyBreakdown(), total: emptyBreakdown() });
        const report = reports.get(monthKey); report.entries.push(entry); this.addToBreakdown(report.total, entry); this.addToBreakdown(entry.paymentStatus === 'received' ? report.received : report.pending, entry);
      }
      const months = [...reports.values()].sort((left, right) => right.key.localeCompare(left.key));
      const total = this.summarize(currentEntries);
      const received = this.summarize(currentEntries.filter((entry) => entry.paymentStatus === 'received'));
      const pending = this.summarize(currentEntries.filter((entry) => entry.paymentStatus !== 'received'));
      if (requestId !== this.requestId || !this.view) return;
      this.view.render(this.view.container, this.state, { months, total, received, pending, closures, currentPeriod, message: employeeId ? '' : 'Cadastre seu perfil para gerar o relatório.' }, { onPaymentChange: (entry, paymentStatus) => this.setPaymentStatus(entry, paymentStatus) });
    } catch (error) {
      if (requestId !== this.requestId || !this.view) return;
      this.view.render(this.view.container, this.state, { months: [], closures: [], total: emptyBreakdown(), received: emptyBreakdown(), pending: emptyBreakdown(), message: error.message || 'Não foi possível carregar o relatório.' });
    }
  }
  async setPaymentStatus(entry, paymentStatus) {
    try { await this.entryRepository.setPaymentStatus(entry, paymentStatus); await this.refresh(); }
    catch (error) { if (this.view) this.view.renderMessage(error.message || 'Não foi possível atualizar o pagamento.'); }
  }
}
