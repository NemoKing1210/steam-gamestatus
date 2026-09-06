import {
  BADGE_CLASS,
  CARD_ROOT_MARGIN,
  HYDRATE_BATCH_SIZE,
  MUTATION_OBSERVER_OPTIONS,
  SCROLL_IDLE_MS,
} from '../../core/constants.js';
import { getSettings } from '../../core/settings.js';
import { loadGame } from '../../api/gamestatus.js';
import { bindCardContextTooltip, bindCardHotkeyTooltip, bindCardHoverTooltip, createLoaderBadge, ensureRelativePosition, renderBadge } from '../badge/index.js';
import { extractAppIdFromHref, findAppAnchor, isDsAppCapsule } from '../../utils/slug.js';
import { getCardTitle, getPageAppId, isGamePage } from '../../utils/steam-dom.js';
import { t } from '../../i18n/index.js';

let cardsObserver = null;
let isScrolling = false;
let scrollIdleTimer = null;
let hydrateFlushRaf = null;
let scrollListenerInstalled = false;
let keyTrackerInstalled = false;
/** e.code values currently held down (hotkey display mode) */
const pressedCodes = new Set();
/** card element → AbortController for its tooltip binding */
const cardBindControllers = new WeakMap();
/** every live binding controller, for bulk abort on display-mode switch */
const liveBindControllers = new Set();
/** @type {Array<{ card: Element, appId: string, link: HTMLAnchorElement|{ href: string }, title: string }>} */
const hydrationQueue = [];

export function setMutationObserver(observer) {
  cardsObserver = observer;
}

export function pauseMutationObserver() {
  cardsObserver?.disconnect();
}

export function resumeMutationObserver() {
  if (cardsObserver && document.body) {
    cardsObserver.observe(document.body, MUTATION_OBSERVER_OPTIONS);
  }
}

export function isRelevantAddedNode(node) {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  const el = /** @type {Element} */ (node);
  if (el.id === 'gs-panel-overlay' || el.id === 'gs-panel' || el.id === 'gs-settings-btn') return false;
  if (el.closest?.('#gs-panel-overlay')) return false;
  if (el.classList?.contains(BADGE_CLASS)) return false;
  if (el.closest?.(`.${BADGE_CLASS}__tooltip`)) return false;
  if (el.closest?.('[data-gs-observed="1"]')) {
    const observed = el.closest('[data-gs-observed="1"]');
    if (observed && !hasMultipleGames(observed)) return false;
  }
  if (el.matches?.('a[href*="/app/"]')) return true;
  return Boolean(el.querySelector?.('a[href*="/app/"]'));
}

export function isFeaturedWideCarouselCard(card) {
  return (
    card?.classList?.contains('store_main_capsule') &&
    Boolean(card.closest('.carousel_wide_mode'))
  );
}

export function isCarouselBadgeVisible(card) {
  if (!isFeaturedWideCarouselCard(card)) return true;
  return card.classList.contains('focus');
}

export function verifyBadgeAppId(card, anchor) {
  const expectedAppId = getCardAppId(card);
  if (!expectedAppId || !anchor) return false;

  const badge = anchor.querySelector(`.${BADGE_CLASS}:not(.${BADGE_CLASS}--loading)`);
  if (!badge) return false;

  if (badge.dataset.gsAppId && badge.dataset.gsAppId !== expectedAppId) {
    badge.remove();
    resetBadgeAnchor(anchor);
    if (card !== anchor && card.dataset.gsObserved === '1') {
      delete card.dataset.gsObserved;
      delete card.dataset.gsAppId;
      delete card.dataset.gsTitle;
    }
    return true;
  }

  return false;
}

export function collectRelevantMutations(mutations) {
  const nodes = [];
  let needsRescan = false;

  for (const mutation of mutations) {
    if (mutation.type === 'attributes') {
      const target = mutation.target;
      if (!(target instanceof Element)) continue;

      if (mutation.attributeName === 'class' && isFeaturedWideCarouselCard(target)) {
        if (target.classList.contains('focus')) {
          const anchor = getBadgeAnchor(target);
          if (verifyBadgeAppId(target, anchor)) {
            needsRescan = true;
          }
          nodes.push(target);
        }
        continue;
      }

      if (!target.hasAttribute('data-ds-appid')) continue;
      if (resetStaleCapsuleBadge(target)) {
        needsRescan = true;
      }
      nodes.push(target);
      continue;
    }

    for (const node of mutation.addedNodes) {
      if (isRelevantAddedNode(node)) {
        nodes.push(/** @type {Element} */ (node));
      }
    }
  }

  if (needsRescan && !nodes.length) {
    nodes.push(document.body);
  }

  return nodes;
}

