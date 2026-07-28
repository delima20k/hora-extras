import { describe, expect, it } from 'vitest';
import { TimeCalculationService } from '../src/services/TimeCalculationService.js';

const service = new TimeCalculationService();

describe('TimeCalculationService', () => {
  it.each([['00:00', 0], ['01:00', 60], ['06:30', 390], ['14:20', 860], ['23:59', 1439]])('converte %s em %i minutos', (time, minutes) => expect(service.parseTimeToMinutes(time)).toBe(minutes));
  it.each([['14:20', '18:00', 220], ['06:00', '14:20', 500], ['22:00', '02:00', 240], ['23:50', '00:20', 30]])('calcula %s até %s', (start, end, minutes) => expect(service.calculateDuration(start, end)).toBe(minutes));
  it('rejeita horários iguais e formatos inválidos', () => { expect(() => service.calculateDuration('14:00', '14:00')).toThrow('diferente'); expect(() => service.parseTimeToMinutes('24:00')).toThrow('Horário inválido'); });
  it('formata duração e identifica virada de dia', () => { expect(service.formatDuration(220)).toBe('3h40'); expect(service.isNextDay('22:00', '02:00')).toBe(true); });
  it('detecta sobreposição inclusive em dias vizinhos', () => { const overnight = { id: 'yesterday', status: 'active', date: '2026-07-14', startTime: '23:00', endTime: '01:00' }; expect(service.hasOverlap({ id: 'new', status: 'active', date: '2026-07-15', startTime: '00:30', endTime: '01:30' }, [overnight])).toBe(true); });
  it('calcula adicional de 65% em dias úteis e 100% em domingos e feriados', () => {
    expect(service.getOvertimeMultiplier('2026-07-27')).toBe(1.65);
    expect(service.getOvertimeMultiplier('2026-07-26')).toBe(2);
    expect(service.getOvertimeMultiplier('2026-12-25')).toBe(2);
    expect(service.calculateOvertimePay(60, '2026-07-27', { salary: 2200, monthlyWorkload: 220 })).toBe(16.5);
    expect(service.overlapsNormalSchedule('14:20', '18:00', { startTime: '06:00', endTime: '14:20' })).toBe(false);
    expect(service.overlapsNormalSchedule('13:00', '15:00', { startTime: '06:00', endTime: '14:20' })).toBe(true);
  });
});
