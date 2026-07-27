export class CalendarController {
  constructor({ state, storage, calendarService, onDaySelected = () => {} }) {
    this.state = state; this.storage = storage; this.calendarService = calendarService; this.onDaySelected = onDaySelected; this.view = null;
    if (!this.calendarService.isValidDateKey(this.state.selectedDate)) this.state.selectedDate = null;
  }
  attachView(view) { this.view = view; this.render(); }
  render() {
    if (!this.view) return;
    this.view.renderMonth({ month: this.state.selectedMonth, year: this.state.selectedYear, title: this.calendarService.getMonthTitle(this.state.selectedMonth, this.state.selectedYear), weekdayLabels: this.calendarService.getWeekdayLabels(), weeks: this.calendarService.getMonthWeeks(this.state.selectedMonth, this.state.selectedYear, this.state.selectedDate) }, { onPrevious: () => this.changeMonth(-1), onNext: () => this.changeMonth(1), onDaySelected: (day) => this.selectDay(day) });
  }
  persist() { this.storage.set('selectedPeriod', { month: this.state.selectedMonth, year: this.state.selectedYear, selectedDate: this.state.selectedDate }); }
  changeMonth(offset) { const period = this.calendarService.getPeriodFromOffset(this.state.selectedMonth, this.state.selectedYear, offset); this.state.selectedMonth = period.month; this.state.selectedYear = period.year; this.persist(); this.render(); }
  selectDay(day) {
    const previousDate = this.state.selectedDate; const changesPeriod = !day.isCurrentMonth;
    this.state.selectedDate = day.date;
    if (changesPeriod) { this.state.selectedMonth = day.month; this.state.selectedYear = day.year; }
    this.persist();
    const selectedDay = this.calendarService.getDayByDate(day.date, this.state.selectedMonth, this.state.selectedYear, this.state.selectedDate);
    if (changesPeriod) this.render(); else this.view?.updateSelection(previousDate, selectedDay);
    this.onDaySelected(selectedDay);
  }
}
