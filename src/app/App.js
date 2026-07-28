import { NavigationController } from '../controllers/NavigationController.js';
import { ProfileController } from '../controllers/ProfileController.js';
import { CalendarController } from '../controllers/CalendarController.js';
import { DayController } from '../controllers/DayController.js';
import { TotalController } from '../controllers/TotalController.js';
import { EmployeeRepository } from '../repositories/EmployeeRepository.js';
import { PayrollSettingsRepository } from '../repositories/PayrollSettingsRepository.js';
import { ProfileRepository } from '../repositories/ProfileRepository.js';
import { WorkScheduleRepository } from '../repositories/WorkScheduleRepository.js';
import { OvertimeEntryRepository } from '../repositories/OvertimeEntryRepository.js';
import { PayrollClosureRepository } from '../repositories/PayrollClosureRepository.js';
import { DatabaseService } from '../services/DatabaseService.js';
import { DateService } from '../services/DateService.js';
import { CalendarService } from '../services/CalendarService.js';
import { TimeCalculationService } from '../services/TimeCalculationService.js';
import { PayrollPeriodService } from '../services/PayrollPeriodService.js';
import { PayrollClosureService } from '../services/PayrollClosureService.js';
import { ImageService } from '../services/ImageService.js';
import { PwaService } from '../services/PwaService.js';
import { StorageService } from '../services/StorageService.js';
import { SidebarView } from '../views/SidebarView.js';
import { LayoutView } from '../views/LayoutView.js';
import { button, element } from '../utils/dom.js';
import { ROUTES } from '../utils/constants.js';

