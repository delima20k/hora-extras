import { button, element } from '../utils/dom.js';
import { ROUTES } from '../utils/constants.js';
import { displayName } from '../utils/formatters.js';

export class SidebarView {
  render(container, { employee, avatarUrl, route }, onNavigate) {
    container.replaceChildren();
    const avatar = element('img', { className: 'sidebar-avatar', src: avatarUrl || '/default-avatar.svg', alt: `Avatar de ${displayName(employee)}` });
    const identity = element('section', { className: 'sidebar-identity' }, [avatar, element('strong', { className: 'sidebar-name', text: displayName(employee) }), element('span', { text: 'Controle de horas extras' })]);
    const nav = element('nav', { className: 'sidebar-nav', 'aria-label': 'Navegação principal' });
    Object.entries(ROUTES).forEach(([key, title]) => nav.append(button(title, { className: `nav-item${route === key ? ' is-active' : ''}`, 'aria-current': route === key ? 'page' : undefined, onClick: () => onNavigate(key) })));
    container.append(identity, nav);
  }
}
