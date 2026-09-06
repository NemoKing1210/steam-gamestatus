import { BADGE_CLASS } from '../../core/constants.js';
import { getSettings } from '../../core/settings.js';
import { loadGame } from '../../api/gamestatus.js';
import { createLoaderBadge, renderBadge } from '../badge/index.js';
import { shouldRenderMissingBadge } from '../cards/index.js';
import { findAppAnchor } from '../../utils/slug.js';
import { getPageAppId, getPageTitle } from '../../utils/steam-dom.js';
import { t } from '../../i18n/index.js';

export async function renderGamePage() {
  const appId = getPageAppId();
  if (!appId) return;

  const anchor = document.querySelector('.apphub_OtherSiteInfo');
  if (!anchor || anchor.dataset.gsPageProcessed === '1') return;
  if (anchor.querySelector(`.${BADGE_CLASS}`)) return;

  anchor.dataset.gsPageProcessed = '1';

  const loader = createLoaderBadge(true);
  anchor.prepend(loader);

  const title = getPageTitle();
  const link =
    findAppAnchor(document, appId) ||
    document.querySelector(`a[href*="/app/${appId}"]`) ||
    { href: location.pathname };

  try {
    const entry = await loadGame(appId, link, title);
    if (!shouldRenderMissingBadge(entry)) {
      loader.remove();
      return;
    }
    loader.replaceWith(renderBadge(entry, { isPage: true }));
  } catch {
    if (!getSettings().showMissingBadge) {
      loader.remove();
      return;
    }
    const badge = renderBadge({ data: null, missing: true, triedUrls: [] }, { isPage: true });
    badge.querySelector(`.${BADGE_CLASS}__label`).textContent = t('loadError');
    loader.replaceWith(badge);
  }
}
