import { button, element } from '../utils/dom.js';
import { displayName } from '../utils/formatters.js';

const defaultAvatar = () => `${import.meta.env.BASE_URL}default-avatar.svg`;

export class LayoutView {
  constructor(root) { this.root = root; this.refs = null; }
  render(onMenu) {
    this.root.replaceChildren();
    const menuButton = button('☰', { className: 'menu-button', 'aria-label': 'Abrir menu', 'aria-expanded': 'false', onClick: onMenu });
    const title = element('h1', { className: 'header-title', text: 'Dia atual' });
    const avatar = element('img', { className: 'header-avatar', src: defaultAvatar(), alt: 'Avatar do usuário' });
    const header = element('header', { className: 'app-header' }, [menuButton, title, avatar]);
    const sidebar = element('aside', { className: 'sidebar', 'aria-hidden': 'true', 'aria-label': 'Menu principal' });
    const overlay = element('div', { className: 'sidebar-overlay', hidden: '', 'aria-hidden': 'true' });
    const main = element('main', { id: 'app', tabindex: '-1' });
    const install = element('section', { className: 'install-card', hidden: '', 'aria-label': 'Instalar aplicativo' });
    this.root.append(header, sidebar, overlay, main, install); this.refs = { header, menuButton, title, avatar, sidebar, overlay, main, install }; return this.refs;
  }
  updateHeader(title, employee, avatarUrl) { this.refs.title.textContent = title; this.refs.avatar.src = avatarUrl || defaultAvatar(); this.refs.avatar.alt = `Avatar de ${displayName(employee)}`; }
  setMenuOpen(open) {
    this.refs.menuButton.textContent = open ? '×' : '☰';
    this.refs.menuButton.setAttribute('aria-expanded', String(open)); this.refs.menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    this.refs.sidebar.setAttribute('aria-hidden', String(!open)); this.refs.sidebar.classList.toggle('is-open', open);
    this.refs.overlay.hidden = !open; this.refs.overlay.setAttribute('aria-hidden', String(!open)); this.refs.overlay.classList.toggle('is-open', open);
    this.refs.main.inert = open; this.refs.main.setAttribute('aria-hidden', String(open));
  }
}
