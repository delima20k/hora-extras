export class PayrollClosureRepository {
  constructor(database) { this.database = database; }
  save(closure) { return this.database.update('payrollClosures', closure); }
  async findAll(employeeId) { const records = await this.database.getByIndex('payrollClosures', 'employeeId', employeeId); return records.sort((left, right) => right.endDate.localeCompare(left.endDate)); }
}
