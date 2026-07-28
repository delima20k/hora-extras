import { OvertimeEntry } from '../models/OvertimeEntry.js';

export class OvertimeEntryRepository {
  constructor(database) { this.database = database; }
  create(entry) { return this.database.add('overtimeEntries', entry.toObject?.() || entry); }
  update(entry) { return this.database.update('overtimeEntries', entry.toObject?.() || entry); }
  async setPaymentStatus(entryOrId, paymentStatus) {
    const source = typeof entryOrId === 'string' ? await this.findById(entryOrId) : entryOrId;
    if (!source) throw new Error('LanÃ§amento nÃ£o encontrado.');
    const entry = new OvertimeEntry(source).update({ paymentStatus, receivedAt: paymentStatus === 'received' ? new Date().toISOString() : null });
    return this.update(entry);
  }
  async delete(entryOrId) {
    const source = typeof entryOrId === 'string' ? await this.findById(entryOrId) : entryOrId;
    if (!source) throw new Error('Lançamento não encontrado.');
    const deleted = new OvertimeEntry(source).softDelete(); return this.update(deleted);
  }
  findById(id) { return this.database.getById('overtimeEntries', id); }
  async findAll(employeeId, includeDeleted = false) { const entries = await this.database.getByIndex('overtimeEntries', 'employeeId', employeeId); return entries.filter((entry) => includeDeleted || entry.status === 'active').sort((left, right) => left.date.localeCompare(right.date) || left.startTime.localeCompare(right.startTime)); }
  async findByDate(employeeId, date, includeDeleted = false) {
    const entries = await this.database.getByIndex('overtimeEntries', 'employeeId_date', [employeeId, date]);
    return this.filterAndSort(entries, includeDeleted);
  }
  async findByMonth(employeeId, month, year, includeDeleted = false) {
    const prefix = `${year}-${String(month).padStart(2, '0')}-`;
    const range = IDBKeyRange.bound([employeeId, prefix], [employeeId, `${prefix}\uffff`]);
    const entries = await this.database.getByIndexRange('overtimeEntries', 'employeeId_date', range);
    return this.filterAndSort(entries, includeDeleted);
  }
  filterAndSort(entries, includeDeleted) { return entries.filter((entry) => includeDeleted || entry.status === 'active').sort((left, right) => left.date.localeCompare(right.date) || left.startTime.localeCompare(right.startTime)); }
}
