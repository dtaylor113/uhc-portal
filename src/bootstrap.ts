/**
 * Bootstrap Entry Point
 *
 * If MSW was pre-registered in HTML (Experiment 2), we skip initialization.
 * Otherwise, we try to initialize MSW here (original approach).
 */

console.log('[Bootstrap] Checking for MSW pre-registration...');

// @ts-ignore - Set by msw-pre-init.js
if (window.__MSW_PRE_REGISTERED__) {
  console.log('[Bootstrap] ✅ MSW was pre-registered in HTML!');
  console.log('[Bootstrap] Skipping MSW initialization, loading main app...');
  import('./main');
} else {
  console.log('[Bootstrap] MSW was NOT pre-registered');
  console.log('[Bootstrap] Attempting MSW initialization from bootstrap...');

  // Check if MSW mode is enabled
  const urlParams = new URLSearchParams(window.location.search);
  const storedEnv = localStorage.getItem('ocmOverridenEnvironment');
  const isMswMode = urlParams.get('env') === 'msw-mockdata' || storedEnv === 'msw-mockdata';

  if (isMswMode && 'serviceWorker' in navigator) {
    console.log('[Bootstrap] MSW mode enabled, registering service worker...');

    navigator.serviceWorker
      .register('/mockServiceWorker.js', { scope: '/' })
      .then((registration) => {
        console.log('[Bootstrap] ✅ Service worker registered from bootstrap:', registration);
        import('./main');
      })
      .catch((error) => {
        console.error('[Bootstrap] ❌ Service worker registration failed:', error);
        console.error('[Bootstrap] Loading app anyway...');
        import('./main');
      });
  } else {
    console.log('[Bootstrap] MSW mode not enabled or service workers not supported');
    import('./main');
  }
}
