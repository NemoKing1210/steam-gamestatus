import { TOAST_DURATION_MS } from '../../core/constants.js';
import { escapeHtml } from '../../utils/html.js';

/** @type {Map<string, { el: HTMLElement, timer: number|null, options: object }>} */
const activeToasts = new Map();

function ensureContainer() {
  let container = document.getElementById('gs-toasts');
  if (!container) {
    container = document.createElement('div');
    container.id = 'gs-toasts';
    container.className = 'gs-toast-stack';
    container.setAttribute('role', 'region');
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-label', 'GameStatus');
    document.body.appendChild(container);
  }
  return container;
}

export function dismissToast(id) {
  const item = activeToasts.get(id);
  if (!item) return;
  if (item.timer) clearTimeout(item.timer);
  item.timer = null;
  activeToasts.delete(id);
  const el = item.el;
  el.classList.add('is-leaving');
  const remove = () => el.remove();
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    remove();
    return;
  }
  setTimeout(remove, 200);
}

function startTimer(id, duration) {
  const item = activeToasts.get(id);
  if (!item || !duration || duration <= 0) return;
  if (item.timer) clearTimeout(item.timer);
  item.timer = setTimeout(() => dismissToast(id), duration);
}

function pauseTimer(id) {
  const item = activeToasts.get(id);
  if (!item?.timer) return;
  clearTimeout(item.timer);
  item.timer = null;
}

function resumeTimer(id) {
  const item = activeToasts.get(id);
  if (!item) return;
  startTimer(id, item.options.duration ?? TOAST_DURATION_MS);
}

/**
 * Small Steam-like toast in the lower-left corner. Passing the same `id`
 * replaces the previous toast instead of stacking duplicates (API outages
 * would otherwise flood the corner).
 */
export function showToast({
  id = '',
  message = '',
  variant = 'warning',
  duration = TOAST_DURATION_MS,
  action = null,
  closeLabel = 'Close',
} = {}) {
  if (!message) return () => {};

  const toastId = id || `gs-toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  if (activeToasts.has(toastId)) dismissToast(toastId);

  const container = ensureContainer();
  const toast = document.createElement('div');
  toast.className = `gs-toast gs-toast--${variant}`;
  toast.setAttribute('role', variant === 'error' ? 'alert' : 'status');
  toast.dataset.gsToastId = toastId;
  toast.innerHTML = `
    <span class="gs-toast__icon" aria-hidden="true">${variant === 'success' ? '✓' : '!'}</span>
    <div class="gs-toast__content">
      <p class="gs-toast__message">${escapeHtml(message)}</p>
      ${action ? '<button type="button" class="gs-toast__action"></button>' : ''}
    </div>
    <button type="button" class="gs-toast__close" aria-label="${escapeHtml(closeLabel)}">×</button>
  `;

  const actionBtn = toast.querySelector('.gs-toast__action');
  if (action && actionBtn) {
    actionBtn.textContent = action.label || '';
    actionBtn.addEventListener('click', () => {
      dismissToast(toastId);
      action.onClick?.();
    });
  }

  toast.querySelector('.gs-toast__close').addEventListener('click', () => dismissToast(toastId));

  activeToasts.set(toastId, { el: toast, timer: null, options: { duration } });
  container.appendChild(toast);
  startTimer(toastId, duration);

  // Keep the toast readable while the user reads/interacts with it.
  toast.addEventListener('mouseenter', () => pauseTimer(toastId));
  toast.addEventListener('mouseleave', () => resumeTimer(toastId));
  toast.addEventListener('focusin', () => pauseTimer(toastId));
  toast.addEventListener('focusout', () => resumeTimer(toastId));

  return () => dismissToast(toastId);
}
