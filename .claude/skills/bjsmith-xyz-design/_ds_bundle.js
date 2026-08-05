/* @ds-bundle: {"format":4,"namespace":"BjsmithXyzDesignSystem_042b50","components":[{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"PageHeader","sourcePath":"components/core/PageHeader.jsx"},{"name":"Panel","sourcePath":"components/core/Panel.jsx"},{"name":"Stat","sourcePath":"components/core/Stat.jsx"},{"name":"StatGrid","sourcePath":"components/core/Stat.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"DirListHeader","sourcePath":"components/listing/DirListHeader.jsx"},{"name":"DirRow","sourcePath":"components/listing/DirRow.jsx"},{"name":"FilterBar","sourcePath":"components/listing/FilterBar.jsx"},{"name":"RollRow","sourcePath":"components/listing/RollRow.jsx"},{"name":"WorkRow","sourcePath":"components/listing/WorkRow.jsx"},{"name":"FilmStrip","sourcePath":"components/media/FilmStrip.jsx"},{"name":"Lightbox","sourcePath":"components/media/Lightbox.jsx"},{"name":"WorldMap","sourcePath":"components/media/WorldMap.jsx"},{"name":"Breadcrumb","sourcePath":"components/navigation/Breadcrumb.jsx"},{"name":"Footer","sourcePath":"components/navigation/Footer.jsx"},{"name":"SiteTree","sourcePath":"components/navigation/SiteTree.jsx"}],"sourceHashes":{"components/core/Button.jsx":"17e56ed3d77c","components/core/PageHeader.jsx":"7094e6a88b85","components/core/Panel.jsx":"eb6501992a98","components/core/Stat.jsx":"784ef9a3e906","components/core/Tag.jsx":"53a57774aca9","components/listing/DirListHeader.jsx":"26d37bf9886c","components/listing/DirRow.jsx":"429d0f81a9c3","components/listing/FilterBar.jsx":"0087cd601dab","components/listing/RollRow.jsx":"151787d15880","components/listing/WorkRow.jsx":"2cbdd7e47d86","components/media/FilmStrip.jsx":"682bc1897981","components/media/Lightbox.jsx":"35b971841576","components/media/WorldMap.jsx":"14c2363b9afd","components/navigation/Breadcrumb.jsx":"f1785875fc13","components/navigation/Footer.jsx":"7e7eaa84b8ed","components/navigation/SiteTree.jsx":"4bc768408180","ui_kits/admin/AdminApp.jsx":"9d4ded760962","ui_kits/admin/AdminScreens.jsx":"dd02201089a8","ui_kits/admin/LocationPicker.jsx":"214c4826c2cc","ui_kits/public-site/App.jsx":"9b788cbaec68","ui_kits/public-site/Screens.jsx":"7f75c578cb22","ui_kits/public-site/TravelMap.jsx":"bf42d52db6c7","ui_kits/public-site/kit-data.js":"d5151f27e849"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.BjsmithXyzDesignSystem_042b50 = window.BjsmithXyzDesignSystem_042b50 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.bjs-btn{display:inline-block;padding:var(--space-2) var(--space-4);font-family:var(--font-family);font-size:var(--font-size-sm);font-weight:var(--font-weight-medium);line-height:var(--line-height-base);text-decoration:none;border-width:1px;border-style:solid;border-radius:0;cursor:pointer;transition:all var(--transition-fast)}
.bjs-btn--md{font-size:var(--font-size-base)}
.bjs-btn--sm{padding:.45rem .65rem;font-size:var(--font-size-xs)}
.bjs-btn--primary{color:var(--color-accent-primary);background:var(--color-bg-tertiary);border-color:var(--color-accent-primary)}
.bjs-btn--primary:hover{color:var(--color-bg-primary);background:var(--color-accent-primary);box-shadow:var(--shadow-hard-accent)}
.bjs-btn--secondary{color:var(--color-text-secondary);background:var(--color-bg-secondary);border-color:var(--color-border)}
.bjs-btn--secondary:hover{color:var(--color-text-primary);background:var(--color-bg-tertiary);border-color:var(--color-border-strong);box-shadow:var(--shadow-hard)}
.bjs-btn--quiet{color:var(--color-text-primary);background:var(--color-bg-secondary);border-color:var(--color-border)}
.bjs-btn--quiet:hover{color:var(--color-accent-primary);border-color:var(--color-accent-primary);box-shadow:var(--shadow-hard-accent)}
.bjs-btn--danger{color:#ff8e8e;background:var(--color-bg-tertiary);border-color:#994444}
.bjs-btn--danger:hover{color:var(--color-bg-primary);background:var(--color-danger);border-color:var(--color-danger)}
.bjs-btn:disabled{cursor:not-allowed;opacity:.45;box-shadow:none}
`;

/** Terminal-style action: square, 1px border, hard offset shadow on hover. */
function Button({
  variant = 'primary',
  size = 'md',
  href,
  children,
  className = '',
  ...rest
}) {
  const cls = ['bjs-btn', 'bjs-btn--' + variant, 'bjs-btn--' + size, className].filter(Boolean).join(' ');
  const Tag = href ? 'a' : 'button';
  const extra = href ? {
    href
  } : {
    type: rest.type || 'button'
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, CSS), /*#__PURE__*/React.createElement(Tag, _extends({
    className: cls
  }, extra, rest), children));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/PageHeader.jsx
