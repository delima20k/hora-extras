const localDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export class CalendarDay {
  constructor({ value, currentMonth, currentYear, selectedDate = null, today }) {
    const compareDate = new Date(value.getFullYear(), value.getMonth(), value.getDate());
    const compareToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    this.date = localDateKey(value);
    this.day = value.getDate();
    this.month = value.getMonth() + 1;
    this.year = value.getFullYear();
    this.weekday = value.getDay();
    this.isToday = compareDate.getTime() === compareToday.getTime();
    this.isCurrentMonth = this.month === currentMonth && this.year === currentYear;
    this.isSelected = this.date === selectedDate;
    this.isFuture = compareDate.getTime() > compareToday.getTime();
    this.isPast = compareDate.getTime() < compareToday.getTime();
  }
}
