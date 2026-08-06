import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const html = `<!doctype html><body>
<fieldset id="travel-editor" disabled><button id="add-stop"></button><div id="stop-list"></div></fieldset>
<p id="editor-status"></p><section id="editor-errors" hidden><ul id="editor-error-list"></ul></section><span id="stop-count"></span>
<button id="review-travel" disabled></button><button id="reload-travel"></button>
<section id="review-panel" hidden tabindex="-1"><p id="review-summary"></p><button id="cancel-review"></button><button id="publish-travel"></button></section>
<section id="publication-panel" hidden><p id="publication-status"></p><a id="publication-pr"></a><a id="publication-preview"></a><button id="refresh-publication"></button><button id="abandon-publication"></button><button id="merge-publication"></button></section>
</body>`;

const trips = {
  meta: { title: 'Trip', subtitle: 'Subtitle' },
  stops: [
    { name: 'A', country: 'One', cc: 'ON', lat: 1, lon: 2, arrive: '2025-01-01', depart: '2025-01-02' },
    { name: 'B', country: 'Two', cc: 'TW', lat: 3, lon: 4, arrive: '2025-01-02', depart: '2025-01-03', tentative: true },
  ],
};

test('travel browser editor loads, edits, validates and opens review', async () => {
  const dom = new JSDOM(html, { url: 'https://admin.bjsmith.xyz/travel/' });
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    sessionStorage: globalThis.sessionStorage,
    confirm: globalThis.confirm,
    fetch: globalThis.fetch,
  };
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.sessionStorage = dom.window.sessionStorage;
  globalThis.confirm = () => true;
  globalThis.fetch = async (url) => {
    assert.equal(url, '/.netlify/functions/travel-data');
    return new Response(JSON.stringify({ ok: true, sha: 'a'.repeat(40), trips }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  };
  try {
    await import(`../src/scripts/travel-editor.js?test=${Date.now()}`);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(document.querySelectorAll('.stop-card').length, 2);
    assert.equal(document.getElementById('travel-editor').disabled, false);
    assert.equal(document.getElementById('review-travel').disabled, true);

    // Editing a stop's date (not place/country) makes the itinerary dirty
    // without invoking the geocoder.
    const depart = document.querySelector('.stop-card input[data-field="depart"]');
    depart.value = '2025-01-05';
    depart.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    assert.equal(document.getElementById('review-travel').disabled, false);
    document.getElementById('review-travel').click();
    assert.equal(document.getElementById('review-panel').hidden, false);
    assert.match(document.getElementById('review-summary').textContent, /2 stops/);
    assert.equal(document.getElementById('editor-errors').hidden, true);

    // Editing a stop schedules a debounced overview redraw; let it fire (it
    // returns early with no map element) before tearing the DOM down, so no
    // timer runs after globals are restored.
    await new Promise((resolve) => setTimeout(resolve, 450));
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
    dom.window.close();
  }
});
