import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { bindTreeToggle } from '../src/lib/tree-toggle.mjs';

test('tree toggles bind while year branches are detached from the document', () => {
  const dom = new JSDOM('<!doctype html><body><ul id="tree"></ul></body>');
  const { document } = dom.window;
  const fragment = document.createDocumentFragment();
  const branch = document.createElement('li');
  branch.dataset.treeBranch = '';
  branch.innerHTML = `
    <button type="button" aria-expanded="false" data-tree-toggle aria-controls="year-panel">2026/</button>
    <div id="year-panel" data-tree-collapse data-collapsed="true" inert></div>
  `;
  fragment.append(branch);

  const button = branch.querySelector('[data-tree-toggle]');
  const panel = branch.querySelector('[data-tree-collapse]');
  bindTreeToggle(button);
  document.getElementById('tree').append(fragment);

  button.click();
  assert.equal(button.getAttribute('aria-expanded'), 'true');
  assert.equal(panel.dataset.collapsed, 'false');

  button.click();
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  assert.equal(panel.dataset.collapsed, 'true');
  dom.window.close();
});
