import { uploaderCapabilities } from '../lib/uploader-capabilities.mjs';

const list = document.getElementById('roll-list');
const status = document.getElementById('roll-list-status');
const newLink = document.getElementById('new-roll-link');
const unsupported = document.getElementById('uploader-unsupported');

const capabilities = uploaderCapabilities();
if (!capabilities.supported) {
  newLink.hidden = true;
  unsupported.hidden = false;
  document.getElementById('missing-capabilities').textContent = capabilities.missing.join(', ');
}

try {
  const response = await fetch('/.netlify/functions/rolls-data', { credentials: 'same-origin' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Could not load rolls');
  status.textContent = `${body.rolls.length} committed rolls`;
  list.replaceChildren(...body.rolls.map((roll) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `/rolls/${encodeURIComponent(roll.slug)}/`;
    link.textContent = roll.slug;
    item.append(link);
    return item;
  }));
} catch (error) {
  status.textContent = error.message;
}
