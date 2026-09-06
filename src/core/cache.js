import { GM_getValue, GM_setValue } from '$';
import { CACHE_KEY, CACHE_PERSIST_MS, CACHE_SOFT_LIMIT_BYTES } from './constants.js';
import { getCacheTtlMs } from './settings.js';

/** @type {Map<string, Promise<any|null>>} */
export const inflight = new Map();
/** @type {Record<string, unknown>|null} */
let memoryCache = null;
let cacheDirty = false;
let cachePersistTimer = null;

export function loadMemoryCache() {
  if (memoryCache) return memoryCache;
  try {
    memoryCache = JSON.parse(GM_getValue(CACHE_KEY, '{}')) || {};
  } catch {
    memoryCache = {};
  }
  return memoryCache;
}

export function readCache() {
  return loadMemoryCache();
}

export function persistCacheNow() {
  if (!cacheDirty || !memoryCache) return;
  GM_setValue(CACHE_KEY, JSON.stringify(memoryCache));
  cacheDirty = false;
}

export function scheduleCachePersist() {
  cacheDirty = true;
  clearTimeout(cachePersistTimer);
  cachePersistTimer = setTimeout(persistCacheNow, CACHE_PERSIST_MS);
}

export function writeCache(cache) {
  memoryCache = cache;
  scheduleCachePersist();
}

export function getCached(appId) {
  const ttl = getCacheTtlMs();
  if (ttl <= 0) return null;
  const entry = readCache()[String(appId)];
  if (!entry) return null;
  if (Date.now() - entry.ts > ttl) return null;
  return entry;
}

export function setCached(appId, payload) {
  if (getCacheTtlMs() <= 0) return;
  const cache = readCache();
  cache[String(appId)] = { ...payload, ts: Date.now() };
  writeCache(cache);
}

export function getCacheEntryCount() {
  return Object.keys(readCache()).length;
}

export function clearGameCache() {
  const count = getCacheEntryCount();
  memoryCache = {};
  cacheDirty = false;
  clearTimeout(cachePersistTimer);
  cachePersistTimer = null;
  GM_setValue(CACHE_KEY, '{}');
  inflight.clear();
  return count;
}

const textEncoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

function entryByteSize(appId, entry) {
  const json = JSON.stringify({ [appId]: entry });
  if (textEncoder) return textEncoder.encode(json).length;
  return json.length;
}

export function removeGameCacheEntry(appId) {
  const cache = readCache();
  const key = String(appId);
  if (!(key in cache)) return false;
  delete cache[key];
  inflight.delete(key);
  scheduleCachePersist();
  return true;
}

export function listGameCacheEntries() {
  return Object.entries(readCache())
    .map(([appId, entry]) => ({
      appId,
      title: entry?.data?.title || entry?.slug || appId,
      missing: !!entry?.missing,
      bytes: entryByteSize(appId, entry),
      ts: Number(entry?.ts) || 0,
    }))
    .sort((a, b) => b.ts - a.ts);
}

export function getGameCacheStats() {
  const entries = listGameCacheEntries();
  const found = { count: 0, bytes: 0 };
  const missing = { count: 0, bytes: 0 };
  for (const entry of entries) {
    const bucket = entry.missing ? missing : found;
    bucket.count += 1;
    bucket.bytes += entry.bytes;
  }
  const usedBytes = found.bytes + missing.bytes;
  return {
    usedBytes,
    limitBytes: CACHE_SOFT_LIMIT_BYTES,
    freeBytes: Math.max(0, CACHE_SOFT_LIMIT_BYTES - usedBytes),
    totalCount: entries.length,
    found,
    missing,
  };
}
