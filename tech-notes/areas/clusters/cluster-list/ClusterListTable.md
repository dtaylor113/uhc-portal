---
id: clusters-cluster-list-table
area: clusters
scope: list-table
owners: ["@team/ocmui"]
entrypoints:
  - "src/components/clusters/ClusterListMultiRegion/components/ClusterListTable.jsx"
status: "current"
last_reviewed: "2025-10-07"
---

## Columns and sorting
- Name (server‑sort: `display_name`, clickable) — links to `/details/s/:subscriptionId`.
- Status (declared sort key: `status`, not clickable)
- Type (declared sort key: `type`, not clickable)
- Created (server‑sort: `created_at`, clickable; hidden on smaller screens) — uses `ClusterCreatedIndicator`.
- Version (declared sort key: `version`, not clickable) — shows version plus `ClusterUpdateLink` (OSD updates hidden in list).
- Provider (Region) (declared sort key: `provider`, not clickable) — `ClusterLocationLabel` with provider + region.
- Actions — PatternFly `ActionsColumn` resolved by `multiRegionActionResolver` with permissions/feature gates.

Sorting behavior
- Column sort keys are declared in `sortColumns`.
- Only columns marked with `apiSortOption: true` expose header sort (currently Name and Created). This gates server‑side sorting supported by the API.
- Clicking a sortable header calls `setSort(index, direction)`, which dispatches `viewActions.onListSortBy` in the parent, updating `viewOptions.CLUSTERS_VIEW.sorting` in Redux.
- The `useFetchClusters` hook reads the Redux sorting and requests the list from the backend with the appropriate sort parameters; non‑clickable columns do not expose header sort because consistent server‑side sorting is not implemented for them.

## Row rendering behaviors
- Skeleton rows render while pending.
- Status cell logic:
  - AI subscriptions without metrics use `AIClusterStatus`.
  - Error state shows a popover with support link.
  - Waiting/pending/validating/installing show an "Installation status" popover with `ProgressList`.
  - Limited support adds a red `Label` linked to details.

## Actions
- Resolver: `components/clusters/common/ClusterActionsDropdown/ClusterActionsDropdownItems`.
- Inputs include: cluster object, subscription permissions (subscribe OCP, hibernate, transfer ownership), feature gate `AUTO_CLUSTER_TRANSFER_OWNERSHIP`, ownership, `toggleSubscriptionReleased`, and `refreshFunc`.

## Dependencies and data
- Needs `availableRegionalInstances` (for status popovers) and user `username` to compute ownership.
- Receives `isClustersDataPending` to decide skeleton vs live content.

## Error/empty states
- If not pending and no clusters, renders an `EmptyState` with guidance.
- When page-level error occurs but rows exist, an inline warning is shown by parent; table still renders rows.

## Related Source Code
_See `tech-notes/bin/UPDATE_RELATED_AUTHORS.md` for how to update this section._

<!-- related-start -->
- `src/components/clusters/ClusterListMultiRegion/components/ClusterListTable.jsx`
  - Last updated: 2025-08-18 by Trevor Hendricks (081230338)
  - Prev: 2025-07-16 by Titani Labaj (42d4b9227)
  - Prev: 2025-04-04 by Zac Herman (045105e79)
- `src/components/clusters/ClusterListMultiRegion/ClusterList.jsx`
  - Last updated: 2025-07-16 by Titani Labaj (42d4b9227)
  - Prev: 2025-06-02 by Trevor Hendricks (ba9a0ad89)
  - Prev: 2025-05-07 by Kim Doberstein (c9dbbe707)
<!-- related-end -->
<!-- related-end -->
<!-- related-end -->
<!-- related-end -->
<!-- related-end -->
## Suggested Enhancements
- Evaluate enabling header sort for Status, Type, Version, and Provider columns.
  - Confirm backend list API supports these sort fields consistently across regions.
  - If supported, mark columns with `apiSortOption: true` and wire through `setSort` with the proper `sortColumns` keys.
  - If not, consider client‑side sort with clear UX (but prefer server‑side for correctness and pagination).


