const MINUTES_PER_DAY = 24 * 60;

const dateToMinuteOffset = (date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) throw new Error('Data inválida para comparação de horário.');
  const [year, month, day] = date.split('-').map(Number); const value = new Date(year, month - 1, day);
  if (value.getFullYear() !== year || value.getMonth() + 1 !== month || value.getDate() !== day) throw new Error('Data inválida para comparação de horário.');
  return Math.floor(value.getTime() / 60000);
};

export class TimeCalculationService {
  isValidTime(time) { return typeof time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(time); }
  parseTimeToMinutes(time) {
    if (!this.isValidTime(time)) throw new Error('Horário inválido. Utilize o formato HH:mm.');
    const [hours, minutes] = time.split(':').map(Number); return hours * 60 + minutes;
  }
  calculateDuration(startTime, endTime) {
    const startMinutes = this.parseTimeToMinutes(startTime); const endMinutes = this.parseTimeToMinutes(endTime);
    if (startMinutes === endMinutes) throw new Error('O horário final deve ser diferente do horário inicial.');
    const duration = endMinutes > startMinutes ? endMinutes - startMinutes : MINUTES_PER_DAY - startMinutes + endMinutes;
    if (!Number.isInteger(duration) || duration <= 0 || duration >= MINUTES_PER_DAY) throw new Error('Não foi possível calcular a duração.');
    return duration;
  }
  isNextDay(startTime, endTime) { return this.parseTimeToMinutes(endTime) < this.parseTimeToMinutes(startTime); }
  getDateParts(date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) throw new Error('Data inválida.');
    const [year, month, day] = date.split('-').map(Number);
    const value = new Date(year, month - 1, day);
    if (value.getFullYear() !== year || value.getMonth() + 1 !== month || value.getDate() !== day) throw new Error('Data inválida.');
    return { year, month, day, value };
  }
  getEasterDate(year) {
    const a = year % 19; const b = Math.floor(year / 100); const c = year % 100; const d = Math.floor(b / 4); const e = b % 4; const f = Math.floor((b + 8) / 25); const g = Math.floor((b - f + 1) / 3); const h = (19 * a + b - d - g + 15) % 30; const i = Math.floor(c / 4); const k = c % 4; const l = (32 + 2 * e + 2 * i - h - k) % 7; const m = Math.floor((a + 11 * h + 22 * l) / 451); const month = Math.floor((h + l - 7 * m + 114) / 31); const day = (h + l - 7 * m + 114) % 31 + 1;
    return new Date(year, month - 1, day);
  }
  isHoliday(date) {
    const { year, month, day, value } = this.getDateParts(date);
    const fixed = new Set(['1-1', '4-21', '5-1', '9-7', '10-12', '11-2', '11-15', '11-20', '12-25']);
    if (fixed.has(`${month}-${day}`)) return true;
    const easter = this.getEasterDate(year);
    const diff = Math.round((value - easter) / 86400000);
    return diff === -2 || diff === 60;
  }
  getOvertimeMultiplier(date) {
    const { value } = this.getDateParts(date);
    return value.getDay() === 0 || this.isHoliday(date) ? 2 : 1.65;
  }
  calculateOvertimePay(durationMinutes, date, payrollSettings) {
    const salary = Number(payrollSettings?.salary); const monthlyWorkload = Number(payrollSettings?.monthlyWorkload);
    if (!Number.isFinite(salary) || salary <= 0 || !Number.isFinite(monthlyWorkload) || monthlyWorkload <= 0) return 0;
    return (durationMinutes / 60) * (salary / monthlyWorkload) * this.getOvertimeMultiplier(date);
  }
  overlapsNormalSchedule(startTime, endTime, schedule) {
    if (!schedule?.startTime || !schedule?.endTime) return false;
    const candidateStart = this.parseTimeToMinutes(startTime); const candidateEnd = candidateStart + this.calculateDuration(startTime, endTime);
    const normalStart = this.parseTimeToMinutes(schedule.startTime); const rawNormalEnd = this.parseTimeToMinutes(schedule.endTime); const normalEnd = rawNormalEnd > normalStart ? rawNormalEnd : rawNormalEnd + MINUTES_PER_DAY;
    return candidateStart < normalEnd && normalStart < candidateEnd;
  }
  formatDuration(durationMinutes) {
    if (!Number.isInteger(durationMinutes) || durationMinutes < 0 || durationMinutes >= MINUTES_PER_DAY) throw new Error('Duração inválida.');
    return `${Math.floor(durationMinutes / 60)}h${String(durationMinutes % 60).padStart(2, '0')}`;
  }
  hasOverlap(candidate, existingEntries, ignoredEntryId = null) {
    const candidateRange = this.getRange(candidate);
    return existingEntries.some((entry) => entry.status === 'active' && entry.id !== ignoredEntryId && this.rangesOverlap(candidateRange, this.getRange(entry)));
  }
  sumDurations(entries) {
    return entries.filter((entry) => entry.status === 'active').reduce((total, entry) => {
      if (!Number.isInteger(entry.durationMinutes) || entry.durationMinutes < 0) throw new Error('Duração inválida.');
      return total + entry.durationMinutes;
    }, 0);
  }
  getRange(entry) {
    const start = dateToMinuteOffset(entry.date) + this.parseTimeToMinutes(entry.startTime); const duration = this.calculateDuration(entry.startTime, entry.endTime);
    return { start, end: start + duration };
  }
  rangesOverlap(left, right) { return left.start < right.end && right.start < left.end; }
}
