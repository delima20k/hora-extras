import { ROUTES } from '../utils/constants.js';
import { MonthView } from '../views/MonthView.js';
import { ProfileView } from '../views/ProfileView.js';
import { TodayView } from '../views/TodayView.js';
import { TotalView } from '../views/TotalView.js';
import { DayView } from '../views/DayView.js';

export class NavigationController {
  constructor({ layout, state, dateService, onNavigate, profileActions, calendarController, dayController }) {
    this.layout = layout; this.state = state; this.dateService = dateService; this.onNavigate = onNavigate; this.profileActions = profileActions; this.calendarController = calendarController; this.dayController = dayController;
    this.views = { today: new TodayView(), month: new MonthView(), total: new TotalView(), profile: new ProfileView(), day: new DayView(this.layout.refs.main) };
  }
  routeFromHash() { const route = window.location.hash.replace('#', ''); return ROUTES[route] || route === 'day' ? route : 'today'; }
  navigate(route) { const valid = ROUTES[route] || route === 'day' ? route : 'today'; if (window.location.hash !== `#${valid}`) window.location.hash = valid; else this.render(valid); }
  render(route = this.routeFromHash()) {
    const valid = ROUTES[route] || route === 'day' ? route : 'today'; if (valid === 'day' && !this.state.selectedDate) return this.navigate('month'); this.state.currentRoute = valid; this.layout.updateHeader(valid === 'day' ? 'Dia' : ROUTES[valid], this.state.employee, this.state.avatarUrl); this.onNavigate(valid);
    if (valid === 'today') this.views.today.render(this.layout.refs.main, this.state, { date: this.dateService.now() });
    if (valid === 'month') this.views.month.render(this.layout.refs.main, this.state, { calendarController: this.calendarController });
    if (valid === 'total') this.views.total.render(this.layout.refs.main, this.state);
    if (valid === 'profile') this.views.profile.render(this.layout.refs.main, this.state, { avatarUrl: this.state.avatarUrl, ...this.profileActions });
    if (valid === 'day') this.dayController.open(this.views.day, () => this.navigate('month'));
  }
}
