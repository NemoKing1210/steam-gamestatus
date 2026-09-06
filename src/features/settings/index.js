import { AUTHOR_URL, CACHE_HOURS_MAX, DEFAULT_SETTINGS, REPO_URL, SCRIPT_VERSION } from '../../core/constants.js';
import {
  getSettings,
  saveSettings,
  normalizeBadgeHorizontal,
  normalizeBadgeSize,
  normalizeBadgeVertical,
  normalizeCacheHours,
  normalizeLanguage,
  setSettingsChangeListener,
} from '../../core/settings.js';
import { clearGameCache, removeGameCacheEntry } from '../../core/cache.js';
import { escapeAttr, escapeHtml } from '../../utils/html.js';
import { configureLocale, t } from '../../i18n/index.js';
import { LOCALE_NATIVE_NAMES, SUPPORTED_LOCALES } from '../../i18n/meta.js';

import { paintCachePane } from './cache-pane.js';
function buildLanguageOptions() {
  const auto = `<option value="auto">${escapeHtml(t('langAuto'))}</option>`;
  return auto + SUPPORTED_LOCALES.map((locale) =>
    `<option value="${locale}">${escapeHtml(LOCALE_NATIVE_NAMES[locale] || locale)}</option>`
  ).join('');
}

let panelOpen = false;

function observeHeader() {
  const observer = new MutationObserver(() => {
    const existing = document.getElementById('gs-settings-btn');
    const menu = getAccountMenuBody();
    // Upgrade header fallback → account menu once dropdown appears (logged-in)
    if (existing?.classList.contains('gs-header-btn') && menu) {
      existing.remove();
      ensureSettingsButton();
      return;
    }
    if (!existing) {
      ensureSettingsButton();
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

function waitForElement(selector, timeout = 15000) {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      resolve(document.querySelector(selector));
    }, timeout);
  });
}

function getAccountMenuBody() {
  return document.querySelector('#account_dropdown .popup_body.popup_menu');
}

function hideAccountDropdown() {
  if (typeof window.HideMenu === 'function') {
    try {
      window.HideMenu('account_pulldown', 'account_dropdown');
      return;
    } catch {
      /* fall through */
    }
  }
  const dropdown = document.getElementById('account_dropdown');
  if (dropdown) {
    dropdown.style.display = 'none';
    dropdown.style.visibility = 'hidden';
  }
}

function onSettingsTriggerClick(e) {
  e.preventDefault();
  e.stopPropagation();
  hideAccountDropdown();
  togglePanel();
}

function injectAccountMenuItem(menu) {
  if (document.getElementById('gs-settings-btn')) {
    return document.getElementById('gs-settings-btn');
  }

  const item = document.createElement('a');
  item.id = 'gs-settings-btn';
  item.className = 'popup_menu_item gs-menu-item';
  item.href = '#';
  item.title = t('btnTitle');
  item.textContent = t('btnText');
  item.addEventListener('click', onSettingsTriggerClick);
  menu.appendChild(item);

  ensurePanel();
  return item;
}

function injectHeaderFallback(host) {
  if (!host || document.getElementById('gs-settings-btn')) {
    updateSettingsButtonState();
    return document.getElementById('gs-settings-btn');
  }

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'gs-settings-btn';
  btn.className = 'gs-header-btn';
  btn.title = t('btnTitle');
  btn.innerHTML = `
    <span class="gs-header-btn__text">${escapeHtml(t('btnText'))}</span>
    <span class="gs-header-btn__dot" id="gs-settings-dot"></span>
  `;
  btn.addEventListener('click', onSettingsTriggerClick);

  const srbbBtn = host.querySelector('#srbb-settings-btn');
  const sihBtn = host.querySelector('.sih-features-button');
  if (srbbBtn) host.insertBefore(btn, srbbBtn.nextSibling);
  else if (sihBtn) host.insertBefore(btn, sihBtn);
  else host.insertBefore(btn, host.firstChild);

  ensurePanel();
  updateSettingsButtonState();
  return btn;
}

