---
id: clusters-cluster-details-overview
area: clusters
scope: details-overview
owners: ["@team/ocmui"]
entrypoints:
  - "src/components/clusters/ClusterDetailsMultiRegion/components/Overview/Overview.jsx"
status: "current"
last_reviewed: "2025-10-07"
---

## Purpose
Default tab summarizing cluster state, subscription, versions, region/provider, and key actions. Receives most data from parent `ClusterDetails` and delegates actions via props.

## Inputs (props)
- `cluster`, `subscription`, `region`
- Loading flags: `clusterDetailsLoading`, `clusterDetailsFetching`
- `cloudProviders` (from query)
- `insightsData` (Redux selector)
- `userAccess` (Redux)
- `canSubscribeOCP`, `isSubscriptionSettingsRequestPending`
- `wifConfigData` (displayName/loading flags)
- `refresh` handler for user‑triggered updates

## Content highlights
- Top cards: health/state, version upgrade CTA when applicable, identity providers summary, region/provider.
- Billing/account and ownership actions when permitted.
- Surfaces warnings such as GCP org policy via props from parent.

## Related
- Parent orchestration: `areas/clusters/cluster-details/TECH_NOTES.md`.

## Related Source Code
_See `tech-notes/bin/UPDATE_RELATED_AUTHORS.md` for how to update this section._

<!-- related-start -->
- `src/components/clusters/ClusterDetailsMultiRegion/components/Overview/Overview.jsx`
  - Last updated: 2025-04-29 by roberto emanuel (55ea05bce)
  - Prev: 2025-03-31 by Montse Ortega Gallart (500ebc76c)
  - Prev: 2025-02-25 by Enrique Mingorance Cano (f57e56b42)
- `src/components/clusters/ClusterDetailsMultiRegion/ClusterDetails.jsx`
  - Last updated: 2025-09-03 by David Aznaurov (dd495e1c0)
  - Prev: 2025-08-20 by Zac Herman (f9caaad91)
  - Prev: 2025-07-16 by Titani Labaj (42d4b9227)
<!-- related-end -->
<!-- related-end -->
<!-- related-end -->
<!-- related-end -->
<!-- related-end -->
