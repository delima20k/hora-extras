export class WorkScheduleRepository {
  constructor(database) { this.database = database; }
  findByEmployeeId(employeeId) { return this.database.getByIndex('workSchedules', 'employeeId', employeeId).then((items) => items[0] || null); }
}
