import { describe, expect, it, vi } from 'vitest';
import { TotalController } from '../src/controllers/TotalController.js';

describe('TotalController', () => {
  it('soma os lançamentos ativos do mês e calcula o valor a receber', async () => {
    const state = {
      employee: { id: 'employee-1' },
      selectedMonth: 7,
      selectedYear: 2026,
      payrollSettings: { salary: 2200, monthlyWorkload: 220 }
    };
    const entryRepository = {
      findByMonth: vi.fn(async () => [
        { date: '2026-07-10', durationMinutes: 120, status: 'active' },
        { date: '2026-07-10', durationMinutes: 30, status: 'active' },
        { date: '2026-07-11', durationMinutes: 60, status: 'active' }
      ])
    };
    const view = { renderLoading: vi.fn(), render: vi.fn() };
    const controller = new TotalController({ state, entryRepository });

    await controller.open(view);

    expect(entryRepository.findByMonth).toHaveBeenCalledWith('employee-1', 7, 2026);
    expect(view.render).toHaveBeenCalledWith(state, expect.objectContaining({ daysWithOvertime: 2, totalMinutes: 210, totalPay: 35 }));
  });
});
