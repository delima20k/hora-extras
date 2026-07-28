import { PayrollPeriodService } from './PayrollPeriodService.js';
import { TimeCalculationService } from './TimeCalculationService.js';

export class PayrollClosureService {
  constructor({ payrollPeriodService = new PayrollPeriodService(), timeCalculationService = new TimeCalculationService() } = {}) { this.payrollPeriodService = payrollPeriodService; this.timeCalculationService = timeCalculationService; }
  summarize(entries, payrollSettings) {
    return entries.reduce((total, entry) => {
      const value = this.timeCalculationService.calculateOvertimePay(entry.durationMinutes, entry.date, payrollSettings);
      total.totalMinutes += entry.durationMinutes; total.totalPay += value;
      if (this.timeCalculationService.getOvertimeMultiplier(entry.date) === 2) { total.minutes100 += entry.durationMinutes; total.value100 += value; } else { total.minutes65 += entry.durationMinutes; total.value65 += value; }
      return total;
    }, { minutes65: 0, minutes100: 0, value65: 0, value100: 0, totalMinutes: 0, totalPay: 0 });
  }
  async sync({ employeeId, entries, payrollSettings, closureRepository, now = new Date() }) {
    if (!employeeId || !payrollSettings?.payrollClosingDay) return [];
    const existing = await closureRepository.findAll(employeeId);
    const existingEnds = new Set(existing.map((closure) => closure.endDate));
    const closedPeriods = this.payrollPeriodService.getClosedPeriods(entries, payrollSettings, now);
    for (const period of closedPeriods) {
      if (existingEnds.has(period.endDate)) continue;
      const totals = this.summarize(period.entries, payrollSettings);
      await closureRepository.save({ id: `${employeeId}:${period.endDate}`, employeeId, startDate: period.startDate, endDate: period.endDate, closedAt: now.toISOString(), ...totals });
    }
    return closureRepository.findAll(employeeId);
  }
}
