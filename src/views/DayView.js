import { button, element, field } from '../utils/dom.js';
const formatSelectedDate = (date) => { const [year, month, day] = date.split('-').map(Number); return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(year, month - 1, day)); };

export class DayView {
  constructor(container) { this.container = container; }
  renderLoading() { this.container.replaceChildren(element('section', { className: 'screen' }, [element('p', { text: 'Carregando lançamentos...' })])); }
  render(model, handlers) {
    const fullDate = formatSelectedDate(model.date); const [weekday, ...dateParts] = fullDate.split(',');
    const schedule = model.workSchedule ? `${model.workSchedule.startTime} às ${model.workSchedule.endTime}` : null;
    const entries = model.entries.length ? element('div', { className: 'entry-list' }, model.entries.map((entry) => this.createEntry(entry, handlers))) : element('section', { className: 'empty-state' }, [element('h3', { text: 'Nenhuma hora extra cadastrada.' })]);
    const content = [button('Voltar para o mês', { className: 'back-button', onClick: handlers.onBack }), element('p', { className: 'eyebrow', text: weekday.replace(/^./, (char) => char.toUpperCase()) }), element('h2', { text: dateParts.join(',').trim().replace(/^./, (char) => char.toUpperCase()) }), element('section', { className: 'work-schedule-card' }, [element('strong', { text: 'Horário normal' }), element('p', { text: schedule || 'Nenhum horário normal foi cadastrado no perfil.' })]), model.message ? element('p', { className: 'day-message', 'aria-live': 'polite', text: model.message }) : null, entries, element('p', { className: 'day-total', text: `Total do dia: ${model.totalDuration}` })];
    if (model.formOpen) content.push(this.createForm(model.editingEntry, handlers)); else content.push(button('Adicionar hora extra', { className: 'primary-button add-entry-button', onClick: handlers.onAdd }));
    this.container.replaceChildren(element('section', { className: 'screen day-screen' }, content));
  }
  createEntry(entry, handlers) {
    const details = [element('strong', { text: `${entry.startTime} → ${entry.endTime}` }), element('span', { className: 'entry-duration', text: `Duração: ${entry.displayDuration}` })];
    if (entry.endsNextDay) details.push(element('span', { className: 'entry-next-day', text: 'Termina no dia seguinte' }));
    if (entry.notes) details.push(element('p', { className: 'entry-notes', text: entry.notes }));
    return element('article', { className: 'overtime-entry' }, [element('div', { className: 'entry-details' }, details), element('div', { className: 'entry-actions' }, [button('Editar', { className: 'secondary-button', onClick: () => handlers.onEdit(entry) }), button('Excluir', { className: 'danger-button', onClick: () => handlers.onDelete(entry) })])]);
  }
  createForm(entry, handlers) {
    const form = element('form', { className: 'entry-form', novalidate: '' }); const startTime = element('input', { id: 'overtime-start', type: 'time', value: entry?.startTime || '', required: '' }); const endTime = element('input', { id: 'overtime-end', type: 'time', value: entry?.endTime || '', required: '' }); const notes = element('textarea', { id: 'overtime-notes', rows: '3', maxlength: '300' }); const preview = element('p', { className: 'duration-preview', 'aria-live': 'polite' }); const warning = element('p', { className: 'schedule-warning', 'aria-live': 'polite' }); notes.value = entry?.notes || '';
    const updatePreview = () => handlers.onTimeChange(startTime.value, endTime.value); startTime.addEventListener('input', updatePreview); endTime.addEventListener('input', updatePreview); this.durationPreview = preview; this.scheduleWarning = warning;
    form.append(element('h3', { text: entry ? 'Editar hora extra' : 'Adicionar hora extra' }), element('div', { className: 'form-grid' }, [field('Hora inicial', startTime), field('Hora final', endTime)]), preview, warning, field('Observação (opcional)', notes, 'Máximo de 300 caracteres.'), element('div', { className: 'button-row' }, [button('Cancelar', { className: 'secondary-button', onClick: handlers.onCancel }), button('Salvar lançamento', { className: 'primary-button', type: 'submit' })]));
    form.addEventListener('submit', (event) => { event.preventDefault(); handlers.onSave({ startTime: startTime.value, endTime: endTime.value, notes: notes.value }); }); return form;
  }
  updateDurationPreview({ text, isError, warning = '' }) { if (!this.durationPreview) return; this.durationPreview.textContent = text; this.durationPreview.classList.toggle('is-error', isError); if (this.scheduleWarning) this.scheduleWarning.textContent = warning; }
}
