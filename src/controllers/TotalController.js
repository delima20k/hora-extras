import { TimeCalculationService } from '../services/TimeCalculationService.js';

export class TotalController {
  constructor({ state, entryRepository, timeCalculationService = new TimeCalculationService() }) {
    this.state = state;
    this.entryRepository = entryRepository;
    this.timeCalculationService = timeCalculationService;
    this.view = null;
  }

  async open(view) {
    this.view = view;
    this.view.renderLoading();
    await this.refresh();
  }

  async refresh() {
    if (!this.view) return;
    try {
      const employeeId = this.state.employee?.id;
      const entries = employeeId
        ? await this.entryRepository.findByMonth(employeeId, this.state.selectedMonth, this.state.selectedYear)
        : [];
      const totalMinutes = this.timeCalculationService.sumDurations(entries);
      const monthlyWorkload = Number(this.state.payrollSettings?.monthlyWorkload);
      const salary = Number(this.state.payrollSettings?.salary);
      const hourlyRate = salary > 0 && monthlyWorkload > 0 ? salary / monthlyWorkload : 0;
      this.view.render(this.state, {
        daysWithOvertime: new Set(entries.map((entry) => entry.date)).size,
        totalMinutes,
        totalPay: hourlyRate * (totalMinutes / 60),
        message: employeeId ? '' : 'Cadastre seu perfil para calcular os totais do período.'
      });
    } catch (error) {
      this.view.render(this.state, { daysWithOvertime: 0, totalMinutes: 0, totalPay: 0, message: error.message || 'Não foi possível carregar os totais do período.' });
    }
  }
}
