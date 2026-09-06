import { GM_getValue, GM_setValue } from '$';
import {
  CACHE_HOURS_MAX,
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
} from './constants.js';
import { SUPPORTED_LOCALES } from '../i18n/meta.js';

export function normalizeCacheHours(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 0) return DEFAULT_SETTINGS.cacheHours;
  return Math.min(n, CACHE_HOURS_MAX);
}

export function normalizeBadgeVertical(value) {
  return value === 'bottom' ? 'bottom' : 'top';
}

export function normalizeBadgeHorizontal(value) {
  return value === 'right' ? 'right' : 'left';
}

export function normalizeBadgeSize(value) {
  if (value === 'small' || value === 'large' || value === 'xlarge') return value;
  return 'medium';
}
export function normalizeLanguage(value) {
  if (value === 'auto' || SUPPORTED_LOCALES.includes(value)) return value;
  return DEFAULT_SETTINGS.language;
}

export function loadSettings() {
  const raw = GM_getValue(SETTINGS_KEY, null);
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS };
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    cacheHours: normalizeCacheHours(raw.cacheHours),
    badgeVertical: normalizeBadgeVertical(raw.badgeVertical),
    badgeHorizontal: normalizeBadgeHorizontal(raw.badgeHorizontal),
    badgeSize: normalizeBadgeSize(raw.badgeSize),
    showMissingBadge: raw.showMissingBadge !== false,
    language: normalizeLanguage(raw.language),
  };
}

/** @type {typeof DEFAULT_SETTINGS} */
let settings = loadSettings();

let settingsChangeListener = null;

export function setSettingsChangeListener(fn) {
  settingsChangeListener = typeof fn === 'function' ? fn : null;
}

export function getSettings() {
  return settings;
}

export function saveSettings(next) {
  settings = {
    ...settings,
    ...next,
    cacheHours: normalizeCacheHours(next.cacheHours ?? settings.cacheHours),
    badgeVertical: normalizeBadgeVertical(next.badgeVertical ?? settings.badgeVertical),
    badgeHorizontal: normalizeBadgeHorizontal(next.badgeHorizontal ?? settings.badgeHorizontal),
    badgeSize: normalizeBadgeSize(next.badgeSize ?? settings.badgeSize),
    showMissingBadge:
      typeof next.showMissingBadge === 'boolean'
        ? next.showMissingBadge
        : settings.showMissingBadge !== false,
    language: normalizeLanguage(next.language ?? settings.language),
  };
  GM_setValue(SETTINGS_KEY, settings);
  applyBadgeAppearance();
  settingsChangeListener?.();
}

export function getCacheTtlMs() {
  const hours = normalizeCacheHours(settings.cacheHours);
  return hours > 0 ? hours * 60 * 60 * 1000 : 0;
}

export function applyBadgeAppearance() {
  const root = document.documentElement;
  root.classList.remove(
    'gs-badge-v-top',
    'gs-badge-v-bottom',
    'gs-badge-h-left',
    'gs-badge-h-right',
    'gs-badge-size-sm',
    'gs-badge-size-md',
    'gs-badge-size-lg',
    'gs-badge-size-xl'
  );
  const sizeClass =
    settings.badgeSize === 'small'
      ? 'gs-badge-size-sm'
      : settings.badgeSize === 'large'
        ? 'gs-badge-size-lg'
        : settings.badgeSize === 'xlarge'
          ? 'gs-badge-size-xl'
          : 'gs-badge-size-md';
  root.classList.add(
    settings.badgeVertical === 'bottom' ? 'gs-badge-v-bottom' : 'gs-badge-v-top',
    settings.badgeHorizontal === 'right' ? 'gs-badge-h-right' : 'gs-badge-h-left',
    sizeClass
  );
}
