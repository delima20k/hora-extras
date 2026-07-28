import { WORK_DAYS } from '../utils/constants.js';
import { button, element, field } from '../utils/dom.js';
import { formatCurrency } from '../utils/formatters.js';

const input = (id, type, value = '') => element('input', { id, type, value });
const defaultAvatar = () => `${import.meta.env.BASE_URL}default-avatar.svg`;

export class ProfileView {
  render(container, state, { avatarUrl, onSubmit, onFileChange }) {
    const employee = state.employee || {}; const schedule = state.workSchedule || {}; const payroll = state.payrollSettings || {};
    const form = element('form', { className: 'profile-form', novalidate: '' }); const status = element('p', { id: 'profile-status', className: 'form-status', role: 'status', 'aria-live': 'polite' });
    const avatar = element('img', { className: 'profile-avatar', src: avatarUrl || defaultAvatar(), alt: 'Prévia da foto de perfil' });
    const file = element('input', { id: 'avatar', className: 'visually-hidden', type: 'file', accept: 'image/jpeg,image/png,image/webp' }); file.addEventListener('change', () => onFileChange(file.files?.[0], avatar, status));
    const photoButton = element('label', { className: 'avatar-upload-button', for: 'avatar', text: '+FOTO' });
    const name = input('name', 'text', employee.name || ''); name.required = true; name.maxLength = 120; name.autocomplete = 'name'; name.setAttribute('aria-describedby', 'profile-status');
    const salary = input('salary', 'text', payroll.salary ? formatCurrency(payroll.salary) : ''); salary.required = true; salary.inputMode = 'decimal'; salary.setAttribute('aria-describedby', 'profile-status');
    const closing = input('payroll-closing-day', 'number', payroll.payrollClosingDay || ''); closing.required = true; closing.min = '1'; closing.max = '31'; closing.setAttribute('aria-describedby', 'profile-status');
    const strategy = element('select', { id: 'invalid-closing-strategy' }); [['last-day-of-month', 'Último dia do mês'], ['first-day-next-month', 'Primeiro dia do mês seguinte']].forEach(([value, text]) => { const option = element('option', { value, text }); if ((payroll.invalidClosingDayStrategy || 'last-day-of-month') === value) option.selected = true; strategy.append(option); });
    const start = input('start-time', 'time', schedule.startTime || ''); start.required = true; const end = input('end-time', 'time', schedule.endTime || ''); end.required = true;
    const interval = input('break-duration', 'number', schedule.breakDurationMinutes ?? 0); interval.min = '0'; interval.required = true;
    const workload = input('monthly-workload', 'number', payroll.monthlyWorkload || 220); workload.min = '1'; workload.required = true;
    const notes = element('textarea', { id: 'notes', rows: '4' }); notes.value = employee.notes || '';
    const days = element('fieldset', { className: 'work-days' }, [element('legend', { text: 'Dias normais de trabalho' })]); const selected = new Set(schedule.workDays || []);
    WORK_DAYS.forEach(([value, text]) => { const check = input(`day-${value}`, 'checkbox'); check.name = 'work-days'; check.value = value; check.checked = selected.has(value); days.append(element('label', { className: 'checkbox-label' }, [check, document.createTextNode(text)])); });
    const save = button('Salvar perfil', { className: 'primary-button', type: 'submit' });
    form.append(element('div', { className: 'avatar-picker' }, [avatar, element('div', { className: 'avatar-upload' }, [file, photoButton, element('small', { className: 'field-hint', text: 'JPG, PNG ou WEBP.' })])]), field('Nome', name), field('Salário', salary), field('Dia de fechamento da folha', closing), field('Quando o dia de fechamento não existir no mês', strategy, 'Esta escolha será usada futuramente no cálculo do período.'), element('div', { className: 'form-grid' }, [field('Horário normal de entrada', start), field('Horário normal de saída', end)]), field('Intervalo (minutos)', interval), days, field('Jornada mensal (horas)', workload), field('Observações', notes), status, save);
    form.addEventListener('submit', (event) => { event.preventDefault(); onSubmit({ name: name.value, salary: salary.value, payrollClosingDay: closing.value, invalidClosingDayStrategy: strategy.value, startTime: start.value, endTime: end.value, breakDurationMinutes: interval.value, workDays: [...form.querySelectorAll('input[name="work-days"]:checked')].map((item) => item.value), monthlyWorkload: workload.value, notes: notes.value }, save, status); });
    container.replaceChildren(element('section', { className: 'screen' }, [element('p', { className: 'eyebrow', text: 'Dados pessoais e configurações' }), element('h2', { text: 'Perfil' }), form]));
  }
}
