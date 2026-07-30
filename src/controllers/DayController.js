import { OvertimeEntry } from '../models/OvertimeEntry.js';
import { TimeCalculationService } from '../services/TimeCalculationService.js';
import { assertDateKey } from '../utils/validators.js';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export class DayController {
  constructor({ state, dateService, entryRepository, closureRepository, payrollPeriodService, payrollClosureService, timeCalculationService = new TimeCalculationService(), onEntriesChanged = () => {} }) {
    this.state = state; this.dateService = dateService; this.entryRepository = entryRepository; this.closureRepository = closureRepository; this.payrollPeriodService = payrollPeriodService; this.payrollClosureService = payrollClosureService; this.timeCalculationService = timeCalculationService; this.onEntriesChanged = onEntriesChanged;
    this.view = null; this.entries = []; this.monthEntries = []; this.cycleEntries = []; this.formOpen = false; this.editingEntry = null; this.message = ''; this.requestId = 0; this.valuesVisible = false; this.isClosed = false; this.closedPeriod = null;
  }
  get date() { return assertDateKey(this.state.selectedDate); }
  get now() { return this.dateService.now?.() || new Date(); }
  get employeeId() { if (!this.state.employee?.id) throw new Error('Cadastre o perfil antes de registrar horas extras.'); return this.state.employee.id; }
  async open(view, onBack, { alwaysShowForm = false } = {}) { const requestId = ++this.requestId; this.view = view; this.onBack = onBack; this.alwaysShowForm = alwaysShowForm; this.formOpen = this.formOpen || alwaysShowForm; this.view.renderLoading(); await this.refresh(requestId); }
  close() { this.requestId += 1; this.view = null; this.formOpen = false; this.editingEntry = null; this.alwaysShowForm = false; }
  async refresh(requestId = this.requestId) {
    try {
      const [year, month] = this.date.split('-').map(Number);
      const [entries, monthEntries, allEntries] = await Promise.all([this.entryRepository.findByDate(this.employeeId, this.date), this.entryRepository.findByMonth(this.employeeId, month, year), this.entryRepository.findAll(this.employeeId)]);
      const currentPeriod = this.payrollPeriodService?.getCurrentPeriod(this.state.payrollSettings, this.now);
      if (this.closureRepository && this.payrollClosureService) await this.payrollClosureService.sync({ employeeId: this.employeeId, entries: allEntries, payrollSettings: this.state.payrollSettings, workSchedule: this.state.workSchedule, closureRepository: this.closureRepository, now: this.now });
      if (requestId !== this.requestId) return;
      this.entries = entries; this.monthEntries = monthEntries; this.cycleEntries = currentPeriod ? allEntries.filter((entry) => this.payrollPeriodService.getPeriodForDate(entry.date, this.state.payrollSettings)?.endDate === currentPeriod.endDate) : monthEntries;
      this.isClosed = this.payrollPeriodService?.isClosed(this.date, this.state.payrollSettings, this.now) || false; this.closedPeriod = this.isClosed ? this.payrollPeriodService.getPeriodForDate(this.date, this.state.payrollSettings) : null; this.message = '';
    } catch (error) { if (requestId !== this.requestId) return; this.entries = []; this.monthEntries = []; this.cycleEntries = []; this.isClosed = false; this.closedPeriod = null; this.message = error.message; }
    if (requestId === this.requestId) this.render();
  }
  render() {
    if (!this.view) return;
    const entries = this.entries.map((entry) => {
      const multiplier = this.timeCalculationService.getOvertimeMultiplier(entry.date, this.state.workSchedule);
      const nightMinutes = this.timeCalculationService.calculateNightMinutes(entry.startTime, entry.endTime);
      return { ...entry, displayDuration: this.timeCalculationService.formatDuration(entry.durationMinutes), endsNextDay: this.timeCalculationService.isNextDay(entry.startTime, entry.endTime), multiplier, nightMinutes, nightPay: this.timeCalculationService.calculateOvertimePay(0, entry.date, this.state.payrollSettings, nightMinutes, this.state.workSchedule), pay: this.timeCalculationService.calculateOvertimePay(entry.durationMinutes, entry.date, this.state.payrollSettings, nightMinutes, this.state.workSchedule) };
    });
    const totals = this.calculateTotals(entries);
    const monthlyEntries = this.cycleEntries.map((entry) => { const nightMinutes = this.timeCalculationService.calculateNightMinutes(entry.startTime, entry.endTime); return { ...entry, multiplier: this.timeCalculationService.getOvertimeMultiplier(entry.date, this.state.workSchedule), nightMinutes, nightPay: this.timeCalculationService.calculateOvertimePay(0, entry.date, this.state.payrollSettings, nightMinutes, this.state.workSchedule), pay: this.timeCalculationService.calculateOvertimePay(entry.durationMinutes, entry.date, this.state.payrollSettings, nightMinutes, this.state.workSchedule) }; });
    const monthlyTotals = this.calculateTotals(monthlyEntries);
    const salary = Number(this.state.payrollSettings?.salary) || 0;
    const monthlyWorkload = Number(this.state.payrollSettings?.monthlyWorkload) || 0;
    const normalRate = salary > 0 && monthlyWorkload > 0 ? salary / monthlyWorkload : 0;
    this.view.render({ date: this.date, workSchedule: this.state.workSchedule, entries, totalDuration: this.timeCalculationService.formatDuration(totals.totalMinutes), formOpen: this.formOpen && !this.isClosed, editingEntry: this.editingEntry, message: this.message, showMonthSummary: this.alwaysShowForm, monthlyTotals, hourlyRates: { normal: normalRate, extra65: normalRate * 1.65, extra100: normalRate * 2 }, valuesVisible: this.valuesVisible, employee: this.state.employee, salary, isClosed: this.isClosed, closedMessage: this.closedPeriod ? `Esta folha foi fechada em ${this.payrollPeriodService.formatDate(this.closedPeriod.endDate)}. Este dia não aceita novos lançamentos.` : '', ...totals }, {
      onBack: this.onBack, onAdd: () => this.openCreateForm(), onEdit: (entry) => this.openEditForm(entry), onCancel: () => this.closeForm(), onSave: (data) => this.save(data), onDelete: (entry) => this.delete(entry), onTimeChange: (startTime, endTime) => this.updateDurationPreview(startTime, endTime), onSelectDate: (date) => this.selectDate(date), onToggleValues: () => this.toggleValues()
    });
  }
  calculateTotals(entries) {
    const totalDurationMinutes = this.timeCalculationService.sumDurations(entries);
    return entries.reduce((result, entry) => {
      if (entry.multiplier === 2) { result.minutes100 += entry.durationMinutes; result.value100 += entry.pay - (entry.nightPay || 0); } else { result.minutes65 += entry.durationMinutes; result.value65 += entry.pay - (entry.nightPay || 0); }
      result.nightMinutes += entry.nightMinutes || 0; result.nightPay += entry.nightPay || 0;
      result.pay += entry.pay; return result;
    }, { minutes65: 0, minutes100: 0, pay: 0, totalMinutes: totalDurationMinutes, value65: 0, value100: 0, nightMinutes: 0, nightPay: 0 });
  }
  openCreateForm() { try { this.ensureOpenPeriod(); this.employeeId; this.formOpen = true; this.editingEntry = null; this.message = ''; } catch (error) { this.message = error.message; } this.render(); }
  openEditForm(entry) { try { this.ensureOpenPeriod(); this.formOpen = true; this.editingEntry = entry; this.message = ''; } catch (error) { this.message = error.message; } this.render(); }
  closeForm() { this.formOpen = this.alwaysShowForm; this.editingEntry = null; this.message = ''; this.render(); }
  selectDate(date) {
    try { this.state.selectedDate = assertDateKey(date); const [year, month] = date.split('-').map(Number); this.state.selectedYear = year; this.state.selectedMonth = month; this.formOpen = this.alwaysShowForm; this.editingEntry = null; this.refresh(); }
    catch (error) { this.message = error.message; this.render(); }
  }
  toggleValues() { this.valuesVisible = !this.valuesVisible; this.render(); }
  ensureOpenPeriod() { if (this.isClosed) throw new Error(this.closedPeriod ? `Esta folha foi fechada em ${this.payrollPeriodService.formatDate(this.closedPeriod.endDate)}.` : 'Esta folha já foi fechada.'); }
  updateDurationPreview(startTime, endTime) {
    if (!startTime || !endTime) return this.view?.updateDurationPreview({ text: '', isError: false });
    try {
      this.ensureOpenPeriod();
      const duration = this.timeCalculationService.calculateDuration(startTime, endTime);
      if (this.timeCalculationService.isNormalWorkday(this.date, this.state.workSchedule) && this.timeCalculationService.overlapsNormalSchedule(startTime, endTime, this.state.workSchedule)) throw new Error('O horário informado invade a jornada normal. Registre apenas o período antes ou depois dela.');
      const multiplier = this.timeCalculationService.getOvertimeMultiplier(this.date, this.state.workSchedule);
      const nightMinutes = this.timeCalculationService.calculateNightMinutes(startTime, endTime); const pay = this.timeCalculationService.calculateOvertimePay(duration, this.date, this.state.payrollSettings, nightMinutes, this.state.workSchedule);
      const nightText = nightMinutes ? ` · noturno 20%: ${this.timeCalculationService.formatDuration(nightMinutes)}` : '';
      this.view?.updateDurationPreview({ text: `Duração: ${this.timeCalculationService.formatDuration(duration)} · adicional de ${Math.round((multiplier - 1) * 100)}%${nightText} · ${currency.format(pay)}.`, isError: false });
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
      if (this.timeCalculationService.isNormalWorkday(this.date, this.state.workSchedule) && this.timeCalculationService.overlapsNormalSchedule(data.startTime, data.endTime, this.state.workSchedule)) throw new Error('O horário informado invade a jornada normal. Registre apenas o período antes ou depois dela.');
      const entry = this.editingEntry ? new OvertimeEntry(this.editingEntry, this.timeCalculationService).update(data, this.timeCalculationService) : new OvertimeEntry({ employeeId: this.employeeId, date: this.date, ...data }, this.timeCalculationService);
      if (this.timeCalculationService.hasOverlap(entry, await this.getEntriesForOverlap(), this.editingEntry?.id)) throw new Error('Este horário se sobrepõe a outro lançamento do mesmo dia.');
      if (this.editingEntry) await this.entryRepository.update(entry); else await this.entryRepository.create(entry);
      const wasEditing = Boolean(this.editingEntry); this.formOpen = this.alwaysShowForm; this.editingEntry = null; this.entries = await this.entryRepository.findByDate(this.employeeId, this.date); this.message = wasEditing ? 'Lançamento atualizado com sucesso.' : 'Hora extra salva com sucesso no aparelho.'; this.onEntriesChanged({ date: this.date }); this.render();
    } catch (error) { this.message = error.message || 'Não foi possível salvar a hora extra.'; this.render(); }
  }
  async delete(entry) {
    if (this.isClosed) { this.message = this.closedPeriod ? `Esta folha foi fechada em ${this.payrollPeriodService.formatDate(this.closedPeriod.endDate)}.` : 'Esta folha já foi fechada.'; this.render(); return; }
    if (!window.confirm('Deseja realmente excluir este lançamento?')) return;
    try { await this.entryRepository.delete(entry); this.entries = await this.entryRepository.findByDate(this.employeeId, this.date); this.message = 'Lançamento excluído.'; this.onEntriesChanged({ date: this.date }); this.render(); }
    catch (error) { this.message = error.message || 'Não foi possível excluir o lançamento.'; this.render(); }
  }
}
