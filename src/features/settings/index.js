import { AUTHOR_URL, CACHE_HOURS_MAX, DEFAULT_SETTINGS, REPO_URL, SCRIPT_VERSION } from '../../core/constants.js';
import {
  getSettings,
  saveSettings,
  resetSettings,
  normalizeBadgeHorizontal,
  normalizeBadgeSize,
  normalizeBadgeVertical,
  normalizeCacheHours,
  normalizeCardDisplay,
  normalizeCardPosition,
  normalizeDisplayKey,
  normalizeLanguage,
  setSettingsChangeListener,
} from '../../core/settings.js';
import { dismissTooltip } from '../badge/index.js';
import { refreshCardsForDisplayMode } from '../cards/index.js';
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
  item.innerHTML = `<span>${escapeHtml(t('settingsWord'))} ${escapeHtml(t('btnText'))}</span>`;
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
    <span class="gs-header-btn__text">${escapeHtml(t('settingsWord'))} · ${escapeHtml(t('btnText'))}</span>
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
    settings.cardDisplay !== DEFAULT_SETTINGS.cardDisplay ||
    settings.cardPosition !== DEFAULT_SETTINGS.cardPosition ||
    settings.displayKey !== DEFAULT_SETTINGS.displayKey ||
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
        <div class="gs-panel__section-title"><span class="gs-panel__section-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"/></svg></span><span>${escapeHtml(t('language'))}</span></div>
        <label class="gs-field">
          <select id="gs-language" aria-label="${escapeAttr(t('language'))}">
            ${buildLanguageOptions()}
          </select>
        </label>
        <p class="gs-hint">${escapeHtml(t('languageHint'))}</p>
      </div>
      <div class="gs-panel__section">
        <div class="gs-panel__section-title"><span class="gs-panel__section-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25"/></svg></span><span>${escapeHtml(t('sectionDisplay'))}</span></div>
        <label class="gs-field">
          <span class="gs-field__label">${escapeHtml(t('cardDisplay'))}</span>
          <select id="gs-card-display">
            <option value="badge">${escapeHtml(t('cardDisplayBadge'))}</option>
            <option value="hover">${escapeHtml(t('cardDisplayHover'))}</option>
            <option value="context">${escapeHtml(t('cardDisplayContext'))}</option>
            <option value="hotkey">${escapeHtml(t('cardDisplayHotkey'))}</option>
          </select>
        </label>
        <p class="gs-hint">${escapeHtml(t('cardDisplayHint'))}</p>
        <div class="gs-field" id="gs-display-key-row" hidden>
          <span class="gs-field__label">${escapeHtml(t('displayKey'))}</span>
          <button type="button" class="gs-btn gs-btn--ghost" id="gs-display-key"></button>
        </div>
        <p class="gs-hint" id="gs-display-key-hint" hidden>${escapeHtml(t('displayKeyHint'))}</p>
        <label class="gs-field">
          <span class="gs-field__label">${escapeHtml(t('cardPosition'))}</span>
          <select id="gs-card-position">
            <option value="left">${escapeHtml(t('posLeft'))}</option>
            <option value="right">${escapeHtml(t('posRight'))}</option>
            <option value="top">${escapeHtml(t('posTop'))}</option>
            <option value="bottom">${escapeHtml(t('posBottom'))}</option>
          </select>
        </label>
        <p class="gs-hint">${escapeHtml(t('cardPositionHint'))}</p>
      </div>
      <div class="gs-panel__section" id="gs-badge-section">
        <div class="gs-panel__section-title"><span class="gs-panel__section-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z"/></svg></span><span>${escapeHtml(t('sectionBadge'))}</span></div>
        <p class="gs-hint" data-gs-badge-gated-hint hidden>${escapeHtml(t('badgeDisabledHint'))}</p>
        <div class="gs-preview" id="gs-badge-preview" data-size="medium" aria-hidden="true">
          <div class="gs-preview__cover"></div>
          <div class="gs-preview__row">
            <span class="gs-preview__bar" style="width:58%"></span>
            <span class="gs-preview__bar gs-preview__bar--dim" style="width:34%"></span>
          </div>
          <span class="gs-steam-badge gs-steam-badge--cracked" data-gs-preview-badge><span class="gs-steam-badge__dot"></span><span class="gs-steam-badge__label" id="gs-preview-label">${escapeHtml(t('cracked'))}</span></span>
        </div>
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
        <div class="gs-field">
          <span class="gs-field__label">${escapeHtml(t('badgePosition'))}</span>
          <div class="gs-pos-picker" id="gs-pos-picker" role="group" aria-label="${escapeAttr(t('badgePosition'))}">
            <button type="button" class="gs-pos-picker__btn" data-v="top" data-h="left" aria-label="${escapeAttr(`${t('posTop')}, ${t('posLeft')}`)}" title="${escapeAttr(`${t('posTop')} · ${t('posLeft')}`)}"><span class="gs-pos-picker__dot"></span></button>
            <button type="button" class="gs-pos-picker__btn" data-v="top" data-h="right" aria-label="${escapeAttr(`${t('posTop')}, ${t('posRight')}`)}" title="${escapeAttr(`${t('posTop')} · ${t('posRight')}`)}"><span class="gs-pos-picker__dot"></span></button>
            <button type="button" class="gs-pos-picker__btn" data-v="bottom" data-h="left" aria-label="${escapeAttr(`${t('posBottom')}, ${t('posLeft')}`)}" title="${escapeAttr(`${t('posBottom')} · ${t('posLeft')}`)}"><span class="gs-pos-picker__dot"></span></button>
            <button type="button" class="gs-pos-picker__btn" data-v="bottom" data-h="right" aria-label="${escapeAttr(`${t('posBottom')}, ${t('posRight')}`)}" title="${escapeAttr(`${t('posBottom')} · ${t('posRight')}`)}"><span class="gs-pos-picker__dot"></span></button>
          </div>
          <select id="gs-badge-vertical" hidden>
            <option value="top">${escapeHtml(t('posTop'))}</option>
            <option value="bottom">${escapeHtml(t('posBottom'))}</option>
          </select>
          <select id="gs-badge-horizontal" hidden>
            <option value="left">${escapeHtml(t('posLeft'))}</option>
            <option value="right">${escapeHtml(t('posRight'))}</option>
          </select>
        </div>
        <p class="gs-hint">${escapeHtml(t('badgePositionHint'))}</p>
      </div>

      <div class="gs-panel__section">
        <div class="gs-panel__section-title"><span class="gs-panel__section-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"/></svg></span><span>${escapeHtml(t('showMissing'))}</span></div>
        <div class="gs-missing-row">
          <label class="gs-switch">
            <input type="checkbox" id="gs-show-missing" />
            <span class="gs-switch__track"></span>
            <span class="gs-switch__label">${escapeHtml(t('showMissing'))}</span>
          </label>
          <span class="gs-pill" id="gs-show-missing-pill">${escapeHtml(t('off'))}</span>
        </div>
        <p class="gs-hint">${escapeHtml(t('showMissingHint'))}</p>
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
        <button type="button" class="gs-btn gs-btn--danger" data-gs="reset" style="margin-right:auto">${escapeHtml(t('resetSettings'))}</button>
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
  panel.querySelector('[data-gs="save"]').addEventListener('click', () => {
    persistPanelForm();
    togglePanel(false);
  });
  panel.querySelector('[data-gs="reset"]').addEventListener('click', () => {
    resetSettings();
    configureLocale(getSettings().language);
    fillPanelForm();
    refreshCardsForDisplayMode();
  });
  panel.querySelectorAll('[data-gs="close"]').forEach((el) =>
    el.addEventListener('click', () => togglePanel(false))
  );
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
  panel.querySelector('#gs-card-display').addEventListener('change', () => syncDisplayControls());
  panel.querySelector('#gs-display-key').addEventListener('click', () => recordDisplayKey());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panelOpen) togglePanel(false);
  });
  panel.querySelector('#gs-badge-size').addEventListener('change', () => updateBadgePreview());
  panel.querySelectorAll('#gs-pos-picker [data-v]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      panel.querySelector('#gs-badge-vertical').value = btn.dataset.v;
      panel.querySelector('#gs-badge-horizontal').value = btn.dataset.h;
      syncPositionPicker();
      updateBadgePreview();
    });
  });
}