export function getChartRowLink(row) {
  const titleLink = row.querySelector('td a[href*="/app/"] img[src*="/apps/"]')?.closest('a');
  return titleLink || row.querySelector('a[href*="/app/"]');
}

export function getCardAppId(card) {
  if (!card) return null;

  // Prefer href on <a /app/{id}/> — SteamPeek (and similar) put the page app id in data-ds-appid
  if (card instanceof HTMLAnchorElement) {
    const fromHref = extractAppIdFromHref(card.href);
    if (fromHref) return fromHref;
  }

  const fromAttr = card.getAttribute('data-ds-appid') || card.dataset.dsAppid;
  if (fromAttr) return fromAttr;

  if (isChartTableRow(card)) {
    const link = getChartRowLink(card);
    return link ? extractAppIdFromHref(link.href) : null;
  }

  return null;
}

export function resolveCardAppId(card, fallbackAppId) {
  return getCardAppId(card) || String(fallbackAppId || '');
}

export function countDistinctAppIds(element) {
  if (!element) return 0;
  return new Set(
    [...element.querySelectorAll('[data-ds-appid]')]
      .map((el) => el.getAttribute('data-ds-appid'))
      .filter(Boolean)
  ).size;
}

export function hasMultipleGames(element) {
  return countDistinctAppIds(element) > 1;
}

export function findDsAppCard(link) {
  const appId = extractAppIdFromHref(link.href);
  if (!appId) return null;

  // Link itself is the capsule; href wins when data-ds-appid mismatches (SteamPeek)
  if (link.hasAttribute('data-ds-appid')) {
    return link;
  }

  const inner =
    link.querySelector(`[data-ds-appid="${appId}"]`) || link.querySelector('[data-ds-appid]');
  if (inner) {
    const innerId = inner.getAttribute('data-ds-appid');
    if (!innerId || innerId === appId) return inner;
  }

  const ancestor = link.closest('[data-ds-appid]');
  if (ancestor?.getAttribute('data-ds-appid') === appId) return ancestor;

  return null;
}


export function tryAddCardFromLink(link, cards) {
  if (link.classList.contains(BADGE_CLASS)) return;
  if (link.closest('.home_content_reason')) return;
  // Own settings UI also links to /app/{id} (cache entry list) — never treat
  // it as store cards (mirrors isRelevantAddedNode for the full-scan path).
  if (link.closest?.('#gs-panel-overlay, #gs-settings-btn')) return;
  const appId = extractAppIdFromHref(link.href);
  if (!appId) return;
  // Game page header badge is handled separately — skip same-app capsules
  if (isGamePage() && appId === getPageAppId()) return;

  const card = findCardContainer(link);
  if (!card || card.closest('.apphub_AppName, .game_area_purchase, #game_highlights')) return;
  if (!isCarouselBadgeVisible(card)) return;

  const cardAppId = getCardAppId(card);
  if (cardAppId && cardAppId !== appId) return;

  const anchor = getBadgeAnchor(card);
  if (!anchor) return;
  if (anchor.querySelector(`.${BADGE_CLASS}:not(.${BADGE_CLASS}--loading)`)) return;
  if (anchor.dataset.gsObserved === '1' && anchor.querySelector(`.${BADGE_CLASS}--loading`)) return;

  const cardLink = getCardLink(card) || link;
  const title = getCardTitle(card, cardLink, getCardLink);
  const resolvedAppId = cardAppId || appId;
  const existing = cards.get(resolvedAppId);
  if (!existing || shouldPreferCard(card, existing.card)) {
    cards.set(resolvedAppId, { card, link: cardLink, title });
  }
}

export function collectCardsFromRoot(root, cards = new Map()) {
  if (root instanceof HTMLAnchorElement && root.href.includes('/app/')) {
    tryAddCardFromLink(root, cards);
  }
  root.querySelectorAll('a[href*="/app/"]').forEach((link) => tryAddCardFromLink(link, cards));
  return cards;
}

export function resolveCardLink(card) {
  if (card instanceof HTMLAnchorElement && /\/app\/\d+/i.test(card.href)) {
    return card;
  }
  return getCardLink(card);
}

