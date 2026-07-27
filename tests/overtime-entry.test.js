import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DayController } from '../src/controllers/DayController.js';
import { OvertimeEntry, calculateDurationMinutes } from '../src/models/OvertimeEntry.js';
import { OvertimeEntryRepository } from '../src/repositories/OvertimeEntryRepository.js';
import { DatabaseService } from '../src/services/DatabaseService.js';

describe('OvertimeEntry', () => {
  const valid = { employeeId: 'employee-1', date: '2026-07-15', startTime: '14:20', endTime: '18:00' };
  it('calcula e salva a duração', () => { expect(calculateDurationMinutes('14:20', '18:00')).toBe(220); expect(new OvertimeEntry(valid).durationMinutes).toBe(220); });
  it('aceita virada de dia, recalcula duração e rejeita dados inválidos', () => { expect(new OvertimeEntry({ ...valid, startTime: '22:00', endTime: '02:00' }).durationMinutes).toBe(240); expect(() => new OvertimeEntry({ ...valid, startTime: '14:00', endTime: '14:00' })).toThrow('diferente'); expect(new OvertimeEntry({ ...valid, durationMinutes: 1 }).durationMinutes).toBe(220); expect(() => new OvertimeEntry({ ...valid, notes: '<b>texto</b>' })).toThrow(); expect(() => new OvertimeEntry({ ...valid, notes: 'x'.repeat(301) })).toThrow(); });
});

describe('OvertimeEntryRepository', () => {
  let database; let repository;
  beforeEach(async () => { database = new DatabaseService(); await database.open(); await database.clear('overtimeEntries'); repository = new OvertimeEntryRepository(database); });
  it('busca por data e mês e aplica soft delete', async () => {
    const july = new OvertimeEntry({ employeeId: 'employee-1', date: '2026-07-15', startTime: '14:00', endTime: '16:00' }); const august = new OvertimeEntry({ employeeId: 'employee-1', date: '2026-08-01', startTime: '14:00', endTime: '16:00' });
    await repository.create(july); await repository.create(august); expect(await repository.findByDate('employee-1', '2026-07-15')).toHaveLength(1); expect(await repository.findByMonth('employee-1', 7, 2026)).toHaveLength(1); await repository.delete(july); expect(await repository.findByDate('employee-1', '2026-07-15')).toHaveLength(0); expect((await repository.findById(july.id)).status).toBe('deleted');
  });
});

describe('DayController', () => {
  const createController = () => {
    const entries = []; const repository = { findByDate: vi.fn(async () => entries.filter((entry) => entry.status === 'active')), create: vi.fn(async (entry) => entries.push(entry.toObject())), update: vi.fn(async (entry) => { const index = entries.findIndex((item) => item.id === entry.id); entries[index] = entry.toObject(); }), delete: vi.fn(async (entry) => { const index = entries.findIndex((item) => item.id === entry.id); entries[index] = new OvertimeEntry(entries[index]).softDelete().toObject(); }) };
    const state = { selectedDate: '2026-07-15', employee: { id: 'employee-1' }, workSchedule: { startTime: '06:00', endTime: '14:20' } }; const view = { renderLoading: vi.fn(), render: vi.fn(), updateDurationPreview: vi.fn() }; const onEntriesChanged = vi.fn(); return { controller: new DayController({ state, dateService: {}, entryRepository: repository, onEntriesChanged }), repository, view, onEntriesChanged };
  };
  it('cria, edita e atualiza a lista sem recarregar o aplicativo', async () => {
    const { controller, repository, view, onEntriesChanged } = createController(); await controller.open(view, vi.fn()); controller.openCreateForm(); await controller.save({ startTime: '14:20', endTime: '18:00', notes: '  Atendimento extra  ' }); expect(repository.create).toHaveBeenCalled(); expect(view.render).toHaveBeenLastCalledWith(expect.objectContaining({ entries: [expect.objectContaining({ durationMinutes: 220, notes: 'Atendimento extra' })] }), expect.any(Object)); const saved = repository.create.mock.calls[0][0].toObject(); controller.openEditForm(saved); await controller.save({ startTime: '14:30', endTime: '18:00', notes: 'Atualizado' }); expect(repository.update).toHaveBeenCalled(); expect(onEntriesChanged).toHaveBeenCalledTimes(2);
  });
  it('exclui logicamente após confirmação', async () => {
    const { controller, repository, view, onEntriesChanged } = createController(); await controller.open(view, vi.fn()); controller.openCreateForm(); await controller.save({ startTime: '14:00', endTime: '15:00', notes: '' }); vi.stubGlobal('confirm', vi.fn(() => true)); await controller.delete(repository.create.mock.calls[0][0].toObject()); expect(repository.delete).toHaveBeenCalled(); expect(onEntriesChanged).toHaveBeenCalledTimes(2); vi.unstubAllGlobals();
  });
  it('calcula prévia em memória, soma ativos e bloqueia sobreposição', async () => {
    const { controller, repository, view } = createController(); await controller.open(view, vi.fn()); controller.updateDurationPreview('22:00', '02:00'); expect(view.updateDurationPreview).toHaveBeenCalledWith(expect.objectContaining({ text: 'Duração calculada: 4h00.' })); controller.openCreateForm(); await controller.save({ startTime: '14:00', endTime: '16:00', notes: '' }); controller.openCreateForm(); await controller.save({ startTime: '15:00', endTime: '17:00', notes: '' }); expect(repository.create).toHaveBeenCalledTimes(1); expect(view.render).toHaveBeenLastCalledWith(expect.objectContaining({ totalDuration: '2h00', message: 'Este horário se sobrepõe a outro lançamento do mesmo dia.' }), expect.any(Object));
  });
  it('mostra aviso de jornada normal sem impedir o salvamento', async () => {
    const { controller, repository, view } = createController(); await controller.open(view, vi.fn()); controller.updateDurationPreview('13:00', '15:00'); expect(view.updateDurationPreview).toHaveBeenCalledWith(expect.objectContaining({ warning: expect.stringContaining('antes do fim') })); controller.openCreateForm(); await controller.save({ startTime: '13:00', endTime: '15:00', notes: '' }); expect(repository.create).toHaveBeenCalled();
  });
  it('identifica o aviso em jornada normal que atravessa a meia-noite', async () => {
    const { controller, view } = createController(); controller.state.workSchedule = { startTime: '22:00', endTime: '06:00' }; await controller.open(view, vi.fn()); controller.updateDurationPreview('23:00', '01:00'); expect(view.updateDurationPreview).toHaveBeenCalledWith(expect.objectContaining({ warning: expect.stringContaining('antes do fim') }));
  });
});