export async function ensureSettingsButton() {
  await waitForElement('#global_actions', 20000);
  if (document.getElementById('gs-settings-btn')) {
    updateSettingsButtonState();
    return document.getElementById('gs-settings-btn');
  }

  const menu = getAccountMenuBody();
  if (menu) return injectAccountMenuItem(menu);

  // Logged-out store header has no account dropdown — keep a compact header control
  return injectHeaderFallback(document.querySelector('#global_actions'));
}

function updateSettingsButtonState() {
  const dot = document.getElementById('gs-settings-dot');
  const settings = getSettings();
  const customized =
    settings.cacheHours !== DEFAULT_SETTINGS.cacheHours ||
    settings.badgeVertical !== DEFAULT_SETTINGS.badgeVertical ||
    settings.badgeHorizontal !== DEFAULT_SETTINGS.badgeHorizontal ||
    settings.badgeSize !== DEFAULT_SETTINGS.badgeSize ||
    settings.showMissingBadge !== DEFAULT_SETTINGS.showMissingBadge ||
    settings.language !== DEFAULT_SETTINGS.language;
  if (dot) {
    dot.classList.toggle('is-on', customized);
    dot.title = customized ? t('on') : t('off');
  }
}

function ensurePanel() {
  if (document.getElementById('gs-panel-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'gs-panel-overlay';
  overlay.className = 'gs-panel-overlay';
  overlay.hidden = true;
  overlay.setAttribute('role', 'presentation');

  const panel = document.createElement('div');
  panel.id = 'gs-panel';
  panel.className = 'gs-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', t('panelTitle'));
  panel.innerHTML = `
    <div class="gs-panel__header">
      <div>
        <div class="gs-panel__title-row">
          <div class="gs-panel__title">${escapeHtml(t('panelTitle'))}</div>
          <span class="gs-panel__version">v${escapeHtml(SCRIPT_VERSION)}</span>
        </div>
        <div class="gs-panel__subtitle">${escapeHtml(t('panelSubtitle'))}</div>
      </div>
      <button type="button" class="gs-panel__close" data-gs="close" aria-label="${escapeHtml(t('close'))}">×</button>
    </div>

    <div class="gs-panel__tabs" role="tablist">
      <button type="button" class="gs-panel__tab is-active" role="tab" data-gs-tab="general" aria-selected="true">${escapeHtml(t('tabGeneral'))}</button>
      <button type="button" class="gs-panel__tab" role="tab" data-gs-tab="cache" aria-selected="false">${escapeHtml(t('sectionCache'))}<span class="gs-panel__tab-badge" data-gs-cache-tab-badge></span></button>
      <button type="button" class="gs-panel__tab" role="tab" data-gs-tab="about" aria-selected="false">${escapeHtml(t('tabAbout'))}</button>
    </div>

    <div class="gs-panel__body">
      <div class="gs-panel__tabpane" data-gs-pane="general" role="tabpanel">
      <div class="gs-panel__section">
        <label class="gs-field">
          <span class="gs-field__label">${escapeHtml(t('language'))}</span>
          <select id="gs-language">
            ${buildLanguageOptions()}
          </select>
        </label>
        <p class="gs-hint">${escapeHtml(t('languageHint'))}</p>
      </div>
      <div class="gs-panel__section">
        <div class="gs-panel__section-title">${escapeHtml(t('sectionBadge'))}</div>
        <div class="gs-field">
          <span class="gs-field__label">${escapeHtml(t('badgePosition'))}</span>
          <div class="gs-grid">
            <label class="gs-field">
              <span class="gs-field__label">${escapeHtml(t('badgeVertical'))}</span>
              <select id="gs-badge-vertical">
                <option value="top">${escapeHtml(t('posTop'))}</option>
                <option value="bottom">${escapeHtml(t('posBottom'))}</option>
              </select>
            </label>
            <label class="gs-field">
              <span class="gs-field__label">${escapeHtml(t('badgeHorizontal'))}</span>
              <select id="gs-badge-horizontal">
                <option value="left">${escapeHtml(t('posLeft'))}</option>
                <option value="right">${escapeHtml(t('posRight'))}</option>
              </select>
            </label>
          </div>
        </div>
        <p class="gs-hint">${escapeHtml(t('badgePositionHint'))}</p>
        <label class="gs-field">
          <span class="gs-field__label">${escapeHtml(t('badgeSize'))}</span>
          <select id="gs-badge-size">
            <option value="small">${escapeHtml(t('sizeSmall'))}</option>
            <option value="medium">${escapeHtml(t('sizeMedium'))}</option>
            <option value="large">${escapeHtml(t('sizeLarge'))}</option>
            <option value="xlarge">${escapeHtml(t('sizeXLarge'))}</option>
          </select>
        </label>
        <p class="gs-hint">${escapeHtml(t('badgeSizeHint'))}</p>
      </div>

      <div class="gs-panel__section gs-panel__section--row">
        <label class="gs-switch">
          <input type="checkbox" id="gs-show-missing" />
          <span class="gs-switch__track"></span>
          <span class="gs-switch__label">${escapeHtml(t('showMissing'))}</span>
        </label>
        <span class="gs-pill" id="gs-show-missing-pill">${escapeHtml(t('off'))}</span>
      </div>
      <div class="gs-panel__section" style="padding-top:0">
        <p class="gs-hint" style="margin-top:0">${escapeHtml(t('showMissingHint'))}</p>
      </div>

      </div>
      <div class="gs-panel__tabpane" data-gs-pane="cache" role="tabpanel" hidden>

      <div class="gs-panel__section">
        <div class="gs-panel__section-title">${escapeHtml(t('cacheUsage'))}</div>
        <div data-gs-cache-meter></div>
      </div>
      <div class="gs-panel__section">
        <div class="gs-panel__section-title">${escapeHtml(t('sectionCache'))}</div>
        <label class="gs-field">
          <span class="gs-field__label">${escapeHtml(t('cacheHours'))}</span>
          <input type="number" id="gs-cache-hours" min="0" max="${CACHE_HOURS_MAX}" step="1" placeholder="6" inputmode="numeric" />
        </label>
        <p class="gs-hint">${escapeHtml(t('cacheHoursHint'))}</p>
      </div>
      <div class="gs-panel__section">
        <div class="gs-cache-collapser">
          <button type="button" class="gs-cache-collapser__toggle" data-gs="cache-list-toggle" aria-expanded="false">
            <span class="gs-cache-collapser__chevron" aria-hidden="true">▸</span>
            <span>${escapeHtml(t('cacheContents'))}</span>
            <span class="gs-cache-collapser__count" data-gs-cache-list-count></span>
          </button>
          <div data-gs-cache-list hidden></div>
        </div>
      </div>
      <div class="gs-panel__section">
        <div class="gs-cache-row">
          <button type="button" class="gs-btn gs-btn--danger" data-gs="clear-cache">${escapeHtml(t('clearCache'))}</button>
        </div>
        <p class="gs-hint">${escapeHtml(t('cacheClearHint'))}</p>
        <p class="gs-cache-status" id="gs-cache-status" aria-live="polite"></p>
      </div>
      </div>

      <div class="gs-panel__tabpane" data-gs-pane="about" role="tabpanel" hidden>
        <div class="gs-about">
          <div class="gs-about__hero">
            <div class="gs-about__name">${escapeHtml(t('panelTitle'))}</div>
            <span class="gs-panel__version">v${escapeHtml(SCRIPT_VERSION)}</span>
          </div>
          <p class="gs-about__blurb">${escapeHtml(t('aboutBlurb'))}</p>
          <a class="gs-about__author" href="${AUTHOR_URL}" target="_blank" rel="noopener noreferrer">
            <span class="gs-about__author-meta">
              <span class="gs-about__author-name">NemoKing1210</span>
              <span class="gs-about__author-sub">github.com/NemoKing1210</span>
            </span>
          </a>
          <div class="gs-about__actions">
            <a class="gs-btn gs-btn--ghost" href="${REPO_URL}" target="_blank" rel="noopener noreferrer">${escapeHtml(t('repoLink'))}</a>
          </div>
          <p class="gs-hint">${escapeHtml(t('repoAbout'))}</p>
        </div>
      </div>
    </div>

    <div class="gs-panel__footer">
      <div class="gs-panel__footer-actions">
        <button type="button" class="gs-btn gs-btn--ghost" data-gs="close">${escapeHtml(t('cancel'))}</button>
        <button type="button" class="gs-btn" data-gs="save">${escapeHtml(t('save'))}</button>
        <button type="button" class="gs-btn gs-btn--green" data-gs="save-run">${escapeHtml(t('saveReload'))}</button>
      </div>
    </div>
  `;
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) togglePanel(false);
  });
  panel.querySelectorAll('[data-gs-tab]').forEach((tab) => {
    tab.addEventListener('click', () => switchPanelTab(tab.getAttribute('data-gs-tab')));
  });
  panel.querySelectorAll('[data-gs="close"]').forEach((el) =>
    el.addEventListener('click', () => togglePanel(false))
  );
  panel.querySelector('[data-gs="save"]').addEventListener('click', () => {
    persistPanelForm();
    togglePanel(false);
  });
  panel.querySelector('[data-gs="save-run"]').addEventListener('click', () => {
    persistPanelForm();
    togglePanel(false);
    location.reload();
  });
  panel.querySelector('[data-gs="clear-cache"]').addEventListener('click', () => {
    const count = clearGameCache();
    const status = panel.querySelector('#gs-cache-status');
    if (status) {
      status.textContent =
        count > 0 ? t('cacheCleared', { count }) : t('cacheEmpty');
    }
    paintCachePane();
  });
  panel.addEventListener('click', (e) => {
    const listToggle = e.target.closest?.('[data-gs="cache-list-toggle"]');
    if (listToggle) {
      e.preventDefault();
      const expanded = listToggle.getAttribute('aria-expanded') === 'true';
      listToggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      const list = panel.querySelector('[data-gs-cache-list]');
      if (list) list.hidden = expanded;
      return;
    }
    const removeBtn = e.target.closest?.('[data-gs="cache-remove"]');
    if (!removeBtn) return;
    e.preventDefault();
    const appId = removeBtn.getAttribute('data-gs-app-id');
    if (appId && removeGameCacheEntry(appId)) {
      paintCachePane();
      const status = panel.querySelector('#gs-cache-status');
      if (status) status.textContent = t('cacheCleared', { count: 1 });
    }
  });

  const missingToggle = panel.querySelector('#gs-show-missing');
  missingToggle.addEventListener('change', () => syncMissingPill());
  panel.querySelector('#gs-language').addEventListener('change', () => {
    const language = normalizeLanguage(panel.querySelector('#gs-language').value);
    saveSettings({ language });
    configureLocale(language);
    fillPanelForm();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panelOpen) togglePanel(false);
  });
}

