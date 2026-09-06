import { BADGE_CLASS } from '../core/constants.js';
import {
  extractAppIdFromHref,
  extractSlugFromHref,
  isDsAppCapsule,
  isValidSlug,
  slugify,
} from './slug.js';

export function getPageAppId() {
  const fromUrl = extractAppIdFromHref(location.pathname);
  if (fromUrl) return fromUrl;
  if (typeof window.g_rgAppData === 'object' && window.g_rgAppData?.appid) {
    return String(window.g_rgAppData.appid);
  }
  const appDataNode = document.querySelector('[data-appid]');
  return appDataNode?.getAttribute('data-appid') || null;
}

export function getPageTitle() {
  return (
    document.querySelector('.apphub_AppName')?.textContent?.trim() ||
    document.querySelector('#appHubAppName')?.textContent?.trim() ||
    document.title.replace(/\s+on Steam.*$/i, '').trim()
  );
}

export const TITLE_SELECTORS = [
  '.tab_item_title',
  '.search_name .title',
  '.search_result_row .title',
  '.title',
  '.StoreSaleWidgetTitle',
  '[class*="item_title"]',
  '[class*="ItemTitle"]',
  'a[href*="/app/"] img[src*="/apps/"] + div',
];

export const UI_CHROME_TITLE_RE =
  /^(in library|в библиотеке|owned|ignored|on wishlist|в вишлисте|в желаемом|wishlisted|on game pass|soon on game pass|скоро в game pass|gamestatus(?:…|\.{0,3})?|not in database|нет в базе|load error|ошибка загрузки|\+\d+\s*more)$/i;

function looksLikePriceText(text) {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  if (!value) return true;
  if (value.length > 100) return true;
  if (/^-\d+%/.test(value)) return true;
  if (/^\d+%?\s*off\b/i.test(value)) return true;
  if (/\b(руб|₽|usd|eur|uah|gbp|cad|aud|try|idr|vnd|kr)\b/i.test(value) && /\d/.test(value)) {
    return true;
  }
  if (/^(released|выход|дата выхода|release date)/i.test(value)) return true;
  if (/^free to play$/i.test(value)) return true;

  const digits = (value.match(/\d/g) || []).length;
  return digits > 0 && digits / value.length > 0.45 && /%|руб|₽|\$|€|£/.test(value);
}

export function isUiChromeTitle(text) {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  if (!value) return true;
  if (UI_CHROME_TITLE_RE.test(value)) return true;
  if (/^game\s*status/i.test(value)) return true;
  return false;
}

function normalizeImageAltTitle(alt) {
  return String(alt || '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s+(banner|capsule|header|poster|logo)$/i, '')
    .trim();
}
export function getCardTitle(card, link, resolveLink) {
  const sources = [];

  const add = (value) => {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text || isUiChromeTitle(text) || looksLikePriceText(text) || sources.includes(text)) return;
    sources.push(text);
  };

  for (const selector of TITLE_SELECTORS) {
    const element = card.querySelector(selector);
    if (element) add(element.textContent);
  }

  if (isDsAppCapsule(card)) {
    const capsuleLink = link || resolveLink?.(card);
    add(normalizeImageAltTitle(card.querySelector('img[alt]')?.alt));
    const slugFromCapsule = extractSlugFromHref(capsuleLink?.href);
    if (slugFromCapsule && isValidSlug(slugFromCapsule)) {
      add(slugFromCapsule.replace(/-/g, ' '));
    }
  }

  add(
    normalizeImageAltTitle(
      card.querySelector(
        'img.sale_capsule_image[alt], img.tab_row_capsule[alt], img[class*="capsule"][alt], img[alt]'
      )?.alt
    )
  );

  const ariaLabel = link?.getAttribute('aria-label')?.trim();
  if (ariaLabel && !/^\d+%\s*off\b/i.test(ariaLabel) && !looksLikePriceText(ariaLabel)) {
    add(ariaLabel.replace(/\.\s*\d+%\s*off.*$/i, '').trim());
  }

  const slugFromHref = extractSlugFromHref(link?.href);
  if (slugFromHref && isValidSlug(slugFromHref)) {
    add(slugFromHref.replace(/-/g, ' '));
  }

  if (!sources.length && link) {
    const clone = link.cloneNode(true);
    clone
      .querySelectorAll(
        `.${BADGE_CLASS}, .ds_flag, .ds_options, .alike_cont, [class*="WishlistFlag"], [class*="wishlist_flag"]`
      )
      .forEach((el) => el.remove());
    const firstLine = clone.textContent
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line && !looksLikePriceText(line) && !isUiChromeTitle(line));
    add(firstLine);
  }

  return sources[0] || '';
}

export function buildSlugCandidates(appId, link, title) {
  const candidates = [];
  const addSlug = (slug) => {
    if (slug && isValidSlug(slug) && !candidates.includes(slug)) {
      candidates.push(slug);
    }
  };
  const addFromHref = (href) => addSlug(extractSlugFromHref(href));
  const addFromText = (text) => {
    const normalized = String(text || '').replace(/\s+/g, ' ').trim();
    if (!normalized || looksLikePriceText(normalized) || isUiChromeTitle(normalized)) return;

    addSlug(slugify(normalized));
    addSlug(slugify(normalized.replace(/\s*[-–—:|].*$/, '')));
  };

  addFromHref(link?.href);

  // Only for the page's own game — not recommendation cards on the same page
  if (isGamePage() && String(appId) === String(getPageAppId())) {
    addFromHref(location.pathname);
    addFromHref(document.querySelector('link[rel="canonical"]')?.href);
    addFromHref(document.querySelector('meta[property="og:url"]')?.content);
  }

  addFromText(title);

  return candidates;
}

export function isGamePage() {
  return /\/app\/\d+/i.test(location.pathname);
}