try { (() => {
const CSS = `
.bjs-page-header{display:flex;align-items:flex-end;justify-content:space-between;gap:var(--space-4);margin-bottom:var(--space-6)}
.bjs-page-header__title{font-size:var(--font-size-page-title);font-weight:var(--font-weight-bold);line-height:var(--line-height-tight);color:var(--color-text-primary);margin-bottom:var(--space-2)}
.bjs-page-header__desc{margin:0;color:var(--color-text-muted);font-size:var(--font-size-sm)}
.bjs-page-header__actions{display:flex;flex:none;flex-wrap:wrap;align-items:end;gap:var(--space-3)}
`;

/** Page title (always a path, e.g. `work/`) plus optional description and actions. */
function PageHeader({
  title,
  description,
  actions
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, CSS), /*#__PURE__*/React.createElement("header", {
    className: "bjs-page-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "bjs-page-header__title"
  }, title), description && /*#__PURE__*/React.createElement("p", {
    className: "bjs-page-header__desc"
  }, description)), actions && /*#__PURE__*/React.createElement("div", {
    className: "bjs-page-header__actions"
  }, actions)));
}
Object.assign(__ds_scope, { PageHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/PageHeader.jsx", error: String((e && e.message) || e) }); }

// components/core/Panel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.bjs-panel{background:var(--color-bg-secondary);border:1px solid var(--color-border);border-radius:0}
.bjs-panel--shadow{box-shadow:var(--shadow-hard)}
.bjs-panel--accent{border-color:var(--color-accent-primary);box-shadow:var(--shadow-hard-accent)}
.bjs-panel--amber{border-color:var(--color-accent-secondary);box-shadow:var(--shadow-hard-amber)}
.bjs-panel--blue{border-color:var(--color-accent-tertiary);box-shadow:var(--shadow-hard-blue)}
.bjs-panel__head{display:flex;align-items:center;justify-content:space-between;gap:var(--space-4);margin-bottom:var(--space-3)}
.bjs-panel__path{display:block;color:var(--color-text-muted);font-size:var(--font-size-xs)}
.bjs-panel__title{font-size:var(--font-size-base);font-weight:var(--font-weight-medium);color:var(--color-text-primary)}
`;

/** Bordered content panel — the site's only container shape. */
function Panel({
  tone = 'default',
  shadow = true,
  path,
  title,
  actions,
  padding,
  children,
  style,
  ...rest
}) {
  const cls = ['bjs-panel', tone !== 'default' ? 'bjs-panel--' + tone : shadow ? 'bjs-panel--shadow' : ''].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, CSS), /*#__PURE__*/React.createElement("section", _extends({
    className: cls,
    style: {
      padding: padding || 'var(--space-4)',
      ...style
    }
  }, rest), (path || title || actions) && /*#__PURE__*/React.createElement("div", {
    className: "bjs-panel__head"
  }, /*#__PURE__*/React.createElement("div", null, path && /*#__PURE__*/React.createElement("span", {
    className: "bjs-panel__path"
  }, path), title && /*#__PURE__*/React.createElement("h2", {
    className: "bjs-panel__title"
  }, title)), actions), children));
}
Object.assign(__ds_scope, { Panel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Panel.jsx", error: String((e && e.message) || e) }); }

// components/core/Stat.jsx
try { (() => {
const CSS = `
.bjs-stats{display:grid;grid-template-columns:repeat(var(--bjs-stat-cols,3),1fr);border-top:1px solid var(--color-border);border-left:1px solid var(--color-border)}
.bjs-stat{min-width:0;padding:var(--space-4);background:var(--color-bg-secondary);border-right:1px solid var(--color-border);border-bottom:1px solid var(--color-border)}
.bjs-stat strong{display:block;overflow:hidden;font-size:var(--font-size-2xl);color:var(--color-text-primary);line-height:1;font-variant-numeric:tabular-nums}
.bjs-stat span{display:block;margin-top:var(--space-2);color:var(--color-text-muted);font-size:var(--font-size-xs);text-transform:uppercase;letter-spacing:var(--letter-spacing-label)}
`;

/** One tabular-number figure with an uppercase caption. */
function Stat({
  value,
  label
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, CSS), /*#__PURE__*/React.createElement("div", {
    className: "bjs-stat"
  }, /*#__PURE__*/React.createElement("strong", null, value), /*#__PURE__*/React.createElement("span", null, label)));
}

/** Hairline grid of Stat cells (3 across on desktop). */
function StatGrid({
  columns = 3,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, CSS), /*#__PURE__*/React.createElement("div", {
    className: "bjs-stats",
    style: {
      '--bjs-stat-cols': columns
    }
  }, children));
}
Object.assign(__ds_scope, { Stat, StatGrid });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Stat.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
const CSS = `
.bjs-tag{font-family:var(--font-family);font-size:var(--font-size-sm);font-weight:var(--font-weight-medium);text-transform:lowercase}
.bjs-tag--dev{color:var(--color-accent-tertiary)}
.bjs-tag--art{color:var(--color-accent-secondary)}
.bjs-tag--photography{color:var(--color-accent-primary)}
.bjs-tag--color{color:var(--color-accent-secondary)}
.bjs-tag--bw{color:var(--color-text-secondary)}
.bjs-tag--neutral{color:var(--color-text-secondary)}
.bjs-chip{display:inline-block;padding:var(--space-1) var(--space-2);font-size:var(--font-size-xs);color:var(--color-text-muted);background:var(--color-bg-tertiary);border:1px solid var(--color-border)}
`;

/** Bracketed category / film-stock label, or a bordered keyword chip. */
function Tag({
  kind = 'neutral',
  bracket = true,
  chip = false,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, CSS), chip ? /*#__PURE__*/React.createElement("span", {
    className: "bjs-chip"
  }, children) : /*#__PURE__*/React.createElement("span", {
    className: 'bjs-tag bjs-tag--' + kind
  }, bracket ? '[' : '', children, bracket ? ']' : ''));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/listing/DirListHeader.jsx
try { (() => {
const CSS = `
.bjs-list-header{display:grid;grid-template-columns:var(--bjs-cols);gap:var(--space-4);padding:var(--space-2) var(--space-4);font-size:var(--font-size-xs);color:var(--color-text-muted);text-transform:uppercase;letter-spacing:var(--letter-spacing-label);border:1px solid var(--color-border);background:var(--color-bg-tertiary)}
.bjs-row{display:grid;grid-template-columns:var(--bjs-cols);gap:var(--space-4);align-items:baseline;padding:var(--space-3) var(--space-4);border:1px solid var(--color-border);margin-top:-1px;background:var(--color-bg-secondary);color:var(--color-text-primary);text-decoration:none;font-size:var(--font-size-sm);transition:background var(--transition-fast)}
.bjs-row:first-child{margin-top:0}
.bjs-row:hover{background:var(--color-bg-tertiary);color:var(--color-text-primary)}
.bjs-row:hover .bjs-row__arrow{color:var(--color-accent-primary)}
.bjs-row__date{color:var(--color-text-muted);font-variant-numeric:tabular-nums}
.bjs-row__arrow{color:var(--color-text-muted);text-align:right;transition:color var(--transition-fast)}
.bjs-row__name{color:var(--color-text-primary);font-weight:var(--font-weight-medium)}
.bjs-row__desc{color:var(--color-text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bjs-row__loc{color:var(--color-text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bjs-row--active{border-color:var(--color-accent-primary);outline:1px solid var(--color-accent-primary)}
@media (max-width:768px){.bjs-list-header{display:none}}
`;

/** Uppercase column header above a directory listing. */
function DirListHeader({
  columns = [],
  cols
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, CSS), /*#__PURE__*/React.createElement("div", {
    className: "bjs-list-header",
    style: {
      '--bjs-cols': cols
    },
    "aria-hidden": "true"
  }, columns.map((c, i) => /*#__PURE__*/React.createElement("span", {
    key: i
  }, c))));
}
Object.assign(__ds_scope, { DirListHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/listing/DirListHeader.jsx", error: String((e && e.message) || e) }); }

// components/listing/DirRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.bjs-list-header{display:grid;grid-template-columns:var(--bjs-cols);gap:var(--space-4);padding:var(--space-2) var(--space-4);font-size:var(--font-size-xs);color:var(--color-text-muted);text-transform:uppercase;letter-spacing:var(--letter-spacing-label);border:1px solid var(--color-border);background:var(--color-bg-tertiary)}
.bjs-row{display:grid;grid-template-columns:var(--bjs-cols);gap:var(--space-4);align-items:baseline;padding:var(--space-3) var(--space-4);border:1px solid var(--color-border);margin-top:-1px;background:var(--color-bg-secondary);color:var(--color-text-primary);text-decoration:none;font-size:var(--font-size-sm);transition:background var(--transition-fast)}
.bjs-row:first-child{margin-top:0}
.bjs-row:hover{background:var(--color-bg-tertiary);color:var(--color-text-primary)}
.bjs-row:hover .bjs-row__arrow{color:var(--color-accent-primary)}
.bjs-row__date{color:var(--color-text-muted);font-variant-numeric:tabular-nums}
.bjs-row__arrow{color:var(--color-text-muted);text-align:right;transition:color var(--transition-fast)}
.bjs-row__name{color:var(--color-text-primary);font-weight:var(--font-weight-medium)}
.bjs-row__desc{color:var(--color-text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bjs-row__loc{color:var(--color-text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bjs-row--active{border-color:var(--color-accent-primary);outline:1px solid var(--color-accent-primary)}
@media (max-width:768px){.bjs-list-header{display:none}}
`;

/** Generic directory row: a bordered grid link with a trailing → arrow. */
function DirRow({
  cols,
  href,
  cells = [],
  arrow = '→',
  active = false,
  id,
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, CSS), /*#__PURE__*/React.createElement("a", _extends({
    id: id,
    className: 'bjs-row' + (active ? ' bjs-row--active' : ''),
    style: {
      '--bjs-cols': cols
    },
    href: href
  }, rest), children || cells.map((cell, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: cell && cell.className
  }, cell && cell.content !== undefined ? cell.content : cell)), arrow && /*#__PURE__*/React.createElement("span", {
    className: "bjs-row__arrow",
    "aria-hidden": "true"
  }, arrow)));
}
Object.assign(__ds_scope, { DirRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/listing/DirRow.jsx", error: String((e && e.message) || e) }); }

// components/listing/FilterBar.jsx
try { (() => {
const CSS = `
.bjs-filters{display:flex;gap:var(--space-2);margin-bottom:var(--space-5);flex-wrap:wrap}
.bjs-filter-btn{padding:var(--space-2) var(--space-3);font-size:var(--font-size-sm);font-family:inherit;font-weight:var(--font-weight-medium);color:var(--color-text-secondary);background:var(--color-bg-secondary);border:1px solid var(--color-border);cursor:pointer;transition:all var(--transition-fast)}
.bjs-filter-btn:hover{border-color:var(--color-border-strong);color:var(--color-text-primary)}
.bjs-filter-btn.is-active{background:var(--color-bg-tertiary);border-color:var(--color-accent-primary);color:var(--color-accent-primary);box-shadow:var(--shadow-hard-accent)}
`;

/** `[all]` + one bracketed button per option; active gains an accent hard shadow. */
function FilterBar({
  options = [],
  value = 'all',
  onChange,
  allLabel = 'all'
}) {
  const opts = [allLabel, ...options];
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, CSS), /*#__PURE__*/React.createElement("div", {
    className: "bjs-filters"
  }, opts.map(opt => /*#__PURE__*/React.createElement("button", {
    key: opt,
    type: "button",
    className: 'bjs-filter-btn' + (opt === value ? ' is-active' : ''),
    onClick: () => onChange && onChange(opt)
  }, "[", opt, "]"))));
}
Object.assign(__ds_scope, { FilterBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/listing/FilterBar.jsx", error: String((e && e.message) || e) }); }

// components/listing/RollRow.jsx
try { (() => {
/** A row in `photos/` — [film stock] · date · roll title · location · →. */
function RollRow({
  slug,
  stock,
  stockType = 'color',
  date,
  title,
  location,
  active = false,
  href
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.DirRow, {
    id: `roll-${slug}`,
    cols: "var(--roll-cols)",
    href: href || `/photos/${slug}/`,
    active: active,
    "data-slug": slug,
    cells: [/*#__PURE__*/React.createElement(__ds_scope.Tag, {
      kind: stockType
    }, stock), /*#__PURE__*/React.createElement("span", {
      className: "bjs-row__date"
    }, date), /*#__PURE__*/React.createElement("span", {
      className: "bjs-row__name"
    }, title), /*#__PURE__*/React.createElement("span", {
      className: "bjs-row__loc"
    }, location)]
  });
}
Object.assign(__ds_scope, { RollRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/listing/RollRow.jsx", error: String((e && e.message) || e) }); }

// components/listing/WorkRow.jsx
try { (() => {
/** A row in `work/` — [category] · date · slug · description · →. */
function WorkRow({
  slug,
  category = 'dev',
  date,
  description,
  showDescription = true,
  href
}) {
  const cells = [/*#__PURE__*/React.createElement(__ds_scope.Tag, {
    kind: category
  }, category), /*#__PURE__*/React.createElement("span", {
    className: "bjs-row__date"
  }, date), /*#__PURE__*/React.createElement("span", {
    className: "bjs-row__name"
  }, slug)];
  if (showDescription) cells.push(/*#__PURE__*/React.createElement("span", {
    className: "bjs-row__desc"
  }, description));
  return /*#__PURE__*/React.createElement(__ds_scope.DirRow, {
    cols: "var(--work-cols)",
    href: href || `/work/${slug}/`,
    cells: cells,
    "data-category": category
  });
}
Object.assign(__ds_scope, { WorkRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/listing/WorkRow.jsx", error: String((e && e.message) || e) }); }

// components/media/FilmStrip.jsx
try { (() => {
const CSS = `
.bjs-strip{background:var(--film-base);border:1px solid var(--color-border);padding:3px 0;margin-bottom:var(--space-4)}
.bjs-strip__sprockets{height:12px;margin:3px 10px;background-image:repeating-linear-gradient(to right,transparent 0 7px,var(--color-bg-primary) 7px 17px,transparent 17px 24px)}
.bjs-strip__edge{display:flex;gap:var(--space-4);padding:1px 14px 3px;font-size:var(--font-size-xs);letter-spacing:var(--letter-spacing-edge);color:var(--bjs-edge);user-select:none;white-space:nowrap;overflow:hidden}
.bjs-strip__range{margin-left:auto}
.bjs-strip__frames{display:flex;gap:6px;padding:2px 10px 6px;overflow-x:auto;scrollbar-width:thin;scrollbar-color:var(--color-border-strong) transparent}
.bjs-strip__frames::-webkit-scrollbar{height:8px}
.bjs-strip__frames::-webkit-scrollbar-track{background:transparent}
.bjs-strip__frames::-webkit-scrollbar-thumb{background:var(--color-border-strong);border:1px solid #000}
.bjs-strip__frames::-webkit-scrollbar-thumb:hover{background:var(--bjs-edge)}
.bjs-frame{margin:0;flex:0 0 clamp(130px,18vw,200px)}
.bjs-frame img{display:block;width:100%;height:auto;aspect-ratio:3/2;object-fit:cover;cursor:pointer;border:1px solid #000}
.bjs-frame__no{display:flex;justify-content:space-between;font-size:var(--font-size-xs);color:var(--bjs-edge);letter-spacing:var(--letter-spacing-frame);padding:2px 2px 0;user-select:none}
`;

/** One strip of a contact sheet: sprocket holes, edge print and up to ~6 frames. */
function FilmStrip({
  photos = [],
  stockName = '',
  stockType = 'color',
  startFrame = 1,
  onSelect
}) {
  const edge = stockType === 'bw' ? 'var(--film-bw-edge)' : 'var(--film-color-edge)';
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, CSS), /*#__PURE__*/React.createElement("div", {
    className: "bjs-strip",
    style: {
      '--bjs-edge': edge
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bjs-strip__sprockets",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "bjs-strip__edge",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("span", null, stockName.toUpperCase()), /*#__PURE__*/React.createElement("span", null, "\u25B8\u25B8"), /*#__PURE__*/React.createElement("span", {
    className: "bjs-strip__range"
  }, startFrame, "\u2013", startFrame + photos.length - 1)), /*#__PURE__*/React.createElement("div", {
    className: "bjs-strip__frames"
  }, photos.map((p, i) => /*#__PURE__*/React.createElement("figure", {
    className: "bjs-frame",
    key: p.src + i
  }, /*#__PURE__*/React.createElement("img", {
    src: p.src,
    alt: p.alt || '',
    loading: "lazy",
    onClick: () => onSelect && onSelect(startFrame + i - 1)
  }), /*#__PURE__*/React.createElement("figcaption", {
    className: "bjs-frame__no"
  }, /*#__PURE__*/React.createElement("span", null, startFrame + i), /*#__PURE__*/React.createElement("span", null, startFrame + i, "A"))))), /*#__PURE__*/React.createElement("div", {
    className: "bjs-strip__sprockets",
    "aria-hidden": "true"
  })));
}
Object.assign(__ds_scope, { FilmStrip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/media/FilmStrip.jsx", error: String((e && e.message) || e) }); }

// components/media/Lightbox.jsx
try { (() => {
const CSS = `
.bjs-lightbox{position:fixed;inset:0;z-index:10000;background:var(--overlay-scrim);backdrop-filter:var(--overlay-blur);display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:all .3s ease;padding:var(--space-8)}
.bjs-lightbox.is-open{opacity:1;pointer-events:auto}
.bjs-lightbox__content{position:relative;max-width:90vw;max-height:90vh;display:flex;flex-direction:column;align-items:center;gap:var(--space-4);transform:scale(.95);transition:transform .3s cubic-bezier(.34,1.56,.64,1)}
.bjs-lightbox.is-open .bjs-lightbox__content{transform:scale(1)}
.bjs-lightbox__content img{max-width:100%;max-height:calc(90vh - 80px);object-fit:contain;border:1px solid var(--color-border)}
.bjs-lightbox__caption{color:#fff;font-size:var(--font-size-lg);font-weight:var(--font-weight-medium);margin:0;text-align:center;text-shadow:0 2px 4px rgba(0,0,0,.5)}
.bjs-lightbox__meta{margin:0;font-size:var(--font-size-xs);color:#999;letter-spacing:0.15em;text-align:center}
.bjs-lightbox__btn{position:absolute;background:var(--color-bg-secondary);border:1px solid var(--color-border);color:var(--color-text-primary);width:48px;height:48px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10001;transition:all var(--transition-fast)}
.bjs-lightbox__btn:hover{background:var(--color-accent-primary);border-color:var(--color-accent-primary);color:var(--color-bg-primary)}
.bjs-lightbox__close{top:var(--space-8);right:var(--space-8);font-size:2rem}
.bjs-lightbox__prev{top:50%;left:var(--space-8);transform:translateY(-50%)}
.bjs-lightbox__next{top:50%;right:var(--space-8);transform:translateY(-50%)}
`;
const CHEV = points => /*#__PURE__*/React.createElement("svg", {
  width: "24",
  height: "24",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("polyline", {
  points: points
}));

/** Full-screen frame viewer: blurred near-black scrim, square 48px controls. */
function Lightbox({
  open = false,
  items = [],
  index = 0,
  onClose,
  onNavigate
}) {
  const item = items[index] || {};
  React.useEffect(() => {
    if (!open) return;
    const onKey = e => {
      if (e.key === 'Escape') onClose && onClose();
      if (e.key === 'ArrowLeft') onNavigate && onNavigate(-1);
      if (e.key === 'ArrowRight') onNavigate && onNavigate(1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, onNavigate]);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, CSS), /*#__PURE__*/React.createElement("div", {
    className: 'bjs-lightbox' + (open ? ' is-open' : ''),
    role: "dialog",
    "aria-modal": "true",
    "aria-hidden": !open,
    onClick: e => {
      if (e.target === e.currentTarget) onClose && onClose();
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "bjs-lightbox__btn bjs-lightbox__close",
    type: "button",
    "aria-label": "Close lightbox",
    onClick: onClose
  }, "\xD7"), /*#__PURE__*/React.createElement("button", {
    className: "bjs-lightbox__btn bjs-lightbox__prev",
    type: "button",
    "aria-label": "Previous image",
    onClick: () => onNavigate && onNavigate(-1)
  }, CHEV('15 18 9 12 15 6')), /*#__PURE__*/React.createElement("button", {
    className: "bjs-lightbox__btn bjs-lightbox__next",
    type: "button",
    "aria-label": "Next image",
    onClick: () => onNavigate && onNavigate(1)
  }, CHEV('9 18 15 12 9 6')), /*#__PURE__*/React.createElement("div", {
    className: "bjs-lightbox__content"
  }, item.src && /*#__PURE__*/React.createElement("img", {
    src: item.full || item.src,
    alt: item.alt || ''
  }), item.caption && /*#__PURE__*/React.createElement("p", {
    className: "bjs-lightbox__caption"
  }, item.caption), item.meta && /*#__PURE__*/React.createElement("p", {
    className: "bjs-lightbox__meta"
  }, item.meta))));
}
Object.assign(__ds_scope, { Lightbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/media/Lightbox.jsx", error: String((e && e.message) || e) }); }

// components/media/WorldMap.jsx
try { (() => {
const CSS = `
.bjs-map{width:100%;height:auto;display:block;border:1px solid var(--color-border);background:var(--color-bg-secondary);padding:var(--space-2)}
.bjs-map__dots{fill:none;stroke:var(--color-border-strong);stroke-linecap:round}
.bjs-map__pin{fill:var(--color-accent-primary);transition:filter .12s ease}
.bjs-map__halo{fill:var(--color-accent-primary);opacity:0;transition:opacity .12s ease}
.bjs-map__link{cursor:pointer}
.bjs-map__link:hover .bjs-map__halo,.bjs-map__link:focus .bjs-map__halo,.bjs-map__link.is-active .bjs-map__halo{opacity:.3}
.bjs-map__link:hover .bjs-map__pin,.bjs-map__link.is-active .bjs-map__pin{filter:brightness(.82)}
.bjs-map__tip{opacity:0;pointer-events:none;transition:opacity .12s ease}
.bjs-map__link:hover .bjs-map__tip,.bjs-map__link:focus .bjs-map__tip,.bjs-map__link.is-active .bjs-map__tip{opacity:1}
.bjs-map__box{fill:var(--color-bg-primary);stroke:var(--color-border-strong);stroke-width:.3}
.bjs-map__title{fill:var(--color-text-primary);font-family:monospace}
.bjs-map__sub{fill:var(--color-text-muted);font-family:monospace}
`;
const COLS = 240,
  ROWS = 120,
  DASH = 0.01;

/** Dot-matrix world map. Land is a precomputed row-string grid; pins are shoot locations. */
function WorldMap({
  dots = [],
  pins = [],
  activeSlug,
  onPinHover
}) {
  const gridRows = dots.length || 1;
  const gridCols = (dots[0] || '').length || 1;
  const cellW = COLS / gridCols;
  const cellH = ROWS / gridRows;
  const dotR = +(cellW * 0.4).toFixed(2);
  const path = React.useMemo(() => dots.map((row, gy) => {
    const y = +((gy + 0.5) * cellH).toFixed(1);
    let d = '';
    for (let gx = 0; gx < row.length; gx += 1) {
      if (row[gx] !== '1') continue;
      let end = gx;
      while (end + 1 < row.length && row[end + 1] === '1') end += 1;
      d += `M${+((gx + 0.5) * cellW).toFixed(1)} ${y}H${+((end + 0.5) * cellW).toFixed(1)}`;
      gx = end;
    }
    return d;
  }).join(''), [dots]);
  const project = (lat, lng) => ({
    x: +((lng + 180) / 360 * COLS).toFixed(1),
    y: +((90 - lat) / 180 * ROWS).toFixed(1)
  });
  const TT = {
    fontSize: 6,
    subSize: 4.6,
    padX: 2.6,
    padTop: 2.4,
    padBottom: 2.2,
    titleGap: 2.2,
    lineH: 5.2
  };
  const titleFor = p => `${p.label} — ${p.count} ${p.count === 1 ? 'frame' : 'frames'}`;
  const width = pins.length ? Math.max(...pins.map(p => Math.max(titleFor(p).length * TT.fontSize * 0.6, ...(p.members || []).map(m => (m.length + 2) * TT.subSize * 0.6)))) + TT.padX * 2 : 0;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, CSS), /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 240 120",
    className: "bjs-map",
    role: "img",
    "aria-label": "Map of shoot locations"
  }, /*#__PURE__*/React.createElement("path", {
    className: "bjs-map__dots",
    d: path,
    strokeWidth: dotR * 2,
    strokeDasharray: `${DASH} ${+(cellW - DASH).toFixed(4)}`
  }), pins.map(p => {
    const {
      x,
      y
    } = project(p.lat, p.lng);
    const members = p.members || [];
    const rectH = TT.padTop + TT.fontSize + (members.length ? TT.titleGap + TT.lineH * members.length : 0) + TT.padBottom;
    const rectX = Math.min(Math.max(x - width / 2, 1), COLS - width - 1);
    const rectY = Math.max(1, y - 3 - rectH);
    const active = activeSlug && (p.slugs || []).includes(activeSlug);
    return /*#__PURE__*/React.createElement("a", {
      key: p.label,
      href: `#roll-${p.slug}`,
      className: 'bjs-map__link' + (active ? ' is-active' : ''),
      "aria-label": titleFor(p),
      onMouseEnter: () => onPinHover && onPinHover(p),
      onMouseLeave: () => onPinHover && onPinHover(null)
    }, /*#__PURE__*/React.createElement("circle", {
      cx: x,
      cy: y,
      r: "3.4",
      className: "bjs-map__halo"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: x,
      cy: y,
      r: "1",
      className: "bjs-map__pin"
    }), /*#__PURE__*/React.createElement("g", {
      className: "bjs-map__tip",
      "aria-hidden": "true"
    }, /*#__PURE__*/React.createElement("rect", {
      x: rectX,
      y: rectY,
      width: width,
      height: rectH,
      rx: "0.8",
      className: "bjs-map__box"
    }), /*#__PURE__*/React.createElement("text", {
      x: rectX + TT.padX,
      y: rectY + TT.padTop + TT.fontSize / 2,
      fontSize: TT.fontSize,
      dominantBaseline: "central",
      className: "bjs-map__title"
    }, titleFor(p)), members.map((m, i) => /*#__PURE__*/React.createElement("text", {
      key: m,
      x: rectX + TT.padX,
      y: rectY + TT.padTop + TT.fontSize + TT.titleGap + TT.lineH * i + TT.lineH / 2,
      fontSize: TT.subSize,
      dominantBaseline: "central",
      className: "bjs-map__sub"
    }, `· ${m}`))));
  })));
}
Object.assign(__ds_scope, { WorldMap });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/media/WorldMap.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Breadcrumb.jsx
try { (() => {
const CSS = `
.bjs-crumb-row{display:flex;height:var(--breadcrumb-row-height);flex:0 0 auto;align-items:center}
.bjs-crumb{width:100%;min-width:0;max-width:100%;flex:1;margin:0;overflow-x:auto;padding:2px 0;scrollbar-width:thin}
.bjs-crumb ol{display:flex;width:max-content;min-width:0;list-style:none;font-size:var(--font-size-sm);line-height:var(--line-height-base);white-space:nowrap}
.bjs-crumb li{display:flex;align-items:center}
.bjs-crumb a,.bjs-crumb__sep{color:var(--color-text-muted)}
.bjs-crumb a{text-decoration:none}
.bjs-crumb a:hover,.bjs-crumb a:focus-visible{color:var(--color-accent-primary)}
.bjs-crumb a[aria-current='page']{color:var(--color-text-secondary)}
.bjs-crumb a[aria-current='page']:hover{color:var(--color-accent-primary)}
`;

/** Filesystem path nav in a static 56px row at the top of the page flow. */
function Breadcrumb({
  items = [],
  row = true
}) {
  const nav = /*#__PURE__*/React.createElement("nav", {
    className: "bjs-crumb",
    "aria-label": "Breadcrumb"
  }, /*#__PURE__*/React.createElement("ol", null, items.map((item, i) => /*#__PURE__*/React.createElement("li", {
    key: item.href + i
  }, i > 0 && /*#__PURE__*/React.createElement("span", {
    className: "bjs-crumb__sep",
    "aria-hidden": "true"
  }, "/"), /*#__PURE__*/React.createElement("a", {
    href: item.href,
    "aria-current": i === items.length - 1 ? 'page' : undefined
  }, item.label)))));
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, CSS), row ? /*#__PURE__*/React.createElement("div", {
    className: "bjs-crumb-row container"
  }, nav) : nav);
}
Object.assign(__ds_scope, { Breadcrumb });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Breadcrumb.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Footer.jsx
try { (() => {
const CSS = `
.bjs-footer{margin-top:auto;padding:var(--space-5) 0 var(--space-4)}
.bjs-footer__inner{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:var(--space-3) var(--space-4)}
.bjs-footer__primary,.bjs-footer__secondary{display:flex;flex-direction:column;gap:var(--space-2)}
.bjs-footer__primary{align-items:flex-start}
.bjs-footer__secondary{align-items:flex-end}
.bjs-footer__tagline{font-size:var(--font-size-sm);color:var(--color-text-muted);margin:0}
.bjs-footer__social{display:flex;gap:var(--space-3)}
.bjs-social-link{display:flex;width:32px;height:32px;align-items:center;justify-content:center;padding:0;color:var(--color-text-secondary);background:transparent;border:0;cursor:pointer;transition:color var(--transition-fast)}
.bjs-social-link svg{width:20px;height:20px}
.bjs-social-link:hover{color:var(--color-accent-primary)}
.bjs-footer__copy{font-size:var(--font-size-xs);color:var(--color-text-muted);margin:0;white-space:nowrap}
`;

// Brand glyphs: Simple Icons (CC0) — the same paths the site ships.
const GITHUB = 'M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z';
const INSTAGRAM = 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.585-.07 4.85-.148 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.069-4.849.069-3.26 0-3.668-.012-4.95-.073-3.232-.154-4.74-1.694-4.89-4.92-.058-1.265-.08-1.644-.08-4.849 0-3.204.013-3.583.072-4.849.149-3.227 1.664-4.771 4.919-4.919C8.35 2.175 8.73 2.163 12 2.163zm0-2.163C8.741 0 8.332.014 7.052.072 2.695.272.273 2.69.073 7.052.014 8.332 0 8.741 0 12s.014 3.668.072 4.948c.2 4.358 2.618 6.78 6.98 6.98C8.332 23.986 8.741 24 12 24s3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98C23.986 15.668 24 15.259 24 12s-.014-3.668-.073-4.948c-.2-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 1 0 12.324 6.162 6.162 0 0 1 0-12.324zM12 7.838a4.162 4.162 0 1 0 0 8.324 4.162 4.162 0 0 0 0-8.324zm6.406-1.155a1.44 1.44 0 1 1-2.881.001 1.44 1.44 0 0 1 2.881-.001z';
const SUN = /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "5"
}), /*#__PURE__*/React.createElement("line", {
  x1: "12",
  y1: "1",
  x2: "12",
  y2: "3"
}), /*#__PURE__*/React.createElement("line", {
  x1: "12",
  y1: "21",
  x2: "12",
  y2: "23"
}), /*#__PURE__*/React.createElement("line", {
  x1: "4.22",
  y1: "4.22",
  x2: "5.64",
  y2: "5.64"
}), /*#__PURE__*/React.createElement("line", {
  x1: "18.36",
  y1: "18.36",
  x2: "19.78",
  y2: "19.78"
}), /*#__PURE__*/React.createElement("line", {
  x1: "1",
  y1: "12",
  x2: "3",
  y2: "12"
}), /*#__PURE__*/React.createElement("line", {
  x1: "21",
  y1: "12",
  x2: "23",
  y2: "12"
}), /*#__PURE__*/React.createElement("line", {
  x1: "4.22",
  y1: "19.78",
  x2: "5.64",
  y2: "18.36"
}), /*#__PURE__*/React.createElement("line", {
  x1: "18.36",
  y1: "5.64",
  x2: "19.78",
  y2: "4.22"
}));
const MOON = /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
}));

/** Site footer: social glyphs + tagline left, theme toggle above copyright right. */
function Footer({
  tagline = '// be excellent to each other.',
  links = [{
    href: 'https://github.com/bjsmithxyz/',
    label: 'github'
  }, {
    href: 'https://www.instagram.com/bjsmith.xyz/',
    label: 'instagram'
  }],
  year = new Date().getFullYear(),
  theme = 'dark',
  onToggleTheme
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, CSS), /*#__PURE__*/React.createElement("footer", {
    className: "bjs-footer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bjs-footer__inner container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bjs-footer__primary"
  }, /*#__PURE__*/React.createElement("nav", {
    className: "bjs-footer__social",
    "aria-label": "Social links"
  }, links.map(link => /*#__PURE__*/React.createElement("a", {
    key: link.label,
    className: "bjs-social-link",
    href: link.href,
    target: "_blank",
    rel: "noopener noreferrer",
    "aria-label": link.label
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: link.label === 'github' ? GITHUB : INSTAGRAM
  }))))), /*#__PURE__*/React.createElement("p", {
    className: "bjs-footer__tagline"
  }, tagline)), /*#__PURE__*/React.createElement("div", {
    className: "bjs-footer__secondary"
  }, /*#__PURE__*/React.createElement("button", {
    className: "bjs-social-link",
    type: "button",
    "aria-label": theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
    onClick: onToggleTheme
  }, theme === 'dark' ? MOON : SUN), /*#__PURE__*/React.createElement("p", {
    className: "bjs-footer__copy"
  }, "\xA9 ", year, " beek")))));
}
Object.assign(__ds_scope, { Footer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Footer.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SiteTree.jsx
try { (() => {
const CSS = `
.bjs-tree{max-width:52rem;padding:var(--space-4);overflow-x:auto;border:1px solid var(--color-border);background:var(--color-bg-secondary);box-shadow:var(--shadow-hard);font-size:var(--font-size-sm);scrollbar-width:thin}
.bjs-tree ul{list-style:none}
.bjs-tree__root,.bjs-tree__row{min-height:2rem}
.bjs-tree__root{display:inline-flex;align-items:center;color:var(--color-accent-primary);font-weight:var(--font-weight-medium)}
.bjs-tree__row{display:grid;grid-template-columns:minmax(0,1fr) auto;min-width:38rem;align-items:center}
.bjs-tree__main{display:flex;width:fit-content;min-width:0;align-items:center;color:var(--color-text-primary);font:inherit;text-align:left;text-decoration:none}
button.bjs-tree__main{padding:0;background:transparent;border:0;cursor:pointer}
.bjs-tree__main:hover,.bjs-tree__main:focus-visible{color:var(--color-accent-primary)}
.bjs-tree__prefix{flex:none;color:var(--color-text-muted);white-space:pre}
.bjs-tree__state{margin-left:var(--space-2);color:var(--color-text-muted)}
.bjs-tree__meta{padding-left:var(--space-6);color:var(--color-text-muted);font-size:var(--font-size-xs);text-align:right;white-space:nowrap}
.bjs-tree__collapse{display:grid;grid-template-rows:1fr;opacity:1;transition:grid-template-rows var(--transition-slow),opacity var(--transition-base)}
.bjs-tree__collapse[data-collapsed='true']{grid-template-rows:0fr;opacity:0}
.bjs-tree__inner{min-height:0;overflow:hidden}
`;
function Node({
  node,
  prefix,
  last,
  depth
}) {
  const [open, setOpen] = React.useState(!!node.open);
  const branch = !!(node.children && node.children.length);
  const glyph = prefix + (last ? '└── ' : '├── ');
  const childPrefix = prefix + (last ? '    ' : '│   ');
  return /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("div", {
    className: "bjs-tree__row"
  }, branch ? /*#__PURE__*/React.createElement("button", {
    className: "bjs-tree__main",
    type: "button",
    "aria-expanded": open,
    onClick: () => setOpen(!open)
  }, /*#__PURE__*/React.createElement("span", {
    className: "bjs-tree__prefix",
    "aria-hidden": "true"
  }, glyph), /*#__PURE__*/React.createElement("span", null, node.label), /*#__PURE__*/React.createElement("span", {
    className: "bjs-tree__state",
    "aria-hidden": "true"
  }, open ? '[-]' : '[+]')) : /*#__PURE__*/React.createElement("a", {
    className: "bjs-tree__main",
    href: node.href || '#'
  }, /*#__PURE__*/React.createElement("span", {
    className: "bjs-tree__prefix",
    "aria-hidden": "true"
  }, glyph), /*#__PURE__*/React.createElement("span", null, node.label)), node.meta && /*#__PURE__*/React.createElement("span", {
    className: "bjs-tree__meta"
  }, node.meta)), branch && /*#__PURE__*/React.createElement("div", {
    className: "bjs-tree__collapse",
    "data-collapsed": String(!open),
    inert: !open ? '' : undefined
  }, /*#__PURE__*/React.createElement("div", {
    className: "bjs-tree__inner"
  }, /*#__PURE__*/React.createElement("ul", null, node.children.map((child, i) => /*#__PURE__*/React.createElement(Node, {
    key: child.label + i,
    node: child,
    prefix: childPrefix,
    last: i === node.children.length - 1,
    depth: depth + 1
  }))))));
}

/** The homepage: an ASCII directory tree with collapsible branches. */
function SiteTree({
  root = '~',
  nodes = []
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, CSS), /*#__PURE__*/React.createElement("nav", {
    className: "bjs-tree",
    "aria-label": "Site index"
  }, /*#__PURE__*/React.createElement("a", {
    className: "bjs-tree__root",
    href: "/",
    "aria-current": "page"
  }, root), /*#__PURE__*/React.createElement("ul", null, nodes.map((node, i) => /*#__PURE__*/React.createElement(Node, {
    key: node.label + i,
    node: node,
    prefix: "",
    last: i === nodes.length - 1,
    depth: 0
  })))));
}
Object.assign(__ds_scope, { SiteTree });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SiteTree.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/AdminApp.jsx
try { (() => {
const AA = window.BjsmithXyzDesignSystem_042b50;
function AdminApp() {
  const [signedIn, setSignedIn] = React.useState(false);
  const [hash, setHash] = React.useState(() => (location.hash || '#').slice(1));
  const [theme, setTheme] = React.useState('dark');
  React.useEffect(() => {
    const onHash = () => setHash((location.hash || '#').slice(1));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  const go = r => {
    if (r === 'login') {
      setSignedIn(false);
      location.hash = '';
    } else {
      location.hash = '#' + r;
    }
  };
  const route = signedIn ? hash : 'login';
  const crumbs = route === 'login' ? [{
    label: '~/admin',
    href: '#'
  }, {
    label: 'sign-in',
    href: '#'
  }] : [{
    label: '~/admin',
    href: '#'
  }].concat(route ? [{
    label: route,
    href: '#'
  }] : []);
  let screen;
  if (route === 'login') screen = /*#__PURE__*/React.createElement(LoginScreen, {
    go: () => {
      setSignedIn(true);
      location.hash = '';
    }
  });else if (route === 'rolls') screen = /*#__PURE__*/React.createElement(RollsIndex, {
    go: go
  });else if (route === 'new') screen = /*#__PURE__*/React.createElement(RollEditor, {
    mode: "create",
    go: go
  });else if (route === 'edit') screen = /*#__PURE__*/React.createElement(RollEditor, {
    mode: "edit",
    go: go
  });else if (route === 'travel') screen = /*#__PURE__*/React.createElement(TravelAdmin, null);else screen = /*#__PURE__*/React.createElement(AdminIndex, {
    go: go
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      position: 'relative',
      zIndex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "container",
    style: {
      display: 'flex',
      height: 'var(--breadcrumb-row-height)',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(AA.Breadcrumb, {
    row: false,
    items: crumbs
  }), route !== 'login' && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--color-text-muted)',
      fontSize: 'var(--font-size-xs)',
      whiteSpace: 'nowrap'
    }
  }, "beek \xB7 ", /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      go('login');
    }
  }, "sign out"))), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1
    }
  }, screen), /*#__PURE__*/React.createElement(AA.Footer, {
    links: [],
    tagline: "// admin.bjsmith.xyz",
    theme: theme,
    onToggleTheme: () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  }));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(AdminApp, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/AdminApp.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/AdminScreens.jsx
try { (() => {
const A = window.BjsmithXyzDesignSystem_042b50;
const {
  PageHeader,
  Panel,
  Button,
  SiteTree,
  Breadcrumb,
  Footer,
  Tag
} = A;
const pageStyle = {
  padding: 'var(--page-content-top) 0 var(--space-16)'
};
const label = {
  color: 'var(--color-text-muted)',
  fontSize: 'var(--font-size-xs)'
};
const input = {
  width: '100%',
  padding: '.52rem .6rem',
  border: '1px solid var(--color-border)',
  borderRadius: 0,
  background: 'var(--bg)',
  color: 'var(--text)',
  font: 'inherit'
};
const field = span => ({
  display: 'grid',
  gap: '.3rem',
  minWidth: 0,
  gridColumn: span ? 'span 2' : 'auto'
});
function AdminIndex({
  go
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: pageStyle
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "index/",
    description: "admin.bjsmith.xyz \u2014 authenticated tools"
  }), /*#__PURE__*/React.createElement(SiteTree, {
    root: "~/admin",
    nodes: [{
      label: 'beek/',
      href: '#',
      meta: 'public site'
    }, {
      label: 'admin/',
      meta: 'beek',
      open: true,
      children: [{
        label: 'rolls/',
        meta: 'desktop beta',
        open: true,
        children: [{
          label: 'index/',
          href: '#rolls',
          meta: 'committed rolls'
        }, {
          label: 'new/',
          href: '#new',
          meta: 'import scans'
        }]
      }, {
        label: 'travel/',
        href: '#travel',
        meta: 'itinerary'
      }]
    }]
  })));
}
function RollsIndex({
  go
}) {
  const rolls = window.KIT_DATA.rolls;
  return /*#__PURE__*/React.createElement("section", {
    style: pageStyle
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "rolls/",
    description: rolls.length + ' committed rolls',
    actions: /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "sm",
      onClick: () => go('new')
    }, "new roll \u2192")
  }), /*#__PURE__*/React.createElement("div", null, rolls.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.slug,
    style: {
      display: 'grid',
      gridTemplateColumns: '12rem 6.5rem 1fr auto',
      gap: 'var(--space-4)',
      alignItems: 'baseline',
      padding: 'var(--space-3) var(--space-4)',
      border: '1px solid var(--color-border)',
      marginTop: -1,
      background: 'var(--color-bg-secondary)',
      fontSize: 'var(--font-size-sm)'
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    kind: r.stockType
  }, r.stock), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--color-text-muted)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, r.date), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--color-text-primary)',
      fontWeight: 'var(--font-weight-medium)'
    }
  }, r.title), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 'var(--space-2)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    onClick: () => go('edit')
  }, "edit")))))));
}
function RollEditor({
  mode = 'create',
  go
}) {
  const frames = window.KIT_DATA.frames;
  const [stage, setStage] = React.useState('edit');
  const [selected, setSelected] = React.useState([]);
  const [picker, setPicker] = React.useState(null); // null | { target: 'roll' | 'frames' }
  const [rollLoc, setRollLoc] = React.useState({
    name: 'Almaty',
    region: 'Kazakhstan',
    lat: 43.2364,
    lng: 76.9457
  });
  const [frameLocs, setFrameLocs] = React.useState({});
  const toggle = i => setSelected(s => s.includes(i) ? s.filter(x => x !== i) : s.concat(i));
  const useLocation = loc => {
    if (picker && picker.target === 'frames') {
      setFrameLocs(prev => {
        const next = {
          ...prev
        };
        selected.forEach(i => {
          next[i] = loc.name;
        });
        return next;
      });
    } else {
      setRollLoc(loc);
    }
    setPicker(null);
  };
  return /*#__PURE__*/React.createElement("section", {
    style: pageStyle
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: mode === 'create' ? 'new-roll/' : 'edit-roll/',
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, mode === 'edit' && /*#__PURE__*/React.createElement(Button, {
      variant: "danger",
      size: "sm"
    }, "delete roll"), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "sm",
      onClick: () => setStage(stage === 'edit' ? 'review' : 'publish')
    }, stage === 'edit' ? 'review changes →' : 'upload + create pull request →'))
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      marginBottom: 'var(--space-5)',
      color: 'var(--color-text-muted)',
      fontSize: 'var(--font-size-sm)'
    }
  }, "18 scans encoded locally \xB7 quality-80 \xB7 2048px long edge"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    path: "source/images",
    title: "scans",
    actions: /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm"
    }, "choose folder")
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '.3rem 0 .7rem',
      ...label
    }
  }, "Folder convention: ", /*#__PURE__*/React.createElement("code", null, "YYYY-MM-DD - film-stock-slug-ISO"), ". Images are encoded locally; originals never leave the browser."), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 4,
      overflow: 'hidden',
      background: 'var(--color-border)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      width: '100%',
      height: '100%',
      background: 'var(--color-accent-primary)'
    }
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '.4rem 0 0',
      ...label
    }
  }, "18 / 18 encoded"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    path: "frontmatter",
    title: "roll metadata",
    actions: /*#__PURE__*/React.createElement("label", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '.45rem',
        ...label
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      style: {
        width: '1rem',
        height: '1rem',
        accentColor: 'var(--accent)'
      }
    }), " draft")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '.7rem'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: field(true)
  }, /*#__PURE__*/React.createElement("span", {
    style: label
  }, "title"), /*#__PURE__*/React.createElement("input", {
    style: input,
    defaultValue: "Almaty"
  })), /*#__PURE__*/React.createElement("label", {
    style: field()
  }, /*#__PURE__*/React.createElement("span", {
    style: label
  }, "film stock"), /*#__PURE__*/React.createElement("select", {
    style: input,
    defaultValue: "fujifilm-400"
  }, /*#__PURE__*/React.createElement("option", {
    value: "fujifilm-400"
  }, "Fujifilm 400"), /*#__PURE__*/React.createElement("option", {
    value: "kodak-tri-x-400"
  }, "Kodak Tri-X 400"))), /*#__PURE__*/React.createElement("label", {
    style: field()
  }, /*#__PURE__*/React.createElement("span", {
    style: label
  }, "date"), /*#__PURE__*/React.createElement("input", {
    style: input,
    type: "date",
    defaultValue: "2025-08-24"
  })), /*#__PURE__*/React.createElement("label", {
    style: field()
  }, /*#__PURE__*/React.createElement("span", {
    style: label
  }, "detected ISO"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...input,
      color: 'var(--text-muted)'
    },
    readOnly: true,
    defaultValue: "400"
  })), /*#__PURE__*/React.createElement("label", {
    style: field(true)
  }, /*#__PURE__*/React.createElement("span", {
    style: label
  }, "slug"), /*#__PURE__*/React.createElement("input", {
    style: input,
    defaultValue: "2025-08-fujifilm-400-almaty"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      ...field(true),
      display: 'flex',
      alignItems: 'end',
      justifyContent: 'space-between',
      gap: '.75rem',
      padding: '.6rem',
      border: '1px solid var(--color-border)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: label
  }, "primary location"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '.2rem 0 0',
      color: 'var(--text-soft)',
      fontSize: 'var(--font-size-sm)'
    }
  }, rollLoc.name ? rollLoc.name + ' · ' + rollLoc.region + ' · ' + rollLoc.lat + ', ' + rollLoc.lng : '(none set)')), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    onClick: () => setPicker({
      target: 'roll'
    })
  }, "set location")), /*#__PURE__*/React.createElement("label", {
    style: field(true)
  }, /*#__PURE__*/React.createElement("span", {
    style: label
  }, "roll notes (Markdown)"), /*#__PURE__*/React.createElement("textarea", {
    style: {
      ...input,
      resize: 'vertical'
    },
    rows: "3"
  }))))), /*#__PURE__*/React.createElement(Panel, {
    path: "photos[]",
    title: 'frames (' + frames.length + ')',
    actions: /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        gap: '.6rem'
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      onClick: () => setSelected(frames.map((_, i) => i))
    }, "select all"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      onClick: () => setPicker({
        target: 'frames'
      })
    }, "set selected location"))
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '.3rem 0 .7rem',
      ...label
    }
  }, "Drag frames or use arrow buttons to reorder. Setting one frame location fills forward until the next explicit location."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))',
      gap: '.75rem'
    }
  }, frames.map((fr, i) => /*#__PURE__*/React.createElement("div", {
    key: fr.src,
    style: {
      minWidth: 0,
      padding: '.55rem',
      border: '1px solid ' + (selected.includes(i) ? 'var(--accent)' : 'var(--color-border)'),
      background: 'var(--bg)',
      boxShadow: selected.includes(i) ? '2px 2px 0 var(--accent)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '.4rem',
      marginBottom: '.4rem'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--amber)',
      fontSize: 'var(--font-size-xs)'
    }
  }, String(i + 1).padStart(3, '0'), ".jpg"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: '.2rem'
    }
  }, ['↑', '↓'].map(g => /*#__PURE__*/React.createElement("button", {
    key: g,
    type: "button",
    style: {
      width: '1.7rem',
      height: '1.7rem',
      padding: 0,
      border: '1px solid var(--color-border)',
      background: 'var(--panel)',
      color: 'var(--text-muted)'
    }
  }, g)))), /*#__PURE__*/React.createElement("img", {
    src: fr.src,
    alt: "",
    style: {
      width: '100%',
      aspectRatio: '3 / 2',
      objectFit: 'cover',
      display: 'block',
      cursor: 'zoom-in'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: '.35rem',
      marginTop: '.45rem'
    }
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...input,
      fontSize: 'var(--font-size-xs)',
      padding: '.35rem'
    },
    placeholder: "alt text"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      ...label,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, frameLocs[i] ? frameLocs[i] : rollLoc.name + ' (inherited)'), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '.3rem',
      ...label
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: selected.includes(i),
    onChange: () => toggle(i),
    style: {
      width: '1rem',
      height: '1rem',
      accentColor: 'var(--accent)'
    }
  }), " select")))))), /*#__PURE__*/React.createElement(LocationPicker, {
    open: !!picker,
    initial: picker && picker.target === 'roll' ? rollLoc : {
      name: '',
      region: rollLoc.region,
      lat: '',
      lng: ''
    },
    onClose: () => setPicker(null),
    onUse: useLocation
  }), stage === 'review' && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    tone: "amber",
    path: "publication/review",
    title: "review roll publication"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      marginBottom: 'var(--space-3)',
      fontSize: 'var(--font-size-sm)',
      color: 'var(--text-soft)'
    }
  }, "1 markdown file \xB7 18 images \xB7 new branch ", /*#__PURE__*/React.createElement("code", null, "admin/rolls/8f21c4")), /*#__PURE__*/React.createElement("p", {
    style: {
      ...label,
      marginBottom: 'var(--space-3)'
    }
  }, "New scans are stored as unreferenced GitHub blobs first. One later commit atomically applies every image, Markdown, rename, or deletion on a review branch."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '.6rem',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    onClick: () => setStage('edit')
  }, "keep editing"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    onClick: () => setStage('publish')
  }, "upload + create pull request \u2192")))), stage === 'publish' && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    tone: "blue",
    path: "publication/status",
    title: "roll publication"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      marginBottom: 'var(--space-3)',
      fontSize: 'var(--font-size-sm)',
      color: 'var(--text-soft)'
    }
  }, "Uploading blobs\u2026 12 / 18"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 4,
      overflow: 'hidden',
      background: 'var(--color-border)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      width: '66%',
      height: '100%',
      background: 'var(--color-accent-primary)'
    }
  })), /*#__PURE__*/React.createElement("dl", {
    style: {
      margin: 'var(--space-4) 0 0',
      borderTop: '1px solid var(--color-border)'
    }
  }, [['pull request', 'waiting…'], ['deploy preview', 'waiting for Netlify…']].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'grid',
      gridTemplateColumns: '9rem 1fr',
      gap: '.6rem',
      padding: '.6rem 0',
      borderBottom: '1px solid var(--color-border)'
    }
  }, /*#__PURE__*/React.createElement("dt", {
    style: label
  }, k), /*#__PURE__*/React.createElement("dd", {
    style: {
      margin: 0,
      fontSize: 'var(--font-size-sm)',
      color: 'var(--text-soft)'
    }
  }, v)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '.6rem',
      marginTop: 'var(--space-3)',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    onClick: () => setStage('edit')
  }, "refresh status"), /*#__PURE__*/React.createElement(Button, {
    variant: "danger",
    size: "sm",
    onClick: () => setStage('edit')
  }, "abandon"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    disabled: true
  }, "merge to main \u2192"))))));
}
function TravelAdmin() {
  const [trip, setTrip] = React.useState(null);
  const [layers, setLayers] = React.useState({
    travelled: true,
    planned: true
  });
  const [focus, setFocus] = React.useState(null);
  React.useEffect(() => {
    fetch('../../assets/trips.json').then(r => r.json()).then(setTrip);
  }, []);
  if (!trip) return /*#__PURE__*/React.createElement("section", {
    style: pageStyle
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)'
    }
  }, "loading itinerary\u2026")));
  const now = Date.now();
  const stops = trip.stops;
  const statuses = stops.map(st => window.statusOf(st, now));
  const currentIndex = statuses.indexOf('current');
  const upcoming = stops.filter((_, i) => statuses[i] === 'future').length;
  const tentative = stops.filter(st => st.tentative).length;
  const chip = (status, on) => ({
    padding: 'var(--space-2) var(--space-3)',
    fontSize: 'var(--font-size-xs)',
    font: 'inherit',
    background: 'var(--color-bg-secondary)',
    cursor: 'pointer',
    flex: 'none',
    whiteSpace: 'nowrap',
    color: status === 'current' ? 'var(--amber)' : on ? 'var(--accent)' : 'var(--text-muted)',
    border: '1px solid ' + (on ? 'var(--accent)' : 'var(--color-border)'),
    boxShadow: on ? 'var(--shadow-hard-accent)' : 'none'
  });
  return /*#__PURE__*/React.createElement("section", {
    style: pageStyle
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "travel/",
    description: stops.length + ' stops · ' + upcoming + ' upcoming · ' + tentative + ' tentative'
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      margin: '0 0 var(--space-4)',
      padding: 'var(--space-2) var(--space-3)',
      color: 'var(--text-soft)',
      background: 'var(--panel)',
      border: '1px solid var(--color-border)',
      borderLeft: '3px solid var(--amber)',
      fontSize: 'var(--font-size-sm)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      flex: 'none',
      background: 'var(--amber)'
    }
  }), "authenticated view \u2014 exact dates, forward plans and tentative stops are never published to bjsmith.xyz"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'end',
      justifyContent: 'space-between',
      gap: 'var(--space-4)',
      marginBottom: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 'var(--font-size-base)',
      color: 'var(--text-muted)',
      fontWeight: 'var(--font-weight-medium)'
    }
  }, "route/"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 'var(--space-1) 0 0',
      fontSize: 'var(--font-size-xs)',
      color: 'var(--text-muted)'
    }
  }, "Solid is travelled; dashed is planned. Click a marker for dates.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-2)'
    }
  }, ['travelled', 'planned'].map(k => /*#__PURE__*/React.createElement("button", {
    key: k,
    type: "button",
    "aria-pressed": layers[k],
    style: chip('past', layers[k]),
    onClick: () => setLayers(l => ({
      ...l,
      [k]: !l[k]
    }))
  }, k)))), /*#__PURE__*/React.createElement(TravelMap, {
    stops: stops,
    layers: layers,
    focus: focus,
    onFocusHandled: () => setFocus(null),
    detail: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-2)',
      marginTop: 'var(--space-3)',
      paddingBottom: 'var(--space-2)',
      overflowX: 'auto'
    }
  }, stops.map((st, i) => /*#__PURE__*/React.createElement("button", {
    key: st.name + i,
    type: "button",
    style: chip(statuses[i], statuses[i] === 'current'),
    onClick: () => setFocus(i)
  }, st.name))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-6)',
      borderTop: '1px solid var(--color-border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '7rem 7rem 1fr 6rem',
      gap: 'var(--space-4)',
      padding: 'var(--space-2) var(--space-4)',
      fontSize: 'var(--font-size-xs)',
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      border: '1px solid var(--color-border)',
      background: 'var(--panel-strong)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "arrive"), /*#__PURE__*/React.createElement("span", null, "depart"), /*#__PURE__*/React.createElement("span", null, "stop"), /*#__PURE__*/React.createElement("span", null, "state")), stops.map((st, i) => /*#__PURE__*/React.createElement("div", {
    key: st.name + st.arrive,
    style: {
      display: 'grid',
      gridTemplateColumns: '7rem 7rem 1fr 6rem',
      gap: 'var(--space-4)',
      alignItems: 'baseline',
      padding: 'var(--space-3) var(--space-4)',
      border: '1px solid var(--color-border)',
      marginTop: -1,
      background: 'var(--panel)',
      fontSize: 'var(--font-size-sm)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, st.arrive), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, st.depart), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--text)',
      fontWeight: 'var(--font-weight-medium)'
    }
  }, st.name), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'var(--space-2)',
      color: 'var(--text-muted)',
      fontSize: 'var(--font-size-xs)'
    }
  }, st.country), st.note && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 'var(--space-1) 0 0',
      color: 'var(--text-muted)',
      fontSize: 'var(--font-size-xs)',
      fontStyle: 'italic'
    }
  }, st.note)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--font-size-xs)',
      color: statuses[i] === 'current' ? 'var(--blue)' : statuses[i] === 'future' ? 'var(--amber)' : 'var(--text-muted)'
    }
  }, statuses[i] === 'future' ? st.tentative ? 'tentative' : 'planned' : statuses[i] === 'current' ? 'here now' : 'done'))))));
}
function LoginScreen({
  go
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: pageStyle
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: '42rem',
      padding: 'var(--space-5)',
      background: 'var(--color-bg-secondary)',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-hard)'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'var(--font-size-2xl)',
      fontWeight: 'var(--font-weight-bold)',
      marginBottom: 'var(--space-2)'
    }
  }, "sign in/"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--color-text-muted)',
      fontSize: 'var(--font-size-sm)',
      marginBottom: 'var(--space-4)'
    }
  }, "admin.bjsmith.xyz is protected. Authentication is GitHub App OAuth; session cookies are host-only and never reach the public origin."), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    onClick: () => go('')
  }, "continue with github \u2192"))));
}
Object.assign(window, {
  AdminIndex,
  RollsIndex,
  RollEditor,
  TravelAdmin,
  LoginScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/AdminScreens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/LocationPicker.jsx
try { (() => {
// Location picker dialog from admin/src/components/RollEditor.astro — search row,
// result list, recent chips, a real Leaflet map you can click to drop a pin, and the
// four editable fields. The live admin geocodes over the network; this kit searches a
// local gazetteer built from the trip's own stops so it works offline.

function buildGazetteer() {
  const stops = window.TRIP_STOPS || [];
  const seen = new Set();
  return stops.filter(s => {
    const k = s.name + s.country;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).map(s => ({
    name: s.name,
    region: s.country,
    lat: s.lat,
    lng: s.lon
  }));
}
function LocationPicker({
  open,
  initial,
  onClose,
  onUse
}) {
  const hostRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const markerRef = React.useRef(null);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState([]);
  const [message, setMessage] = React.useState('');
  const [place, setPlace] = React.useState(initial || {
    name: '',
    region: '',
    lat: '',
    lng: ''
  });
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  React.useEffect(() => {
    if (open) setPlace(initial || {
      name: '',
      region: '',
      lat: '',
      lng: ''
    });
  }, [open]);
  React.useEffect(() => {
    if (!open || !hostRef.current || typeof L === 'undefined') return;
    const tiles = theme === 'light' ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    const start = [Number(place.lat) || 20, Number(place.lng) || 40];
    const map = L.map(hostRef.current, {
      attributionControl: true
    }).setView(start, place.lat ? 8 : 2);
    L.tileLayer(tiles, {
      attribution: '© OpenStreetMap contributors, © CARTO',
      subdomains: 'abcd',
      maxZoom: 18
    }).addTo(map);
    map.on('click', e => {
      setPlace(p => ({
        ...p,
        lat: +e.latlng.lat.toFixed(6),
        lng: +e.latlng.lng.toFixed(6)
      }));
      setMessage('Pin dropped — name it before saving.');
    });
    mapRef.current = map;
    const t = setTimeout(() => map.invalidateSize(), 60);
    return () => {
      clearTimeout(t);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [open, theme]);
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || typeof L === 'undefined') return;
    const lat = Number(place.lat),
      lng = Number(place.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || place.lat === '' || place.lng === '') return;
    if (markerRef.current) map.removeLayer(markerRef.current);
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--color-accent-primary').trim() || '#33ff66';
    markerRef.current = L.circleMarker([lat, lng], {
      radius: 6,
      color: accent,
      weight: 3,
      fillColor: accent,
      fillOpacity: 0.35
    }).addTo(map);
  }, [place.lat, place.lng]);
  const search = () => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults([]);
      setMessage('Type a place name.');
      return;
    }
    const hits = buildGazetteer().filter(g => (g.name + ' ' + g.region).toLowerCase().includes(q)).slice(0, 6);
    setResults(hits);
    setMessage(hits.length ? hits.length + ' matches' : 'No matches in the local gazetteer — drop a pin on the map instead.');
  };
  const pick = hit => {
    setPlace({
      name: hit.name,
      region: hit.region,
      lat: hit.lat,
      lng: hit.lng
    });
    setMessage('');
    if (mapRef.current) mapRef.current.flyTo([hit.lat, hit.lng], 7, {
      duration: 0.5
    });
  };
  if (!open) return null;
  const label = {
    color: 'var(--color-text-muted)',
    fontSize: 'var(--font-size-xs)'
  };
  const input = {
    width: '100%',
    minWidth: 0,
    padding: '.52rem .6rem',
    border: '1px solid var(--color-border)',
    borderRadius: 0,
    background: 'var(--bg)',
    color: 'var(--text)',
    font: 'inherit'
  };
  const smallBtn = {
    padding: '.45rem .65rem',
    border: '1px solid var(--border-strong)',
    background: 'var(--panel-strong)',
    color: 'var(--text-soft)',
    font: 'inherit',
    fontSize: 'var(--font-size-xs)',
    cursor: 'pointer'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 9000,
      background: 'rgba(0,0,0,.82)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '1rem',
      overflow: 'auto'
    },
    onClick: e => {
      if (e.target === e.currentTarget) onClose();
    }
  }, /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    "aria-label": "Set location",
    style: {
      width: 'min(620px, calc(100vw - 2rem))',
      padding: '1rem',
      border: '1px solid var(--border-strong)',
      background: 'var(--bg)',
      color: 'var(--text)',
      boxShadow: 'var(--shadow-dialog)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'start',
      marginBottom: '.7rem'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: label
  }, "location/picker"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 'var(--font-size-base)',
      fontWeight: 'var(--font-weight-medium)'
    }
  }, "set location")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Close",
    onClick: onClose,
    style: {
      width: '2rem',
      height: '2rem',
      border: '1px solid var(--color-border)',
      background: 'var(--panel)',
      color: 'var(--text)',
      font: 'inherit',
      cursor: 'pointer'
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '.6rem'
    }
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...input,
      flex: 1
    },
    placeholder: "search place\u2026",
    value: query,
    onChange: e => setQuery(e.target.value),
    onKeyDown: e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        search();
      }
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: smallBtn,
    onClick: search
  }, "search")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '.4rem 0 .5rem',
      ...label
    },
    role: "status"
  }, message), results.length > 0 && /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: '.4rem 0',
      display: 'grid',
      gap: '.25rem'
    }
  }, results.map(hit => /*#__PURE__*/React.createElement("li", {
    key: hit.name + hit.lat
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => pick(hit),
    style: {
      width: '100%',
      padding: '.45rem',
      textAlign: 'left',
      border: '1px solid var(--color-border)',
      background: 'var(--panel)',
      color: 'var(--text-soft)',
      font: 'inherit',
      fontSize: 'var(--font-size-sm)',
      cursor: 'pointer'
    }
  }, hit.name, " ", /*#__PURE__*/React.createElement("span", {
    style: label
  }, "\xB7 ", hit.region, " \xB7 ", hit.lat, ", ", hit.lng))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '.3rem',
      margin: '.4rem 0'
    }
  }, buildGazetteer().slice(-6).map(hit => /*#__PURE__*/React.createElement("button", {
    key: 'chip' + hit.name + hit.lat,
    type: "button",
    onClick: () => pick(hit),
    style: {
      padding: '.25rem .4rem',
      border: '1px solid var(--color-border)',
      background: 'var(--panel)',
      color: 'var(--text-muted)',
      fontSize: 'var(--font-size-xs)',
      font: 'inherit',
      cursor: 'pointer'
    }
  }, hit.name))), /*#__PURE__*/React.createElement("div", {
    ref: hostRef,
    className: "travel-map",
    style: {
      height: 270,
      margin: '.6rem 0',
      border: '1px solid var(--color-border)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '.6rem'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'grid',
      gap: '.3rem',
      gridColumn: 'span 2'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: label
  }, "place"), /*#__PURE__*/React.createElement("input", {
    style: input,
    maxLength: 160,
    value: place.name,
    onChange: e => setPlace(p => ({
      ...p,
      name: e.target.value
    }))
  })), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'grid',
      gap: '.3rem'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: label
  }, "latitude"), /*#__PURE__*/React.createElement("input", {
    style: input,
    type: "number",
    min: "-90",
    max: "90",
    step: "any",
    value: place.lat,
    onChange: e => setPlace(p => ({
      ...p,
      lat: e.target.value
    }))
  })), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'grid',
      gap: '.3rem'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: label
  }, "longitude"), /*#__PURE__*/React.createElement("input", {
    style: input,
    type: "number",
    min: "-180",
    max: "180",
    step: "any",
    value: place.lng,
    onChange: e => setPlace(p => ({
      ...p,
      lng: e.target.value
    }))
  })), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'grid',
      gap: '.3rem',
      gridColumn: 'span 2'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: label
  }, "region / country"), /*#__PURE__*/React.createElement("input", {
    style: input,
    maxLength: 160,
    value: place.region,
    onChange: e => setPlace(p => ({
      ...p,
      region: e.target.value
    }))
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '.6rem',
      justifyContent: 'flex-end',
      marginTop: '.7rem'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: {
      ...smallBtn,
      color: 'var(--accent)',
      borderColor: 'var(--accent)',
      boxShadow: 'var(--shadow-hard-accent)'
    },
    onClick: () => onUse(place)
  }, "use location"))));
}
Object.assign(window, {
  LocationPicker
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/LocationPicker.jsx", error: String((e && e.message) || e) }); }

// ui_kits/public-site/App.jsx
try { (() => {
const DSA = window.BjsmithXyzDesignSystem_042b50;

// Leaf labels match what the site index calls the same thing: directories keep a bare
// name, single-file routes keep their extension. The crumb is the path; the page title
// is the heading — on detail pages they differ on purpose (slug vs. real title).
const FILE_ROUTES = {
  about: 'about.md',
  404: '404.html'
};
function crumbsFor(route) {
  const [top, slug] = route.split('/');
  if (!top) return [{
    label: '~',
    href: '#'
  }];
  const base = [{
    label: '~/beek',
    href: '#'
  }];
  if (!slug) return base.concat([{
    label: FILE_ROUTES[top] || top,
    href: '#' + top
  }]);
  return base.concat([{
    label: top,
    href: '#' + top
  }, {
    label: slug + '.md',
    href: '#' + route
  }]);
}
function App() {
  const [route, setRoute] = React.useState(() => (location.hash || '#').slice(1));
  const [theme, setTheme] = React.useState('dark');
  React.useEffect(() => {
    const onHash = () => setRoute((location.hash || '#').slice(1));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  const go = r => {
    location.hash = '#' + r;
  };
  const [top, slug] = route.split('/');
  let screen;
  if (top === 'work') screen = slug ? /*#__PURE__*/React.createElement(WorkDetailScreen, {
    slug: slug,
    go: go
  }) : /*#__PURE__*/React.createElement(WorkScreen, {
    go: go
  });else if (top === 'photos') screen = slug ? /*#__PURE__*/React.createElement(RollScreen, {
    slug: slug
  }) : /*#__PURE__*/React.createElement(PhotosScreen, {
    go: go
  });else if (top === 'travel') screen = /*#__PURE__*/React.createElement(TravelScreen, null);else if (top === 'about') screen = /*#__PURE__*/React.createElement(AboutScreen, null);else if (top === '404') screen = /*#__PURE__*/React.createElement(NotFoundScreen, null);else screen = /*#__PURE__*/React.createElement(HomeScreen, {
    go: go
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      position: 'relative',
      zIndex: 1
    }
  }, /*#__PURE__*/React.createElement(DSA.Breadcrumb, {
    items: crumbsFor(route)
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1
    }
  }, screen), /*#__PURE__*/React.createElement(DSA.Footer, {
    theme: theme,
    onToggleTheme: () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  }));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/public-site/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/public-site/Screens.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const DS = window.BjsmithXyzDesignSystem_042b50;
const {
  PageHeader,
  Panel,
  Button,
  Tag,
  Breadcrumb,
  SiteTree,
  Footer,
  FilterBar,
  DirListHeader,
  WorkRow,
  RollRow,
  FilmStrip,
  Lightbox,
  WorldMap,
  Stat,
  StatGrid
} = DS;
const D = window.KIT_DATA;
const pageStyle = {
  padding: 'var(--page-content-top) 0 var(--space-16)'
};
const sectionLabel = {
  fontSize: 'var(--font-size-base)',
  color: 'var(--color-text-muted)',
  marginBottom: 'var(--space-3)',
  fontWeight: 'var(--font-weight-medium)'
};
function HomeScreen({
  go
}) {
  const rollsByYear = {
    2025: D.rolls
  };
  return /*#__PURE__*/React.createElement("section", {
    style: pageStyle
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement(SiteTree, {
    root: "~",
    nodes: [{
      label: 'admin/',
      href: '#',
      meta: 'protected'
    }, {
      label: 'beek/',
      meta: 'public home',
      open: true,
      children: [{
        label: 'work/',
        meta: D.work.length + ' entries',
        children: [{
          label: 'index/',
          href: '#work',
          meta: 'all work'
        }, {
          label: 'dev/',
          meta: '2 entries',
          children: D.work.filter(w => w.category === 'dev').map(w => ({
            label: w.slug + '.md',
            href: '#work/' + w.slug
          }))
        }, {
          label: 'art/',
          meta: '3 entries',
          children: D.work.filter(w => w.category !== 'dev').map(w => ({
            label: w.slug + '.md',
            href: '#work/' + w.slug
          }))
        }]
      }, {
        label: 'photos/',
        meta: D.rolls.length + ' rolls',
        children: [{
          label: 'index/',
          href: '#photos',
          meta: 'all rolls'
        }, {
          label: '2025/',
          meta: D.rolls.length + ' rolls',
          children: rollsByYear[2025].map(r => ({
            label: r.slug + '.md',
            href: '#photos/' + r.slug,
            meta: r.date
          }))
        }]
      }, {
        label: 'travel/',
        href: '#travel',
        meta: 'journey'
      }, {
        label: 'about.md',
        href: '#about',
        meta: 'file'
      }]
    }]
  })));
}
function WorkScreen({
  go
}) {
  const [filter, setFilter] = React.useState('all');
  const rows = filter === 'all' ? D.work : D.work.filter(w => w.category === filter);
  return /*#__PURE__*/React.createElement("section", {
    style: pageStyle
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "work/",
    description: D.work.length + ' entries — projects, art, photography'
  }), /*#__PURE__*/React.createElement(FilterBar, {
    options: ['dev', 'art', 'photography'],
    value: filter,
    onChange: setFilter
  }), /*#__PURE__*/React.createElement(DirListHeader, {
    columns: ['type', 'date', 'name', 'description', ''],
    cols: "var(--work-cols)"
  }), /*#__PURE__*/React.createElement("div", null, rows.map(w => /*#__PURE__*/React.createElement("div", {
    key: w.slug,
    onClick: e => {
      e.preventDefault();
      go('work/' + w.slug);
    }
  }, /*#__PURE__*/React.createElement(WorkRow, {
    slug: w.slug,
    category: w.category,
    date: w.date,
    description: w.description,
    href: '#work/' + w.slug
  }))))));
}
const navLink = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-1)',
  minWidth: 0,
  padding: 'var(--space-3) var(--space-4)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg-secondary)',
  color: 'var(--color-text-primary)'
};
const navDir = {
  fontSize: 'var(--font-size-xs)',
  color: 'var(--color-text-muted)'
};
const navTitle = {
  fontSize: 'var(--font-size-sm)',
  fontWeight: 'var(--font-weight-medium)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
};
function WorkDetailScreen({
  slug,
  go
}) {
  const sorted = D.work;
  const at = Math.max(0, sorted.findIndex(w => w.slug === slug));
  const entry = sorted[at] || sorted[2];
  const newer = at > 0 ? sorted[at - 1] : null;
  const older = at < sorted.length - 1 ? sorted[at + 1] : null;
  const [lb, setLb] = React.useState(null);
  const images = (entry.images || []).map((src, i) => ({
    src,
    alt: entry.title + ' ' + (i + 1),
    caption: entry.title
  }));
  return /*#__PURE__*/React.createElement("article", {
    style: pageStyle
  }, /*#__PURE__*/React.createElement("div", {
    className: "container container-narrow"
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      marginBottom: 'var(--space-6)',
      paddingBottom: 'var(--space-6)',
      borderBottom: '1px solid var(--color-border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    kind: entry.category
  }, entry.category)), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'var(--font-size-page-title)',
      fontWeight: 'var(--font-weight-bold)',
      marginBottom: 'var(--space-3)'
    }
  }, entry.title), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--color-text-secondary)',
      lineHeight: 'var(--line-height-relaxed)',
      marginBottom: 'var(--space-4)'
    }
  }, entry.description), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-4)',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginBottom: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement("time", {
    style: {
      color: 'var(--color-text-muted)',
      fontSize: 'var(--font-size-sm)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, entry.date), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-2)',
      flexWrap: 'wrap'
    }
  }, (entry.tags || []).map(t => /*#__PURE__*/React.createElement(Tag, {
    key: t,
    chip: true
  }, t)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-2)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    href: "#"
  }, "view live \u2192"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    href: "#"
  }, "source \u2192"))), entry.cover && /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--color-border)',
      marginBottom: 'var(--space-6)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: entry.cover,
    alt: entry.title,
    style: {
      width: '100%'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--color-text-secondary)',
      lineHeight: 'var(--line-height-relaxed)',
      marginBottom: 'var(--space-8)'
    }
  }, (entry.body || [entry.description]).map((p, i) => /*#__PURE__*/React.createElement("p", {
    key: i,
    style: {
      marginBottom: 'var(--space-4)'
    }
  }, p))), images.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid var(--color-border)',
      paddingTop: 'var(--space-6)'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: sectionLabel
  }, "gallery/"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))',
      gap: 'var(--space-3)'
    }
  }, images.map((img, i) => /*#__PURE__*/React.createElement("figure", {
    key: img.src,
    style: {
      margin: 0,
      border: '1px solid var(--color-border)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: img.src,
    alt: img.alt,
    style: {
      width: '100%',
      cursor: 'pointer'
    },
    onClick: () => setLb(i)
  }), /*#__PURE__*/React.createElement("figcaption", {
    style: {
      padding: 'var(--space-2) var(--space-3)',
      fontSize: 'var(--font-size-xs)',
      color: 'var(--color-text-muted)',
      borderTop: '1px solid var(--color-border)'
    }
  }, img.alt))))), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'var(--space-3)',
      marginTop: 'var(--space-8)',
      paddingTop: 'var(--space-6)',
      borderTop: '1px solid var(--color-border)'
    },
    "aria-label": "More work"
  }, newer ? /*#__PURE__*/React.createElement("a", {
    href: '#work/' + newer.slug,
    style: navLink
  }, /*#__PURE__*/React.createElement("span", {
    style: navDir
  }, "\u2190 newer"), /*#__PURE__*/React.createElement("span", {
    style: navTitle
  }, newer.title)) : /*#__PURE__*/React.createElement("span", null), older ? /*#__PURE__*/React.createElement("a", {
    href: '#work/' + older.slug,
    style: {
      ...navLink,
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: navDir
  }, "older \u2192"), /*#__PURE__*/React.createElement("span", {
    style: navTitle
  }, older.title)) : /*#__PURE__*/React.createElement("span", null)), /*#__PURE__*/React.createElement(Lightbox, {
    open: lb !== null,
    items: images,
    index: lb || 0,
    onClose: () => setLb(null),
    onNavigate: d => setLb(v => (v + d + images.length) % images.length)
  })));
}
function PhotosScreen({
  go
}) {
  const [dots, setDots] = React.useState([]);
  const [hovered, setHovered] = React.useState(null);
  React.useEffect(() => {
    fetch('../../assets/world-dots.json').then(r => r.json()).then(setDots);
  }, []);
  const frames = D.rolls.reduce((n, r) => n + r.frames, 0);
  return /*#__PURE__*/React.createElement("section", {
    style: pageStyle
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "photos/",
    description: D.rolls.length + ' rolls — ' + frames + ' frames · ' + D.pins.length + ' locations'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 'var(--space-6)'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: sectionLabel
  }, "map/"), /*#__PURE__*/React.createElement(WorldMap, {
    dots: dots,
    pins: D.pins,
    activeSlug: hovered,
    onPinHover: p => setHovered(p ? p.slugs[0] : null)
  })), /*#__PURE__*/React.createElement("h2", {
    style: sectionLabel
  }, "rolls/"), /*#__PURE__*/React.createElement(DirListHeader, {
    columns: ['film', 'date', 'roll', 'location', ''],
    cols: "var(--roll-cols)"
  }), /*#__PURE__*/React.createElement("div", null, D.rolls.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.slug,
    onMouseEnter: () => setHovered(r.slug),
    onMouseLeave: () => setHovered(null),
    onClick: e => {
      e.preventDefault();
      go('photos/' + r.slug);
    }
  }, /*#__PURE__*/React.createElement(RollRow, _extends({}, r, {
    active: hovered === r.slug,
    href: '#photos/' + r.slug
  })))))));
}
function RollScreen({
  slug
}) {
  const roll = D.rolls.find(r => r.slug === slug) || D.rolls[0];
  const [lb, setLb] = React.useState(null);
  const frames = D.frames;
  return /*#__PURE__*/React.createElement("article", {
    style: pageStyle
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      marginBottom: 'var(--space-6)',
      paddingBottom: 'var(--space-6)',
      borderBottom: '1px solid var(--color-border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    kind: roll.stockType
  }, roll.stock)), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'var(--font-size-page-title)',
      fontWeight: 'var(--font-weight-bold)',
      marginBottom: 'var(--space-3)'
    }
  }, roll.title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-2)',
      alignItems: 'center',
      color: 'var(--color-text-muted)',
      fontSize: 'var(--font-size-sm)'
    }
  }, /*#__PURE__*/React.createElement("time", {
    style: {
      fontVariantNumeric: 'tabular-nums'
    }
  }, roll.date), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\xB7"), /*#__PURE__*/React.createElement("span", null, roll.location), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\xB7"), /*#__PURE__*/React.createElement("span", {
    style: {
      whiteSpace: 'nowrap'
    }
  }, roll.frames, " frames"))), /*#__PURE__*/React.createElement("h2", {
    style: sectionLabel
  }, "contact-sheet/"), /*#__PURE__*/React.createElement(FilmStrip, {
    photos: frames,
    stockName: roll.stock,
    stockType: roll.stockType,
    startFrame: 1,
    onSelect: setLb
  }), /*#__PURE__*/React.createElement(FilmStrip, {
    photos: frames,
    stockName: roll.stock,
    stockType: roll.stockType,
    startFrame: 7,
    onSelect: setLb
  }), /*#__PURE__*/React.createElement(FilmStrip, {
    photos: frames.slice(0, 4),
    stockName: roll.stock,
    stockType: roll.stockType,
    startFrame: 13,
    onSelect: setLb
  }), /*#__PURE__*/React.createElement(Lightbox, {
    open: lb !== null,
    items: frames,
    index: lb || 0,
    onClose: () => setLb(null),
    onNavigate: d => setLb(v => (v + d + frames.length) % frames.length)
  })));
}
function TravelScreen() {
  // Public view is deliberately reduced: no future or tentative stops, and no dates
  // anywhere. Forward itinerary and exact dates live behind auth in the admin kit.
  const [tab, setTab] = React.useState('route');
  const [trip, setTrip] = React.useState(null);
  const [focus, setFocus] = React.useState(null);
  React.useEffect(() => {
    fetch('../../assets/trips.json').then(r => r.json()).then(setTrip);
  }, []);
  const tabs = ['stats', 'route', 'timeline'];
  const btn = active => ({
    flex: 'none',
    padding: 'var(--space-2) var(--space-3)',
    fontSize: 'var(--font-size-sm)',
    color: active ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
    background: 'var(--color-bg-secondary)',
    border: '1px solid ' + (active ? 'var(--color-accent-primary)' : 'var(--color-border)'),
    boxShadow: active ? 'var(--shadow-hard-accent)' : 'none',
    font: 'inherit',
    cursor: 'pointer'
  });
  const chip = status => ({
    padding: 'var(--space-2) var(--space-3)',
    fontSize: 'var(--font-size-xs)',
    font: 'inherit',
    background: 'var(--color-bg-secondary)',
    cursor: 'pointer',
    flex: 'none',
    whiteSpace: 'nowrap',
    color: status === 'current' ? 'var(--color-accent-tertiary)' : 'var(--color-text-muted)',
    border: '1px solid ' + (status === 'current' ? 'var(--color-accent-tertiary)' : 'var(--color-border)')
  });
  if (!trip) return /*#__PURE__*/React.createElement("div", {
    style: pageStyle
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--color-text-muted)'
    }
  }, "loading journey\u2026")));
  const now = Date.now();
  const all = trip.stops;
  const allStatuses = all.map(st => window.statusOf(st, now));
  // Everything the public page can see: travelled stops plus wherever I am right now.
  const stops = all.filter((st, i) => allStatuses[i] !== 'future' && !st.tentative);
  const statuses = stops.map(st => window.statusOf(st, now));
  const currentIndex = statuses.indexOf('current');
  const current = stops[currentIndex] || stops[stops.length - 1];
  const day = window.dayCount(all[0].arrive, new Date().toISOString().slice(0, 10));
  const countries = new Set(stops.map(st => st.country)).size;
  const years = [...new Set(stops.map(st => st.arrive.slice(0, 4)))];
  return /*#__PURE__*/React.createElement("div", {
    style: pageStyle
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "travel/",
    description: "Places I've been, in order \u2014 no dates, no onward plans."
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      margin: '0 0 var(--space-4)',
      padding: 'var(--space-2) var(--space-3)',
      color: 'var(--color-text-secondary)',
      background: 'var(--color-bg-secondary)',
      border: '1px solid var(--color-border)',
      borderLeft: '3px solid var(--color-accent-primary)',
      fontSize: 'var(--font-size-sm)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "travel-pulse",
    style: {
      width: 7,
      height: 7,
      flex: 'none',
      background: 'var(--color-accent-primary)'
    }
  }), "day ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--color-text-primary)'
    }
  }, day), " \u2014 ", currentIndex >= 0 ? 'in' : 'last seen in', " ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--color-text-primary)'
    }
  }, current.name), ", ", current.country), /*#__PURE__*/React.createElement("nav", {
    role: "tablist",
    style: {
      display: 'flex',
      gap: 'var(--space-2)',
      padding: 'var(--space-2) 0',
      overflowX: 'auto'
    }
  }, tabs.map(x => /*#__PURE__*/React.createElement("button", {
    key: x,
    type: "button",
    role: "tab",
    "aria-selected": tab === x,
    style: btn(tab === x),
    onClick: () => setTab(x)
  }, x, "/"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-6)'
    }
  }, tab === 'stats' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(StatGrid, {
    columns: 3
  }, /*#__PURE__*/React.createElement(Stat, {
    value: day,
    label: "days on the road"
  }), /*#__PURE__*/React.createElement(Stat, {
    value: stops.length,
    label: "stops so far"
  }), /*#__PURE__*/React.createElement(Stat, {
    value: countries,
    label: "countries"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-2) var(--space-4)',
      marginTop: 'var(--space-3)',
      color: 'var(--color-text-muted)',
      fontSize: 'var(--font-size-xs)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      borderBottom: '1px dotted var(--color-border-strong)'
    }
  }, "started in ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--color-text-secondary)'
    }
  }, all[0].name), ", ", all[0].country), /*#__PURE__*/React.createElement("span", {
    style: {
      borderBottom: '1px dotted var(--color-border-strong)'
    }
  }, currentIndex >= 0 ? 'currently in ' : 'last seen in ', /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--color-text-secondary)'
    }
  }, current.name)), /*#__PURE__*/React.createElement("span", {
    style: {
      borderBottom: '1px dotted var(--color-border-strong)'
    }
  }, "heading roughly west \u2014 next stops go up once I'm there"))), tab === 'route' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 var(--space-4)',
      fontSize: 'var(--font-size-xs)',
      color: 'var(--color-text-muted)'
    }
  }, "Where I've been, in order, and where I am now. Onward plans aren't published."), /*#__PURE__*/React.createElement(TravelMap, {
    stops: stops,
    layers: {
      travelled: true,
      planned: false
    },
    focus: focus,
    onFocusHandled: () => setFocus(null)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-4)',
      marginTop: 'var(--space-3)',
      color: 'var(--color-text-muted)',
      fontSize: 'var(--font-size-xs)'
    }
  }, [['been there', 'var(--color-accent-primary)'], ['here now', 'var(--color-accent-tertiary)']].map(([l, c]) => /*#__PURE__*/React.createElement("span", {
    key: l,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-2)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      width: 8,
      height: 8,
      background: c
    }
  }), l))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-2)',
      marginTop: 'var(--space-3)',
      paddingBottom: 'var(--space-2)',
      overflowX: 'auto'
    }
  }, stops.map((st, i) => /*#__PURE__*/React.createElement("button", {
    key: st.name + i,
    type: "button",
    style: chip(statuses[i]),
    onClick: () => setFocus(i)
  }, st.name)))), tab === 'timeline' && /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid var(--color-border)'
    }
  }, years.map(year => /*#__PURE__*/React.createElement("div", {
    key: year
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-3) 0 var(--space-2)',
      color: 'var(--color-accent-primary)',
      fontSize: 'var(--font-size-xs)',
      letterSpacing: '0.12em'
    }
  }, year), stops.map((st, i) => st.arrive.slice(0, 4) === year ? /*#__PURE__*/React.createElement("div", {
    key: st.name + i,
    style: {
      display: 'grid',
      gridTemplateColumns: '10rem 1fr',
      borderTop: '1px solid var(--color-border)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      padding: 'var(--space-3)',
      background: 'var(--color-bg-secondary)',
      color: 'var(--color-text-muted)',
      borderRight: '3px solid ' + (statuses[i] === 'current' ? 'var(--color-accent-tertiary)' : 'var(--color-accent-primary)'),
      fontSize: 'var(--font-size-xs)',
      textAlign: 'right'
    }
  }, st.country), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-3)',
      background: 'var(--color-bg-secondary)'
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--color-text-primary)'
    }
  }, st.name), statuses[i] === 'current' && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'var(--space-2)',
      color: 'var(--color-accent-tertiary)',
      fontSize: 'var(--font-size-xs)'
    }
  }, "here now"))) : null))), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 'var(--space-4) 0 0',
      color: 'var(--color-text-muted)',
      fontSize: 'var(--font-size-xs)'
    }
  }, "// no dates published \u2014 places appear once I've left them")))));
}
function AboutScreen() {
  return /*#__PURE__*/React.createElement("section", {
    style: pageStyle
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "about.md"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-narrow)',
      border: '1px solid var(--color-border)',
      background: 'var(--color-bg-secondary)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-6)'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      lineHeight: 'var(--line-height-relaxed)',
      color: 'var(--color-text-secondary)',
      marginBottom: 'var(--space-4)'
    }
  }, "My name is ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--color-accent-primary)',
      fontWeight: 'var(--font-weight-medium)'
    }
  }, "beek"), ". I'm a creative and tech guy based in Australia. I enjoy messing around with technical projects and creating art, sometimes the two intersect."), /*#__PURE__*/React.createElement("p", {
    style: {
      lineHeight: 'var(--line-height-relaxed)',
      color: 'var(--color-text-secondary)',
      margin: 0
    }
  }, "Links: ", /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "github"), ", ", /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "instagram"))))));
}
function NotFoundScreen() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      padding: 'var(--space-16) 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 480
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: '5rem',
      fontWeight: 'var(--font-weight-bold)',
      color: 'var(--color-accent-primary)',
      lineHeight: 1,
      marginBottom: 'var(--space-3)'
    }
  }, "404"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--font-size-lg)',
      color: 'var(--color-text-primary)',
      marginBottom: 'var(--space-2)'
    }
  }, "file not found"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--color-text-secondary)',
      fontSize: 'var(--font-size-sm)',
      marginBottom: 'var(--space-6)'
    }
  }, "The page you're looking for doesn't exist. Maybe you imagined it?"), /*#__PURE__*/React.createElement(Button, {
    variant: "quiet",
    href: "#"
  }, "> home"))));
}
Object.assign(window, {
  HomeScreen,
  WorkScreen,
  WorkDetailScreen,
  PhotosScreen,
  RollScreen,
  TravelScreen,
  AboutScreen,
  NotFoundScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/public-site/Screens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/public-site/TravelMap.jsx
try { (() => {
// Real Leaflet route map for /travel/ — CARTO tiles, square themed chrome.
// Mirrors src/scripts/travel-client.js: solid line = travelled, dashed = planned,
// markers coloured green (been) / cyan (here now) / amber (planned). Day counts and
// past/current/upcoming status are computed in the browser on every load, never baked in.

const CARTO = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
};
const ATTR = '© OpenStreetMap contributors, © CARTO';
function statusOf(stop, now) {
  const arrive = new Date(stop.arrive + 'T00:00:00Z').getTime();
  const depart = new Date(stop.depart + 'T00:00:00Z').getTime();
  if (depart < now) return 'past';
  if (arrive <= now) return 'current';
  return 'future';
}
function colorFor(status) {
  const css = getComputedStyle(document.documentElement);
  if (status === 'current') return css.getPropertyValue('--color-accent-tertiary').trim() || '#66ccff';
  if (status === 'future') return css.getPropertyValue('--color-accent-secondary').trim() || '#ffaa00';
  return css.getPropertyValue('--color-accent-primary').trim() || '#33ff66';
}
function dayCount(a, b) {
  return Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000));
}
function TravelMap({
  stops,
  layers,
  focus,
  onFocusHandled,
  detail = false
}) {
  const hostRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const markersRef = React.useRef([]);
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  const now = Date.now();
  React.useEffect(() => {
    if (!hostRef.current || typeof L === 'undefined') return;
    // Leaflet is recreated after the panel becomes visible so it always gets real dimensions.
    const map = L.map(hostRef.current, {
      worldCopyJump: true,
      attributionControl: true
    }).setView([25, 60], 2);
    L.tileLayer(CARTO[theme] || CARTO.dark, {
      attribution: ATTR,
      subdomains: 'abcd',
      maxZoom: 18
    }).addTo(map);
    mapRef.current = map;
    const t = setTimeout(() => map.invalidateSize(), 60);
    return () => {
      clearTimeout(t);
      map.remove();
      mapRef.current = null;
    };
  }, [theme]);
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || typeof L === 'undefined') return;
    markersRef.current.forEach(l => map.removeLayer(l));
    markersRef.current = [];
    const travelled = [];
    const planned = [];
    stops.forEach((stop, i) => {
      const status = statusOf(stop, now);
      const point = [stop.lat, stop.lon];
      if (status === 'future') planned.push(point);else travelled.push(point);
      if (status === 'current') planned.unshift(point);
      const show = status === 'future' && layers.planned || status !== 'future' && layers.travelled;
      if (!show) return;
      const marker = L.circleMarker(point, {
        radius: status === 'current' ? 7 : 4,
        color: colorFor(status),
        weight: status === 'current' ? 3 : 2,
        fillColor: colorFor(status),
        fillOpacity: status === 'past' ? 0.9 : 0.35
      }).addTo(map);
      const cls = status === 'current' ? 'popup-current' : status === 'future' ? 'popup-future' : 'popup-muted';
      // Public map shows place only — no dates, no day counts. `detail` is opt-in
      // and only the authenticated admin itinerary view passes it.
      marker.bindPopup('<b>' + stop.name + '</b><br>' + '<span class="' + cls + '">' + stop.country + (status === 'current' ? ' · here now' : '') + '</span>' + (detail ? '<br><span class="popup-muted">' + stop.arrive + ' → ' + stop.depart + ' · ' + dayCount(stop.arrive, stop.depart) + ' days</span>' : '') + (detail && stop.note ? '<p class="travel-popup-note">' + stop.note + '</p>' : '') + (detail && stop.tentative ? '<p class="travel-popup-note">tentative</p>' : ''));
      marker._stopIndex = i;
      markersRef.current.push(marker);
    });
    if (layers.travelled && travelled.length > 1) {
      markersRef.current.push(L.polyline(travelled, {
        color: colorFor('past'),
        weight: 2,
        opacity: 0.85
      }).addTo(map));
    }
    if (layers.planned && planned.length > 1) {
      markersRef.current.push(L.polyline(planned, {
        color: colorFor('future'),
        weight: 2,
        opacity: 0.8,
        dashArray: '5 6'
      }).addTo(map));
    }
  }, [stops, layers.travelled, layers.planned, theme, detail]);
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || focus === null || focus === undefined) return;
    const stop = stops[focus];
    if (!stop) return;
    map.flyTo([stop.lat, stop.lon], 6, {
      duration: 0.6
    });
    const marker = markersRef.current.find(m => m._stopIndex === focus);
    if (marker) marker.openPopup();
    onFocusHandled && onFocusHandled();
  }, [focus]);
  return /*#__PURE__*/React.createElement("div", {
    ref: hostRef,
    className: "travel-map",
    role: "region",
    "aria-label": "Interactive map of the journey",
    tabIndex: 0,
    style: {
      height: 'min(62vh, 540px)',
      minHeight: 360,
      border: '1px solid var(--color-border-strong)',
      background: 'var(--color-bg-secondary)',
      boxShadow: 'var(--shadow-hard)',
      zIndex: 0
    }
  });
}
Object.assign(window, {
  TravelMap,
  statusOf,
  dayCount
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/public-site/TravelMap.jsx", error: String((e && e.message) || e) }); }

// ui_kits/public-site/kit-data.js
try { (() => {
// Content lifted from bjsmith.xyz's own collections (src/content/**) so the kit
// reads like the real site. Abbreviated: a few rows stand in for the full set.
window.KIT_DATA = {
  work: [{
    slug: 'loot-sheet',
    category: 'dev',
    date: '2024-11-02',
    title: 'Loot Sheet',
    description: 'a sheet, for loot',
    tags: ['svelte', 'dnd', 'tools'],
    cover: '../../assets/artwork/loot_sheet.png'
  }, {
    slug: 'planguage',
    category: 'dev',
    date: '2024-06-18',
    title: 'Planguage',
    description: 'planning, in language',
    tags: ['typescript', 'tools']
  }, {
    slug: 'dudes',
    category: 'art',
    date: '2025-01-01',
    title: 'Dudes',
    description: 'Just dudes being guys tbh',
    tags: ['illustration', 'watercolour', 'acrylics'],
    cover: '../../assets/artwork/3blokes.png',
    body: ['Watercolours and acrylics on paper.', 'Painted most of these in sets/pairs at various times over the last year.'],
    images: ['../../assets/artwork/3blokes.png', '../../assets/artwork/anotherday.png', '../../assets/artwork/frog.png', '../../assets/artwork/littlefella.png']
  }, {
    slug: 'mspaint',
    category: 'art',
    date: '2019-01-31',
    title: 'MS Paint',
    description: 'paint.exe',
    tags: ['illustration', 'digital', 'mspaint'],
    cover: '../../assets/artwork/hakimashita.png',
    body: ['About a decade ago I was working in a job where I had considerable downtime in front of a computer. Naturally, I decided that the best way to spend my time was to draw things in MS Paint.'],
    images: ['../../assets/artwork/hakimashita.png', '../../assets/artwork/licklick.png', '../../assets/artwork/mcp.png', '../../assets/artwork/fire.png']
  }, {
    slug: 'another-day',
    category: 'art',
    date: '2024-09-14',
    title: 'Another Day',
    description: 'sun comes up, sun goes down',
    tags: ['illustration']
  }, {
    slug: 'one-star-maccas',
    category: 'photography',
    date: '2023-03-02',
    title: 'One Star Maccas',
    description: 'the worst golden arches in the country',
    tags: ['digital']
  }],
  rolls: [{
    slug: '2025-08-fujifilm-400-almaty',
    stock: 'Fujifilm 400',
    stockType: 'color',
    date: '2025-08-24',
    title: 'Almaty',
    location: 'Almaty',
    region: 'Kazakhstan',
    frames: 18
  }, {
    slug: '2025-08-kodak-colorplus-200-bishkek-song-kol',
    stock: 'Kodak ColorPlus 200',
    stockType: 'color',
    date: '2025-08-11',
    title: 'Bishkek → Song Köl',
    location: 'Bishkek +2',
    region: 'Kyrgyzstan',
    frames: 24
  }, {
    slug: '2025-07-kodak-tri-x-400-chiang-mai',
    stock: 'Kodak Tri-X 400',
    stockType: 'bw',
    date: '2025-07-11',
    title: 'Chiang Mai',
    location: 'Chiang Mai',
    region: 'Thailand',
    frames: 12
  }, {
    slug: '2025-07-kodak-ultramax-400-ha-giang-sapa-kunming',
    stock: 'Kodak Ultramax 400',
    stockType: 'color',
    date: '2025-07-29',
    title: 'Ha Giang → Sapa → Kunming',
    location: 'Ha Giang +2',
    region: 'Vietnam',
    frames: 36
  }, {
    slug: '2025-09-lucky-200-charyn-canyon',
    stock: 'Lucky 200',
    stockType: 'color',
    date: '2025-09-06',
    title: 'Charyn Canyon',
    location: 'Charyn Canyon',
    region: 'Kazakhstan',
    frames: 9
  }],
  pins: [{
    label: 'Kazakhstan',
    lat: 48.1012954,
    lng: 66.7780818,
    count: 27,
    members: ['Almaty', 'Charyn Canyon'],
    slug: '2025-08-fujifilm-400-almaty',
    slugs: ['2025-08-fujifilm-400-almaty', '2025-09-lucky-200-charyn-canyon']
  }, {
    label: 'Kyrgyzstan',
    lat: 41.5089324,
    lng: 74.724091,
    count: 24,
    members: ['Bishkek', 'Song Köl'],
    slug: '2025-08-kodak-colorplus-200-bishkek-song-kol',
    slugs: ['2025-08-kodak-colorplus-200-bishkek-song-kol']
  }, {
    label: 'Thailand',
    lat: 14.8971921,
    lng: 100.83273,
    count: 12,
    members: ['Chiang Mai'],
    slug: '2025-07-kodak-tri-x-400-chiang-mai',
    slugs: ['2025-07-kodak-tri-x-400-chiang-mai']
  }, {
    label: 'Vietnam',
    lat: 14.0583,
    lng: 108.2772,
    count: 36,
    members: ['Ha Giang', 'Sapa'],
    slug: '2025-07-kodak-ultramax-400-ha-giang-sapa-kunming',
    slugs: ['2025-07-kodak-ultramax-400-ha-giang-sapa-kunming']
  }],
  frames: [1, 2, 3, 4, 5, 6].map(n => ({
    src: '../../assets/photos/almaty-00' + n + '.jpg',
    alt: 'Almaty, frame ' + n,
    caption: 'Almaty',
    meta: 'FUJIFILM 400 · ' + n + 'A · 08 25 · ALMATY'
  })),
  trip: {
    title: 'travel/',
    subtitle: 'A long way east, mostly overland, on film.',
    stats: [['184', 'days on the road'], ['27', 'stops'], ['9', 'countries']],
    timeline: [{
      date: '2025-07-04',
      place: 'Chiang Mai',
      note: 'Thailand',
      kind: 'past'
    }, {
      date: '2025-07-22',
      place: 'Ha Noi',
      note: 'Vietnam',
      kind: 'past'
    }, {
      date: '2025-08-11',
      place: 'Bishkek',
      note: 'Kyrgyzstan',
      kind: 'past'
    }, {
      date: '2025-08-24',
      place: 'Almaty',
      note: 'Kazakhstan',
      kind: 'current'
    }, {
      date: '2025-09-14',
      place: 'Samarkand',
      note: 'Uzbekistan',
      kind: 'future'
    }]
  }
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/public-site/kit-data.js", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.PageHeader = __ds_scope.PageHeader;

__ds_ns.Panel = __ds_scope.Panel;

__ds_ns.Stat = __ds_scope.Stat;

__ds_ns.StatGrid = __ds_scope.StatGrid;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.DirListHeader = __ds_scope.DirListHeader;

__ds_ns.DirRow = __ds_scope.DirRow;

__ds_ns.FilterBar = __ds_scope.FilterBar;

__ds_ns.RollRow = __ds_scope.RollRow;

__ds_ns.WorkRow = __ds_scope.WorkRow;

__ds_ns.FilmStrip = __ds_scope.FilmStrip;

__ds_ns.Lightbox = __ds_scope.Lightbox;

__ds_ns.WorldMap = __ds_scope.WorldMap;

__ds_ns.Breadcrumb = __ds_scope.Breadcrumb;

__ds_ns.Footer = __ds_scope.Footer;

__ds_ns.SiteTree = __ds_scope.SiteTree;

})();
