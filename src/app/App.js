import { NavigationController } from '../controllers/NavigationController.js';
import { ProfileController } from '../controllers/ProfileController.js';
import { CalendarController } from '../controllers/CalendarController.js';
import { DayController } from '../controllers/DayController.js';
import { EmployeeRepository } from '../repositories/EmployeeRepository.js';
import { PayrollSettingsRepository } from '../repositories/PayrollSettingsRepository.js';
import { ProfileRepository } from '../repositories/ProfileRepository.js';
import { WorkScheduleRepository } from '../repositories/WorkScheduleRepository.js';
import { OvertimeEntryRepository } from '../repositories/OvertimeEntryRepository.js';
import { DatabaseService } from '../services/DatabaseService.js';
import { DateService } from '../services/DateService.js';
import { CalendarService } from '../services/CalendarService.js';
import { TimeCalculationService } from '../services/TimeCalculationService.js';
import { ImageService } from '../services/ImageService.js';
import { PwaService } from '../services/PwaService.js';
import { StorageService } from '../services/StorageService.js';
import { SidebarView } from '../views/SidebarView.js';
import { LayoutView } from '../views/LayoutView.js';
import { button, element } from '../utils/dom.js';
import { ROUTES } from '../utils/constants.js';

export class App {
  constructor(root) {
    this.root = root; this.database = new DatabaseService(); this.storage = new StorageService(); this.dateService = new DateService(); this.imageService = new ImageService(); this.state = { currentRoute: 'today', ...this.dateService.currentPeriod(), selectedDate: null, employee: null, workSchedule: null, payrollSettings: null, sidebarOpen: false, avatarUrl: null };
  }
  async initialize() {
    this.root.textContent = 'Carregando aplicativo...';
    try {
      const savedPeriod = this.storage.get('selectedPeriod'); if (savedPeriod?.month && savedPeriod?.year) Object.assign(this.state, savedPeriod);
      await this.database.open();
      this.repositories = { employee: new EmployeeRepository(this.database), workSchedule: new WorkScheduleRepository(this.database), payroll: new PayrollSettingsRepository(this.database), profile: new ProfileRepository(this.database), overtimeEntry: new OvertimeEntryRepository(this.database) };
      const loaded = await this.repositories.profile.loadPrimary(); if (loaded) Object.assign(this.state, loaded); this.updateAvatarUrl();
      this.layout = new LayoutView(this.root); this.layout.render(() => this.toggleMenu()); this.sidebar = new SidebarView();
      this.profileController = new ProfileController({ profileRepository: this.repositories.profile, imageService: this.imageService, onSaved: async (bundle) => { Object.assign(this.state, bundle); this.updateAvatarUrl(); this.refreshChrome(); } });
      this.calendarController = new CalendarController({ state: this.state, storage: this.storage, calendarService: new CalendarService(() => this.dateService.now()), onDaySelected: () => this.navigation.navigate('day') });
      this.dayController = new DayController({ state: this.state, dateService: this.dateService, entryRepository: this.repositories.overtimeEntry, timeCalculationService: new TimeCalculationService(), onEntriesChanged: () => { if (this.state.currentRoute === 'month') this.calendarController.render(); } });
      this.navigation = new NavigationController({ layout: this.layout, state: this.state, dateService: this.dateService, onNavigate: () => { this.closeMenu(); this.renderSidebar(); }, calendarController: this.calendarController, dayController: this.dayController, profileActions: { onSubmit: (...args) => this.profileController.submit(...args), onFileChange: (...args) => this.profileController.handleFile(...args) } });
      this.layout.refs.overlay.addEventListener('click', () => this.closeMenu()); document.addEventListener('keydown', (event) => { if (event.key === 'Escape') this.closeMenu(); }); window.addEventListener('hashchange', () => this.navigation.render());
      this.pwa = new PwaService(this.storage); this.pwa.register(); this.pwa.listen(() => this.renderInstallCard());
      const initialRoute = this.navigation.routeFromHash();
      if (!window.location.hash || initialRoute !== window.location.hash.slice(1)) history.replaceState(null, '', '#today');
      this.navigation.render(initialRoute);
    } catch { this.root.replaceChildren(element('section', { className: 'startup-error' }, [element('h1', { text: 'Não foi possível iniciar o aplicativo.' }), element('p', { text: 'Tente fechar e abrir novamente.' })])); }
  }
  updateAvatarUrl() { if (this.state.avatarUrl) this.imageService.revokePreview(this.state.avatarUrl); this.state.avatarUrl = this.state.employee?.avatar instanceof Blob ? this.imageService.createPreview(this.state.employee.avatar) : null; }
  renderSidebar() { this.sidebar.render(this.layout.refs.sidebar, this.state, (route) => this.navigation.navigate(route)); }
  refreshChrome() { this.layout.updateHeader(ROUTES[this.state.currentRoute] || ROUTES.today, this.state.employee, this.state.avatarUrl); this.renderSidebar(); }
  toggleMenu() { this.state.sidebarOpen ? this.closeMenu() : this.openMenu(); }
  openMenu() { this.state.sidebarOpen = true; this.layout.setMenuOpen(true); }
  closeMenu() { if (!this.layout) return; this.state.sidebarOpen = false; this.layout.setMenuOpen(false); }
  renderInstallCard() { const card = this.layout.refs.install; const install = button('Instalar', { className: 'primary-button', onClick: async () => { await this.pwa.install(); card.hidden = true; } }); const later = button('Agora não', { className: 'secondary-button', onClick: () => { this.pwa.dismiss(); card.hidden = true; } }); card.replaceChildren(element('strong', { text: 'Instalar aplicativo' }), element('p', { text: 'Adicione o Controle de Horas Extras à tela inicial do celular.' }), element('div', { className: 'button-row' }, [install, later])); card.hidden = false; }
}
