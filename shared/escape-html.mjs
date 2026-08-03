// Shared by the public travel page and both admin editors, all of which build
// markup strings for innerHTML. Escapes the apostrophe as well as the four
// required characters so the output is safe inside single-quoted attributes.
const ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
};

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ENTITIES[character]);
}
