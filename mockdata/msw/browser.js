import { setupWorker } from 'msw/browser';
import { handlers } from './handlers/index.js';

export const worker = setupWorker(...handlers);

export async function startMsw() {
  await worker.start({
    onUnhandledRequest: APP_MSW ? 'error' : 'bypass',
    serviceWorker: {
      url: `${APP_BASE_PATH || ''}/mockServiceWorker.js`,
      options: { scope: `${APP_BASE_PATH || ''}/` },
    },
  });
}


