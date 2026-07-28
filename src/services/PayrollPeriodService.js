const toKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const fromKey = (key) => { const [year, month, day] = key.split('-').map(Number); return new Date(year, month - 1, day); };
const addDays = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export class PayrollPeriodService {
  getClosingDate(year, month, settings) {
    const requestedDay = Number(settings?.payrollClosingDay);
    if (!Number.isInteger(requestedDay) || requestedDay < 1) return null;
    const daysInMonth = new Date(year, month, 0).getDate();
    if (requestedDay <= daysInMonth) return new Date(year, month - 1, requestedDay);
    if (settings?.invalidClosingDayStrategy === 'first-day-next-month') return new Date(year, month, 1);
    return new Date(year, month - 1, daysInMonth);
  }
  getPeriodForDate(dateKey, settings) {
    const target = fromKey(dateKey); const year = target.getFullYear(); const month = target.getMonth() + 1;
    let end = this.getClosingDate(year, month, settings);
    if (!end) return null;
    if (target > end) end = this.getClosingDate(year, month + 1, settings);
    const previousMonth = new Date(end.getFullYear(), end.getMonth() - 1, 1);
    const previousEnd = this.getClosingDate(previousMonth.getFullYear(), previousMonth.getMonth() + 1, settings);
    const start = addDays(previousEnd, 1);
    return { startDate: toKey(start), endDate: toKey(end) };
  }
  isClosed(dateKey, settings, now = new Date()) {
    const period = this.getPeriodForDate(dateKey, settings);
    return Boolean(period && period.endDate < toKey(now));
  }
  getClosedPeriods(entries, settings, now = new Date()) {
    const today = toKey(now); const periods = new Map();
    for (const entry of entries) {
      const period = this.getPeriodForDate(entry.date, settings);
      if (period && period.endDate < today) {
        const current = periods.get(period.endDate) || { ...period, entries: [] };
        current.entries.push(entry); periods.set(period.endDate, current);
      }
    }
    return [...periods.values()].sort((left, right) => right.endDate.localeCompare(left.endDate));
  }
  getCurrentPeriod(settings, now = new Date()) { return this.getPeriodForDate(toKey(now), settings); }
  formatDate(dateKey) { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(fromKey(dateKey)); }
}
