---
id: clusters-cluster-details
area: clusters
scope: details
owners: ["@team/ocmui"]
routes: ["/details/s/:id", "/details/:id"]
entrypoints:
  - "src/components/clusters/ClusterDetailsMultiRegion/ClusterDetails.jsx"
status: "current"
last_reviewed: "2025-10-07"
---

## Overview
Cluster Details (multi‑region) aggregates data via React Query and coordinates many sub‑tabs. It also triggers background Redux fetches for specific tabs.

## Data sources
- Primary: `useFetchClusterDetails(subscriptionID)` provides `cluster`, loading/error states.
- Other queries used directly in the page: identity providers, cloud providers, GCP WIF config, access protection, available regional instances, pending access requests.
- Background Redux fetches on refresh or mount: insights, support contacts, cluster logs, users, routers, upgrade schedules/gates, user access.

## Tabs
Rendered by `TabsRow` with conditional visibility by cluster state/capabilities:
- Overview (always shown)
- Monitoring
  - Shown when: not archived, not managed, not ARO, not RHOIC, not uninstalled AI, and not restricted env
  - Code:
```11:21:src/components/clusters/ClusterDetailsMultiRegion/ClusterDetails.jsx
const displayMonitoringTab =
  !isArchived &&
  !cluster.managed &&
  !isAROCluster &&
  !isRHOIC &&
  !isUninstalledAICluster(cluster) &&
  !isRestrictedEnv();
```
- Access Control
  - Shown when: not archived
  - Code:
```454:456:src/components/clusters/ClusterDetailsMultiRegion/ClusterDetails.jsx
const displayAccessControlTab = !isArchived;
```
- Add‑ons
  - Shown when: managed cluster, not installing/pending/waiting, not archived, not restricted env
  - Code:
```439:446:src/components/clusters/ClusterDetailsMultiRegion/ClusterDetails.jsx
const displayAddOnsTab =
  !isClusterInstalling &&
  !isClusterPending &&
  !isClusterWaiting &&
  cluster.managed &&
  !isArchived &&
  !isRestrictedEnv();
```
- Cluster history (logs)
  - Shown when: `displayClusterLogs` is truthy (has external_id or id)
  - Code:
```199:205:src/components/clusters/ClusterDetailsMultiRegion/ClusterDetails.jsx
const displayClusterLogs = cluster && (!!cluster.external_id || !!cluster.id);
```
- Networking
  - Shown when: ready/updating/hibernating, managed, has API URL, provider is AWS or (GCP with CCS or routers), not archived
  - Code:
```456:462:src/components/clusters/ClusterDetailsMultiRegion/ClusterDetails.jsx
const displayNetworkingTab =
  (isClusterReady || isClusterUpdating || clusterHibernating) &&
  cluster.managed &&
  !!get(cluster, 'api.url') &&
  (cloudProvider === 'aws' ||
    (cloudProvider === 'gcp' && (get(cluster, 'ccs.enabled') || gotRouters))) &&
  !isArchived;
```
- Machine pools
  - Shown when: `canViewMachinePoolTab(cluster)` is true
- Support
  - Shown when: not hidden by rules below
  - Hidden when: managed, subscription has not reported `external_id`; in restricted env this rule is disabled
  - Code:
```463:470:src/components/clusters/ClusterDetailsMultiRegion/ClusterDetails.jsx
const hideSupportTab = isRestrictedEnv()
  ? false
  : cluster.managed && cluster.external_id === undefined;
const displaySupportTab = !hideSupportTab && !isOSDTrial;
```
- Upgrade settings
  - Shown when: managed, editable, not ARO, not archived
  - Code:
```470:472:src/components/clusters/ClusterDetailsMultiRegion/ClusterDetails.jsx
const displayUpgradeSettingsTab =
  cluster.managed && !isAROCluster && cluster.canEdit && !isArchived;
```
- Add Hosts (AI)
  - Shown/disabled based on `getAddHostsTabState(cluster)`; when disabled, tab still shown with a tooltip; content omitted