function prettyKeyLabel(code) {
  const base = String(code || '').replace(/(Left|Right)$/, '');
  if (base.startsWith('Key')) return base.slice(3);
  if (base.startsWith('Digit')) return base.slice(5);
  return base || 'Shift';
}

function syncDisplayControls() {
  const panel = document.getElementById('gs-panel');
  if (!panel) return;
  const mode = normalizeCardDisplay(panel.querySelector('#gs-card-display').value);
  const badgeMode = mode === 'badge';
  panel.querySelector('#gs-badge-section')?.classList.toggle('is-disabled', !badgeMode);
  panel.querySelectorAll('#gs-badge-section select').forEach((sel) => {
    sel.disabled = !badgeMode;
  });
  panel.querySelectorAll('#gs-pos-picker button').forEach((btn) => {
    btn.disabled = !badgeMode;
  });
  const hint = panel.querySelector('[data-gs-badge-gated-hint]');
  if (hint) hint.hidden = badgeMode;
  const hotkeyMode = mode === 'hotkey';
  const keyRow = panel.querySelector('#gs-display-key-row');
  if (keyRow) keyRow.hidden = !hotkeyMode;
  const keyHint = panel.querySelector('#gs-display-key-hint');
  if (keyHint) keyHint.hidden = !hotkeyMode;
}

