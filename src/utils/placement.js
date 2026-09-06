/**
 * Viewport-adaptive placement for the GameStatus popover card.
 *
 * `cardPosition` is only a preference: sides are tried in order — the
 * preferred side, its opposite, then the perpendicular pair — and the first
 * placement fully inside the padded viewport wins. When no side fits
 * completely (very small viewport / very tall card), the side with the
 * largest visible area is kept and clamped into the viewport.
 *
 * Pure module: no DOM, no GM APIs — safe for Node smoke tests.
 */

export const TOOLTIP_PAD = 15;
export const TOOLTIP_GAP = 7;

/** @param {string} preferred */
export function tooltipSideOrder(preferred) {
  if (preferred === 'right') return ['right', 'left', 'top', 'bottom'];
  if (preferred === 'top') return ['top', 'bottom', 'left', 'right'];
  if (preferred === 'bottom') return ['bottom', 'top', 'left', 'right'];
  return ['left', 'right', 'top', 'bottom'];
}

/**
 * Top-left for a candidate side next to the anchor rect. Left/right align the
 * tooltip's near vertical edge to the anchor and center vertically; top/bottom
 * center horizontally.
 * @param {'left'|'right'|'top'|'bottom'} side
 * @param {{left: number, top: number, width: number, height: number}} rect
 * @param {number} tipWidth
 * @param {number} tipHeight
 */
export function tooltipPosForSide(side, rect, tipWidth, tipHeight) {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  switch (side) {
    case 'left':
      return { left: rect.left - TOOLTIP_GAP - tipWidth, top: centerY - tipHeight / 2 };
    case 'right':
      return { left: rect.left + rect.width + TOOLTIP_GAP, top: centerY - tipHeight / 2 };
    case 'top':
      return { left: centerX - tipWidth / 2, top: rect.top - TOOLTIP_GAP - tipHeight };
    case 'bottom':
      return { left: centerX - tipWidth / 2, top: rect.top + rect.height + TOOLTIP_GAP };
    default:
      return { left: rect.left, top: rect.top };
  }
}

function fitsViewport(pos, tipWidth, tipHeight, viewportWidth, viewportHeight) {
  return (
    pos.left >= TOOLTIP_PAD &&
    pos.top >= TOOLTIP_PAD &&
    pos.left + tipWidth <= viewportWidth - TOOLTIP_PAD &&
    pos.top + tipHeight <= viewportHeight - TOOLTIP_PAD
  );
}

function visibleArea(pos, tipWidth, tipHeight, viewportWidth, viewportHeight) {
  const x0 = Math.max(pos.left, TOOLTIP_PAD);
  const x1 = Math.min(pos.left + tipWidth, viewportWidth - TOOLTIP_PAD);
  const y0 = Math.max(pos.top, TOOLTIP_PAD);
  const y1 = Math.min(pos.top + tipHeight, viewportHeight - TOOLTIP_PAD);
  return Math.max(0, x1 - x0) * Math.max(0, y1 - y0);
}

function clamp(pos, tipWidth, tipHeight, viewportWidth, viewportHeight) {
  const maxLeft = viewportWidth - tipWidth - TOOLTIP_PAD;
  const maxTop = viewportHeight - tipHeight - TOOLTIP_PAD;
  return {
    left: Math.max(TOOLTIP_PAD, Math.min(pos.left, maxLeft)),
    top: Math.max(TOOLTIP_PAD, Math.min(pos.top, maxTop)),
  };
}

/**
 * @param {object} params
 * @param {string} params.preferred   Normalized `cardPosition` ('left' default).
 * @param {{left: number, top: number, width: number, height: number}} params.anchor
 *   Target bounding rect in viewport coordinates.
 * @param {number} params.tipWidth
 * @param {number} params.tipHeight
 * @param {number} params.viewportWidth
 * @param {number} params.viewportHeight
 * @returns {{left: number, top: number}} Final tooltip top-left in viewport px.
 */
export function resolveTooltipPlacement({
  preferred,
  anchor,
  tipWidth,
  tipHeight,
  viewportWidth,
  viewportHeight,
}) {
  let bestPos = null;
  let bestArea = -1;

  for (const side of tooltipSideOrder(preferred)) {
    const pos = tooltipPosForSide(side, anchor, tipWidth, tipHeight);
    if (fitsViewport(pos, tipWidth, tipHeight, viewportWidth, viewportHeight)) {
      return pos;
    }
    const area = visibleArea(pos, tipWidth, tipHeight, viewportWidth, viewportHeight);
    if (area > bestArea) {
      bestArea = area;
      bestPos = pos;
    }
  }

  return clamp(bestPos, tipWidth, tipHeight, viewportWidth, viewportHeight);
}
