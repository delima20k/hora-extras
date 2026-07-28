import { describe, expect, it, vi } from 'vitest';
import { TotalController } from '../src/controllers/TotalController.js';

describe('TotalController', () => {
  it('separa valores pendentes e recebidos no relatorio mensal', async () => {
    const state = { employee: { id: 'employee-1' }, payrollSettings: { salary: 2200, monthlyWorkload: 220 } };
    const entryRepository = { findAll: vi.fn(async () => [
      { date: '2026-07-10', durationMinutes: 120, status: 'active' },
      { date: '2026-07-10', durationMinutes: 30, status: 'active', paymentStatus: 'received' },
      { date: '2026-07-11', durationMinutes: 60, status: 'active' }
    ]) };
    const view = { container: document.createElement('main'), renderLoading: vi.fn(), render: vi.fn() };
    const controller = new TotalController({ state, entryRepository });

    await controller.open(view);

    expect(entryRepository.findAll).toHaveBeenCalledWith('employee-1');
    expect(view.render).toHaveBeenCalledWith(expect.anything(), state, expect.objectContaining({
      total: expect.objectContaining({ totalMinutes: 210, minutes65: 210, minutes100: 0, totalPay: 57.75 }),
      pending: expect.objectContaining({ totalMinutes: 180, totalPay: 49.5 }),
      received: expect.objectContaining({ totalMinutes: 30, totalPay: 8.25 }),
      months: [expect.objectContaining({ key: '2026-07' })]
    }), expect.anything());
  });
});
