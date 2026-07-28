import { ROUTES } from '../utils/constants.js';
import { MonthView } from '../views/MonthView.js';
import { ProfileView } from '../views/ProfileView.js';
import { TodayView } from '../views/TodayView.js';
import { TotalView } from '../views/TotalView.js';
import { DayView } from '../views/DayView.js';

export class NavigationController {
  constructor({ layout, state, dateService, onNavigate, profileActions, calendarController, dayController, totalController }) {
    this.layout = layout; this.state = state; this.dateService = dateService; this.onNavigate = onNavigate; this.profileActions = profileActions; this.calendarController = calendarController; this.dayController = dayController; this.totalController = totalController;
    this.views = { today: new DayView(this.layout.refs.main), hours: new DayView(this.layout.refs.main), month: new MonthView(), total: new TotalView(), profile: new ProfileView(), day: new DayView(this.layout.refs.main) };
  }
  isKnownRoute(route) { return Boolean(ROUTES[route]) || route === 'day'; }
  routeFromHash() { const route = window.location.hash.replace('#', ''); return this.isKnownRoute(route) ? route : 'today'; }
  navigate(route) { const valid = this.isKnownRoute(route) ? route : 'today'; if (window.location.hash !== `#${valid}`) window.location.hash = valid; else this.render(valid); }
  render(route = this.routeFromHash()) {
    const valid = this.isKnownRoute(route) ? route : 'today'; if (valid === 'day' && !this.state.selectedDate) return this.navigate('month');
    if (['today', 'day', 'hours'].includes(this.state.currentRoute) && !['today', 'day', 'hours'].includes(valid)) this.dayController?.close();
    if (this.state.currentRoute === 'total' && valid !== 'total') this.totalController?.close();
    this.state.currentRoute = valid; this.layout.updateHeader(['day', 'hours'].includes(valid) ? 'Adicionar horas' : ROUTES[valid], this.state.employee, this.state.avatarUrl); this.onNavigate(valid);
    if (valid === 'today') {
      this.state.selectedDate = this.dateService.toDateKey(this.dateService.now());
      this.dayController?.open(this.views.today, () => this.navigate('month'), { alwaysShowForm: true });
    }
    if (valid === 'hours') {
      if (!this.state.selectedDate) this.state.selectedDate = this.dateService.toDateKey(this.dateService.now());
      this.dayController.open(this.views.hours, () => this.navigate('month'));
    }
    if (valid === 'month') this.views.month.render(this.layout.refs.main, this.state, { calendarController: this.calendarController });
    if (valid === 'total') {
      if (this.totalController) this.totalController.open(this.views.total);
      else this.views.total.render(this.layout.refs.main, this.state);
    }
    if (valid === 'profile') this.views.profile.render(this.layout.refs.main, this.state, { avatarUrl: this.state.avatarUrl, ...this.profileActions });
    if (valid === 'day') this.dayController.open(this.views.day, () => this.navigate('month'));
  }
}
