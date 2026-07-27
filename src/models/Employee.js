import { newId, normalizeText, optionalText } from '../utils/validators.js';

export class Employee {
  constructor({ id = newId(), name, avatar = null, notes = '', createdAt = new Date().toISOString(), updatedAt = createdAt } = {}) {
    this.id = String(id); this.name = normalizeText(name, 'Nome', 120); this.avatar = avatar; this.notes = optionalText(notes, 1000); this.createdAt = createdAt; this.updatedAt = updatedAt;
  }
  update({ name = this.name, avatar = this.avatar, notes = this.notes } = {}) { this.name = normalizeText(name, 'Nome', 120); this.avatar = avatar; this.notes = optionalText(notes, 1000); this.updatedAt = new Date().toISOString(); return this; }
  toObject() { return { id: this.id, name: this.name, avatar: this.avatar, notes: this.notes, createdAt: this.createdAt, updatedAt: this.updatedAt }; }
}
