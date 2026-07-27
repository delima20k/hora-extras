import { element } from '../utils/dom.js';
import { formatCurrency, formatMonthYear } from '../utils/formatters.js';

export class TotalView {
  render(container, state) {
    const rows = [['Período', formatMonthYear(state.selectedMonth, state.selectedYear)], ['Dias com hora extra', '0'], ['Total de horas extras', '00h00'], ['Total a receber', formatCurrency(0)]];
    container.replaceChildren(element('section', { className: 'screen' }, [element('p', { className: 'eyebrow', text: 'Resumo do período' }), element('h2', { text: 'Total a receber' }), element('dl', { className: 'summary-list' }, rows.flatMap(([term, description]) => [element('dt', { text: term }), element('dd', { text: description })])), element('p', { className: 'screen-note', text: 'Os cálculos serão disponibilizados em uma próxima etapa.' })]));
  }
}
