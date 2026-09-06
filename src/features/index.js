import { observeCards, observeCardsFromNodes } from './cards/index.js';
import { renderGamePage } from './game-page/index.js';
import { ensureSettingsButton } from './settings/index.js';

export { openSettings } from './settings/index.js';

/**
 * Page-scan hooks invoked on init and MutationObserver rescans.
 * `scan(nodes)` receives pending mutation nodes (empty array = full scan).
 */
export const pageFeatures = [
  {
    scan: () => {
      if (!document.getElementById('gs-settings-btn')) {
        void ensureSettingsButton();
      }
    },
  },
  {
    scan: () => {
      void renderGamePage();
    },
  },
  {
    scan: (nodes) => {
      if (Array.isArray(nodes) && nodes.length > 0) {
        observeCardsFromNodes(nodes);
      } else {
        observeCards();
      }
    },
  },
];
