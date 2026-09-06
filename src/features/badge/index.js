import { BADGE_CLASS, DONATE_URL, REPO_URL, SITE_BASE } from '../../core/constants.js';
import { buildApiUrl } from '../../api/gamestatus.js';
import { t } from '../../i18n/index.js';
import { escapeAttr, escapeHtml } from '../../utils/html.js';
import {
  formatDate,
  formatScore,
  getLocalizedDescription,
  getLocalizedGroup,
  parseGameDate,
  truncateText,
} from '../../utils/format.js';

export function getNotCrackedVariant(game) {
  const release = parseGameDate(game.release_date);
  if (!release) return 'not-cracked-recent';

  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  return release > monthAgo ? 'not-cracked-recent' : 'not-cracked-old';
}

export function getStatusType(game) {
  if (!game) return 'missing';

  const status = String(game.readable_status || '').toLowerCase();
  const groups = String(game.hacked_groups_en || game.hacked_groups || '').toLowerCase();

  if (/release today|релиз сегодня|выходит сегодня/.test(status)) {
    return 'release-today';
  }
  if (/bypass|обход|hypervisor/.test(groups) || /bypass|обход/.test(status)) {
    return 'bypass';
  }
  if (/not cracked|не взлом|не взломан|unbroken|unreleased crack/.test(status)) {
    return getNotCrackedVariant(game);
  }
  if (game.crack_date || /cracked|взлом/.test(status)) {
    return 'cracked';
  }
  return 'unknown';
}

export function getStatusLabel(game, type) {
  if (!game) return t('notInDatabase');
  if (game.readable_status) return game.readable_status;
  if (type === 'cracked') return t('cracked');
  if (type === 'not-cracked-recent' || type === 'not-cracked-old') return t('notCracked');
  if (type === 'bypass') return t('protectionBypass');
  if (type === 'release-today') return t('releaseToday');
  return t('unknownStatus');
}

export function tooltipRow(label, valueHtml) {
  if (!valueHtml) return '';
  return `
    <div class="gs-tip-row">
      <span class="gs-tip-label">${escapeHtml(label)}</span>
      <span class="gs-tip-value">${valueHtml}</span>
    </div>
  `;
}

export function tipChip(text, variant = '') {
  if (!text) return '';
  const mod = variant ? ` gs-tip-chip--${variant}` : '';
  return `<span class="gs-tip-chip${mod}">${escapeHtml(text)}</span>`;
}

export function tipTitle(game) {
  const title = escapeHtml(game?.title || 'GameStatus');
  if (!game?.slug) return title;
  return `<a class="gs-tip-title__link" href="${escapeAttr(`${SITE_BASE}/${game.slug}`)}" target="_blank" rel="noopener noreferrer">${title}</a>`;
}