export function isChartTableRow(element) {
  return Boolean(element?.matches?.('tr') && element.querySelector('[class*="StoreSalePriceWidgetContainer"]'));
}

export function findChartTableRow(link) {
  const row = link.closest('tr');
  if (!row) return null;

  const priceAnchor = row.querySelector('[class*="StoreSalePriceWidgetContainer"]');
  if (!priceAnchor) return null;

  const rowAppIds = new Set(
    [...row.querySelectorAll('a[href*="/app/"]')]
      .map((anchor) => extractAppIdFromHref(anchor.href))
      .filter(Boolean)
  );
  if (rowAppIds.size !== 1) return null;

  const linkAppId = extractAppIdFromHref(link.href);
  if (linkAppId && !rowAppIds.has(linkAppId)) return null;

  return row;
}

export function getChartPriceAnchor(row) {
  return row.querySelector('[class*="StoreSalePriceWidgetContainer"]');
}

export function findHomeContentGamelink(link) {
  const homeRoot = link.closest('.home_content.single, .home_content_single_ctn');
  if (!homeRoot) return null;

  const gamelink = homeRoot.querySelector('.home_content_items[data-ds-appid], .gamelink[data-ds-appid]');
  if (!gamelink) return null;

  const linkAppId = extractAppIdFromHref(link.href);
  const cardAppId = getCardAppId(gamelink);
  if (linkAppId && cardAppId && linkAppId !== cardAppId) return null;

  return gamelink;
}

export function getCapsuleImageAnchor(card) {
  if (!card) return null;

  return (
    card.querySelector('.microtrailer_wrapper') ||
    card.querySelector('.capsule.capsule_image_ctn.main_capsule') ||
    card.querySelector('.capsule_image_ctn.main_capsule') ||
    card.querySelector('.capsule.capsule_image_ctn') ||
    card.querySelector('.capsule_image_ctn') ||
    card.querySelector('a.capsule_image_ctn')
  );
}

export function getBadgeAnchor(card) {
  if (!card) return card;

  if (isChartTableRow(card)) {
    const priceAnchor = getChartPriceAnchor(card);
    if (priceAnchor) return priceAnchor;
  }

  const imageAnchor = getCapsuleImageAnchor(card);
  if (imageAnchor) return imageAnchor;

  const homeRoot = card.closest('.home_content.single, .home_content_single_ctn');
  if (homeRoot) {
    const gamelink = homeRoot.querySelector('.home_content_items[data-ds-appid], .gamelink[data-ds-appid]');
    return (
      getCapsuleImageAnchor(gamelink) ||
      gamelink ||
      card
    );
  }

  return card;
}

export function cleanupMisplacedHomeBadge(card) {
  const homeRoot = card.closest('.home_content.single, .home_content_single_ctn');
  if (!homeRoot) return;

  homeRoot.querySelectorAll('.single_buttonbar .' + BADGE_CLASS).forEach((badge) => badge.remove());
}

export function cleanupMisplacedGroupBadge(card, anchor) {
  if (!card || !hasMultipleGames(card)) return;

  cleanupMisplacedCapsuleBadges(card, anchor);

  if (card.dataset.gsObserved === '1' && card !== anchor) {
    delete card.dataset.gsObserved;
    delete card.dataset.gsAppId;
    delete card.dataset.gsTitle;
  }
}

export function cleanupMisplacedCapsuleBadges(card, anchor) {
  if (!card || !anchor) return;

  card.querySelectorAll('.' + BADGE_CLASS).forEach((badge) => {
    if (!anchor.contains(badge)) badge.remove();
  });

  const anchorBadges = [...anchor.querySelectorAll('.' + BADGE_CLASS)];
  anchorBadges.slice(1).forEach((badge) => badge.remove());
}

export function resetStaleCapsuleBadge(card) {
  if (!card?.hasAttribute?.('data-ds-appid')) return false;

  const appId = getCardAppId(card);
  if (!appId) return false;

  const anchor = getBadgeAnchor(card);
  if (anchor.dataset.gsObserved !== '1' || anchor.dataset.gsAppId === appId) return false;

  resetBadgeAnchor(anchor);
  if (card !== anchor && card.dataset.gsObserved === '1') {
    delete card.dataset.gsObserved;
    delete card.dataset.gsAppId;
    delete card.dataset.gsTitle;
  }
  return true;
}

