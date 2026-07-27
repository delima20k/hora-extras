import { element } from '../utils/dom.js';
import { CalendarView } from './CalendarView.js';

export class MonthView {
  render(container, state, { calendarController }) {
    const calendarRoot = element('section', { className: 'calendar', 'aria-label': 'Calendário mensal' });
    container.replaceChildren(element('section', { className: 'screen' }, [element('p', { className: 'eyebrow', text: 'Navegue pelos dias' }), element('h2', { text: 'Mês' }), calendarRoot]));
    calendarController.attachView(new CalendarView(calendarRoot, calendarController.calendarService));
  }
}
