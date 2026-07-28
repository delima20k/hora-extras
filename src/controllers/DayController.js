import { OvertimeEntry } from '../models/OvertimeEntry.js';
import { TimeCalculationService } from '../services/TimeCalculationService.js';
import { assertDateKey } from '../utils/validators.js';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export class DayController {
  constructor({ state, dateService, entryRepository, timeCalculationService = new TimeCalculationService(), onEntriesChanged = () => {} }) {
    this.state = state; this.dateService = dateService; this.entryRepository = entryRepository; this.timeCalculationService = timeCalculationService; this.onEntriesChanged = onEntriesChanged;
    this.view = null; this.entries = []; this.formOpen = false; this.editingEntry = null; this.message = ''; this.requestId = 0;
  }
  get date() { return assertDateKey(this.state.selectedDate); }
  get employeeId() { if (!this.state.employee?.id) throw new Error('Cadastre o perfil antes de registrar horas extras.'); return this.state.employee.id; }
  async open(view, onBack) { const requestId = ++this.requestId; this.view = view; this.onBack = onBack; this.view.renderLoading(); await this.refresh(requestId); }
  close() { this.requestId += 1; this.view = null; this.formOpen = false; this.editingEntry = null; }
  async refresh(requestId = this.requestId) {
    try { const entries = await this.entryRepository.findByDate(this.employeeId, this.date); if (requestId !== this.requestId) return; this.entries = entries; this.message = ''; }
    catch (error) { if (requestId !== this.requestId) return; this.entries = []; this.message = error.message; }
    if (requestId === this.requestId) this.render();
  }
  render() {
    if (!this.view) return;
    const entries = this.entries.map((entry) => {
      const multiplier = this.timeCalculationService.getOvertimeMultiplier(entry.date);
      return { ...entry, displayDuration: this.timeCalculationService.formatDuration(entry.durationMinutes), endsNextDay: this.timeCalculationService.isNextDay(entry.startTime, entry.endTime), multiplier, pay: this.timeCalculationService.calculateOvertimePay(entry.durationMinutes, entry.date, this.state.payrollSettings) };
    });
    const totalDurationMinutes = this.timeCalculationService.sumDurations(this.entries);
    const totals = entries.reduce((result, entry) => {
      if (entry.multiplier === 2) result.minutes100 += entry.durationMinutes; else result.minutes65 += entry.durationMinutes;
      result.pay += entry.pay; return result;
    }, { minutes65: 0, minutes100: 0, pay: 0 });
    this.view.render({ date: this.date, workSchedule: this.state.workSchedule, entries, totalDuration: this.timeCalculationService.formatDuration(totalDurationMinutes), formOpen: this.formOpen, editingEntry: this.editingEntry, message: this.message, ...totals }, {
      onBack: this.onBack, onAdd: () => this.openCreateForm(), onEdit: (entry) => this.openEditForm(entry), onCancel: () => this.closeForm(), onSave: (data) => this.save(data), onDelete: (entry) => this.delete(entry), onTimeChange: (startTime, endTime) => this.updateDurationPreview(startTime, endTime), onSelectDate: (date) => this.selectDate(date)
    });
  }
  openCreateForm() { try { this.employeeId; this.formOpen = true; this.editingEntry = null; this.message = ''; } catch (error) { this.message = error.message; } this.render(); }
  openEditForm(entry) { this.formOpen = true; this.editingEntry = entry; this.message = ''; this.render(); }
  closeForm() { this.formOpen = false; this.editingEntry = null; this.message = ''; this.render(); }
  selectDate(date) {
    try { this.state.selectedDate = assertDateKey(date); const [year, month] = date.split('-').map(Number); this.state.selectedYear = year; this.state.selectedMonth = month; this.formOpen = false; this.editingEntry = null; this.refresh(); }
    catch (error) { this.message = error.message; this.render(); }
  }
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
      const wasEditing = Boolean(this.editingEntry); this.formOpen = false; this.editingEntry = null; this.entries = await this.entryRepository.findByDate(this.employeeId, this.date); this.message = wasEditing ? 'Lançamento atualizado com sucesso.' : 'Hora extra salva com sucesso.'; this.onEntriesChanged({ date: this.date }); this.render();
    } catch (error) { this.message = error.message || 'Não foi possível salvar a hora extra.'; this.render(); }
  }
  async delete(entry) {
    if (!window.confirm('Deseja realmente excluir este lançamento?')) return;
    try { await this.entryRepository.delete(entry); this.entries = await this.entryRepository.findByDate(this.employeeId, this.date); this.message = 'Lançamento excluído.'; this.onEntriesChanged({ date: this.date }); this.render(); }
    catch (error) { this.message = error.message || 'Não foi possível excluir o lançamento.'; this.render(); }
  }
}