export function splitChipValues(value) {
  return String(value || '')
    .split(/[,;/|]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function normalizeScorePercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  if (number <= 10) return number * 10;
  return Math.max(0, Math.min(100, number));
}

export function getScoreTone(value) {
  const percent = normalizeScorePercent(value);
  if (percent === null) return 'unknown';
  if (percent >= 75) return 'high';
  if (percent >= 50) return 'mid';
  return 'low';
}

export function formatScoreBadge(label, value) {
  const text = formatScore(value);
  if (!text) return '';
  const tone = getScoreTone(value);
  return `
    <div class="gs-tip-score gs-tip-score--${tone}">
      <span class="gs-tip-score__value">${escapeHtml(text)}</span>
      <span class="gs-tip-score__label">${escapeHtml(label)}</span>
    </div>
  `;
}

export function formatTooltipFooter(entry, game) {
  const pageUrl = game?.slug ? `${SITE_BASE}/${game.slug}` : SITE_BASE;
  const apiUrl = entry?.apiUrl || (game?.slug ? buildApiUrl(game.slug) : null);
  const links = [
    apiUrl
      ? `<a href="${escapeAttr(apiUrl)}" target="_blank" rel="noopener noreferrer">API</a>`
      : '',
    `<a href="${escapeAttr(pageUrl)}" target="_blank" rel="noopener noreferrer">GameStatus</a>`,
  ].filter(Boolean);

  return `
    <div class="gs-tip-footer">
      <div class="gs-tip-footer-top">
        <a class="gs-tip-donate-btn" href="${escapeAttr(DONATE_URL)}" target="_blank" rel="noopener noreferrer"><span>${escapeHtml(t('supportProject'))}</span></a>
        <div class="gs-tip-footer-links">${links.join('<span class="gs-tip-footer-sep">·</span>')}</div>
      </div>
      <div class="gs-tip-footer-divider" role="separator"></div>
      <a class="gs-tip-repo" href="${escapeAttr(REPO_URL)}" target="_blank" rel="noopener noreferrer">
        <span class="gs-tip-repo-title">${escapeHtml(t('repoLink'))}</span>
        <span class="gs-tip-repo-desc">${escapeHtml(t('repoAbout'))}</span>
      </a>
    </div>
  `;
}

export function formatHardwareSection(specs) {
  if (!specs || typeof specs !== 'object') return '';
  const rows = [
    ['CPU', specs.cpu_info],
    ['RAM', specs.ram_info],
    ['GPU', specs.gpu_info],
    ['OS', specs.os_info],
  ].filter(([, value]) => value);

  if (!rows.length) return '';

  return `
    <div class="gs-tip-section">
      <div class="gs-tip-section-title">${escapeHtml(t('hardware'))}</div>
      <div class="gs-tip-specs">
        ${rows
          .map(
            ([key, value]) => `
          <div class="gs-tip-spec">
            <span class="gs-tip-spec__key">${escapeHtml(key)}</span>
            <span class="gs-tip-spec__val">${escapeHtml(value)}</span>
          </div>`
          )
          .join('')}
      </div>
    </div>
  `;
}

export function formatTooltip(entry) {
  const game = entry?.data || null;

  if (!game) {
    return `
      <div class="gs-tip-header">
        <div class="gs-tip-header-body">
          <div class="gs-tip-title">GameStatus</div>
          <div class="gs-tip-chips">${tipChip(t('notInDatabase'), 'missing')}</div>
        </div>
      </div>
      <div class="gs-tip-body">
        <p class="gs-tip-muted">${escapeHtml(t('gameNotFound'))}</p>
      </div>
      ${formatTooltipFooter(entry, null)}
    `;
  }

  const statusType = getStatusType(game);
  const statusLabel = getStatusLabel(game, statusType);
  const protectionChips = splitChipValues(game.protections)
    .map((item) => tipChip(item, 'protection'))
    .join('');
  const group = getLocalizedGroup(game);
  const headerChips = [
    tipChip(statusLabel, statusType),
    game.is_AAA ? tipChip('AAA', 'aaa') : '',
    protectionChips,
    group ? tipChip(group) : '',
  ]
    .filter(Boolean)
    .join('');

  const cover = game.short_image
    ? `<img class="gs-tip-cover" src="${escapeAttr(game.short_image)}" alt="" loading="lazy" referrerpolicy="no-referrer" />`
    : '';

  const infoRows = [
    tooltipRow(t('release'), formatDate(game.release_date) ? escapeHtml(formatDate(game.release_date)) : ''),
    tooltipRow(t('crack'), formatDate(game.crack_date) ? escapeHtml(formatDate(game.crack_date)) : ''),
    tooltipRow(t('steamId'), game.steam_prod_id ? escapeHtml(String(game.steam_prod_id)) : ''),
    tooltipRow(
      t('subscriptions'),
      game.count_subscribe > 0 ? escapeHtml(String(game.count_subscribe)) : ''
    ),
  ].join('');

  const scores = [formatScoreBadge(t('score'), game.user_score), formatScoreBadge(t('metacritic'), game.mata_score)]
    .filter(Boolean)
    .join('');
  const scoresBlock = scores ? `<div class="gs-tip-section"><div class="gs-tip-scores">${scores}</div></div>` : '';

  const description = truncateText(getLocalizedDescription(game), 180);
  const descriptionBlock = description
    ? `<div class="gs-tip-section"><p class="gs-tip-desc">${escapeHtml(description)}</p></div>`
    : '';

  return `
    <div class="gs-tip-header">
      ${cover}
      <div class="gs-tip-header-body">
        <div class="gs-tip-title">${tipTitle(game)}</div>
        <div class="gs-tip-chips">${headerChips}</div>
      </div>
    </div>
    <div class="gs-tip-body">
      ${infoRows ? `<div class="gs-tip-section">${infoRows}</div>` : ''}
      ${scoresBlock}
      ${formatHardwareSection(game.specs_info)}
      ${descriptionBlock}
    </div>
    ${formatTooltipFooter(entry, game)}
  `;
}

let tooltipEl = null;

export function ensureTooltip() {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.className = `${BADGE_CLASS}__tooltip`;
    document.documentElement.appendChild(tooltipEl);
  }
  return tooltipEl;
}

