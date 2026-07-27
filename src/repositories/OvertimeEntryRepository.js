import { OvertimeEntry } from '../models/OvertimeEntry.js';

export class OvertimeEntryRepository {
  constructor(database) { this.database = database; }
  create(entry) { return this.database.add('overtimeEntries', entry.toObject?.() || entry); }
  update(entry) { return this.database.update('overtimeEntries', entry.toObject?.() || entry); }
  async delete(entryOrId) {
    const source = typeof entryOrId === 'string' ? await this.findById(entryOrId) : entryOrId;
    if (!source) throw new Error('Lançamento não encontrado.');
    const deleted = new OvertimeEntry(source).softDelete(); return this.update(deleted);
  }
  findById(id) { return this.database.getById('overtimeEntries', id); }
  async findAll(employeeId, includeDeleted = false) { const entries = await this.database.getByIndex('overtimeEntries', 'employeeId', employeeId); return entries.filter((entry) => includeDeleted || entry.status === 'active').sort((left, right) => left.date.localeCompare(right.date) || left.startTime.localeCompare(right.startTime)); }
  async findByDate(employeeId, date, includeDeleted = false) { return (await this.findAll(employeeId, includeDeleted)).filter((entry) => entry.date === date); }
  async findByMonth(employeeId, month, year, includeDeleted = false) { const prefix = `${year}-${String(month).padStart(2, '0')}-`; return (await this.findAll(employeeId, includeDeleted)).filter((entry) => entry.date.startsWith(prefix)); }
}
