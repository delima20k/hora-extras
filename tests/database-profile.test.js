import { beforeEach, describe, expect, it } from 'vitest';
import { DatabaseService } from '../src/services/DatabaseService.js';
import { ProfileRepository } from '../src/repositories/ProfileRepository.js';

let database; let profiles;
beforeEach(async () => { database = new DatabaseService(); await database.open(); await Promise.all(['employees', 'workSchedules', 'payrollSettings', 'overtimeEntries', 'appSettings'].map((store) => database.clear(store))); profiles = new ProfileRepository(database); });

const profile = (name = 'Ana') => ({ name, notes: '', workSchedule: { workDays: ['monday'], startTime: '08:00', endTime: '17:00', breakDurationMinutes: 60 }, payrollSettings: { salary: 2500, payrollClosingDay: 20, invalidClosingDayStrategy: 'last-day-of-month', monthlyWorkload: 220 } });

describe('ProfileRepository', () => {
  it('cria e atualiza apenas um perfil principal', async () => { const first = await profiles.saveProfileBundle(profile()); const second = await profiles.saveProfileBundle(profile('Ana Souza')); expect(second.employee.id).toBe(first.employee.id); expect((await database.getAll('employees')).length).toBe(1); expect((await profiles.loadPrimary()).employee.name).toBe('Ana Souza'); });
  it('preserva o avatar quando apenas dados textuais mudam', async () => { await profiles.saveProfileBundle({ ...profile(), avatar: new Blob(['imagem'], { type: 'image/webp' }) }); await profiles.saveProfileBundle(profile('Ana Lima')); expect((await profiles.loadPrimary()).employee.avatar).toBeTruthy(); });
  it('preserva os dados anteriores quando a transação falha', async () => { await profiles.saveProfileBundle(profile()); await expect(profiles.saveProfileBundle({ ...profile('Nome novo'), workSchedule: { ...profile().workSchedule, workDays: [] } })).rejects.toThrow(); expect((await profiles.loadPrimary()).employee.name).toBe('Ana'); });
  it('consulta por índice e rejeita store inexistente', async () => { const result = await profiles.saveProfileBundle(profile()); expect(await database.getByIndex('payrollSettings', 'employeeId', result.employee.id)).toHaveLength(1); await expect(database.getAll('unknown')).rejects.toThrow(); });
});
