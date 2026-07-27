import { assertIntegerInRange, assertTime, assertWorkDays, newId } from '../utils/validators.js';

export class WorkSchedule {
  constructor({ id = newId(), employeeId, workDays, startTime, endTime, breakDurationMinutes = 0, createdAt = new Date().toISOString(), updatedAt = createdAt } = {}) {
    if (!employeeId) throw new Error('Funcionário é obrigatório.');
    this.id = String(id); this.employeeId = String(employeeId); this.workDays = assertWorkDays(workDays); this.startTime = assertTime(startTime, 'Horário de entrada'); this.endTime = assertTime(endTime, 'Horário de saída'); this.breakDurationMinutes = assertIntegerInRange(breakDurationMinutes, 0, 1440, 'Intervalo'); this.createdAt = createdAt; this.updatedAt = updatedAt;
  }
  update(data) { return new WorkSchedule({ ...this.toObject(), ...data, id: this.id, employeeId: this.employeeId, createdAt: this.createdAt, updatedAt: new Date().toISOString() }); }
  toObject() { return { ...this }; }
}
