import { OvertimeEntry } from '../models/OvertimeEntry.js';
import { TimeCalculationService } from '../services/TimeCalculationService.js';
import { assertDateKey } from '../utils/validators.js';

export class DayController {
  constructor({ state, dateService, entryRepository, timeCalculationService = new TimeCalculationService(), onEntriesChanged = () => {} }) { this.state = state; this.dateService = dateService; this.entryRepository = entryRepository; this.timeCalculationService = timeCalculationService; this.onEntriesChanged = onEntriesChanged; this.view = null; this.entries = []; this.formOpen = false; this.editingEntry = null; this.message = ''; }
  get date() { return assertDateKey(this.state.selectedDate); }
  get employeeId() { if (!this.state.employee?.id) throw new Error('Cadastre o perfil antes de registrar horas extras.'); return this.state.employee.id; }
  async open(view, onBack) { this.view = view; this.onBack = onBack; this.view.renderLoading(); await this.refresh(); }
  async refresh() { try { this.entries = await this.entryRepository.findByDate(this.employeeId, this.date); this.message = ''; } catch (error) { this.entries = []; this.message = error.message; } this.render(); }
  render() {
    if (!this.view) return;
    const entries = this.entries.map((entry) => ({ ...entry, displayDuration: this.timeCalculationService.formatDuration(entry.durationMinutes), endsNextDay: this.timeCalculationService.isNextDay(entry.startTime, entry.endTime) }));
    const totalDurationMinutes = this.timeCalculationService.sumDurations(this.entries);
    this.view.render({ date: this.date, workSchedule: this.state.workSchedule, entries, totalDuration: this.timeCalculationService.formatDuration(totalDurationMinutes), formOpen: this.formOpen, editingEntry: this.editingEntry, message: this.message }, { onBack: this.onBack, onAdd: () => this.openCreateForm(), onEdit: (entry) => this.openEditForm(entry), onCancel: () => this.closeForm(), onSave: (data) => this.save(data), onDelete: (entry) => this.delete(entry), onTimeChange: (startTime, endTime) => this.updateDurationPreview(startTime, endTime) });
  }
  openCreateForm() { try { this.employeeId; this.formOpen = true; this.editingEntry = null; this.message = ''; } catch (error) { this.message = error.message; } this.render(); }
  openEditForm(entry) { this.formOpen = true; this.editingEntry = entry; this.message = ''; this.render(); }
  closeForm() { this.formOpen = false; this.editingEntry = null; this.message = ''; this.render(); }
  updateDurationPreview(startTime, endTime) {
    if (!startTime || !endTime) return this.view?.updateDurationPreview({ text: '', isError: false });
    try { const duration = this.timeCalculationService.calculateDuration(startTime, endTime); this.view?.updateDurationPreview({ text: `Duração calculada: ${this.timeCalculationService.formatDuration(duration)}.`, isError: false, warning: this.getScheduleWarning(startTime) }); } catch (error) { this.view?.updateDurationPreview({ text: error.message, isError: true, warning: '' }); }
  }
  getScheduleWarning(startTime) {
    const schedule = this.state.workSchedule;
    if (!schedule || !this.timeCalculationService.isValidTime(startTime) || !this.timeCalculationService.isValidTime(schedule.startTime) || !this.timeCalculationService.isValidTime(schedule.endTime)) return '';
    const extraStart = this.timeCalculationService.parseTimeToMinutes(startTime); const normalStart = this.timeCalculationService.parseTimeToMinutes(schedule.startTime); const normalEnd = this.timeCalculationService.parseTimeToMinutes(schedule.endTime);
    const occursDuringNormalSchedule = normalStart < normalEnd ? extraStart < normalEnd : extraStart >= normalStart || extraStart < normalEnd;
    return occursDuringNormalSchedule ? 'O início informado acontece antes do fim da jornada normal. Verifique o horário antes de salvar.' : '';
  }
  getAdjacentDates() {
    const [year, month, day] = this.date.split('-').map(Number); const current = new Date(year, month - 1, day);
    return [-1, 0, 1].map((offset) => { const value = new Date(year, month - 1, day + offset); return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`; });
  }
  async getEntriesForOverlap() { return (await Promise.all(this.getAdjacentDates().map((date) => this.entryRepository.findByDate(this.employeeId, date)))).flat(); }
  async save(data) {
    try {
      this.timeCalculationService.calculateDuration(data.startTime, data.endTime);
      const entry = this.editingEntry ? new OvertimeEntry(this.editingEntry, this.timeCalculationService).update(data, this.timeCalculationService) : new OvertimeEntry({ employeeId: this.employeeId, date: this.date, ...data }, this.timeCalculationService);
      if (this.timeCalculationService.hasOverlap(entry, await this.getEntriesForOverlap(), this.editingEntry?.id)) throw new Error('Este horário se sobrepõe a outro lançamento do mesmo dia.');
      if (this.editingEntry) await this.entryRepository.update(entry); else await this.entryRepository.create(entry);
      const wasEditing = Boolean(this.editingEntry); this.formOpen = false; this.editingEntry = null; this.entries = await this.entryRepository.findByDate(this.employeeId, this.date); this.message = wasEditing ? 'Lançamento atualizado com sucesso.' : 'Hora extra salva com sucesso.'; this.onEntriesChanged({ date: this.date }); this.render();
    } catch (error) { this.message = error.message || 'Não foi possível salvar a hora extra.'; this.render(); }
  }
  async delete(entry) {
    if (!window.confirm('Deseja realmente excluir este lançamento?')) return;
    try { await this.entryRepository.delete(entry); this.entries = await this.entryRepository.findByDate(this.employeeId, this.date); this.message = 'Lançamento excluído.'; this.onEntriesChanged({ date: this.date }); this.render(); } catch (error) { this.message = error.message || 'Não foi possível excluir o lançamento.'; this.render(); }
  }
}
