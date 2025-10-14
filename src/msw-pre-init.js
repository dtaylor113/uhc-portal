/**
 * MSW PRE-INITIALIZATION
 *
 * This file is loaded BEFORE webpack bundles (via HtmlWebpackPlugin)
 * It registers the service worker BEFORE Module Federation loads
 */

(function () {
  console.log('[MSW Pre-Init] Starting service worker pre-registration...');
  console.log('[MSW Pre-Init] Current URL:', window.location.href);

  // Check if MSW mode is enabled
  const urlParams = new URLSearchParams(window.location.search);
  const urlParamValue = urlParams.get('env');
  const storedEnv = localStorage.getItem('ocmOverridenEnvironment');

  // If URL param is set, save it to localStorage for persistence
  if (urlParamValue === 'msw-mockdata' && storedEnv !== 'msw-mockdata') {
    console.log('[MSW Pre-Init] URL param detected, saving to localStorage for future sessions');
    localStorage.setItem('ocmOverridenEnvironment', 'msw-mockdata');
  }

  const isMswMode = urlParamValue === 'msw-mockdata' || storedEnv === 'msw-mockdata';

  if (!isMswMode) {
    console.log('[MSW Pre-Init] Not in MSW mode (env param or localStorage not set)');
    console.log('[MSW Pre-Init] To enable: add ?env=msw-mockdata to URL');
    return;
  }

  console.log('[MSW Pre-Init] ✅ MSW mode detected!');
  console.log('[MSW Pre-Init] URL param:', urlParams.get('env'));
  console.log('[MSW Pre-Init] localStorage:', storedEnv);

  if (!('serviceWorker' in navigator)) {
    console.error('[MSW Pre-Init] ❌ Service Workers not supported in this browser');
    return;
  }

  console.log('[MSW Pre-Init] Registering service worker from /mockServiceWorker.js...');

  // Register service worker
  navigator.serviceWorker
    .register('/mockServiceWorker.js', {
      scope: '/',
    })
    .then(function (registration) {
      console.log('[MSW Pre-Init] ✅ Service worker registered!');
      console.log('[MSW Pre-Init] Scope:', registration.scope);
      console.log(
        '[MSW Pre-Init] State:',
        registration.installing?.state || registration.waiting?.state || registration.active?.state,
      );

      // Mark that we pre-registered (so app code doesn't try again)
      window.__MSW_PRE_REGISTERED__ = true;

      // Wait for activation if needed
      if (registration.installing) {
        console.log('[MSW Pre-Init] Service worker installing, waiting for activation...');
        registration.installing.addEventListener('statechange', function (e) {
          console.log('[MSW Pre-Init] Service worker state changed to:', e.target.state);
          if (e.target.state === 'activated') {
            console.log('[MSW Pre-Init] ✅ Service worker activated!');
          }
        });
      } else if (registration.active) {
        console.log('[MSW Pre-Init] ✅ Service worker already active!');
      }

      // The MSW library will send the initialization messages when it loads
      console.log(
        '[MSW Pre-Init] Pre-registration complete. Waiting for MSW library to initialize handlers...',
      );
    })
    .catch(function (error) {
      console.error('[MSW Pre-Init] ❌ Service worker registration failed:', error);
      console.error('[MSW Pre-Init] Error details:', error.message);
    });
})();
