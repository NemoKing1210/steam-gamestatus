import { STEAM_STORE_URL } from '../../core/constants.js';
import {
  getGameCacheStats,
  listGameCacheEntries,
} from '../../core/cache.js';
import { t } from '../../i18n/index.js';
import { escapeAttr, escapeHtml } from '../../utils/html.js';
import { formatCacheBytes } from '../../utils/format.js';

const CACHE_LIST_LIMIT = 100;

function cacheFillTone(pct) {
  const n = Math.max(0, Math.min(100, Number(pct) || 0));
  if (n >= 90) return 'high';
  if (n >= 70) return 'mid';
  return 'low';
}

function replaceNode(selector, html, root = document) {
  const current = root.querySelector?.(selector);
  if (!current) return;
  const wrap = document.createElement('div');
  wrap.innerHTML = html.trim();
  const next = wrap.firstElementChild;
  if (next) current.replaceWith(next);
}

export function buildCacheTabBadgeHtml() {
  const stats = getGameCacheStats();
  const pct = stats.limitBytes
    ? Math.round((stats.usedBytes / stats.limitBytes) * 100)
    : 0;
  const tone = cacheFillTone(pct);
  return `<span class="gs-panel__tab-badge gs-panel__tab-badge--${tone}" data-gs-cache-tab-badge>${pct}%</span>`;
}

export function buildCacheMeterHtml() {
  const stats = getGameCacheStats();
  const denom = Math.max(stats.usedBytes, stats.limitBytes, 1);
  const pct = stats.limitBytes
    ? Math.round((stats.usedBytes / stats.limitBytes) * 100)
    : 0;
  const tone = cacheFillTone(pct);
  const seg = (bytes, cls, title) => {
    const w = Math.max(0, Math.min(100, (bytes / denom) * 100));
    if (w <= 0) return '';
    return `<span class="gs-cache-meter__seg gs-cache-meter__seg--${cls}" style="width:${w}%" title="${escapeAttr(title)}"></span>`;
  };
  const row = (cls, label, count, size) => `
    <li class="gs-cache-meter__row">
      <span class="gs-cache-meter__swatch gs-cache-meter__swatch--${cls}"></span>
      <span class="gs-cache-meter__name">${escapeHtml(label)}</span>
      <span class="gs-cache-meter__meta">
        <span class="gs-cache-meter__count">${escapeHtml(t('cacheMeterEntries', { count }))}</span>
        <span class="gs-cache-meter__size">${escapeHtml(size)}</span>
      </span>
    </li>`;

  return `
    <div class="gs-cache-meter" data-gs-cache-meter>
      <div class="gs-cache-meter__head">
        <div class="gs-cache-meter__pct gs-cache-meter__pct--${tone}">
          <span class="gs-cache-meter__pct-value">${escapeHtml(t('cacheMeterPct', { pct }))}</span>
        </div>
        <div class="gs-cache-meter__used-wrap">
          <span class="gs-cache-meter__used">${escapeHtml(
            t('cacheMeterUsed', {
              used: formatCacheBytes(stats.usedBytes),
              limit: formatCacheBytes(stats.limitBytes),
            })
          )}</span>
        </div>
      </div>
      <div class="gs-cache-meter__bar" role="img" aria-label="${escapeAttr(
        t('cacheMeterUsed', {
          used: formatCacheBytes(stats.usedBytes),
          limit: formatCacheBytes(stats.limitBytes),
        })
      )}">
        ${seg(stats.found.bytes, 'found', `${t('cacheMeterFound')}: ${formatCacheBytes(stats.found.bytes)}`)}
        ${seg(stats.missing.bytes, 'missing', `${t('cacheMeterMissing')}: ${formatCacheBytes(stats.missing.bytes)}`)}
        <span class="gs-cache-meter__seg gs-cache-meter__seg--free" style="width:${Math.max(0, Math.min(100, (stats.freeBytes / denom) * 100))}%"></span>
      </div>
      <ul class="gs-cache-meter__legend">
        ${row('found', t('cacheMeterFound'), stats.found.count, formatCacheBytes(stats.found.bytes))}
        ${row('missing', t('cacheMeterMissing'), stats.missing.count, formatCacheBytes(stats.missing.bytes))}
        <li class="gs-cache-meter__row gs-cache-meter__row--free">
          <span class="gs-cache-meter__swatch gs-cache-meter__swatch--free"></span>
          <span class="gs-cache-meter__name">${escapeHtml(t('cacheMeterFree'))}</span>
          <span class="gs-cache-meter__meta">
            <span class="gs-cache-meter__size">${escapeHtml(formatCacheBytes(stats.freeBytes))}</span>
          </span>
        </li>
      </ul>
    </div>`;
}

export function buildCacheListHtml() {
  const entries = listGameCacheEntries();
  if (!entries.length) {
    return `<div class="gs-cache-list" data-gs-cache-list>
      <div class="gs-cache-list__empty">${escapeHtml(t('cacheListEmpty'))}</div>
    </div>`;
  }
  const shown = entries.slice(0, CACHE_LIST_LIMIT);
  const rows = shown
    .map((entry) => {
      const chip = entry.missing
        ? `<span class="gs-cache-list__kind gs-cache-list__kind--missing">${escapeHtml(t('cacheEntryNotFound'))}</span>`
        : '';
      return `
        <div class="gs-cache-list__item">
          <div class="gs-cache-list__main">
            ${chip}
            <a class="gs-cache-list__label" href="${escapeAttr(`${STEAM_STORE_URL}/app/${entry.appId}/`)}" target="_blank" rel="noopener noreferrer" title="${escapeAttr(`${entry.title} · ${entry.appId}`)}">${escapeHtml(entry.title)}</a>
          </div>
          <div class="gs-cache-list__meta">
            <span>${escapeHtml(formatCacheBytes(entry.bytes))}</span>
            <button type="button" class="gs-btn gs-btn--ghost gs-cache-list__remove" data-gs="cache-remove" data-gs-app-id="${escapeAttr(entry.appId)}" title="${escapeAttr(t('cacheRemoveEntry'))}">×</button>
          </div>
        </div>`;
    })
    .join('');
  const more =
    entries.length > shown.length
      ? `<div class="gs-cache-list__more">${escapeHtml(t('cacheListMore', { count: entries.length - shown.length }))}</div>`
      : '';
  return `<div class="gs-cache-list" data-gs-cache-list>${rows}${more}</div>`;
}

export function paintCachePane(root = document) {
  const stats = getGameCacheStats();
  replaceNode('[data-gs-cache-meter]', buildCacheMeterHtml(), root);
  replaceNode('[data-gs-cache-list]', buildCacheListHtml(), root);
  const toggle = root.querySelector?.('[data-gs="cache-list-toggle"]');
  const list = root.querySelector?.('[data-gs-cache-list]');
  if (toggle && list) {
    list.hidden = toggle.getAttribute('aria-expanded') !== 'true';
    const countEl = toggle.querySelector('[data-gs-cache-list-count]');
    if (countEl) countEl.textContent = t('cacheMeterEntries', { count: stats.totalCount });
  }
  replaceNode('[data-gs-cache-tab-badge]', buildCacheTabBadgeHtml(), root);
}
