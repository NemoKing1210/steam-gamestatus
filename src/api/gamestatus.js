import { GM_xmlhttpRequest } from '$';
import { API_BASE, MAX_SLUG_ATTEMPTS } from '../core/constants.js';
import { getCached, inflight, setCached } from '../core/cache.js';
import { enqueue } from '../core/queue.js';
import {
  isApiPaused,
  registerApiFailure,
  registerApiSuccess,
} from '../core/api-guard.js';
import { fetchSteamAppTitle } from './steam.js';
import { buildSlugCandidates, isUiChromeTitle } from '../utils/steam-dom.js';
import { getApiLanguage } from '../utils/format.js';

export function buildApiUrl(slug) {
  return `${API_BASE}/${encodeURIComponent(slug)}/`;
}

/** Returned instead of a lookup while the API guard has paused the script. */
function pausedEntry() {
  return {
    data: null,
    slug: null,
    slugs: [],
    triedUrls: [],
    missing: false,
    paused: true,
  };
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
          // The API answered: it is reachable even though the slug is not.
          registerApiSuccess();
          resolve(null);
          return;
        }
        if (response.status < 200 || response.status >= 300) {
          registerApiFailure();
          reject(new Error(`HTTP ${response.status}`));
          return;
        }
        try {
          const data = JSON.parse(response.responseText);
          registerApiSuccess();
          resolve(data);
        } catch (error) {
          registerApiFailure();
          reject(error);
        }
      },
      onerror: () => {
        registerApiFailure();
        reject(new Error('Network error'));
      },
      ontimeout: () => {
        registerApiFailure();
        reject(new Error('Timeout'));
      },
    });
  });
}

export async function fetchBySlug(slug, appId) {
  const data = await requestJson(buildApiUrl(slug));
  return isMatchingGame(data, appId) ? data : null;
}

/**
 * Tries up to `MAX_SLUG_ATTEMPTS` slugs. Returns the resolved entry plus
 * whether the API was reachable at all: a 404 / steam_prod_id mismatch proves
 * reachability, while a transport or HTTP error does not. Callers must not
 * cache a "missing" result when no attempt completed — that would turn an
 * outage into a fake "not in database" for the whole cache TTL.
 */
export async function tryResolveBySlugs(appId, slugs, triedUrls) {
  const slugsToTry = slugs.slice(0, MAX_SLUG_ATTEMPTS);
  let reachable = false;
  let lastError = null;

  for (const slug of slugsToTry) {
    try {
      const data = await fetchBySlug(slug, appId);
      reachable = true;
      if (data) {
        return {
          entry: {
            data,
            slug,
            slugs,
            triedUrls,
            apiUrl: buildApiUrl(slug),
            missing: false,
          },
          reachable,
          lastError: null,
        };
      }
    } catch (error) {
      lastError = error;
    }
  }
  return { entry: null, reachable, lastError };
}

export async function resolveGame(appId, link, title) {
  const cached = getCached(appId);
  if (cached) return cached;

  const safeTitle = isUiChromeTitle(title) ? '' : title;
  let resolvedTitle = safeTitle;
  let slugs = buildSlugCandidates(appId, link, resolvedTitle);
  let triedUrls = slugs.map(buildApiUrl);
  let usedSteamTitle = false;
  let reachable = false;
  let lastError = null;

  const attempt = async (candidateSlugs, urls) => {
    const result = await tryResolveBySlugs(appId, candidateSlugs, urls);
    reachable = reachable || result.reachable;
    if (result.lastError) lastError = result.lastError;
    return result.entry;
  };

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

  let entry = await attempt(slugs, triedUrls);
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
      entry = await attempt(steamSlugs, steamTried);
      if (entry) {
        setCached(appId, entry);
        return entry;
      }
      slugs = steamSlugs.length ? steamSlugs : slugs;
      triedUrls = steamTried;
      resolvedTitle = steamTitle;
    }
  }

  // Every attempted request failed at the transport/HTTP level: this is an
  // outage, not a missing game. Throw so the failure is never cached as a
  // valid "not in database" result.
  if (!reachable && lastError) {
    throw lastError;
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

  // Cached data may still be shown while paused; new lookups must not start.
  if (isApiPaused()) return Promise.resolve(pausedEntry());

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
