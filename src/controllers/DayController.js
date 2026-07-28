import { OvertimeEntry } from '../models/OvertimeEntry.js';
import { TimeCalculationService } from '../services/TimeCalculationService.js';
import { assertDateKey } from '../utils/validators.js';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export class DayController {
  constructor({ state, dateService, entryRepository, timeCalculationService = new TimeCalculationService(), onEntriesChanged = () => {} }) {
    this.state = state; this.dateService = dateService; this.entryRepository = entryRepository; this.timeCalculationService = timeCalculationService; this.onEntriesChanged = onEntriesChanged;
    this.view = null; this.entries = []; this.monthEntries = []; this.formOpen = false; this.editingEntry = null; this.message = ''; this.requestId = 0; this.valuesVisible = false;
  }
  get date() { return assertDateKey(this.state.selectedDate); }
  get employeeId() { if (!this.state.employee?.id) throw new Error('Cadastre o perfil antes de registrar horas extras.'); return this.state.employee.id; }
  async open(view, onBack, { alwaysShowForm = false } = {}) { const requestId = ++this.requestId; this.view = view; this.onBack = onBack; this.alwaysShowForm = alwaysShowForm; this.formOpen = this.formOpen || alwaysShowForm; this.view.renderLoading(); await this.refresh(requestId); }
  close() { this.requestId += 1; this.view = null; this.formOpen = false; this.editingEntry = null; this.alwaysShowForm = false; }
  async refresh(requestId = this.requestId) {
    try {
      const [year, month] = this.date.split('-').map(Number);
      const [entries, monthEntries] = await Promise.all([this.entryRepository.findByDate(this.employeeId, this.date), this.entryRepository.findByMonth(this.employeeId, month, year)]);
      if (requestId !== this.requestId) return; this.entries = entries; this.monthEntries = monthEntries; this.message = '';
    } catch (error) { if (requestId !== this.requestId) return; this.entries = []; this.monthEntries = []; this.message = error.message; }
    if (requestId === this.requestId) this.render();
  }
  render() {
    if (!this.view) return;
    const entries = this.entries.map((entry) => {
      const multiplier = this.timeCalculationService.getOvertimeMultiplier(entry.date);
      return { ...entry, displayDuration: this.timeCalculationService.formatDuration(entry.durationMinutes), endsNextDay: this.timeCalculationService.isNextDay(entry.startTime, entry.endTime), multiplier, pay: this.timeCalculationService.calculateOvertimePay(entry.durationMinutes, entry.date, this.state.payrollSettings) };
    });
    const totals = this.calculateTotals(entries);
    const monthlyEntries = this.monthEntries.map((entry) => ({ ...entry, multiplier: this.timeCalculationService.getOvertimeMultiplier(entry.date), pay: this.timeCalculationService.calculateOvertimePay(entry.durationMinutes, entry.date, this.state.payrollSettings) }));
    const monthlyTotals = this.calculateTotals(monthlyEntries);
    const salary = Number(this.state.payrollSettings?.salary) || 0;
    const monthlyWorkload = Number(this.state.payrollSettings?.monthlyWorkload) || 0;
    const normalRate = salary > 0 && monthlyWorkload > 0 ? salary / monthlyWorkload : 0;
    this.view.render({ date: this.date, workSchedule: this.state.workSchedule, entries, totalDuration: this.timeCalculationService.formatDuration(totals.totalMinutes), formOpen: this.formOpen, editingEntry: this.editingEntry, message: this.message, showMonthSummary: this.alwaysShowForm, monthlyTotals, hourlyRates: { normal: normalRate, extra65: normalRate * 1.65, extra100: normalRate * 2 }, valuesVisible: this.valuesVisible, employee: this.state.employee, salary, ...totals }, {
      onBack: this.onBack, onAdd: () => this.openCreateForm(), onEdit: (entry) => this.openEditForm(entry), onCancel: () => this.closeForm(), onSave: (data) => this.save(data), onDelete: (entry) => this.delete(entry), onTimeChange: (startTime, endTime) => this.updateDurationPreview(startTime, endTime), onSelectDate: (date) => this.selectDate(date), onToggleValues: () => this.toggleValues()
    });
  }
  calculateTotals(entries) {
    const totalDurationMinutes = this.timeCalculationService.sumDurations(entries);
    return entries.reduce((result, entry) => {
      if (entry.multiplier === 2) { result.minutes100 += entry.durationMinutes; result.value100 += entry.pay; } else { result.minutes65 += entry.durationMinutes; result.value65 += entry.pay; }
      result.pay += entry.pay; return result;
    }, { minutes65: 0, minutes100: 0, pay: 0, totalMinutes: totalDurationMinutes, value65: 0, value100: 0 });
  }
  openCreateForm() { try { this.employeeId; this.formOpen = true; this.editingEntry = null; this.message = ''; } catch (error) { this.message = error.message; } this.render(); }
  openEditForm(entry) { this.formOpen = true; this.editingEntry = entry; this.message = ''; this.render(); }
  closeForm() { this.formOpen = this.alwaysShowForm; this.editingEntry = null; this.message = ''; this.render(); }
  selectDate(date) {
    try { this.state.selectedDate = assertDateKey(date); const [year, month] = date.split('-').map(Number); this.state.selectedYear = year; this.state.selectedMonth = month; this.formOpen = this.alwaysShowForm; this.editingEntry = null; this.refresh(); }
    catch (error) { this.message = error.message; this.render(); }
  }
  toggleValues() { this.valuesVisible = !this.valuesVisible; this.render(); }
  updateDurationPreview(startTime, endTime) {
    if (!startTime || !endTime) return this.view?.updateDurationPreview({ text: '', isError: false });
    try {
      const duration = this.timeCalculationService.calculateDuration(startTime, endTime);
      if (this.timeCalculationService.overlapsNormalSchedule(startTime, endTime, this.state.workSchedule)) throw new Error('O horário informado invade a jornada normal. Registre apenas o período antes ou depois dela.');
      const multiplier = this.timeCalculationService.getOvertimeMultiplier(this.date);
      const pay = this.timeCalculationService.calculateOvertimePay(duration, this.date, this.state.payrollSettings);
      this.view?.updateDurationPreview({ text: `Duração: ${this.timeCalculationService.formatDuration(duration)} · adicional de ${Math.round((multiplier - 1) * 100)}% · ${currency.format(pay)}.`, isError: false });
    } catch (error) { this.view?.updateDurationPreview({ text: error.message, isError: true, warning: '' }); }
  }
  getAdjacentDates() {
    const [year, month, day] = this.date.split('-').map(Number);
    return [-1, 0, 1].map((offset) => { const value = new Date(year, month - 1, day + offset); return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`; });
  }
  async getEntriesForOverlap() { return (await Promise.all(this.getAdjacentDates().map((date) => this.entryRepository.findByDate(this.employeeId, date)))).flat(); }
  async save(data) {
    try {
      this.timeCalculationService.calculateDuration(data.startTime, data.endTime);
      if (this.timeCalculationService.overlapsNormalSchedule(data.startTime, data.endTime, this.state.workSchedule)) throw new Error('O horário informado invade a jornada normal. Registre apenas o período antes ou depois dela.');
      const entry = this.editingEntry ? new OvertimeEntry(this.editingEntry, this.timeCalculationService).update(data, this.timeCalculationService) : new OvertimeEntry({ employeeId: this.employeeId, date: this.date, ...data }, this.timeCalculationService);
      if (this.timeCalculationService.hasOverlap(entry, await this.getEntriesForOverlap(), this.editingEntry?.id)) throw new Error('Este horário se sobrepõe a outro lançamento do mesmo dia.');
      if (this.editingEntry) await this.entryRepository.update(entry); else await this.entryRepository.create(entry);
      const wasEditing = Boolean(this.editingEntry); this.formOpen = this.alwaysShowForm; this.editingEntry = null; this.entries = await this.entryRepository.findByDate(this.employeeId, this.date); this.message = wasEditing ? 'Lançamento atualizado com sucesso.' : 'Hora extra salva com sucesso no aparelho.'; this.onEntriesChanged({ date: this.date }); this.render();
    } catch (error) { this.message = error.message || 'Não foi possível salvar a hora extra.'; this.render(); }
  }
  async delete(entry) {
    if (!window.confirm('Deseja realmente excluir este lançamento?')) return;
    try { await this.entryRepository.delete(entry); this.entries = await this.entryRepository.findByDate(this.employeeId, this.date); this.message = 'Lançamento excluído.'; this.onEntriesChanged({ date: this.date }); this.render(); }
    catch (error) { this.message = error.message || 'Não foi possível excluir o lançamento.'; this.render(); }
  }
}