export function shouldPreferCard(candidate, current) {
  if (!current) return true;
  if (current.contains(candidate)) return false;
  if (candidate.contains(current)) return true;

  if (isDsAppCapsule(candidate) && !isDsAppCapsule(current)) return true;
  if (isDsAppCapsule(current) && !isDsAppCapsule(candidate)) return false;

  if (isChartTableRow(candidate) && !isChartTableRow(current)) return true;
  if (isChartTableRow(current) && !isChartTableRow(candidate)) return false;

  const candidateAnchor = getBadgeAnchor(candidate);
  const currentAnchor = getBadgeAnchor(current);
  const candidateHasImage = candidateAnchor !== candidate;
  const currentHasImage = currentAnchor !== current;
  return candidateHasImage && !currentHasImage;
}

export function findCardContainer(link) {
  const chartRow = findChartTableRow(link);
  if (chartRow) return chartRow;

  const homeGamelink = findHomeContentGamelink(link);
  if (homeGamelink) return homeGamelink;

  const dsCard = findDsAppCard(link);
  if (dsCard) return dsCard;

  const appId = extractAppIdFromHref(link.href);
  const container = link.closest(
    [
      '[data-ds-appid]',
      '.sale_capsule',
      '.tab_row_item',
      '.search_result_row',
      '.browse_item',
      '.store_capsule',
      '.capsule',
      '.home_content_items',
      '.gamelink',
      '.Panel',
      'div[class*="Capsule"]',
      'div[class*="Item"]',
    ].join(', ')
  );

  if (container && hasMultipleGames(container) && appId) {
    const specific = container.querySelector(`[data-ds-appid="${appId}"]`);
    if (specific) return specific;
    return null;
  }

  if (container?.classList.contains('single_buttonbar')) {
    const gamelink = findHomeContentGamelink(link);
    if (gamelink) return gamelink;
  }

  return container || link.parentElement;
}

export function getCardLink(card) {
  if (card instanceof HTMLAnchorElement && card.href.includes('/app/')) {
    return card;
  }

  const cardAppId = getCardAppId(card);
  if (cardAppId) {
    const matched =
      findAppAnchor(card, cardAppId, { includeClosest: isDsAppCapsule(card) }) ||
      (isDsAppCapsule(card) ? findAppAnchor(card.parentElement, cardAppId, { includeClosest: true }) : null);
    if (matched) return matched;
  }

  if (isChartTableRow(card)) {
    const titleLink = getChartRowLink(card);
    if (titleLink) return titleLink;
  }

  return card.querySelector('a[href*="/app/"]');
}

export function collectCards() {
  return collectCardsFromRoot(document);
}

export function collectCardsFromNodes(nodes) {
  const cards = new Map();
  nodes.forEach((node) => collectCardsFromRoot(node, cards));
  return cards;
}

export function enqueueHydration(card, appId, link, title) {
  const anchor = getBadgeAnchor(card);
  visibilityObserver.unobserve(anchor);
  hydrationQueue.push({ card, appId, link, title });
  if (!isScrolling) {
    flushHydrationQueue();
  }
}

export function flushHydrationQueue() {
  if (hydrateFlushRaf || hydrationQueue.length === 0 || isScrolling) return;

  hydrateFlushRaf = requestAnimationFrame(() => {
    hydrateFlushRaf = null;
    const batch = hydrationQueue.splice(0, HYDRATE_BATCH_SIZE);
    batch.forEach(({ card, appId, link, title }) => {
      hydrateCard(card, appId, link, title);
    });
    if (hydrationQueue.length > 0) {
      flushHydrationQueue();
    }
  });
}

export function setupScrollListener() {
  window.addEventListener(
    'scroll',
    () => {
      isScrolling = true;
      clearTimeout(scrollIdleTimer);
      scrollIdleTimer = setTimeout(() => {
        isScrolling = false;
        flushHydrationQueue();
      }, SCROLL_IDLE_MS);
    },
    { passive: true }
  );
}

export function setupKeyTracker() {
  if (keyTrackerInstalled) return;
  keyTrackerInstalled = true;
  window.addEventListener('keydown', (e) => {
    pressedCodes.add(e.code);
  });
  window.addEventListener('keyup', (e) => {
    pressedCodes.delete(e.code);
  });
  window.addEventListener('blur', () => pressedCodes.clear());
}

