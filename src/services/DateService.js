export class DateService {
  now() { return new Date(); }
  currentPeriod() { const date = this.now(); return { month: date.getMonth() + 1, year: date.getFullYear() }; }
}
