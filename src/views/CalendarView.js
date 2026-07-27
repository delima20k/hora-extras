import { button, element } from '../utils/dom.js';

export class CalendarView {
  constructor(container, calendarService) { this.container = container; this.calendarService = calendarService; this.dayButtons = new Map(); }
  renderMonth(model, handlers) {
    this.dayButtons.clear();
    const previous = button('‹', { className: 'calendar-nav-button', 'aria-label': 'Mês anterior', onClick: handlers.onPrevious });
    const next = button('›', { className: 'calendar-nav-button', 'aria-label': 'Próximo mês', onClick: handlers.onNext });
    const navigation = element('div', { className: 'calendar-navigation' }, [previous, element('h3', { className: 'calendar-title', text: model.title, 'aria-live': 'polite' }), next]);
    const weekdayRow = element('div', { className: 'calendar-weekdays', role: 'row' }, model.weekdayLabels.map((label) => element('span', { role: 'columnheader', text: label })));
    const grid = element('div', { className: 'calendar-grid', role: 'grid', 'aria-label': `Calendário de ${model.title}` });
    model.weeks.flat().forEach((day) => {
      const classes = ['calendar-day']; if (!day.isCurrentMonth) classes.push('is-outside-month'); if (day.isToday) classes.push('is-today'); if (day.isSelected) classes.push('is-selected');
      const dayButton = button(String(day.day), { className: classes.join(' '), 'data-date': day.date, 'aria-label': this.calendarService.getAriaLabel(day), 'aria-pressed': String(day.isSelected), role: 'gridcell', onClick: () => handlers.onDaySelected(day) });
      this.dayButtons.set(day.date, dayButton); grid.append(dayButton);
    });
    this.container.replaceChildren(navigation, weekdayRow, grid);
  }
  updateSelection(previousDate, selectedDay) {
    const previous = this.dayButtons.get(previousDate); if (previous) { previous.classList.remove('is-selected'); previous.setAttribute('aria-pressed', 'false'); }
    const current = this.dayButtons.get(selectedDay.date); if (current) { current.classList.add('is-selected'); current.setAttribute('aria-pressed', 'true'); }
  }
}
