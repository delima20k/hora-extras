import { element } from '../utils/dom.js';
import { formatCurrency, formatMonthYear } from '../utils/formatters.js';

export class TotalView {
  renderLoading(container) {
    container.replaceChildren(element('section', { className: 'screen' }, [element('p', { text: 'Carregando totais...' })]));
  }

  render(container, state, summary = {}) {
    const totalMinutes = Math.max(0, Number(summary.totalMinutes) || 0);
    const duration = `${Math.floor(totalMinutes / 60)}h${String(totalMinutes % 60).padStart(2, '0')}`;
    const rows = [
      ['Período', formatMonthYear(state.selectedMonth, state.selectedYear)],
      ['Dias com hora extra', String(summary.daysWithOvertime || 0)],
      ['Total de horas extras', duration],
      ['Total a receber', formatCurrency(summary.totalPay || 0)]
    ];
    const note = summary.message || 'O valor usa o salário e a jornada mensal cadastrados no perfil.';
    container.replaceChildren(element('section', { className: 'screen' }, [
      element('p', { className: 'eyebrow', text: 'Resumo do período' }),
      element('h2', { text: 'Total a receber' }),
      element('dl', { className: 'summary-list' }, rows.flatMap(([term, description]) => [element('dt', { text: term }), element('dd', { text: description })])),
      element('p', { className: 'screen-note', text: note })
    ]));
  }
}
