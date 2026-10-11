export function bindTreeToggle(button) {
  if (button.dataset.treeReady === 'true') return;
  const branch = button.closest('[data-tree-branch]');
  const panel = branch?.querySelector('[data-tree-collapse]');
  if (!panel) return;

  button.dataset.treeReady = 'true';
  panel.inert = button.getAttribute('aria-expanded') !== 'true';
  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    panel.dataset.collapsed = String(expanded);
    panel.inert = expanded;
  });
}
