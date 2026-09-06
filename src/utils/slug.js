export function isDsAppCapsule(card) {
  return Boolean(card?.hasAttribute?.('data-ds-appid'));
}

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[™®©'’":]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

export function extractAppIdFromHref(href) {
  const match = String(href || '').match(/\/app\/(\d+)(?:\/|$|\?)/i);
  return match ? match[1] : null;
}

export function extractSlugFromHref(href) {
  const match = String(href || '').match(/\/app\/\d+\/([^/?#]+)/i);
  if (!match) return null;
  return slugify(match[1].replace(/_/g, '-'));
}

export function hrefMatchesAppId(href, appId) {
  if (!href || !appId) return false;
  return extractAppIdFromHref(href) === String(appId);
}

export function findAppAnchor(root, appId, { includeClosest = false } = {}) {
  if (!root || !appId) return null;
  const id = String(appId);

  if (root instanceof HTMLAnchorElement && hrefMatchesAppId(root.href, id)) {
    return root;
  }

  if (includeClosest && root.closest) {
    const wrap = root.closest('a[href*="/app/"]');
    if (wrap && hrefMatchesAppId(wrap.href, id)) return wrap;
  }

  if (!root.querySelectorAll) return null;
  for (const anchor of root.querySelectorAll('a[href*="/app/"]')) {
    if (hrefMatchesAppId(anchor.href, id)) return anchor;
  }
  return null;
}

export const INVALID_SLUG_RE =
  /^(https?-)?(store-)?steam(powered|static)?(-[a-z0-9]+)*(-com)?$|steampowered|steamstatic|akamaihd|^(on-)?wishlist$|^gamestatus$|^(soon-)?on-game-pass$/;

export function isValidSlug(slug) {
  if (!slug || slug.length < 2) return false;
  if (!/[a-z]/.test(slug)) return false;
  if (INVALID_SLUG_RE.test(slug)) return false;
  if (/^\d+(-\d+)+$/.test(slug)) return false;

  const segments = slug.split('-').filter(Boolean);
  if (!segments.length) return false;
  if (segments.every((part) => /^\d+$/.test(part))) return false;

  const numericParts = segments.filter((part) => /^\d+$/.test(part)).length;
  return numericParts / segments.length <= 0.5;
}
