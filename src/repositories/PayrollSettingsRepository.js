export class PayrollSettingsRepository {
  constructor(database) { this.database = database; }
  findByEmployeeId(employeeId) { return this.database.getByIndex('payrollSettings', 'employeeId', employeeId).then((items) => items[0] || null); }
}
