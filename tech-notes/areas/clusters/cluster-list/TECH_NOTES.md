---
id: clusters-cluster-list
area: clusters
scope: list
owners: ["@team/ocmui"]
routes: ["/cluster-list"]
entrypoints:
  - "src/components/clusters/ClusterListMultiRegion/ClusterList.jsx"
  - "src/queries/ClusterListQueries/useFetchClusters.ts"
imported_by:
  - "src/components/App/Router.tsx"
status: "current"
last_reviewed: "2025-10-07"
---

## Overview
Cluster List page for multi‑region. Provides filters, table, pagination, and actions. Uses React Query for fetching clusters, with Redux for view state (pagination, sorting, filters) and ancillary background data.

## Data fetching
- Hook: `useFetchClusters(isArchived=false, getMultiRegion)` from `queries/ClusterListQueries` provides `{ isLoading, data, refetch, isError, errors, isFetching, isFetched, isClustersDataPending }`.
- Data shape: `data.items` (clusters), `data.itemsCount` (total).
- On mount, after initial fetch, background Redux fetches are kicked off if needed (cloud providers, machine types, organization/quota) to populate global caches used elsewhere.
- Total count is synced to Redux via `onSetTotalClusters` for pagination state.

## State management split
- React Query (server data)
  - `useFetchClusters(isArchived, getMultiRegion)` retrieves `data.items` and `data.itemsCount`, and exposes `isLoading/isFetching/isFetched/isError/errors/refetch/isClustersDataPending`.
  - Error aggregation for multi‑region comes from the hook (`errors`).
  - Parent passes `refetch` to header Refresh and down to the table.
- Redux (view/UI state)
  - `viewOptions.CLUSTERS_VIEW`: `currentPage`, `pageSize`, `sorting` (field + asc/desc), `flags.subscriptionFilter`, `flags.showMyClustersOnly`, and `filter` text.
  - Actions: `onPageInput`, `onPerPageSelect`, `viewActions.onListSortBy`, `onListFlagsSet`, `onSetTotalClusters`.
  - Total count (`data.itemsCount`) is mirrored into Redux to keep pagination controls consistent across re‑renders.
- Storage
  - `sessionStorage.clusterListSelectedTypes` persists `subscriptionFilter.plan_id`.
  - `localStorage.ONLY_MY_CLUSTERS_TOGGLE_CLUSTERS_LIST` persists the “only my clusters” toggle.

## UI breakdown
- Page header:
  - `ReadOnlyBanner` for any read-only cluster states present
  - Title and a toolbar with spinner/error triangle, and `RefreshButton` (calls `refetch` and `refetchClusterTransferDetail`)
- Filter bar:
  - `ClusterListFilter` (text/attribute filters) bound to `CLUSTERS_VIEW`
  - `ClusterListFilterDropdown` (product type) unless restricted env
  - `ClusterListActions` (bulk actions/navigation)
  - `ViewOnlyMyClustersToggle`
  - Top `PaginationRow` (hidden on small screens)
  - `ClusterListFilterChipGroup` to show active filters
- Content:
  - Empty state when no clusters and no active filters
  - `Unavailable` warning when errors with no rows; otherwise inline `ErrorBox` when some data is present
  - `AccessRequestPendingAlert` and `TransferOwnerPendingAlert`
  - `ClusterListTable` renders rows, sorting, and row actions
  - Bottom `PaginationRow`
  - `CommonClusterModals` mounted for create/edit/delete flows

## Sorting & pagination
- Sorting controlled via Redux `viewOptions.CLUSTERS_VIEW.sorting` (index + asc/desc). Table updates dispatch `viewActions.onListSortBy`.
- Pagination uses Redux `currentPage` and `pageSize` with `onPageInput` and `onPerPageSelect`. Items range displayed using total from Redux.
- When current page exceeds data after a change, code adjusts to last valid page.

## Error handling
- Aggregates multi-region errors into `errorDetails` for display. Shows spinner while loading; shows warning icon and inline alert as appropriate.

## Notes
- Restricted environments default filter to ROSA and hide some controls.


## Related Source Code
_See `tech-notes/bin/UPDATE_RELATED_AUTHORS.md` for how to update this section._

<!-- related-start -->
- `src/components/clusters/ClusterListMultiRegion/ClusterList.jsx`
  - Last updated: 2025-07-16 by Titani Labaj (42d4b9227)
  - Prev: 2025-06-02 by Trevor Hendricks (ba9a0ad89)
  - Prev: 2025-05-07 by Kim Doberstein (c9dbbe707)
- `src/components/clusters/ClusterListMultiRegion/components/ClusterListTable.jsx`
  - Last updated: 2025-08-18 by Trevor Hendricks (081230338)
  - Prev: 2025-07-16 by Titani Labaj (42d4b9227)
  - Prev: 2025-04-04 by Zac Herman (045105e79)
- `src/components/clusters/ClusterListMultiRegion/components/RefreshButton.tsx`
  - Last updated: 2025-07-16 by Titani Labaj (42d4b9227)
  - Prev: 2024-05-22 by Kim Doberstein (5490a03db)
- `src/components/clusters/common/ClusterListFilter.tsx`
  - Last updated: 2024-07-12 by Kim Doberstein (6b4a74236)
  - Prev: 2024-04-09 by Enrique Mingorance Cano (d326a57f2)
  - Prev: 2024-04-23 by Dylan Cooper (f3300a474)
- `src/components/clusters/common/ClusterListFilterHook.ts`
  - Last updated: 2024-12-17 by Enrique Mingorance Cano (df47db13c)
- `src/queries/ClusterListQueries/useFetchClusters.ts`
  - Last updated: 2024-12-13 by Enrique Mingorance Cano (e20f31a33)
  - Prev: 2024-11-01 by David Aznaurov (76f1020ec)
  - Prev: 2024-09-27 by Kim Doberstein (d536ad5ab)
<!-- related-end -->
<!-- related-end -->
<!-- related-end -->
<!-- related-end -->
<!-- related-end -->
