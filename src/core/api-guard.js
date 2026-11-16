import { GM_getValue, GM_setValue } from '$';
import {
  API_FAILURE_WINDOW_MS,
  API_GUARD_KEY,
} from './constants.js';
import { getSettings } from './settings.js';

/**
 * Circuit breaker for the GameStatus API.
 *
 * - `closed`     — normal operation.
 * - `open`       — API considered unavailable; `isApiPaused()` is true and no
 *                  requests may start until `openUntil`.
 * - `half-open`  — one recovery probe is allowed; the next failure reopens the
 *                  circuit immediately, the next success closes it.
 *
 * State survives reloads through GM storage so a dead API is not hammered
 * again on every page navigation.
 */
export const API_GUARD_CLOSED = 'closed';
export const API_GUARD_OPEN = 'open';
export const API_GUARD_HALF_OPEN = 'half-open';

let state = API_GUARD_CLOSED;
let failures = 0;
let lastFailureAt = 0;
let openUntil = 0;
let toastShown = false;
let timer = null;

/** @type {Set<(change: { state: string, reason: string, remainingMs: number }) => void>} */
const listeners = new Set();

function isEnabled() {
  return getSettings().apiGuardEnabled !== false;
}

function threshold() {
  return getSettings().apiFailureThreshold;
}

function cooldownMs() {
  return getSettings().apiCooldownMinutes * 60 * 1000;
}

function persist() {
  try {
    GM_setValue(API_GUARD_KEY, {
      state,
      failures,
      lastFailureAt,
      openUntil,
      toastShown,
    });
  } catch {
    /* storage is best-effort — never break the request pipeline */
  }
}

function notify(reason) {
  const change = {
    state,
    reason,
    remainingMs: state === API_GUARD_OPEN ? Math.max(0, openUntil - Date.now()) : 0,
  };
  listeners.forEach((listener) => {
    try {
      listener(change);
    } catch {
      /* a broken listener must not break the guard */
    }
  });
}

function clearTimer() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

function scheduleOpenTimer() {
  clearTimer();
  const remaining = openUntil - Date.now();
  if (remaining <= 0) {
    enterHalfOpen();
    return;
  }
  timer = setTimeout(() => {
    timer = null;
    if (state === API_GUARD_OPEN && Date.now() >= openUntil) {
      enterHalfOpen();
    }
  }, remaining);
}

function enterHalfOpen() {
  clearTimer();
  state = API_GUARD_HALF_OPEN;
  openUntil = 0;
  toastShown = false;
  persist();
  notify('retry');
}

function openCircuit() {
  clearTimer();
  state = API_GUARD_OPEN;
  openUntil = Date.now() + cooldownMs();
  toastShown = true;
  persist();
  scheduleOpenTimer();
  notify('paused');
}

export function isApiPaused() {
  if (!isEnabled()) return false;
  if (state !== API_GUARD_OPEN) return false;
  if (Date.now() >= openUntil) {
    enterHalfOpen();
    return false;
  }
  return true;
}

export function registerApiFailure() {
  if (!isEnabled()) return;
  const now = Date.now();

  if (state === API_GUARD_OPEN) {
    // The timer was throttled (background tab) and the cooldown already
    // elapsed: treat this request as the recovery probe.
    if (now >= openUntil) {
      state = API_GUARD_HALF_OPEN;
      openUntil = 0;
      toastShown = false;
    } else {
      return;
    }
  }

  if (now - lastFailureAt > API_FAILURE_WINDOW_MS) {
    failures = 0;
  }
  failures += 1;
  lastFailureAt = now;

  if (state === API_GUARD_HALF_OPEN || failures >= threshold()) {
    openCircuit();
    return;
  }
  persist();
}

