import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DayController } from '../src/controllers/DayController.js';
import { OvertimeEntry, calculateDurationMinutes } from '../src/models/OvertimeEntry.js';
import { OvertimeEntryRepository } from '../src/repositories/OvertimeEntryRepository.js';
import { DatabaseService } from '../src/services/DatabaseService.js';

describe('OvertimeEntry', () => {
  const valid = { employeeId: 'employee-1', date: '2026-07-15', startTime: '14:20', endTime: '18:00' };
  it('calcula e salva a duração', () => { expect(calculateDurationMinutes('14:20', '18:00')).toBe(220); expect(new OvertimeEntry(valid).durationMinutes).toBe(220); });
  it('aceita virada de dia e rejeita horários inválidos', () => { expect(new OvertimeEntry({ ...valid, startTime: '22:00', endTime: '02:00' }).durationMinutes).toBe(240); expect(() => new OvertimeEntry({ ...valid, startTime: '14:00', endTime: '14:00' })).toThrow('diferente'); });
});

describe('OvertimeEntryRepository', () => {
  let database; let repository;
  beforeEach(async () => { database = new DatabaseService(); await database.open(); await database.clear('overtimeEntries'); repository = new OvertimeEntryRepository(database); });
  it('busca por mês e aplica soft delete', async () => { const entry = new OvertimeEntry({ employeeId: 'employee-1', date: '2026-07-15', startTime: '14:20', endTime: '16:00' }); await repository.create(entry); expect(await repository.findByMonth('employee-1', 7, 2026)).toHaveLength(1); await repository.delete(entry); expect(await repository.findByDate('employee-1', '2026-07-15')).toHaveLength(0); });
});

describe('DayController', () => {
  const createController = () => {
    const entries = []; const repository = { findByDate: vi.fn(async () => entries.filter((entry) => entry.status === 'active')), create: vi.fn(async (entry) => entries.push(entry.toObject())), update: vi.fn(async (entry) => { const index = entries.findIndex((item) => item.id === entry.id); entries[index] = entry.toObject(); }), delete: vi.fn(async (entry) => { const index = entries.findIndex((item) => item.id === entry.id); entries[index] = new OvertimeEntry(entries[index]).softDelete().toObject(); }) };
    const state = { selectedDate: '2026-07-15', employee: { id: 'employee-1' }, payrollSettings: { salary: 2200, monthlyWorkload: 220 }, workSchedule: { startTime: '06:00', endTime: '14:20' } }; const view = { renderLoading: vi.fn(), render: vi.fn(), updateDurationPreview: vi.fn() }; return { controller: new DayController({ state, dateService: {}, entryRepository: repository }), repository, view };
  };
  it('salva apenas horas fora da jornada e edita lançamento', async () => { const { controller, repository, view } = createController(); await controller.open(view, vi.fn()); controller.openCreateForm(); await controller.save({ startTime: '14:20', endTime: '18:00', notes: '' }); expect(repository.create).toHaveBeenCalled(); const saved = repository.create.mock.calls[0][0].toObject(); controller.openEditForm(saved); await controller.save({ startTime: '14:30', endTime: '18:00', notes: '' }); expect(repository.update).toHaveBeenCalled(); });
  it('exclui logicamente após confirmação', async () => { const { controller, repository, view } = createController(); await controller.open(view, vi.fn()); controller.openCreateForm(); await controller.save({ startTime: '14:20', endTime: '15:00', notes: '' }); vi.stubGlobal('confirm', vi.fn(() => true)); await controller.delete(repository.create.mock.calls[0][0].toObject()); expect(repository.delete).toHaveBeenCalled(); vi.unstubAllGlobals(); });
  it('mostra adicional e bloqueia horários dentro da jornada', async () => { const { controller, repository, view } = createController(); await controller.open(view, vi.fn()); controller.updateDurationPreview('22:00', '02:00'); expect(view.updateDurationPreview).toHaveBeenCalledWith(expect.objectContaining({ text: expect.stringContaining('adicional de 65%'), isError: false })); controller.openCreateForm(); await controller.save({ startTime: '13:00', endTime: '15:00', notes: '' }); expect(repository.create).not.toHaveBeenCalled(); expect(view.render).toHaveBeenLastCalledWith(expect.objectContaining({ message: expect.stringContaining('invade a jornada normal') }), expect.any(Object)); });
  it('bloqueia sobreposição fora da jornada e permite trocar para dia anterior', async () => { const { controller, repository, view } = createController(); await controller.open(view, vi.fn()); controller.openCreateForm(); await controller.save({ startTime: '14:20', endTime: '16:00', notes: '' }); controller.openCreateForm(); await controller.save({ startTime: '15:00', endTime: '17:00', notes: '' }); expect(repository.create).toHaveBeenCalledTimes(1); controller.selectDate('2026-07-14'); await Promise.resolve(); expect(repository.findByDate).toHaveBeenLastCalledWith('employee-1', '2026-07-14'); });
});
