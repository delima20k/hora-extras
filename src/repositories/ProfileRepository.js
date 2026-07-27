import { Employee } from '../models/Employee.js';
import { PayrollSettings } from '../models/PayrollSettings.js';
import { WorkSchedule } from '../models/WorkSchedule.js';
import { PRIMARY_EMPLOYEE_KEY } from '../utils/constants.js';

export class ProfileRepository {
  constructor(database) { this.database = database; }
  async loadPrimary() {
    return this.database.runTransaction(['employees', 'workSchedules', 'payrollSettings', 'appSettings'], 'readonly', async (tx) => {
      const setting = await tx.get('appSettings', PRIMARY_EMPLOYEE_KEY); if (!setting?.value) return null;
      const employee = await tx.get('employees', setting.value); if (!employee) return null;
      const [schedules, payrollSettings] = await Promise.all([tx.getByIndex('workSchedules', 'employeeId', employee.id), tx.getByIndex('payrollSettings', 'employeeId', employee.id)]);
      return { employee, workSchedule: schedules[0] || null, payrollSettings: payrollSettings[0] || null };
    });
  }
  async saveProfileBundle(data) {
    return this.database.runTransaction(['employees', 'workSchedules', 'payrollSettings', 'appSettings'], 'readwrite', async (tx) => {
      const primary = await tx.get('appSettings', PRIMARY_EMPLOYEE_KEY); const existing = primary?.value ? await tx.get('employees', primary.value) : null;
      const employee = existing ? new Employee(existing).update({ name: data.name, notes: data.notes, avatar: data.avatar === undefined ? existing.avatar : data.avatar }) : new Employee({ name: data.name, notes: data.notes, avatar: data.avatar ?? null });
      const schedules = await tx.getByIndex('workSchedules', 'employeeId', employee.id); const payrolls = await tx.getByIndex('payrollSettings', 'employeeId', employee.id);
      const schedule = schedules[0] ? new WorkSchedule(schedules[0]).update(data.workSchedule) : new WorkSchedule({ ...data.workSchedule, employeeId: employee.id });
      const payroll = payrolls[0] ? new PayrollSettings(payrolls[0]).update(data.payrollSettings) : new PayrollSettings({ ...data.payrollSettings, employeeId: employee.id });
      await tx.put('employees', employee.toObject()); await tx.put('workSchedules', schedule.toObject()); await tx.put('payrollSettings', payroll.toObject()); await tx.put('appSettings', { key: PRIMARY_EMPLOYEE_KEY, value: employee.id });
      return { employee: employee.toObject(), workSchedule: schedule.toObject(), payrollSettings: payroll.toObject() };
    });
  }
}