export function registerApiSuccess() {
  if (state === API_GUARD_CLOSED && failures === 0) return;

  const wasPaused = state === API_GUARD_OPEN || state === API_GUARD_HALF_OPEN;
  clearTimer();
  state = API_GUARD_CLOSED;
  failures = 0;
  lastFailureAt = 0;
  openUntil = 0;
  toastShown = false;
  persist();
  if (wasPaused) notify('resumed');
}

/** Manual recovery from the toast action / settings panel. */
export function retryApiNow() {
  if (!isEnabled()) return;
  if (state === API_GUARD_CLOSED) return;
  enterHalfOpen();
}

/**
 * Re-apply guard settings after the panel saves. Disabling the guard clears
 * any open circuit; lowering the threshold below the recent failure count
 * opens it right away.
 */
export function syncApiGuardSettings() {
  if (!isEnabled()) {
    clearTimer();
    const changed =
      state !== API_GUARD_CLOSED || failures !== 0 || openUntil !== 0 || toastShown;
    state = API_GUARD_CLOSED;
    failures = 0;
    lastFailureAt = 0;
    openUntil = 0;
    toastShown = false;
    persist();
    if (changed) notify('settings');
    return;
  }

  if (state === API_GUARD_CLOSED && failures >= threshold()) {
    openCircuit();
    return;
  }

  // New threshold/cooldown values apply to the running circuit.
  if (state === API_GUARD_OPEN) {
    openUntil = Math.min(openUntil, Date.now() + cooldownMs());
    scheduleOpenTimer();
  }
  persist();
}

export function getApiGuardStatus() {
  const enabled = isEnabled();
  const now = Date.now();
  const openActive = state === API_GUARD_OPEN && now < openUntil;
  const paused = enabled && openActive;
  return {
    enabled,
    paused,
    // A throttled timer must not report a stale "open" state as healthy.
    state: !enabled
      ? API_GUARD_CLOSED
      : state === API_GUARD_OPEN && !openActive
        ? API_GUARD_HALF_OPEN
        : state,
    failures,
    threshold: threshold(),
    cooldownMinutes: getSettings().apiCooldownMinutes,
    remainingMs: paused ? Math.max(0, openUntil - now) : 0,
    until: paused ? openUntil : 0,
  };
}

/**
 * Restore persisted state at startup. A stored pause that already expired
 * becomes half-open so the initial scan is the recovery probe.
 */
export function loadApiGuardState() {
  if (!isEnabled()) {
    state = API_GUARD_CLOSED;
    failures = 0;
    openUntil = 0;
    toastShown = false;
    persist();
    return;
  }

  let stored = null;
  try {
    stored = GM_getValue(API_GUARD_KEY, null);
  } catch {
    stored = null;
  }
  if (!stored || typeof stored !== 'object') return;

  const now = Date.now();
  failures = Number.isFinite(Number(stored.failures)) ? Math.max(0, Number(stored.failures)) : 0;
  lastFailureAt = Number(stored.lastFailureAt) || 0;
  openUntil = Number(stored.openUntil) || 0;
  toastShown = stored.toastShown === true;
  state =
    stored.state === API_GUARD_OPEN || stored.state === API_GUARD_HALF_OPEN
      ? stored.state
      : API_GUARD_CLOSED;

  if (now - lastFailureAt > API_FAILURE_WINDOW_MS) {
    failures = 0;
    lastFailureAt = 0;
  }

  if (state === API_GUARD_OPEN) {
    if (now >= openUntil) {
      enterHalfOpen();
      return;
    }
    scheduleOpenTimer();
    if (!toastShown) {
      toastShown = true;
      persist();
      notify('paused');
    }
    return;
  }

  if (state === API_GUARD_HALF_OPEN) {
    // Keep the probe window: the initial page scan will make the attempt.
    return;
  }

  if (failures >= threshold()) {
    openCircuit();
    return;
  }
  persist();
}

/** @returns {() => void} unsubscribe */
export function onApiGuardChange(listener) {
  if (typeof listener !== 'function') return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}
