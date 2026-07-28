import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NavigationController } from '../src/controllers/NavigationController.js';

describe('NavigationController', () => {
  let layout; let state; let controller;
  beforeEach(() => { document.body.innerHTML = '<main id="app"></main>'; layout = { refs: { main: document.querySelector('main') }, updateHeader: vi.fn() }; state = { currentRoute: 'today', selectedMonth: 1, selectedYear: 2026, employee: null, avatarUrl: null }; controller = new NavigationController({ layout, state, dateService: { now: () => new Date(2026, 6, 27), toDateKey: () => '2026-07-27' }, onNavigate: vi.fn(), onPeriodChange: vi.fn(), profileActions: { onSubmit: vi.fn(), onFileChange: vi.fn() } }); });
  it('abre hoje e trata rota inválida', () => { window.location.hash = '#invalid'; controller.render(); expect(state.currentRoute).toBe('today'); expect(layout.updateHeader).toHaveBeenCalledWith('Dia atual', null, null); });
  it('navega para total e atualiza título', () => { controller.render('total'); expect(state.currentRoute).toBe('total'); expect(layout.updateHeader).toHaveBeenCalledWith('Total a receber', null, null); });
});
