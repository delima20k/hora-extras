import { TimeCalculationService } from '../services/TimeCalculationService.js';

export class TotalController {
  constructor({ state, entryRepository, timeCalculationService = new TimeCalculationService() }) { this.state = state; this.entryRepository = entryRepository; this.timeCalculationService = timeCalculationService; this.view = null; this.requestId = 0; }
  async open(view) { const requestId = ++this.requestId; this.view = view; this.view.renderLoading(); await this.refresh(requestId); }
  close() { this.requestId += 1; this.view = null; }
  async refresh(requestId = this.requestId) {
    if (!this.view) return;
    try {
      const employeeId = this.state.employee?.id;
      const entries = employeeId ? await this.entryRepository.findByMonth(employeeId, this.state.selectedMonth, this.state.selectedYear) : [];
      const totalMinutes = this.timeCalculationService.sumDurations(entries);
      const totals = entries.reduce((result, entry) => {
        const multiplier = this.timeCalculationService.getOvertimeMultiplier(entry.date);
        if (multiplier === 2) result.minutes100 += entry.durationMinutes; else result.minutes65 += entry.durationMinutes;
        result.totalPay += this.timeCalculationService.calculateOvertimePay(entry.durationMinutes, entry.date, this.state.payrollSettings);
        return result;
      }, { minutes65: 0, minutes100: 0, totalPay: 0 });
      if (requestId !== this.requestId || !this.view) return;
      this.view.render(this.state, { daysWithOvertime: new Set(entries.map((entry) => entry.date)).size, totalMinutes, ...totals, message: employeeId ? '' : 'Cadastre seu perfil para calcular os totais do período.' });
    } catch (error) {
      if (requestId !== this.requestId || !this.view) return;
      this.view.render(this.state, { daysWithOvertime: 0, totalMinutes: 0, minutes65: 0, minutes100: 0, totalPay: 0, message: error.message || 'Não foi possível carregar os totais do período.' });
    }
  }
}
