# MSW Mocking (Browser, Jest, Storybook)

This project supports MSW for browser-based API mocking when running with `?env=msw-mockdata`.

## How to Run MSW Mockdata
- One-time (or if missing): `yarn msw:init` (creates `public/mockServiceWorker.js`)
- Start dev: `yarn start`
- Open: `https://prod.foo.redhat.com:1337/openshift?env=msw-mockdata`
- Verify:
  - Banner shows: “Using the msw-mockdata environment API”
  - DevTools → Application → Service Workers: script `/openshift/mockServiceWorker.js`, scope `/openshift/`, status `activated`
  - Network: open the clusters request; the most reliable check is the presence of the `x-msw-mock: true` response header added by our handler (Chrome may also show “from ServiceWorker”).

## How to Run Legacy Mockdata
- Start dev: `yarn start`
- Open: `https://prod.foo.redhat.com:1337/openshift?env=mockdata`
- Verify:
  - Banner shows: “Using the mockdata environment API”
  - Requests hit the legacy Python server via `/mockdata/...` (dev proxy forwards to `http://[::1]:8010`)

## Detection / indicators
- MSW mode:
  - Banner says `msw-mockdata`
  - Service worker is active and requests show `x-msw-mock: true` in the response headers
- Legacy mode:
  - Banner says `mockdata`
  - Requests to `/mockdata/...` are network responses from the Python server (no `x-msw-mock` header)

## What MSW Server Supports (current)
- “Supported” means MSW intercepts these URLs and returns deterministic responses. For now, we source payloads from existing JSON fixtures for 1:1 parity. Over time, we’ll migrate to small typed TS fixtures/factories (see Best practices) to model variations without large blobs.
- Cluster List
  - `GET /api/clusters_mgmt/v1/clusters`
  - `POST /api/clusters_mgmt/v1/clusters?method=get`
  - `GET /mockdata/api/clusters_mgmt/v1/clusters`
  - `POST /mockdata/api/clusters_mgmt/v1/clusters?method=get`
- Cluster Details (minimal)
  - `GET /api/clusters_mgmt/v1/clusters/:cluster_id`
  - `GET /mockdata/api/clusters_mgmt/v1/clusters/:cluster_id`
- Cluster Status (minimal/placeholder payload)
  - `GET /api/clusters_mgmt/v1/clusters/:cluster_id/status`
  - `GET /mockdata/api/clusters_mgmt/v1/clusters/:cluster_id/status`
- MSW-only demo failure (to show difference from legacy)
  - `GET /api/clusters_mgmt/v1/clusters/:cluster_id/identity_providers` → 500
  - `GET /mockdata/api/clusters_mgmt/v1/clusters/:cluster_id/identity_providers` → 500

## Difference from Legacy System
Legacy Python serves many more endpoints from static JSON. MSW currently focuses on Cluster List and a minimal subset of Details. Notable legacy-only areas (not yet supported by MSW unless listed above):
- clusters_mgmt/v1 subresources
  - `upgrade_policies`, `limited_support_reasons`, `ingresses`, `machine_pools`/`node_pools`, `groups`, `external_auths`, `external_configuration/{syncsets,manifests,labels}`
  - `addons`, `addon_inquiries`, `gate_agreements`, `aws_infrastructure_access_role_grants`
  - `metric_queries/{nodes,cluster_operators,alerts}`
  - `logs/{install,uninstall}` (including `offset` polling behavior)
  - `identity_providers` (explicitly set to 500 in MSW demo)
- clusters_mgmt/v1 collections used across the app (if requested at runtime)
  - `versions.json`, `machine_types.json`, `products.json`, `limited_support_reason_templates.json`, `version_gates.json`, `oidc_configs.json`, `load_balancer_quota_values.json`, `storage_quota_values.json`, `dashboards/summary/*.json`, `flavours/*.json`, `gcp*.json`, `gcp_inquiries/*.json`, `aws_inquiries/*.json`
- accounts_mgmt/v1 (e.g., `current_account`, `organizations/**`, `subscriptions/**`, `feature_toggles/**`)
- insights-results-aggregator, service_logs, upgrades_info collections

These can be added to MSW incrementally as needed. Use DevTools → Network to see which endpoints the page calls and add typed handlers for those only.

## MSW Files
- `mockdata/msw/browser.js`: MSW worker bootstrap (exposes `startMsw()`)
- `mockdata/msw/handlers/index.js`: Endpoint handlers
- `src/main.tsx`: Starts MSW (imports `../mockdata/msw/browser.js`) when `?env=msw-mockdata`
- `src/config.ts`: Recognizes the `mockdata` env

## Futures
- Migrate handlers to typed TS fixtures/factories using `src/types/**` (generated from OpenAPI) for strictness and easier scenario modeling
- Wire MSW for Jest tests (node server) so unit tests can reuse the same handlers
- Use MSW in Storybook. Start with a Cluster List story powered by MSW mockdata mode, then add Cluster Details states
- Expand handlers to cover additional endpoints and error scenarios

## Best practices
- During transition, source responses from existing JSON for 1:1 parity
- Prefer small, focused fixtures/factories as we migrate off large JSON blobs
- Branch in handlers by method, headers, query, or body to simulate real scenarios
- Reuse handlers in Jest (node server) and Storybook (MSW addon)

## Transition notes
- During the transition, handlers can import JSON from `mockdata/api/**` for parity
- Unit/Cypress tests that import JSON directly will continue to work; those files are not removed
- The legacy Python server remains available with `?env=mockdata` until MSW achieves parity
