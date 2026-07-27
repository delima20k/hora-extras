export function element(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(options).forEach(([key, value]) => {
    if (key === 'className') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value !== undefined && value !== null) node.setAttribute(key, String(value));
  });
  children.flat().filter(Boolean).forEach((child) => node.append(child)); return node;
}
export function button(text, options = {}) { return element('button', { type: 'button', text, ...options }); }
export function field(labelText, control, hint = '') { const id = control.id; const label = element('label', { for: id, text: labelText }); return element('div', { className: 'form-field' }, [label, control, hint ? element('small', { className: 'field-hint', text: hint }) : null]); }
