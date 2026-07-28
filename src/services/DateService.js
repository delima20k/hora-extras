export class DateService {
  now() { return new Date(); }
  currentPeriod() { const date = this.now(); return { month: date.getMonth() + 1, year: date.getFullYear() }; }
  toDateKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
}
