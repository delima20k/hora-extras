import { ACCEPTED_IMAGE_TYPES, CLOSING_STRATEGIES, MAX_IMAGE_BYTES, WORK_DAYS } from './constants.js';

export function assert(condition, message) { if (!condition) throw new Error(message); }
export function newId() { return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
export function normalizeText(value, field = 'Texto', maxLength = 500) {
  const text = String(value ?? '').replace(/[\u0000-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim();
  assert(text.length > 0, `${field} é obrigatório.`);
  assert(text.length <= maxLength, `${field} deve ter no máximo ${maxLength} caracteres.`);
  return text;
}
export function optionalText(value, maxLength = 1000) {
  const text = String(value ?? '').replace(/[\u0000-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim();
  assert(text.length <= maxLength, `O campo deve ter no máximo ${maxLength} caracteres.`);
  return text;
}
export function parseSalary(value) {
  const raw = String(value ?? '').trim().replace(/R\$/gi, '').replace(/\s/g, '');
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
  const salary = Number(normalized);
  assert(Number.isFinite(salary) && salary > 0, 'Informe um salário válido maior que zero.');
  return salary;
}
export function assertTime(value, label) { assert(/^([01]\d|2[0-3]):[0-5]\d$/.test(value), `${label} deve estar no formato HH:mm.`); return value; }
export function assertDateKey(value) {
  assert(/^\d{4}-\d{2}-\d{2}$/.test(value || ''), 'Data inválida.');
  const [year, month, day] = value.split('-').map(Number); const date = new Date(year, month - 1, day);
  assert(date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day, 'Data inválida.'); return value;
}
export function assertWorkDays(days) {
  assert(Array.isArray(days) && days.length > 0, 'Selecione pelo menos um dia de trabalho.');
  const permitted = new Set(WORK_DAYS.map(([id]) => id));
  assert(days.every((day) => permitted.has(day)), 'Há um dia de trabalho inválido.');
  return [...new Set(days)];
}
export function assertImageFile(file) {
  assert(file && ACCEPTED_IMAGE_TYPES.includes(file.type), 'Escolha uma imagem JPG, JPEG, PNG ou WEBP.');
  assert(file.size <= MAX_IMAGE_BYTES, 'A imagem deve ter no máximo 5 MB.');
  return file;
}
export function assertClosingStrategy(value) { assert(CLOSING_STRATEGIES.includes(value), 'Escolha uma estratégia válida para o fechamento.'); return value; }
export function assertIntegerInRange(value, min, max, label) { const number = Number(value); assert(Number.isInteger(number) && number >= min && number <= max, `${label} deve estar entre ${min} e ${max}.`); return number; }
export function assertPositive(value, label) { const number = Number(value); assert(Number.isFinite(number) && number > 0, `${label} deve ser maior que zero.`); return number; }