export function showTooltipHtml(target, html) {
  const tip = ensureTooltip();
  tip.innerHTML = html;
  tip.classList.add(`${BADGE_CLASS}__tooltip--visible`, `${BADGE_CLASS}__tooltip--interactive`);

  const rect = target.getBoundingClientRect();
  const tipRect = tip.getBoundingClientRect();
  const pad = 15;
  let left = rect.left;
  let top = rect.top - tipRect.height - 7;

  if (top < pad) {
    top = rect.bottom + 7;
  }

  if (top + tipRect.height > window.innerHeight - pad) {
    top = Math.max(pad, rect.top - tipRect.height - 7);
  }

  if (left + tipRect.width > window.innerWidth - pad) {
    left = window.innerWidth - tipRect.width - pad;
  }

  tip.style.left = `${Math.max(pad, left)}px`;
  tip.style.top = `${Math.max(pad, top)}px`;
}

export function showTooltipForElement(target, entry) {
  showTooltipHtml(target, formatTooltip(entry));
}

/**
 * Instant loading state for hover display mode: same tooltip shell with the
 * known game title and shimmer placeholders, swapped for real content on resolve.
 */
export function formatLoadingTooltip(title) {
  const skeletonRow = '<div class="gs-tip-skeleton"></div>';
  return `
    <div class="gs-tip-header">
      <div class="gs-tip-header-body">
        <div class="gs-tip-title">${escapeHtml(title || t('loading'))}</div>
        <div class="gs-tip-chips">${tipChip(t('loading'), '')}</div>
      </div>
    </div>
    <div class="gs-tip-body gs-tip-body--loading">
      ${skeletonRow}
      ${skeletonRow}
      ${skeletonRow}
    </div>
  `;
}
/**
 * Fully dismiss the shared tooltip: opening the settings modal must never
 * leave a stuck interactive tooltip floating above the panel and swallowing
 * its clicks (hover tooltip whose hide was cancelled by tip-mouseenter, or a
 * pinned card tooltip).
 */
export function dismissTooltip() {
  cardTooltipDismissOnOutside = false;
  activeCardTooltip = null;
  hideTooltip();
}

export function hideTooltip() {
  tooltipEl?.classList.remove(`${BADGE_CLASS}__tooltip--visible`, `${BADGE_CLASS}__tooltip--interactive`);
}

let activeCardTooltip = null;
let cardTooltipDismissOnOutside = false;
let cardTooltipHooksInstalled = false;

