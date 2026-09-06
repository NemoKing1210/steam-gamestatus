import { getLocale } from '../i18n/index.js';

export function getApiLanguage() {
  return navigator.language || 'en-US';
}

export function getLocalizedGroup(game) {
  if (!game) return null;
  if (getLocale() === 'ru') return game.hacked_groups || game.hacked_groups_en;
  return game.hacked_groups_en || game.hacked_groups;
}

export function getLocalizedDescription(game) {
  if (!game) return '';
  if (getLocale() === 'ru') return game.description || game.description_en;
  return game.description_en || game.description;
}

export function truncateText(text, maxLength = 140) {
  const value = String(text || '').trim();
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}…`;
}

export function parseGameDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value) {
  if (!value) return null;
  const date = parseGameDate(value);
  if (!date) return value;
  return date.toLocaleDateString(getApiLanguage());
}

export function formatScore(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? `${number}` : String(value);
}

export function formatCacheBytes(n) {
  const bytes = Math.max(0, Number(n) || 0);
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
