import { DEFAULT_MONTHLY_WORKLOAD } from '../utils/constants.js';
import { assertClosingStrategy, assertIntegerInRange, assertPositive, newId } from '../utils/validators.js';

export class PayrollSettings {
  constructor({ id = newId(), employeeId, salary, payrollClosingDay, invalidClosingDayStrategy = 'last-day-of-month', monthlyWorkload = DEFAULT_MONTHLY_WORKLOAD, createdAt = new Date().toISOString(), updatedAt = createdAt } = {}) {
    if (!employeeId) throw new Error('Funcionário é obrigatório.');
    this.id = String(id); this.employeeId = String(employeeId); this.salary = assertPositive(salary, 'Salário'); this.payrollClosingDay = assertIntegerInRange(payrollClosingDay, 1, 31, 'Dia de fechamento'); this.invalidClosingDayStrategy = assertClosingStrategy(invalidClosingDayStrategy); this.monthlyWorkload = assertPositive(monthlyWorkload, 'Jornada mensal'); this.createdAt = createdAt; this.updatedAt = updatedAt;
  }
  update(data) { return new PayrollSettings({ ...this.toObject(), ...data, id: this.id, employeeId: this.employeeId, createdAt: this.createdAt, updatedAt: new Date().toISOString() }); }
  toObject() { return { ...this }; }
}