- Access Requests
  - Shown when: `accessProtection?.enabled` is true; badge shows pending count and spinner while loading
  - Title icon logic is in `TabsRow.helper` with a spinner/badge for `numberOfIssues` and `isLoading`.

## Refresh model
- `refresh()` invalidates React Query caches (`invalidateClusterDetailsQueries`) and calls `refreshRelatedResources()` which selectively refetches per capability/state (insights, logs, users, routers, schedules, access protection, WIF, quotas).
- Auto‑refresh: the `ClusterDetailsTop` header receives `autoRefreshEnabled={!anyModalOpen}` and `isRefetching={isFetching}`. The header component owns the refresh icon/spinner behavior and triggers `refresh` on its own cadence when `autoRefreshEnabled` is true, backing off while modals are open. Three intervals are typically used (short while installing, medium while updating, long when ready); see the header’s implementation for exact values.

Exact intervals and logic
```16:36:src/components/common/RefreshButton/RefreshButton.tsx
const shortTimerSeconds = 10;
const longTimerSeconds = 60;
const numberOfShortTries = 3;
...
useInterval(() => {
  if (interValTime === shortTimerSeconds) {
    if (shortTimerTries < numberOfShortTries - 1) {
      setShortTimerTries(shortTimerTries + 1);
    } else {
      setInterValTime(longTimerSeconds);
      setShortTimerTries(0);
    }
  }
  if (autoRefresh && document.visibilityState === 'visible' && navigator.onLine && !isDisabled) {
    refreshFunc();
  }
}, interValTime * 1000);
```
- When `useShortTimer=true`, it polls every 10s for 3 tries, then switches to 60s.
- `ClusterDetailsTop` sets `useShortTimer={!Object.values(clusterStates).includes(cluster.state)}`, which enables short polling when the cluster state is not one of the known states (transient/unknown), otherwise uses long polling.

## Error and loading
- Full‑page spinner while cluster details or org data are loading.
- Redirect to `/cluster-list` with a global error banner for 404/403.

## Notes
- Restricted envs change visibility of some tabs and defaults.
- See also: `areas/quotas/TECH_NOTES.md` for quota refresh considerations.

## Related Source Code
_See `tech-notes/bin/UPDATE_RELATED_AUTHORS.md` for how to update this section._

<!-- related-start -->
- `src/components/clusters/ClusterDetailsMultiRegion/ClusterDetails.jsx`
  - Last updated: 2025-09-03 by David Aznaurov (dd495e1c0)
  - Prev: 2025-08-20 by Zac Herman (f9caaad91)
  - Prev: 2025-07-16 by Titani Labaj (42d4b9227)
- `src/components/clusters/ClusterDetailsMultiRegion/components/TabsRow/TabsRow.tsx`
  - Last updated: 2025-01-14 by Kim Doberstein (323895a53)
  - Prev: 2024-08-28 by Joachim Schuler (d15e00bc4)
  - Prev: 2024-08-20 by Joachim Schuler (dbc0fbefb)
- `src/components/clusters/ClusterDetailsMultiRegion/components/TabsRow/TabsRow.helper.tsx`
  - Last updated: 2025-02-07 by Kim Doberstein (cf829ac3b)
  - Prev: 2024-11-01 by David Aznaurov (2a76a95b1)
  - Prev: 2024-05-29 by David Aznaurov (9ec549d73)
- `src/components/clusters/ClusterDetailsMultiRegion/components/ClusterDetailsTop/ClusterDetailsTop.jsx`
  - Last updated: 2025-09-26 by Dylan Cooper (a1fd9809b)
  - Prev: 2025-09-04 by David Aznaurov (3af9297c0)
  - Prev: 2025-08-12 by Lior Keren (b728bf481)
<!-- related-end -->
<!-- related-end -->
<!-- related-end -->
<!-- related-end -->
<!-- related-end -->
