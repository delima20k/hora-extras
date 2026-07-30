import { PayrollPeriodService } from './PayrollPeriodService.js';
import { TimeCalculationService } from './TimeCalculationService.js';

export class PayrollClosureService {
  constructor({ payrollPeriodService = new PayrollPeriodService(), timeCalculationService = new TimeCalculationService() } = {}) { this.payrollPeriodService = payrollPeriodService; this.timeCalculationService = timeCalculationService; }
  summarize(entries, payrollSettings, workSchedule = null) {
    return entries.reduce((total, entry) => {
      const nightMinutes = this.timeCalculationService.calculateNightMinutes(entry.startTime, entry.endTime);
      const nightPay = this.timeCalculationService.calculateOvertimePay(0, entry.date, payrollSettings, nightMinutes, workSchedule);
      const value = this.timeCalculationService.calculateOvertimePay(entry.durationMinutes, entry.date, payrollSettings, nightMinutes, workSchedule);
      total.totalMinutes += entry.durationMinutes; total.totalPay += value;
      total.nightMinutes += nightMinutes; total.nightPay += nightPay;
      if (this.timeCalculationService.getOvertimeMultiplier(entry.date, workSchedule) === 2) { total.minutes100 += entry.durationMinutes; total.value100 += value - nightPay; } else { total.minutes65 += entry.durationMinutes; total.value65 += value - nightPay; }
      return total;
    }, { minutes65: 0, minutes100: 0, value65: 0, value100: 0, nightMinutes: 0, nightPay: 0, totalMinutes: 0, totalPay: 0 });
  }
  async sync({ employeeId, entries, payrollSettings, workSchedule = null, closureRepository, now = new Date() }) {
    if (!employeeId || !payrollSettings?.payrollClosingDay) return [];
    const existing = await closureRepository.findAll(employeeId);
    const existingEnds = new Set(existing.map((closure) => closure.endDate));
    const closedPeriods = this.payrollPeriodService.getClosedPeriods(entries, payrollSettings, now);
    for (const period of closedPeriods) {
      if (existingEnds.has(period.endDate)) continue;
      const totals = this.summarize(period.entries, payrollSettings, workSchedule);
      await closureRepository.save({ id: `${employeeId}:${period.endDate}`, employeeId, startDate: period.startDate, endDate: period.endDate, closedAt: now.toISOString(), ...totals });
    }
    return closureRepository.findAll(employeeId);
  }
}