export function isDisplayKeyHeld(e) {
  const code = getSettings().displayKey;
  const mod = /^(Alt|Control|Shift|Meta)/.exec(code || '');
  if (mod) return !!e[`${mod[1].toLowerCase()}Key`];
  return pressedCodes.has(code);
}

export function getCardBindSignal(card) {
  cardBindControllers.get(card)?.abort();
  const ac = new AbortController();
  cardBindControllers.set(card, ac);
  liveBindControllers.add(ac);
  ac.signal.addEventListener('abort', () => liveBindControllers.delete(ac));
  return ac.signal;
}

export const visibilityObserver = new IntersectionObserver(
  (entries) => {
    if (!isBadgeDisplayMode()) return;
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const anchor = entry.target;
      const card =
        anchor.closest('[data-ds-appid]') ||
        anchor.closest('tr') ||
        anchor.closest('.home_content_items[data-ds-appid], .gamelink[data-ds-appid], [data-ds-appid]') ||
        anchor;
      if (!isCarouselBadgeVisible(card)) return;

      const appId = resolveCardAppId(card, anchor.dataset.gsAppId);
      if (!appId) return;

      const link = getCardLink(card) || resolveCardLink(card);
      const title = anchor.dataset.gsTitle || getCardTitle(card, link, getCardLink);
      enqueueHydration(card, appId, link, title);
    });
  },
  { root: null, rootMargin: CARD_ROOT_MARGIN, threshold: 0.05 }
);

export function resetBadgeAnchor(anchor) {
  anchor.querySelectorAll(`.${BADGE_CLASS}`).forEach((badge) => badge.remove());
  visibilityObserver.unobserve(anchor);
  delete anchor.dataset.gsObserved;
  delete anchor.dataset.gsAppId;
  delete anchor.dataset.gsTitle;
}
export function isBadgeDisplayMode() {
  return getSettings().cardDisplay === 'badge';
}
export function shouldRenderMissingBadge(entry) {
  if (entry?.data) return true;
  return getSettings().showMissingBadge !== false;
}

async function resolveHoverEntry(card, link, title, fallbackAppId) {
  try {
    const liveId = resolveCardAppId(card, fallbackAppId);
    if (!liveId) return null;
    const liveLink = getCardLink(card) || link;
    const liveTitle = title || getCardTitle(card, liveLink, getCardLink);
    const entry = await loadGame(liveId, liveLink, liveTitle);
    if (resolveCardAppId(card, fallbackAppId) !== liveId) return null;
    // Hover mode always shows the card — missing games render "not in database".
    return entry;
  } catch {
    return null;
  }
}
export async function hydrateCard(card, appId, link, title) {
  const anchor = getBadgeAnchor(card);
  const isChart = isChartTableRow(card);
  const resolvedAppId = resolveCardAppId(card, appId);
  const resolvedLink = getCardLink(card) || link;
  if (!isBadgeDisplayMode()) {
    anchor.querySelector(`.${BADGE_CLASS}--loading`)?.remove();
    return;
  }
  const resolvedTitle = title || getCardTitle(card, resolvedLink, getCardLink);
  const loader = anchor.querySelector(`.${BADGE_CLASS}--loading`);

  if (anchor.dataset.gsAppId && anchor.dataset.gsAppId !== resolvedAppId) {
    loader?.remove();
    return;
  }

  try {
    const entry = await loadGame(resolvedAppId, resolvedLink, resolvedTitle);
    if (anchor.dataset.gsAppId && anchor.dataset.gsAppId !== resolvedAppId) {
      loader?.remove();
      return;
    }

    if (!shouldRenderMissingBadge(entry)) {
      requestAnimationFrame(() => {
        if (anchor.dataset.gsAppId && anchor.dataset.gsAppId !== resolvedAppId) {
          loader?.remove();
          return;
        }
        loader?.remove();
        anchor.dataset.gsMissingHidden = '1';
      });
      return;
    }

    const badge = renderBadge(entry, { isChart, appId: resolvedAppId });
    requestAnimationFrame(() => {
      if (anchor.dataset.gsAppId && anchor.dataset.gsAppId !== resolvedAppId) {
        loader?.remove();
        return;
      }
      loader?.replaceWith(badge);
    });
  } catch {
    if (anchor.dataset.gsAppId && anchor.dataset.gsAppId !== resolvedAppId) {
      loader?.remove();
      return;
    }

    if (!getSettings().showMissingBadge) {
      loader?.remove();
      return;
    }

    const badge = renderBadge({ data: null, missing: true, triedUrls: [] }, { isChart, appId: resolvedAppId });
    badge.querySelector(`.${BADGE_CLASS}__label`).textContent = t('loadError');
    requestAnimationFrame(() => {
      if (anchor.dataset.gsAppId && anchor.dataset.gsAppId !== resolvedAppId) {
        loader?.remove();
        return;
      }
      loader?.replaceWith(badge);
    });
  }
}

