import { retryApiNow } from '../../core/api-guard.js';
import { t } from '../../i18n/index.js';
import { dismissToast, showToast } from '../toast/index.js';

const PAUSED_TOAST_ID = 'gs-api-paused';
const RESUMED_TOAST_ID = 'gs-api-resumed';

function pausedMinutes(change = {}) {
  const fromRemaining = Math.ceil(Number(change.remainingMs || 0) / 60000);
  if (fromRemaining > 0) return fromRemaining;
  return Math.max(1, Number(change.cooldownMinutes) || 1);
}

export function showApiPausedToast(change = {}) {
  showToast({
    id: PAUSED_TOAST_ID,
    variant: 'warning',
    message: t('apiPausedToast', { minutes: pausedMinutes(change) }),
    duration: 12000,
    closeLabel: t('close'),
    action: {
      label: t('apiGuardRetry'),
      onClick: () => retryApiNow(),
    },
  });
}

export function showApiResumedToast() {
  dismissToast(PAUSED_TOAST_ID);
  showToast({
    id: RESUMED_TOAST_ID,
    variant: 'success',
    message: t('apiResumedToast'),
    duration: 7000,
    closeLabel: t('close'),
  });
}
