import { button, element } from '../utils/dom.js';
import { formatCurrency, formatMonthYear } from '../utils/formatters.js';

const duration = (minutes = 0) => `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}`;

export class TotalView {
  constructor(container) { this.container = container; }
  renderLoading(container = this.container) { container.replaceChildren(element('section', { className: 'screen' }, [element('p', { text: 'Carregando relatório...' })])); }
  render(container = this.container, state, report = {}, handlers = {}) {
    this.container = container;
    const months = report.months || [];
    const content = [
      element('p', { className: 'eyebrow', text: 'Relatório financeiro' }),
      element('h2', { text: 'Horas e valores' }),
      element('p', { className: 'screen-note', text: report.message || (report.currentPeriod ? `Ciclo atual: ${report.currentPeriod.startDate.split('-').reverse().join('/')} a ${report.currentPeriod.endDate.split('-').reverse().join('/')}.` : 'Acompanhe os valores recebidos e pendentes.') }),
      this.createOverallCards(report),
      this.createClosedPayrolls(report.closures || []),
      element('h3', { className: 'report-section-title', text: 'Relatório por mês' }),
      months.length ? element('div', { className: 'monthly-report-list' }, months.map((month) => this.createMonth(month, handlers))) : element('section', { className: 'empty-state' }, [element('h3', { text: 'Nenhuma hora extra cadastrada.' }), element('p', { text: 'Os lançamentos salvos aparecerão aqui, separados por mês.' })])
    ];
    container.replaceChildren(element('section', { className: 'screen report-screen' }, content));
  }
  createOverallCards(report) {
    return element('div', { className: 'report-overview' }, [
      this.createCard('A receber', report.pending, 'pending'),
      this.createCard('Já recebido', report.received, 'received'),
      this.createCard('Total registrado', report.total, 'total')
    ]);
  }
  createCard(title, summary = {}, variant) {
    const night = summary.nightMinutes ? ` · ${duration(summary.nightMinutes)} noturno (+${formatCurrency(summary.nightPay)})` : '';
    return element('article', { className: `report-card ${variant}` }, [element('span', { text: title }), element('strong', { text: formatCurrency(summary.totalPay) }), element('small', { text: `${duration(summary.minutes65)} a 65% · ${duration(summary.minutes100)} a 100%${night}` })]);
  }
  createClosedPayrolls(closures) {
    if (!closures.length) return null;
    return element('section', { className: 'closed-payrolls' }, [
      element('h3', { className: 'report-section-title', text: 'Folhas fechadas' }),
      element('div', { className: 'closed-payroll-list' }, closures.map((closure) => element('article', { className: 'closed-payroll-card' }, [
        element('span', { text: `${closure.startDate.split('-').reverse().join('/')} a ${closure.endDate.split('-').reverse().join('/')}` }),
        element('strong', { text: formatCurrency(closure.totalPay) }),
        element('small', { text: `65%: ${duration(closure.minutes65)} (${formatCurrency(closure.value65)}) · 100%: ${duration(closure.minutes100)} (${formatCurrency(closure.value100)})` })
      ])))
    ]);
  }
  createMonth(month, handlers) {
    const [year, value] = month.key.split('-').map(Number);
    return element('article', { className: 'monthly-report' }, [
      element('div', { className: 'monthly-report-heading' }, [element('h4', { text: formatMonthYear(value, year) }), element('strong', { text: formatCurrency(month.total.totalPay) })]),
      this.createBreakdown('A receber', month.pending, 'pending'),
      this.createBreakdown('Já recebido', month.received, 'received'),
      element('div', { className: 'payment-entry-list' }, month.entries.map((entry) => this.createEntry(entry, handlers)))
    ]);
  }
  createBreakdown(label, summary, variant) {
    const children = [element('strong', { text: label }), element('span', { text: `65%: ${duration(summary.minutes65)} (${formatCurrency(summary.value65)})` }), element('span', { text: `100%: ${duration(summary.minutes100)} (${formatCurrency(summary.value100)})` })];
    if (summary.nightMinutes) children.push(element('span', { text: `Noturno 20%: ${duration(summary.nightMinutes)} (${formatCurrency(summary.nightPay)})` }));
    children.push(element('b', { text: formatCurrency(summary.totalPay) }));
    return element('div', { className: `payment-breakdown ${variant}` }, children);
  }
  createEntry(entry, handlers) {
    const isReceived = entry.paymentStatus === 'received';
    return element('div', { className: 'payment-entry' }, [
      element('span', { text: `${entry.date.split('-').reverse().join('/')} · ${entry.startTime} → ${entry.endTime}` }),
      element('strong', { text: formatCurrency(entry.pay || 0) }),
      entry.isClosed ? element('small', { className: 'closed-entry-note', text: 'Folha fechada' }) : button(isReceived ? 'Marcar pendente' : 'Marcar recebido', { className: isReceived ? 'secondary-button compact-button' : 'primary-button compact-button', onClick: () => handlers.onPaymentChange?.(entry, isReceived ? 'pending' : 'received') })
    ]);
  }
  renderMessage(message) { const note = this.container.querySelector('.screen-note'); if (note) note.textContent = message; }
}