export function observeCardsMap(cards) {
  if (!cards.size) return;

  // main.js owns the MutationObserver but not the scroll listener (per contract);
  // install the scroll/idle hydration listener from here, once.
  if (!scrollListenerInstalled) {
    scrollListenerInstalled = true;
    setupScrollListener();
    setupKeyTracker();
  }

  pauseMutationObserver();
  requestAnimationFrame(() => {
    try {
      cards.forEach(({ card, link, title }, appId) => {
        const resolvedAppId = resolveCardAppId(card, appId);
        if (getCardAppId(card) && String(appId) !== resolvedAppId) return;
        if (!isCarouselBadgeVisible(card)) return;

        if (!isBadgeDisplayMode()) {
          if (hasMultipleGames(card)) return;
          if (card.dataset.gsHoverBound === '1') return;
          const mode = getSettings().cardDisplay;
          const itemLink = getCardLink(card) || link;
          const itemTitle = title || getCardTitle(card, itemLink, getCardLink);
          const resolveEntry = () => resolveHoverEntry(card, itemLink, itemTitle, resolvedAppId);
          const getTitle = () => title || getCardTitle(card, getCardLink(card) || itemLink, getCardLink);
          const getLiveId = () => resolveCardAppId(card, resolvedAppId);
          const signal = getCardBindSignal(card);
          if (mode === 'context') {
            bindCardContextTooltip(card, resolveEntry, getTitle, getLiveId, signal);
          } else if (mode === 'hotkey') {
            bindCardHotkeyTooltip(card, resolveEntry, getTitle, getLiveId, isDisplayKeyHeld, signal);
          } else {
            bindCardHoverTooltip(card, resolveEntry, getTitle, getLiveId, signal);
          }
          return;
        }

        const anchor = getBadgeAnchor(card);
        const isChart = isChartTableRow(card);
        if (verifyBadgeAppId(card, anchor)) {
          // stale badge removed — continue to re-observe
        } else if (anchor.dataset.gsObserved === '1') {
          if (anchor.dataset.gsAppId === resolvedAppId) return;
          resetBadgeAnchor(anchor);
        }

        cleanupMisplacedHomeBadge(card);
        cleanupMisplacedGroupBadge(card, anchor);
        cleanupMisplacedCapsuleBadges(card, anchor);
        if (!isChart) {
          ensureRelativePosition(anchor);
        }
        anchor.dataset.gsObserved = '1';
        anchor.dataset.gsAppId = resolvedAppId;
        anchor.dataset.gsTitle = title;

        if (!hasMultipleGames(card) || card === anchor) {
          card.dataset.gsObserved = '1';
        }

        if (!anchor.querySelector(`.${BADGE_CLASS}`)) {
          anchor.appendChild(createLoaderBadge(false, isChart));
        }

        visibilityObserver.observe(anchor);
      });
    } finally {
      resumeMutationObserver();
    }
  });
}

export function observeCards() {
  observeCardsMap(collectCards());
}

export function observeCardsFromNodes(nodes) {
  observeCardsMap(collectCardsFromNodes(nodes));
}

/**
 * Live display-mode switch: abort on-demand tooltip bindings, drop queued
 * hydrations, strip card badges and observation state (page chips use
 * gsPageProcessed, untouched), then rescan with the new mode's triggers.
 */
export function refreshCardsForDisplayMode() {
  liveBindControllers.forEach((ac) => ac.abort());
  liveBindControllers.clear();
  hydrationQueue.length = 0;
  document.querySelectorAll('[data-gs-hover-bound="1"]').forEach((el) => {
    delete el.dataset.gsHoverBound;
  });
  document.querySelectorAll('[data-gs-observed="1"]').forEach((anchor) => {
    resetBadgeAnchor(anchor);
    delete anchor.dataset.gsMissingHidden;
  });
  observeCards();
}
