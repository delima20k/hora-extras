import { describe, expect, it } from 'vitest';
import { TimeCalculationService } from '../src/services/TimeCalculationService.js';

const service = new TimeCalculationService();

describe('TimeCalculationService', () => {
  it.each([['00:00', 0], ['01:00', 60], ['06:30', 390], ['14:20', 860], ['23:59', 1439]])('converte %s em %i minutos', (time, minutes) => expect(service.parseTimeToMinutes(time)).toBe(minutes));
  it.each([['14:20', '18:00', 220], ['06:00', '14:20', 500], ['22:00', '02:00', 240], ['23:50', '00:20', 30], ['00:00', '01:00', 60], ['12:00', '12:30', 30]])('calcula %s até %s', (start, end, minutes) => expect(service.calculateDuration(start, end)).toBe(minutes));
  it('rejeita horários iguais e formatos inválidos', () => { expect(() => service.calculateDuration('14:00', '14:00')).toThrow('diferente'); [ '24:00', '23:60', '-01:00', '14:5', '6:30', 'abc', '', null, undefined ].forEach((time) => expect(() => service.parseTimeToMinutes(time)).toThrow('Horário inválido')); });
  it.each([[0, '0h00'], [30, '0h30'], [60, '1h00'], [90, '1h30'], [220, '3h40'], [1439, '23h59']])('formata %i minutos', (minutes, result) => expect(service.formatDuration(minutes)).toBe(result));
  it('identifica virada de dia e soma somente lançamentos ativos', () => { expect(service.isNextDay('14:20', '18:00')).toBe(false); expect(service.isNextDay('22:00', '02:00')).toBe(true); expect(service.isNextDay('14:00', '14:00')).toBe(false); expect(service.sumDurations([{ status: 'active', durationMinutes: 60 }, { status: 'deleted', durationMinutes: 90 }, { status: 'active', durationMinutes: 30 }])).toBe(90); expect(service.sumDurations([])).toBe(0); });
  it('detecta sobreposição inclusive em dias vizinhos e permite horários encostados', () => {
    const overnight = { id: 'yesterday', status: 'active', date: '2026-07-14', startTime: '23:00', endTime: '01:00' };
    expect(service.hasOverlap({ id: 'new', status: 'active', date: '2026-07-15', startTime: '00:30', endTime: '01:30' }, [overnight])).toBe(true);
    expect(service.hasOverlap({ id: 'next', status: 'active', date: '2026-07-15', startTime: '01:00', endTime: '02:00' }, [overnight])).toBe(false);
    expect(service.hasOverlap({ id: 'same', status: 'active', date: '2026-07-14', startTime: '23:30', endTime: '00:30' }, [overnight], 'yesterday')).toBe(false);
  });
});
