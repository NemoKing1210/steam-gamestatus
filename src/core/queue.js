import { MAX_CONCURRENT, REQUEST_DELAY_MS } from './constants.js';

/** @type {Array<{ task: () => Promise<unknown>, resolve: (value: unknown) => void, reject: (reason?: unknown) => void }>} */
const queue = [];
let activeRequests = 0;

function startQueueItem(item) {
  activeRequests += 1;
  item
    .task()
    .then(item.resolve)
    .catch(item.reject)
    .finally(() => {
      activeRequests -= 1;
      setTimeout(drainQueue, REQUEST_DELAY_MS);
    });
}

function drainQueue() {
  while (activeRequests < MAX_CONCURRENT && queue.length > 0) {
    startQueueItem(queue.shift());
  }
}

export function enqueue(task) {
  return new Promise((resolve, reject) => {
    queue.push({ task, resolve, reject });
    drainQueue();
  });
}