function syncMissingPill() {
  const panel = document.getElementById('gs-panel');
  if (!panel) return;
  const on = panel.querySelector('#gs-show-missing').checked;
  const pill = panel.querySelector('#gs-show-missing-pill');
  pill.textContent = on ? t('on') : t('off');
  pill.classList.toggle('is-on', on);
}
function syncPositionPicker() {
  const panel = document.getElementById('gs-panel');
  if (!panel) return;
  const v = normalizeBadgeVertical(panel.querySelector('#gs-badge-vertical')?.value);
  const h = normalizeBadgeHorizontal(panel.querySelector('#gs-badge-horizontal')?.value);
  panel.querySelectorAll('#gs-pos-picker [data-v]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.v === v && btn.dataset.h === h);
  });
}

function updateBadgePreview() {
  const panel = document.getElementById('gs-panel');
  const preview = panel?.querySelector('#gs-badge-preview');
  if (!preview) return;
  const v = normalizeBadgeVertical(panel.querySelector('#gs-badge-vertical')?.value);
  const h = normalizeBadgeHorizontal(panel.querySelector('#gs-badge-horizontal')?.value);
  preview.dataset.size = normalizeBadgeSize(panel.querySelector('#gs-badge-size')?.value);
  const badge = preview.querySelector('[data-gs-preview-badge]');
  if (badge) {
    // Inline styles (with explicit auto) win over the page-scoped
    // html.gs-badge-* position rules, which would otherwise stretch it.
    badge.style.top = v === 'top' ? '8px' : 'auto';
    badge.style.bottom = v === 'bottom' ? '8px' : 'auto';
    badge.style.left = h === 'left' ? '8px' : 'auto';
    badge.style.right = h === 'right' ? '8px' : 'auto';
  }
}

function recordDisplayKey() {
  const panel = document.getElementById('gs-panel');
  const btn = panel?.querySelector('#gs-display-key');
  if (!btn) return;
  btn.textContent = t('displayKeyPress');
  btn.blur();
  const onKey = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.removeEventListener('keydown', onKey, true);
    if (e.code === 'Escape') {
      btn.textContent = prettyKeyLabel(getSettings().displayKey);
      return;
    }
    const code = normalizeDisplayKey(e.code);
    saveSettings({ displayKey: code });
    btn.textContent = prettyKeyLabel(code);
  };
  window.addEventListener('keydown', onKey, true);
}

function fillPanelForm() {
  const panel = document.getElementById('gs-panel');
  if (!panel) return;
  const settings = getSettings();
  panel.querySelector('#gs-badge-vertical').value = normalizeBadgeVertical(settings.badgeVertical);
  panel.querySelector('#gs-badge-horizontal').value = normalizeBadgeHorizontal(settings.badgeHorizontal);
  panel.querySelector('#gs-badge-size').value = normalizeBadgeSize(settings.badgeSize);
  panel.querySelector('#gs-card-display').value = normalizeCardDisplay(settings.cardDisplay);
  panel.querySelector('#gs-card-position').value = normalizeCardPosition(settings.cardPosition);
  panel.querySelector('#gs-display-key').textContent = prettyKeyLabel(
    normalizeDisplayKey(settings.displayKey)
  );
  panel.querySelector('#gs-show-missing').checked = settings.showMissingBadge !== false;
  panel.querySelector('#gs-cache-hours').value = String(normalizeCacheHours(settings.cacheHours));
  panel.querySelector('#gs-language').value = normalizeLanguage(settings.language);
  syncMissingPill();
  syncDisplayControls();
  syncPositionPicker();
  updateBadgePreview();
  const previewLabel = panel.querySelector('#gs-preview-label');
  if (previewLabel) previewLabel.textContent = t('cracked');
  const status = panel.querySelector('#gs-cache-status');
  if (status) status.textContent = '';
  paintCachePane();
}

function persistPanelForm() {
  const panel = document.getElementById('gs-panel');
  if (!panel) return;
  const prevDisplay = getSettings().cardDisplay;
  saveSettings({
    badgeVertical: panel.querySelector('#gs-badge-vertical').value,
    badgeHorizontal: panel.querySelector('#gs-badge-horizontal').value,
    badgeSize: panel.querySelector('#gs-badge-size').value,
    cardDisplay: panel.querySelector('#gs-card-display').value,
    cardPosition: panel.querySelector('#gs-card-position').value,
    showMissingBadge: panel.querySelector('#gs-show-missing').checked,
    cacheHours: normalizeCacheHours(panel.querySelector('#gs-cache-hours').value),
    language: panel.querySelector('#gs-language').value,
  });
  if (getSettings().cardDisplay !== prevDisplay) refreshCardsForDisplayMode();
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
    // A stuck interactive tooltip (same z-index, later in DOM) would float
    // above the modal and swallow tab clicks — dismiss it on open.
    dismissTooltip();
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
