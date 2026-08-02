const logout = document.getElementById('admin-logout');
logout?.addEventListener('click', async () => {
  logout.disabled = true;
  try {
    const response = await fetch('/.netlify/functions/auth-logout', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (!response.ok) throw new Error('sign out failed');
    location.href = '/';
  } catch {
    logout.disabled = false;
    const status = document.getElementById('logout-status');
    if (status) status.textContent = 'Could not sign out. Reload and try again.';
  }
});
