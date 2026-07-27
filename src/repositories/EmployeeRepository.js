export class EmployeeRepository {
  constructor(database) { this.database = database; }
  create(employee) { return this.database.add('employees', employee.toObject?.() || employee); }
  findById(id) { return this.database.getById('employees', id); }
  findAll() { return this.database.getAll('employees'); }
  update(employee) { return this.database.update('employees', employee.toObject?.() || employee); }
  delete(id) { return this.database.delete('employees', id); }
}
