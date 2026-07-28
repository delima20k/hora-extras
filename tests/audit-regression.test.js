import { describe, expect, it, vi } from 'vitest';
import { DayController } from '../src/controllers/DayController.js';
import { OvertimeEntry } from '../src/models/OvertimeEntry.js';
import { OvertimeEntryRepository } from '../src/repositories/OvertimeEntryRepository.js';
import { DatabaseService } from '../src/services/DatabaseService.js';
import { PwaService } from '../src/services/PwaService.js';

describe('auditoria de regressão', () => {
  it('consulta lançamentos por dia e por mês pelo índice composto', async () => {
    const database = new DatabaseService();
    await database.open();
    await database.clear('overtimeEntries');
    const repository = new OvertimeEntryRepository(database);
    await repository.create(new OvertimeEntry({ employeeId: 'audit-user', date: '2026-07-02', startTime: '08:00', endTime: '09:00' }));
    await repository.create(new OvertimeEntry({ employeeId: 'audit-user', date: '2026-07-31', startTime: '10:00', endTime: '11:00' }));
    await repository.create(new OvertimeEntry({ employeeId: 'audit-user', date: '2026-08-01', startTime: '10:00', endTime: '11:00' }));
    expect(await repository.findByDate('audit-user', '2026-07-02')).toHaveLength(1);
    expect(await repository.findByMonth('audit-user', 7, 2026)).toHaveLength(2);
    database.close();
  });

  it('não renderiza uma tela do dia depois de ela ter sido fechada', async () => {
    let resolveEntries;
    const repository = { findByDate: vi.fn(() => new Promise((resolve) => { resolveEntries = resolve; })) };
    const view = { renderLoading: vi.fn(), render: vi.fn(), updateDurationPreview: vi.fn() };
    const controller = new DayController({ state: { selectedDate: '2026-07-15', employee: { id: 'audit-user' } }, dateService: {}, entryRepository: repository });
    const opening = controller.open(view, vi.fn());
    controller.close();
    resolveEntries([]);
    await opening;
    expect(view.renderLoading).toHaveBeenCalledOnce();
    expect(view.render).not.toHaveBeenCalled();
  });

  it('respeita a dispensa temporária do card de instalação e remove listeners', () => {
    const storage = { get: vi.fn(() => ({ at: Date.now() })), set: vi.fn() };
    const service = new PwaService(storage);
    const available = vi.fn();
    service.listen(available);
    window.dispatchEvent(new Event('beforeinstallprompt'));
    expect(available).not.toHaveBeenCalled();
    service.destroy();
    storage.get.mockReturnValue(null);
    window.dispatchEvent(new Event('beforeinstallprompt'));
    expect(available).not.toHaveBeenCalled();
  });
});
