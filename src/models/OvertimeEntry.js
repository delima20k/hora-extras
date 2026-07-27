import { TimeCalculationService } from '../services/TimeCalculationService.js';
import { assertDateKey, newId, optionalText } from '../utils/validators.js';

const defaultTimeCalculationService = new TimeCalculationService();
export const calculateDurationMinutes = (startTime, endTime) => defaultTimeCalculationService.calculateDuration(startTime, endTime);

export class OvertimeEntry {
  constructor({ id = newId(), employeeId, date, startTime, endTime, durationMinutes, notes = '', status = 'active', createdAt = new Date().toISOString(), updatedAt = createdAt } = {}, timeCalculationService = defaultTimeCalculationService) {
    if (!employeeId || !date) throw new Error('Funcionário e data são obrigatórios.');
    this.id = String(id); this.employeeId = String(employeeId); this.date = assertDateKey(date); this.startTime = startTime; this.endTime = endTime; this.durationMinutes = timeCalculationService.calculateDuration(this.startTime, this.endTime); this.notes = optionalText(notes, 300);
    if (/<\/?[a-z][^>]*>/i.test(this.notes)) throw new Error('A observação não aceita HTML.');
    if (!Number.isInteger(this.durationMinutes) || this.durationMinutes <= 0) throw new Error('Duração inválida.');
    if (!['active', 'deleted'].includes(status)) throw new Error('Status inválido.');
    this.status = status; this.createdAt = createdAt; this.updatedAt = updatedAt;
  }
  update({ startTime = this.startTime, endTime = this.endTime, notes = this.notes } = {}, timeCalculationService = defaultTimeCalculationService) { return new OvertimeEntry({ ...this.toObject(), startTime, endTime, notes, status: this.status, createdAt: this.createdAt, updatedAt: new Date().toISOString() }, timeCalculationService); }
  softDelete(timeCalculationService = defaultTimeCalculationService) { return new OvertimeEntry({ ...this.toObject(), status: 'deleted', updatedAt: new Date().toISOString() }, timeCalculationService); }
  toObject() { return { ...this }; }
}
