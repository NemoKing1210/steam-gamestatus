import { STEAM_APPDETAILS_URL } from '../core/constants.js';

const steamTitleCache = new Map();
const steamTitleInflight = new Map();

export async function fetchSteamAppTitle(appId) {
  const key = String(appId);
  if (steamTitleCache.has(key)) return steamTitleCache.get(key);
  if (steamTitleInflight.has(key)) return steamTitleInflight.get(key);

  const promise = (async () => {
    try {
      const onStore = location.hostname === 'store.steampowered.com';
      const url = `${STEAM_APPDETAILS_URL}?appids=${encodeURIComponent(key)}&filters=basic`;
      const response = await fetch(url, {
        credentials: onStore ? 'same-origin' : 'omit',
      });
      if (!response.ok) {
        steamTitleCache.set(key, null);
        return null;
      }
      const json = await response.json();
      const payload = json?.[key];
      const name = payload?.success ? payload.data?.name : null;
      const title = name ? String(name).replace(/\s+/g, ' ').trim() : null;
      steamTitleCache.set(key, title || null);
      return title || null;
    } catch {
      steamTitleCache.set(key, null);
      return null;
    } finally {
      steamTitleInflight.delete(key);
    }
  })();

  steamTitleInflight.set(key, promise);
  return promise;
}
