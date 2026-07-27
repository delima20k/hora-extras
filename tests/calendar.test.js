import { describe, expect, it, vi } from 'vitest';
import { CalendarController } from '../src/controllers/CalendarController.js';
import { CalendarService } from '../src/services/CalendarService.js';
import { CalendarView } from '../src/views/CalendarView.js';

const service = new CalendarService(() => new Date(2026, 6, 15, 12));

describe('CalendarService', () => {
  it('gera janeiro com a semana iniciando em domingo', () => { const weeks = service.getMonthWeeks(1, 2026); expect(weeks[0]).toHaveLength(7); expect(weeks[0][0].date).toBe('2025-12-28'); expect(weeks.flat().find((day) => day.date === '2026-01-01').weekday).toBe(4); });
  it('trata fevereiro comum e bissexto', () => { expect(service.getMonthWeeks(2, 2025).flat().some((day) => day.date === '2025-02-29')).toBe(false); expect(service.getMonthWeeks(2, 2024).flat().some((day) => day.date === '2024-02-29')).toBe(true); });
  it('gera dezembro e identifica flags da data', () => { const days = service.getMonthWeeks(12, 2026, '2026-12-31').flat(); const selected = days.find((day) => day.date === '2026-12-31'); const today = service.getMonthWeeks(7, 2026).flat().find((day) => day.date === '2026-07-15'); expect(selected.isSelected).toBe(true); expect(today.isToday).toBe(true); expect(selected.isFuture).toBe(true); expect(service.getDayByDate('2026-07-14', 7, 2026).isPast).toBe(true); });
});

describe('CalendarController', () => {
  const createController = () => {
    const state = { selectedMonth: 1, selectedYear: 2026, selectedDate: null }; const storage = { set: vi.fn() }; const onDaySelected = vi.fn(); const controller = new CalendarController({ state, storage, calendarService: service, onDaySelected }); const view = { renderMonth: vi.fn(), updateSelection: vi.fn() }; controller.attachView(view); return { state, storage, onDaySelected, controller, view };
  };
  it('troca mês e ano sem limites artificiais', () => { const { controller, state, storage, view } = createController(); controller.changeMonth(-1); expect(state).toMatchObject({ selectedMonth: 12, selectedYear: 2025 }); controller.changeMonth(13); expect(state).toMatchObject({ selectedMonth: 1, selectedYear: 2027 }); expect(storage.set).toHaveBeenCalled(); expect(view.renderMonth).toHaveBeenCalledTimes(3); });
  it('atualiza somente a seleção ao escolher dia do mês atual', () => { const { controller, state, view, onDaySelected } = createController(); const first = service.getDayByDate('2026-01-12', 1, 2026); const second = service.getDayByDate('2026-01-14', 1, 2026); controller.selectDay(first); controller.selectDay(second); expect(state.selectedDate).toBe('2026-01-14'); expect(view.updateSelection).toHaveBeenLastCalledWith('2026-01-12', expect.objectContaining({ date: '2026-01-14' })); expect(onDaySelected).toHaveBeenCalledWith(expect.objectContaining({ date: '2026-01-14' })); });
  it('navega ao selecionar um dia externo', () => { const { controller, state, view } = createController(); const outside = service.getMonthWeeks(1, 2026).flat().find((day) => day.date === '2025-12-31'); controller.selectDay(outside); expect(state).toMatchObject({ selectedMonth: 12, selectedYear: 2025, selectedDate: '2025-12-31' }); expect(view.renderMonth).toHaveBeenCalledTimes(2); });
});

describe('CalendarView', () => {
  it('renderiza a grade acessível e envia o dia clicado', () => {
    const root = document.createElement('div'); const view = new CalendarView(root, service); const onDaySelected = vi.fn(); const model = { month: 7, year: 2026, title: 'Julho de 2026', weekdayLabels: service.getWeekdayLabels(), weeks: service.getMonthWeeks(7, 2026) };
    view.renderMonth(model, { onPrevious: vi.fn(), onNext: vi.fn(), onDaySelected });
    const selected = root.querySelector('[data-date="2026-07-15"]'); expect(root.querySelectorAll('.calendar-day')).toHaveLength(35); expect(selected.getAttribute('aria-label')).toContain('15 de julho de 2026'); selected.click(); expect(onDaySelected).toHaveBeenCalledWith(expect.objectContaining({ date: '2026-07-15' }));
  });
  it('troca classes sem recriar a grade', () => {
    const root = document.createElement('div'); const view = new CalendarView(root, service); const model = { month: 7, year: 2026, title: 'Julho de 2026', weekdayLabels: service.getWeekdayLabels(), weeks: service.getMonthWeeks(7, 2026, '2026-07-14') };
    view.renderMonth(model, { onPrevious: vi.fn(), onNext: vi.fn(), onDaySelected: vi.fn() }); const grid = root.querySelector('.calendar-grid'); view.updateSelection('2026-07-14', service.getDayByDate('2026-07-15', 7, 2026, '2026-07-15')); expect(root.querySelector('.calendar-grid')).toBe(grid); expect(root.querySelector('[data-date="2026-07-15"]').classList.contains('is-selected')).toBe(true);
  });
});
