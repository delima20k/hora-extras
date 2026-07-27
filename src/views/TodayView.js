import { element } from '../utils/dom.js';
import { displayName, formatDate } from '../utils/formatters.js';

export class TodayView {
  render(container, state, { date }) {
    const dateText = formatDate(date); const [weekday, ...rest] = dateText.split(',');
    container.replaceChildren(element('section', { className: 'screen today-screen' }, [element('p', { className: 'eyebrow', text: `Olá, ${displayName(state.employee)}` }), element('h2', { text: weekday.replace(/^./, (char) => char.toUpperCase()) }), element('p', { className: 'large-date', text: rest.join(',').trim().replace(/^./, (char) => char.toUpperCase()) }), element('section', { className: 'empty-state' }, [element('h3', { text: 'Sem lançamentos hoje' }), element('p', { text: 'Nenhuma hora extra lançada neste dia. Os lançamentos serão adicionados futuramente.' })]) ]));
  }
}
