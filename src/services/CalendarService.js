import { CalendarDay } from '../models/CalendarDay.js';

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const localDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export class CalendarService {
  constructor(nowProvider = () => new Date()) { this.nowProvider = nowProvider; }
  getWeekdayLabels() { return [...WEEKDAY_LABELS]; }
  isValidDateKey(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const [year, month, day] = value.split('-').map(Number); const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day;
  }
  getDateFromKey(value) {
    if (!this.isValidDateKey(value)) return null;
    const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day);
  }
  getMonthTitle(month, year) { return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1)).replace(/^./, (letter) => letter.toUpperCase()); }
  getAriaLabel(day) { return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(this.getDateFromKey(day.date)); }
  createDay(value, currentMonth, currentYear, selectedDate = null) { return new CalendarDay({ value, currentMonth, currentYear, selectedDate, today: this.nowProvider() }); }
  getMonthWeeks(month, year, selectedDate = null) {
    const firstDay = new Date(year, month - 1, 1); const lastDay = new Date(year, month, 0);
    const visibleCells = Math.ceil((firstDay.getDay() + lastDay.getDate()) / 7) * 7;
    const firstVisibleDate = new Date(year, month - 1, 1 - firstDay.getDay());
    const days = Array.from({ length: visibleCells }, (_, index) => {
      const value = new Date(firstVisibleDate.getFullYear(), firstVisibleDate.getMonth(), firstVisibleDate.getDate() + index);
      return this.createDay(value, month, year, selectedDate);
    });
    return Array.from({ length: days.length / 7 }, (_, index) => days.slice(index * 7, index * 7 + 7));
  }
  getDayByDate(date, currentMonth, currentYear, selectedDate = null) {
    const value = this.getDateFromKey(date); return value ? this.createDay(value, currentMonth, currentYear, selectedDate) : null;
  }
  getPeriodFromOffset(month, year, offset) { const value = new Date(year, month - 1 + offset, 1); return { month: value.getMonth() + 1, year: value.getFullYear() }; }
  toLocalDateKey(date) { return localDateKey(date); }
}