function syncMissingPill() {
  const panel = document.getElementById('gs-panel');
  if (!panel) return;
  const on = panel.querySelector('#gs-show-missing').checked;
  const pill = panel.querySelector('#gs-show-missing-pill');
  pill.textContent = on ? t('on') : t('off');
  pill.classList.toggle('is-on', on);
}

function fillPanelForm() {
  const panel = document.getElementById('gs-panel');
  if (!panel) return;
  const settings = getSettings();
  panel.querySelector('#gs-badge-vertical').value = normalizeBadgeVertical(settings.badgeVertical);
  panel.querySelector('#gs-badge-horizontal').value = normalizeBadgeHorizontal(settings.badgeHorizontal);
  panel.querySelector('#gs-badge-size').value = normalizeBadgeSize(settings.badgeSize);
  panel.querySelector('#gs-show-missing').checked = settings.showMissingBadge !== false;
  panel.querySelector('#gs-cache-hours').value = String(normalizeCacheHours(settings.cacheHours));
  panel.querySelector('#gs-language').value = normalizeLanguage(settings.language);
  const status = panel.querySelector('#gs-cache-status');
  if (status) status.textContent = '';
  syncMissingPill();
  paintCachePane();
}

function persistPanelForm() {
  const panel = document.getElementById('gs-panel');
  if (!panel) return;
  saveSettings({
    badgeVertical: panel.querySelector('#gs-badge-vertical').value,
    badgeHorizontal: panel.querySelector('#gs-badge-horizontal').value,
    badgeSize: panel.querySelector('#gs-badge-size').value,
    showMissingBadge: panel.querySelector('#gs-show-missing').checked,
    cacheHours: normalizeCacheHours(panel.querySelector('#gs-cache-hours').value),
    language: panel.querySelector('#gs-language').value,
  });
  // Header-dot refresh arrives via the setSettingsChangeListener registration
  // below (monolith saveSettings() did it internally; core cannot import features).
}

