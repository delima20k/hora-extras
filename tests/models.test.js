import { describe, expect, it } from 'vitest';
import { Employee } from '../src/models/Employee.js';
import { PayrollSettings } from '../src/models/PayrollSettings.js';
import { WorkSchedule } from '../src/models/WorkSchedule.js';

describe('Employee', () => {
  it('normaliza o nome e preserva avatar ao atualizar', () => { const employee = new Employee({ name: '  Ana   D\'Ávila ', avatar: new Blob(['x']) }); const updated = employee.update({ name: ' Ana Lima ' }); expect(updated.name).toBe('Ana Lima'); expect(updated.avatar).toBe(employee.avatar); expect(updated.createdAt).toBe(employee.createdAt); });
  it('rejeita nome vazio', () => expect(() => new Employee({ name: '  ' })).toThrow('Nome'));
});

describe('WorkSchedule', () => {
  it('aceita jornada pela meia-noite', () => { const schedule = new WorkSchedule({ employeeId: 'a', workDays: ['monday'], startTime: '22:00', endTime: '06:00' }); expect(schedule.endTime).toBe('06:00'); });
  it('rejeita horário e dias inválidos', () => { expect(() => new WorkSchedule({ employeeId: 'a', workDays: [], startTime: '08:00', endTime: '17:00' })).toThrow(); expect(() => new WorkSchedule({ employeeId: 'a', workDays: ['monday'], startTime: '28:00', endTime: '17:00' })).toThrow(); });
});

describe('PayrollSettings', () => {
  it.each([1, 20, 29, 30, 31])('aceita fechamento no dia %i', (day) => expect(new PayrollSettings({ employeeId: 'a', salary: 2500, payrollClosingDay: day }).payrollClosingDay).toBe(day));
  it('usa jornada padrão e valida estratégia', () => { expect(new PayrollSettings({ employeeId: 'a', salary: 1, payrollClosingDay: 1 }).monthlyWorkload).toBe(220); expect(() => new PayrollSettings({ employeeId: 'a', salary: 1, payrollClosingDay: 1, invalidClosingDayStrategy: 'unknown' })).toThrow(); });
});
