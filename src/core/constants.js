import pkg from '../../package.json' with { type: 'json' };

export const SCRIPT_VERSION = pkg.version;
export const API_BASE = 'https://gamestatus.info/back/api/gameinfo/game';
export const SITE_BASE = 'https://gamestatus.info';
export const DONATE_URL = `${SITE_BASE}/#donate`;
export const REPO_URL = 'https://github.com/NemoKing1210/steam-gamestatus';
export const AUTHOR_URL = 'https://github.com/NemoKing1210';
export const CACHE_KEY = 'gs_steam_cache_v5';
export const SETTINGS_KEY = 'gs_steam_settings';
export const CACHE_HOURS_MAX = 168;
/** Soft byte budget for the Cache tab meter (game lookups are small JSON) */
export const CACHE_SOFT_LIMIT_BYTES = 2 * 1024 * 1024;
export const STEAM_STORE_URL = 'https://store.steampowered.com';
export const DEFAULT_SETTINGS = {
  cacheHours: 6,
  badgeVertical: 'top',
  badgeHorizontal: 'left',
  badgeSize: 'medium',
  cardDisplay: 'badge',
  displayKey: 'ShiftLeft',
  showMissingBadge: true,
};
export const MAX_CONCURRENT = 2;
export const CARD_ROOT_MARGIN = '80px 0px';
export const SCAN_DEBOUNCE_MS = 450;
export const SCROLL_IDLE_MS = 150;
export const CACHE_PERSIST_MS = 1000;
export const REQUEST_DELAY_MS = 75;
export const HYDRATE_BATCH_SIZE = 3;
export const MAX_SLUG_ATTEMPTS = 2;
export const BADGE_CLASS = 'gs-steam-badge';
export const STEAM_APPDETAILS_URL = 'https://store.steampowered.com/api/appdetails';
export const MUTATION_OBSERVER_OPTIONS = {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['data-ds-appid', 'data-sub-id', 'class'],
};
