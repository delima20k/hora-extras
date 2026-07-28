import { describe, expect, it } from 'vitest';
import { PayrollPeriodService } from '../src/services/PayrollPeriodService.js';

describe('PayrollPeriodService', () => {
  const settings = { payrollClosingDay: 20, invalidClosingDayStrategy: 'last-day-of-month' };
  const service = new PayrollPeriodService();
  it('calcula o ciclo de 21 a 20', () => {
    expect(service.getPeriodForDate('2026-07-21', settings)).toEqual({ startDate: '2026-07-21', endDate: '2026-08-20' });
    expect(service.getPeriodForDate('2026-08-20', settings)).toEqual({ startDate: '2026-07-21', endDate: '2026-08-20' });
  });
  it('considera fechado somente depois do dia de fechamento', () => {
    expect(service.isClosed('2026-07-20', settings, new Date(2026, 6, 20, 18))).toBe(false);
    expect(service.isClosed('2026-07-20', settings, new Date(2026, 6, 21))).toBe(true);
  });
});
