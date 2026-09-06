import { GM_xmlhttpRequest } from '$';
import { API_BASE, MAX_SLUG_ATTEMPTS } from '../core/constants.js';
import { getCached, inflight, setCached } from '../core/cache.js';
import { enqueue } from '../core/queue.js';
import { fetchSteamAppTitle } from './steam.js';
import { buildSlugCandidates, isUiChromeTitle } from '../utils/steam-dom.js';
import { getApiLanguage } from '../utils/format.js';

export function buildApiUrl(slug) {
  return `${API_BASE}/${encodeURIComponent(slug)}/`;
}

export function isMatchingGame(data, appId) {
  if (!data) return false;
  if (!data.steam_prod_id) return true;
  return String(data.steam_prod_id) === String(appId);
}

export function requestJson(url) {
  const language = getApiLanguage();
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: 'GET',
      url,
      headers: {
        Accept: 'application/json',
        'Accept-Language': language,
      },
      timeout: 15000,
      onload(response) {
        if (response.status === 404) {
          resolve(null);
          return;
        }
        if (response.status < 200 || response.status >= 300) {
          reject(new Error(`HTTP ${response.status}`));
          return;
        }
        try {
          resolve(JSON.parse(response.responseText));
        } catch (error) {
          reject(error);
        }
      },
      onerror: () => reject(new Error('Network error')),
      ontimeout: () => reject(new Error('Timeout')),
    });
  });
}

export async function fetchBySlug(slug, appId) {
  const data = await requestJson(buildApiUrl(slug));
  return isMatchingGame(data, appId) ? data : null;
}

export async function tryResolveBySlugs(appId, slugs, triedUrls) {
  const slugsToTry = slugs.slice(0, MAX_SLUG_ATTEMPTS);
  for (const slug of slugsToTry) {
    try {
      const data = await fetchBySlug(slug, appId);
      if (data) {
        return {
          data,
          slug,
          slugs,
          triedUrls,
          apiUrl: buildApiUrl(slug),
          missing: false,
        };
      }
    } catch {
      // try next slug
    }
  }
  return null;
}

export async function resolveGame(appId, link, title) {
  const cached = getCached(appId);
  if (cached) return cached;

  const safeTitle = isUiChromeTitle(title) ? '' : title;
  let resolvedTitle = safeTitle;
  let slugs = buildSlugCandidates(appId, link, resolvedTitle);
  let triedUrls = slugs.map(buildApiUrl);
  let usedSteamTitle = false;

  // Capsules like Personal Calendar often have /app/{id}?… with no real title
  // (DOM may only expose Steam UI chrome such as "ON WISHLIST").
  if (!slugs.length) {
    const steamTitle = await fetchSteamAppTitle(appId);
    usedSteamTitle = true;
    if (steamTitle) {
      resolvedTitle = steamTitle;
      slugs = buildSlugCandidates(appId, link, resolvedTitle);
      triedUrls = slugs.map(buildApiUrl);
    }
  }

  let entry = await tryResolveBySlugs(appId, slugs, triedUrls);
  if (entry) {
    setCached(appId, entry);
    return entry;
  }

  // Bad DOM titles (wishlist flags, badge text) can yield junk slugs — retry via Steam name.
  if (!usedSteamTitle) {
    const steamTitle = await fetchSteamAppTitle(appId);
    if (steamTitle && steamTitle !== resolvedTitle) {
      const steamSlugs = buildSlugCandidates(appId, link, steamTitle);
      const steamTried = [...new Set([...triedUrls, ...steamSlugs.map(buildApiUrl)])];
      entry = await tryResolveBySlugs(appId, steamSlugs, steamTried);
      if (entry) {
        setCached(appId, entry);
        return entry;
      }
      slugs = steamSlugs.length ? steamSlugs : slugs;
      triedUrls = steamTried;
      resolvedTitle = steamTitle;
    }
  }

  entry = {
    data: null,
    slug: slugs[0] || null,
    slugs,
    triedUrls,
    missing: true,
  };
  setCached(appId, entry);
  return entry;
}

export function loadGame(appId, link, title) {
  const key = String(appId);
  const cached = getCached(key);
  if (cached) return Promise.resolve(cached);

  if (!inflight.has(key)) {
    inflight.set(
      key,
      enqueue(() => resolveGame(appId, link, title)).finally(() => {
        inflight.delete(key);
      })
    );
  }
  return inflight.get(key);
}