export function switchPanelTab(tabId) {
  const panel = document.getElementById('gs-panel');
  if (!panel || !tabId) return;
  panel.querySelectorAll('[data-gs-tab]').forEach((tab) => {
    const active = tab.getAttribute('data-gs-tab') === tabId;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  panel.querySelectorAll('[data-gs-pane]').forEach((pane) => {
    pane.hidden = pane.getAttribute('data-gs-pane') !== tabId;
  });
}

export function togglePanel(force) {
  ensurePanel();
  const overlay = document.getElementById('gs-panel-overlay');
  if (!overlay) return;

  panelOpen = typeof force === 'boolean' ? force : !panelOpen;
  overlay.hidden = !panelOpen;
  document.getElementById('gs-settings-btn')?.classList.toggle('is-open', panelOpen);
  setBodyScrollLocked(panelOpen);

  if (panelOpen) {
    fillPanelForm();
  }
}

/** @type {{ y: number, pad: string } | null} */
let scrollLockState = null;

function isEventInsidePanelScroller(target) {
  const panelBody = document.querySelector('#gs-panel .gs-panel__body');
  return !!(panelBody && target instanceof Node && panelBody.contains(target));
}

function onModalScrollGuard(e) {
  if (!panelOpen) return;
  if (isEventInsidePanelScroller(e.target)) return;
  e.preventDefault();
}

function setBodyScrollLocked(locked) {
  const root = document.documentElement;
  const body = document.body;

  if (locked) {
    if (scrollLockState) return;
    const y = window.scrollY || root.scrollTop || body.scrollTop || 0;
    const pad = Math.max(0, window.innerWidth - root.clientWidth);
    scrollLockState = { y, pad: body.style.paddingRight };
    root.classList.add('gs-modal-open');
    body.style.paddingRight = pad ? `${pad}px` : scrollLockState.pad;
    body.style.top = `-${y}px`;
    document.addEventListener('wheel', onModalScrollGuard, { passive: false, capture: true });
    document.addEventListener('touchmove', onModalScrollGuard, { passive: false, capture: true });
    return;
  }

  if (!scrollLockState) {
    root.classList.remove('gs-modal-open');
    return;
  }

  const { y, pad } = scrollLockState;
  scrollLockState = null;
  document.removeEventListener('wheel', onModalScrollGuard, { capture: true });
  document.removeEventListener('touchmove', onModalScrollGuard, { capture: true });
  root.classList.remove('gs-modal-open');
  body.style.top = '';
  body.style.paddingRight = pad;
  window.scrollTo(0, y);
}

setSettingsChangeListener(updateSettingsButtonState);
export function openSettings() {
  return ensureSettingsButton().then(() => togglePanel(true));
}

export { observeHeader };
