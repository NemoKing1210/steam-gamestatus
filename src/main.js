import { GM_registerMenuCommand } from '$';
import './styles/app.css';
import {
  MUTATION_OBSERVER_OPTIONS,
  SCAN_DEBOUNCE_MS,
} from './core/constants.js';
import { loadMemoryCache, persistCacheNow } from './core/cache.js';
import { applyBadgeAppearance, getSettings } from './core/settings.js';
import {
  collectRelevantMutations,
  setMutationObserver,
} from './features/cards/index.js';
import { pageFeatures } from './features/index.js';
import {
  ensureSettingsButton,
  observeHeader,
  togglePanel,
} from './features/settings/index.js';
import { configureLocale, t } from './i18n/index.js';

let mutationObserver = null;
let hasInitialScan = false;
/** @type {Element[]} */
const pendingScanNodes = [];
let scanTimer = null;

function debounce(fn, delay) {
  return (...args) => {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(() => fn(...args), delay);
  };
}

function runScan() {
  const nodes = pendingScanNodes.splice(0, pendingScanNodes.length);
  if (!hasInitialScan) {
    hasInitialScan = true;
    nodes.length = 0;
  }
  for (const feature of pageFeatures) {
    feature.scan(nodes);
  }
}

const scheduleScan = debounce(runScan, SCAN_DEBOUNCE_MS);


function init() {
  configureLocale(getSettings().language ?? 'auto');
  applyBadgeAppearance();
  loadMemoryCache();
  window.addEventListener('pagehide', persistCacheNow);
  void ensureSettingsButton();
  observeHeader();
  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand(t('menuSettings'), () => {
      void ensureSettingsButton().then(() => togglePanel(true));
    });
  }
  scheduleScan();

  // collectRelevantMutations() already drops our own UI
  // (#gs-panel-overlay, #gs-settings-btn, .gs-steam-badge__tooltip), so
  // self-mutations rescan as a no-op here.
  mutationObserver = new MutationObserver((mutations) => {
    const nodes = collectRelevantMutations(mutations);
    if (!nodes.length) return;
    pendingScanNodes.push(...nodes);
    scheduleScan();
  });
  setMutationObserver(mutationObserver);

  mutationObserver.observe(document.body, MUTATION_OBSERVER_OPTIONS);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