function ensureCardTooltipHooks() {
  if (cardTooltipHooksInstalled) return;
  cardTooltipHooksInstalled = true;
  ensureTooltip().addEventListener('mouseenter', () => activeCardTooltip?.cancelHide());
  ensureTooltip().addEventListener('mouseleave', () => activeCardTooltip?.scheduleHide());
  document.addEventListener(
    'click',
    (e) => {
      if (!cardTooltipDismissOnOutside) return;
      const tip = ensureTooltip();
      if (!tip.classList.contains(`${BADGE_CLASS}__tooltip--visible`) || tip.contains(e.target)) return;
      cardTooltipDismissOnOutside = false;
      hideTooltip();
    },
    true
  );
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cardTooltipDismissOnOutside) {
      cardTooltipDismissOnOutside = false;
      hideTooltip();
    }
  });
}

/**
 * Shared on-demand tooltip brain for non-badge display modes. Card and tooltip
 * are one hover region: hide fires only when the cursor is over neither
 * (checked at hide time, since a taller loaded card often ends up under the
 * cursor). Shown entries are cached per live App ID so repeated triggers never
 * flash the skeleton. Callers bind their own trigger events to `show()`.
 */
function createCardTooltip(card, resolveEntry, getTitle, getLiveId) {
  ensureCardTooltipHooks();
  let activeToken = 0;
  let hideTimer = null;
  let cached = null;

  const liveId = () => (typeof getLiveId === 'function' ? getLiveId() : '');

  const show = (dismissOnOutside) => {
    cardTooltipDismissOnOutside = !!dismissOnOutside;
    activeCardTooltip = api;
    clearTimeout(hideTimer);
    hideTimer = null;
    const token = ++activeToken;
    const id = liveId();
    if (cached && id && cached.id === id) {
      showTooltipForElement(card, cached.entry);
      return;
    }
    cached = null;
    showTooltipHtml(card, formatLoadingTooltip(typeof getTitle === 'function' ? getTitle() : ''));
    Promise.resolve()
      .then(() => resolveEntry())
      .then((entry) => {
        if (token !== activeToken) return;
        if (!entry || (id && liveId() !== id)) {
          hideTooltip();
          return;
        }
        cached = { id, entry };
        showTooltipForElement(card, entry);
      });
  };

  const scheduleHide = () => {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (card.matches(':hover') || ensureTooltip().matches(':hover')) return;
      activeToken++;
      if (activeCardTooltip === api) {
        activeCardTooltip = null;
        cardTooltipDismissOnOutside = false;
      }
      hideTooltip();
    }, 180);
  };

  const cancelHide = () => {
    clearTimeout(hideTimer);
    hideTimer = null;
  };

  const api = { show, scheduleHide, cancelHide };
  return api;
}

function guardCardBinding(card) {
  if (card.dataset.gsHoverBound === '1') return false;
  card.dataset.gsHoverBound = '1';
  return true;
}

/**
 * Hover mode: tooltip opens on game hover, no outside-click dismissal.
 */
export function bindCardHoverTooltip(card, resolveEntry, getTitle, getLiveId, signal) {
  if (!guardCardBinding(card)) return;
  const tip = createCardTooltip(card, resolveEntry, getTitle, getLiveId);
  const opts = signal ? { signal } : undefined;
  card.addEventListener('mouseenter', () => tip.show(false), opts);
  card.addEventListener('focus', () => tip.show(false), opts);
  card.addEventListener('mouseleave', tip.scheduleHide, opts);
  card.addEventListener('blur', tip.scheduleHide, opts);
}

/**
 * Right-click mode: Steam's menu is suppressed on cards, the tooltip pins
 * until outside click, Escape, or moving off the card+tooltip region.
 */
export function bindCardContextTooltip(card, resolveEntry, getTitle, getLiveId, signal) {
  if (!guardCardBinding(card)) return;
  const tip = createCardTooltip(card, resolveEntry, getTitle, getLiveId);
  const opts = signal ? { signal } : undefined;
  card.addEventListener(
    'contextmenu',
    (e) => {
      e.preventDefault();
      tip.show(true);
    },
    opts
  );
  card.addEventListener('mouseleave', tip.scheduleHide, opts);
  card.addEventListener('blur', tip.scheduleHide, opts);
}

