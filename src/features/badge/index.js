import { BADGE_CLASS, DONATE_URL, REPO_URL, SITE_BASE } from '../../core/constants.js';
import { buildApiUrl, getTriedUrls } from '../../api/gamestatus.js';
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
    const urls = getTriedUrls(entry);
    const links = urls.length
      ? `<div class="gs-tip-section">
          <div class="gs-tip-section-title">${escapeHtml(t('checkedUrls'))}</div>
          <ul class="gs-tip-links">
            ${urls
              .map(
                (url) =>
                  `<li><a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a></li>`
              )
              .join('')}
          </ul>
        </div>`
      : '';

    return `
      <div class="gs-tip-header">
        <div class="gs-tip-header-body">
          <div class="gs-tip-title">GameStatus</div>
          <div class="gs-tip-chips">${tipChip(t('notInDatabase'), 'missing')}</div>
        </div>
      </div>
      <div class="gs-tip-body">
        <p class="gs-tip-muted">${escapeHtml(t('gameNotFound'))}</p>
        ${links}
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

export function bindTooltip(badge, entry) {
  const activate = () => {
    badge.removeEventListener('mouseenter', activate);
    badge.removeEventListener('focus', activate);

    const tip = ensureTooltip();
    let hideTimer = null;

    const show = () => {
      clearTimeout(hideTimer);
      tip.innerHTML = formatTooltip(entry);
      tip.classList.add(`${BADGE_CLASS}__tooltip--visible`, `${BADGE_CLASS}__tooltip--interactive`);

      const rect = badge.getBoundingClientRect();
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
    };

    const scheduleHide = () => {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        tip.classList.remove(`${BADGE_CLASS}__tooltip--visible`, `${BADGE_CLASS}__tooltip--interactive`);
      }, 120);
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