const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export class App {
  constructor(root) {
    this.root = root;
    this.database = new DatabaseService();
    this.storage = new StorageService();
    this.dateService = new DateService();
    this.imageService = new ImageService();
    const period = this.dateService.currentPeriod();
    this.state = { currentRoute: 'today', selectedMonth: period.month, selectedYear: period.year, selectedDate: null, employee: null, workSchedule: null, payrollSettings: null, sidebarOpen: false, avatarUrl: null };
    this.initialized = false;
    this.lastFocusedElement = null;
  }

  async initialize() {
    if (this.initialized) return;
    this.initialized = true;
    this.root.textContent = 'Carregando aplicativo...';
    try {
      const savedPeriod = this.storage.get('selectedPeriod');
      if (savedPeriod?.month && savedPeriod?.year) Object.assign(this.state, { selectedMonth: savedPeriod.month, selectedYear: savedPeriod.year, selectedDate: savedPeriod.selectedDate || null });
      await this.database.open();
      this.repositories = {
        employee: new EmployeeRepository(this.database),
        workSchedule: new WorkScheduleRepository(this.database),
        payroll: new PayrollSettingsRepository(this.database),
        profile: new ProfileRepository(this.database),
        overtimeEntry: new OvertimeEntryRepository(this.database),
        payrollClosure: new PayrollClosureRepository(this.database)
      };
      const loaded = await this.repositories.profile.loadPrimary();
      if (loaded) Object.assign(this.state, loaded);
      this.updateAvatarUrl();

      this.layout = new LayoutView(this.root);
      this.layout.render(() => this.toggleMenu());
      this.sidebar = new SidebarView();
      this.profileController = new ProfileController({
        profileRepository: this.repositories.profile,
        imageService: this.imageService,
        onSaved: async (bundle) => {
          Object.assign(this.state, bundle);
          this.updateAvatarUrl();
          this.refreshChrome();
          if (this.state.currentRoute === 'total') await this.totalController.refresh();
        }
      });
      this.calendarController = new CalendarController({
        state: this.state,
        storage: this.storage,
        calendarService: new CalendarService(() => this.dateService.now()),
        onDaySelected: () => this.navigation.navigate('day')
      });
      const timeCalculationService = new TimeCalculationService(); const payrollPeriodService = new PayrollPeriodService(); const payrollClosureService = new PayrollClosureService({ payrollPeriodService, timeCalculationService });
      this.totalController = new TotalController({ state: this.state, entryRepository: this.repositories.overtimeEntry, closureRepository: this.repositories.payrollClosure, timeCalculationService, payrollPeriodService, payrollClosureService, dateService: this.dateService });
      this.dayController = new DayController({
        state: this.state,
        dateService: this.dateService,
        entryRepository: this.repositories.overtimeEntry,
        timeCalculationService,
        closureRepository: this.repositories.payrollClosure,
        payrollPeriodService,
        payrollClosureService,
        onEntriesChanged: () => {
          if (this.state.currentRoute === 'month') this.calendarController.render();
          if (this.state.currentRoute === 'total') void this.totalController.refresh();
        }
      });
      this.navigation = new NavigationController({
        layout: this.layout,
        state: this.state,
        dateService: this.dateService,
        onNavigate: () => {
          const wasOpen = this.state.sidebarOpen;
          this.closeMenu({ restoreFocus: false });
          this.renderSidebar();
          if (wasOpen) this.layout.refs.main.focus();
        },
        calendarController: this.calendarController,
        dayController: this.dayController,
        totalController: this.totalController,
        profileActions: {
          onSubmit: (...args) => this.profileController.submit(...args),
          onFileChange: (...args) => this.profileController.handleFile(...args)
        }
      });
      this.handleOverlayClick = () => this.closeMenu();
      this.handleKeyDown = (event) => this.onKeyDown(event);
      this.handleHashChange = () => this.navigation.render();
      this.layout.refs.overlay.addEventListener('click', this.handleOverlayClick);
      document.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('hashchange', this.handleHashChange);

      this.pwa = new PwaService(this.storage);
      void this.pwa.register();
      this.pwa.listen(() => this.renderInstallCard());
      const initialRoute = this.navigation.routeFromHash();
      if (!window.location.hash || initialRoute !== window.location.hash.slice(1)) history.replaceState(null, '', '#today');
      this.navigation.render(initialRoute);
    } catch {
      this.root.replaceChildren(element('section', { className: 'startup-error' }, [element('h1', { text: 'Não foi possível iniciar o aplicativo.' }), element('p', { text: 'Tente fechar e abrir novamente.' })]));
    }
  }

  updateAvatarUrl() {
    if (this.state.avatarUrl) this.imageService.revokePreview(this.state.avatarUrl);
    this.state.avatarUrl = this.state.employee?.avatar instanceof Blob ? this.imageService.createPreview(this.state.employee.avatar) : null;
  }

  renderSidebar() { this.sidebar.render(this.layout.refs.sidebar, this.state, (route) => this.navigation.navigate(route)); }
  refreshChrome() { this.layout.updateHeader(this.state.currentRoute === 'day' ? 'Dia' : (ROUTES[this.state.currentRoute] || ROUTES.today), this.state.employee, this.state.avatarUrl); this.renderSidebar(); }
  toggleMenu() { this.state.sidebarOpen ? this.closeMenu() : this.openMenu(); }

  openMenu() {
    this.lastFocusedElement = document.activeElement;
    this.state.sidebarOpen = true;
    this.renderSidebar();
    this.layout.setMenuOpen(true);
    const focusFirstItem = () => this.layout.refs.sidebar.querySelector(focusableSelector)?.focus();
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(focusFirstItem); else setTimeout(focusFirstItem, 0);
  }

  closeMenu({ restoreFocus = true } = {}) {
    if (!this.layout || !this.state.sidebarOpen) return;
    this.state.sidebarOpen = false;
    this.layout.setMenuOpen(false);
    if (restoreFocus && this.lastFocusedElement?.isConnected) this.lastFocusedElement.focus();
    this.lastFocusedElement = null;
  }

  onKeyDown(event) {
    if (event.key === 'Escape' && this.state.sidebarOpen) {
      event.preventDefault();
      this.closeMenu();
      return;
    }
    if (event.key !== 'Tab' || !this.state.sidebarOpen) return;
    const focusable = [...this.layout.refs.sidebar.querySelectorAll(focusableSelector)];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  renderInstallCard() {
    const card = this.layout.refs.install;
    const install = button('Instalar', { className: 'primary-button', onClick: async () => { const accepted = await this.pwa.install(); if (accepted) card.hidden = true; } });
    const later = button('Agora não', { className: 'secondary-button', onClick: () => { this.pwa.dismiss(); card.hidden = true; } });
    card.replaceChildren(element('strong', { text: 'Instalar aplicativo' }), element('p', { text: 'Adicione o Controle de Horas Extras à tela inicial do celular.' }), element('div', { className: 'button-row' }, [install, later]));
    card.hidden = false;
  }

  destroy() {
    if (!this.initialized) return;
    this.closeMenu({ restoreFocus: false });
    this.layout?.refs.overlay.removeEventListener('click', this.handleOverlayClick);
    document.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('hashchange', this.handleHashChange);
    this.dayController?.close();
    this.totalController?.close();
    this.profileController?.destroy();
    this.pwa?.destroy();
    if (this.state.avatarUrl) this.imageService.revokePreview(this.state.avatarUrl);
    this.database.close();
    this.initialized = false;
  }
}