/**
 * Key+click mode: left-click while isKeyHeld(e) opens the tooltip instead of
 * navigating; plain clicks behave as usual.
 */
export function bindCardHotkeyTooltip(card, resolveEntry, getTitle, getLiveId, isKeyHeld, signal) {
  if (!guardCardBinding(card)) return;
  const tip = createCardTooltip(card, resolveEntry, getTitle, getLiveId);
  const opts = signal ? { signal } : undefined;
  card.addEventListener(
    'click',
    (e) => {
      if (e.button !== 0 || typeof isKeyHeld !== 'function' || !isKeyHeld(e)) return;
      if (!e.target?.closest?.('a')) return;
      e.preventDefault();
      tip.show(true);
    },
    opts
  );
  card.addEventListener('mouseleave', tip.scheduleHide, opts);
  card.addEventListener('blur', tip.scheduleHide, opts);
}

export function bindTooltip(badge, entry) {
  const activate = () => {
    badge.removeEventListener('mouseenter', activate);
    badge.removeEventListener('focus', activate);

    const tip = ensureTooltip();
    let hideTimer = null;

    const show = () => {
      clearTimeout(hideTimer);
      showTooltipForElement(badge, entry);
    };

    const scheduleHide = () => {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(hideTooltip, 120);
    };

    badge.addEventListener('mouseenter', show);
    badge.addEventListener('focus', show);
    badge.addEventListener('mouseleave', scheduleHide);
    badge.addEventListener('blur', scheduleHide);

    tip.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    tip.addEventListener('mouseleave', scheduleHide);

    show();
  };

  badge.addEventListener('mouseenter', activate);
  badge.addEventListener('focus', activate);
}

export function createLoaderBadge(isPage = false, isChart = false) {
  const badge = document.createElement('span');
  const pageClass = isPage ? ` ${BADGE_CLASS}--page` : '';
  const chartClass = isChart ? ` ${BADGE_CLASS}--chart` : '';
  badge.className = `${BADGE_CLASS} ${BADGE_CLASS}--loading${pageClass}${chartClass}`;
  badge.innerHTML = `<span class="${BADGE_CLASS}__dot"></span><span class="${BADGE_CLASS}__label">${escapeHtml(t('loading'))}</span>`;
  return badge;
}

export function renderBadge(entry, options = {}) {
  const { isPage = false, isChart = false, appId = null } = options;
  const game = entry?.data || null;
  const type = getStatusType(game);
  const label = getStatusLabel(game, type);
  const href = game?.slug ? `${SITE_BASE}/${game.slug}` : SITE_BASE;

  const badge = document.createElement('a');
  const pageClass = isPage ? ` ${BADGE_CLASS}--page` : '';
  const chartClass = isChart ? ` ${BADGE_CLASS}--chart` : '';
  badge.className = `${BADGE_CLASS} ${BADGE_CLASS}--${type}${pageClass}${chartClass}`;
  badge.href = href;
  badge.target = '_blank';
  badge.rel = 'noopener noreferrer';
  badge.setAttribute('data-gs-processed', '1');
  badge.dataset.gsAppId = String(appId || game?.steam_prod_id || '');
  badge.innerHTML = `<span class="${BADGE_CLASS}__dot"></span><span class="${BADGE_CLASS}__label">${escapeHtml(label)}</span>`;

  bindTooltip(badge, entry);
  return badge;
}

export function ensureRelativePosition(element) {
  const inlinePosition = element.style.position;
  if (inlinePosition && inlinePosition !== 'static') return;
  if (!inlinePosition) {
    const computed = getComputedStyle(element).position;
    if (computed !== 'static') return;
  }
  element.style.position = 'relative';
}
