import { button, element, field } from '../utils/dom.js';
import { formatCurrency } from '../utils/formatters.js';

const dateFromKey = (date) => { const [year, month, day] = date.split('-').map(Number); return new Date(year, month - 1, day); };
const toDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const formatSelectedDate = (date) => new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(dateFromKey(date));
const shortWeekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });

export class DayView {
  constructor(container) { this.container = container; }
  renderLoading() { this.container.replaceChildren(element('section', { className: 'screen' }, [element('p', { role: 'status', text: 'Carregando lançamentos...' })])); }
  render(model, handlers) {
    const fullDate = formatSelectedDate(model.date); const [weekday, ...dateParts] = fullDate.split(',');
    const schedule = model.workSchedule ? `${model.workSchedule.startTime} às ${model.workSchedule.endTime}` : null;
    const entries = model.entries.length ? element('div', { className: 'entry-list' }, model.entries.map((entry) => this.createEntry(entry, handlers, model.isClosed))) : element('section', { className: 'empty-state' }, [element('h3', { text: 'Nenhuma hora extra cadastrada.' }), element('p', { text: 'Selecione um dia e informe apenas os horários fora da jornada normal.' })]);
    const totals = element('section', { className: 'overtime-summary' }, [
      element('strong', { text: `Total do dia: ${model.totalDuration}` }),
      element('span', { text: `65%: ${this.formatDuration(model.minutes65)} · 100%: ${this.formatDuration(model.minutes100)}` }),
      model.nightMinutes ? element('span', { text: `Noturno 20%: ${this.formatDuration(model.nightMinutes)} · ${formatCurrency(model.nightPay)}` }) : null,
      element('span', { className: 'overtime-pay', text: `Valor estimado: ${formatCurrency(model.pay)}` })
    ]);
    const content = [
      this.createDateNavigator(model.date, handlers),
      button('Ver calendário mensal', { className: 'back-button', onClick: handlers.onBack }),
      element('p', { className: 'eyebrow', text: weekday.replace(/^./, (char) => char.toUpperCase()) }),
      element('h2', { text: dateParts.join(',').trim().replace(/^./, (char) => char.toUpperCase()) }),
      element('section', { className: 'work-schedule-card' }, [element('strong', { text: 'Horário normal de trabalho' }), element('p', { text: schedule || 'Cadastre seu horário normal no perfil para validar as horas extras.' })]),
      model.isClosed ? element('section', { className: 'payroll-closed-message', role: 'status' }, [element('strong', { text: 'Folha fechada' }), element('p', { text: model.closedMessage })]) : null,
      model.showMonthSummary ? this.createMonthSummary(model) : null,
      model.message ? element('p', { className: 'day-message', role: 'status', 'aria-live': 'polite', text: model.message }) : null,
      entries, totals
    ];
    if (!model.isClosed && model.formOpen) content.push(this.createForm(model.editingEntry, handlers)); else if (!model.isClosed) content.push(button('Adicionar hora extra', { className: 'primary-button add-entry-button', onClick: handlers.onAdd }));
    if (model.showMonthSummary) content.push(this.createHourlyRatesFooter(model, handlers));
    this.container.replaceChildren(element('section', { className: 'screen day-screen' }, content));
  }
  createMonthSummary(model) {
    const totals = model.monthlyTotals || {}; const hidden = model.valuesVisible ? '' : ' is-hidden';
    return element('section', { className: 'month-overtime-summary' }, [
      element('strong', { text: 'Total de horas extras no ciclo atual' }),
      element('div', { className: `sensitive-value${hidden}` }, [
        element('span', { text: `65%: ${this.formatDuration(totals.minutes65)} · ${formatCurrency(totals.value65)}` }),
        element('span', { text: `100%: ${this.formatDuration(totals.minutes100)} · ${formatCurrency(totals.value100)}` }),
        element('b', { text: `Total: ${this.formatDuration(totals.totalMinutes)} · ${formatCurrency(totals.pay)}` })
      ])
    ]);
  }
  createHourlyRatesFooter(model, handlers) {
    const hidden = model.valuesVisible ? '' : ' is-hidden'; const rates = model.hourlyRates || {};
    return element('footer', { className: 'hourly-rates-footer' }, [
      button('👁', { className: 'privacy-button', 'aria-label': model.valuesVisible ? 'Ocultar valores' : 'Mostrar valores', title: model.valuesVisible ? 'Ocultar valores' : 'Mostrar valores', onClick: handlers.onToggleValues }),
      element('div', { className: 'rate-user' }, [element('strong', { text: model.employee?.name || 'Usuario' }), element('span', { className: `sensitive-value${hidden}`, text: `Salario: ${formatCurrency(model.salary)}` })]),
      element('div', { className: `rate-values sensitive-value${hidden}` }, [
        element('h2', { text: 'Valor da hora' }), element('p', { text: `Valor normal: ${formatCurrency(rates.normal)}` }),
        element('h2', { text: 'Hora extra com 65%' }), element('p', { text: formatCurrency(rates.extra65) }),
        element('h2', { text: 'Hora extra com 100%' }), element('p', { text: formatCurrency(rates.extra100) })
      ])
    ]);
  }
  createDateNavigator(selectedDate, handlers) {
    const selected = dateFromKey(selectedDate); const monday = new Date(selected); monday.setDate(selected.getDate() - ((selected.getDay() + 6) % 7));
    const days = Array.from({ length: 7 }, (_, index) => { const date = new Date(monday); date.setDate(monday.getDate() + index); return date; });
    const today = toDateKey(new Date()); const previous = new Date(selected); previous.setDate(selected.getDate() - 1);
    const input = element('input', { id: 'overtime-date', type: 'date', value: selectedDate, max: today });
    input.addEventListener('change', () => { if (input.value) handlers.onSelectDate(input.value); });
    return element('section', { className: 'day-navigator', 'aria-label': 'Selecionar dia para horas extras' }, [
      element('div', { className: 'day-navigator-heading' }, [element('strong', { text: 'Adicionar horas' }), button('Hoje', { className: 'secondary-button compact-button', onClick: () => handlers.onSelectDate(today) })]),
      element('div', { className: 'weekday-picker' }, days.map((date) => { const key = toDateKey(date); return element('button', { type: 'button', className: `weekday-button${key === selectedDate ? ' is-selected' : ''}`, 'aria-pressed': String(key === selectedDate), onClick: () => handlers.onSelectDate(key) }, [element('span', { text: shortWeekday.format(date).replace('.', '') }), element('strong', { text: String(date.getDate()) })]); })),
      element('div', { className: 'past-day-picker' }, [button('Dia anterior', { className: 'secondary-button compact-button', onClick: () => handlers.onSelectDate(toDateKey(previous)) }), field('Outro dia anterior', input)])
    ]);
  }
  createEntry(entry, handlers, isClosed = false) {
    const details = [element('strong', { text: `${entry.startTime} → ${entry.endTime}` }), element('span', { className: 'entry-duration', text: `Duração: ${entry.displayDuration}` }), element('span', { className: 'entry-rate', text: `Adicional: ${Math.round((entry.multiplier - 1) * 100)}% · ${formatCurrency(entry.pay)}` })];
    if (entry.nightMinutes) details.push(element('span', { className: 'entry-rate', text: `Noturno: 20% em ${this.formatDuration(entry.nightMinutes)}` }));
    if (entry.endsNextDay) details.push(element('span', { className: 'entry-next-day', text: 'Termina no dia seguinte' }));
    if (entry.notes) details.push(element('p', { className: 'entry-notes', text: entry.notes }));
    return element('article', { className: 'overtime-entry' }, [element('div', { className: 'entry-details' }, details), isClosed ? element('span', { className: 'entry-closed', text: 'Fechado' }) : element('div', { className: 'entry-actions' }, [button('Editar', { className: 'secondary-button', onClick: () => handlers.onEdit(entry) }), button('Excluir', { className: 'danger-button', onClick: () => handlers.onDelete(entry) })])]);
  }
  createForm(entry, handlers) {
    const form = element('form', { className: 'entry-form', novalidate: '' }); const startTime = element('input', { id: 'overtime-start', type: 'time', value: entry?.startTime || '', required: '', 'aria-describedby': 'duration-preview schedule-warning' }); const endTime = element('input', { id: 'overtime-end', type: 'time', value: entry?.endTime || '', required: '', 'aria-describedby': 'duration-preview schedule-warning' }); const notes = element('textarea', { id: 'overtime-notes', rows: '3', maxlength: '300' }); const preview = element('p', { id: 'duration-preview', className: 'duration-preview', role: 'status', 'aria-live': 'polite' }); const warning = element('p', { id: 'schedule-warning', className: 'schedule-warning', role: 'status', 'aria-live': 'polite' });
    notes.value = entry?.notes || ''; const updatePreview = () => handlers.onTimeChange(startTime.value, endTime.value); startTime.addEventListener('input', updatePreview); endTime.addEventListener('input', updatePreview); this.durationPreview = preview; this.scheduleWarning = warning; this.startTime = startTime; this.endTime = endTime;
    form.append(element('h3', { text: entry ? 'Editar hora extra' : 'Adicionar hora extra' }), element('div', { className: 'form-grid' }, [field('Hora inicial', startTime), field('Hora final', endTime)]), preview, warning, field('Observação (opcional)', notes, 'Máximo de 300 caracteres.'), element('div', { className: 'button-row' }, [button('Cancelar', { className: 'secondary-button', onClick: handlers.onCancel }), button('Salvar lançamento', { className: 'primary-button', type: 'submit' })]));
    form.addEventListener('submit', (event) => { event.preventDefault(); handlers.onSave({ startTime: startTime.value, endTime: endTime.value, notes: notes.value }); }); return form;
  }
  formatDuration(minutes = 0) { return `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}`; }
  updateDurationPreview({ text, isError, warning = '' }) { if (!this.durationPreview) return; this.durationPreview.textContent = text; this.durationPreview.classList.toggle('is-error', isError); this.startTime?.setAttribute('aria-invalid', String(isError)); this.endTime?.setAttribute('aria-invalid', String(isError)); if (this.scheduleWarning) this.scheduleWarning.textContent = warning; }
}
