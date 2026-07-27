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
