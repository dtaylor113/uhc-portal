---
id: quotas-overview
area: quotas
owners: ["@team/ocmui"]
entrypoints:
  - "src/components/clusters/common/quotaSelectors.ts"
  - "src/components/clusters/common/quotaModel.ts"
  - "src/components/clusters/wizards/common/utils/quotas.ts"
  - "src/components/clusters/common/billingModelMapper.ts"
imported_by:
  - "src/components/clusters/wizards/osd/**"
  - "src/components/clusters/wizards/rosa/**"
status: "current"
last_reviewed: "2025-10-07"
---

## How quota is gathered
- Source: `state.userProfile.organization.quotaList` (type `QuotaCostList`), populated by user/organization fetch flows.
- Access pattern in wizards: `useGlobalState(state => state.userProfile.organization.quotaList)`.
- Core selector: `availableQuota(quotaList, quotaParams)` sums available capacity across matching `related_resources` entries.

## availableQuota mechanics
- Inputs: `QuotaParams` → transformed to a `QuotaQuery` via `queryFromQuotaParams`.
- Matching: `relatedResourceMatches(resource, query)` requires all specified fields to match (`ANY` wildcard otherwise):
  - `resource_type`, `product`, `billing_model`, `cloud_provider`, `byoc`, `availability_zone_type`, `resource_name`.
- Billing model normalization:
  - Marketplace variants (`marketplace_*`) normalize to `billing_model = marketplace`.
  - Standard trial value normalizes to `standard` for quota checks.
- Output calculation for each `QuotaCost` item:
  - Collect `cost` for matching `related_resources`, pick the smallest `cost` (best case).
  - If `cost == 0`, treat as infinite capacity (`Infinity`).
  - Else compute `(allowed - consumed) / cost`, floored to integer and clamped at `>= 0`.
  - Sum across quota items.

## QuotaType flags used by wizards
Defined in `wizards/common/utils/quotas.ts` and computed by `useGetBillingQuotas`:
- `osdTrial`: resourceType=cluster, product=OSDTrial
- `standardOsd`: resourceType=cluster, product=OSD, billing=standard
- `marketplace`: resourceType=cluster, product=OSD, billing=marketplace
- `byoc`: resourceType=cluster, billing=standard, isBYOC=true
- `rhInfra`: resourceType=cluster, billing=standard, isBYOC=false
- `marketplaceByoc`: resourceType=cluster, product=OSD, billing=marketplace, isBYOC=true
- `marketplaceRhInfra`: resourceType=cluster, product=OSD, billing=marketplace, isBYOC=false
- `gcpResources`: resourceType=cluster, cloudProviderID=Gcp (plus caller-provided product/billing/isBYOC)
- `awsResources`: resourceType=cluster, cloudProviderID=Aws (plus caller-provided product/billing/isBYOC)

## Billing model mapping
- `clusterBillingModelToRelatedResource(model)`:
  - `marketplace_*` → `marketplace`
  - `standard` → `standard`
  - `ANY` → `any`
- Used when converting subscription/cluster billing models to quota query space.

## Common pitfalls
- Passing marketplace variants without normalization can lead to false negatives.
- BYOC must be set consistently (`'byoc'|'rhinfra'|ANY` mapping).
- Multi‑AZ affects `availability_zone_type` and results; specify when gating Multi‑AZ options.

## References
- Selectors: `availableQuota`, `hasPotentialQuota`, `addOnBillingQuota`, `queryFromCluster`
- Hooks: `useGetBillingQuotas`

## Related Source Code
_See `tech-notes/bin/UPDATE_RELATED_AUTHORS.md` for how to update this section._

<!-- related-start -->
- `src/components/clusters/common/quotaSelectors.ts`
  - Last updated: 2025-02-25 by Enrique Mingorance Cano (f57e56b42)
  - Prev: 2025-01-22 by Enrique Mingorance Cano (50cfc6e72)
  - Prev: 2025-01-20 by Enrique Mingorance Cano (6f6b70348)
- `src/components/clusters/common/quotaModel.ts`
  - Last updated: 2025-01-22 by Enrique Mingorance Cano (50cfc6e72)
  - Prev: 2024-11-19 by Enrique Mingorance Cano (18acb8083)
  - Prev: 2023-11-14 by Enrique Mingorance Cano (113a8e12f)
- `src/components/clusters/common/billingModelMapper.ts`
  - Last updated: 2025-02-25 by Enrique Mingorance Cano (f57e56b42)
  - Prev: 2025-01-22 by Enrique Mingorance Cano (50cfc6e72)
  - Prev: 2024-11-19 by Enrique Mingorance Cano (18acb8083)
- `src/components/clusters/wizards/common/utils/quotas.ts`
  - Last updated: 2025-01-31 by Roberto Emanuel (38edd6782)
  - Prev: 2025-01-30 by eliran (d9aa1fdcd)
  - Prev: 2025-01-22 by Enrique Mingorance Cano (50cfc6e72)
<!-- related-end -->
<!-- related-end -->
<!-- related-end -->
<!-- related-end -->
<!-- related-end -->
## Suggested Refactoring Recommendations
- Clarify BYOC encoding
  - Today `byoc` in queries maps booleans to string literals (`'byoc'|'rhinfra'|ANY`). Replace with an enum type and a small helper `mapByoc(boolean|undefined): RelatedResourceByoc` to avoid string drift.
- Normalize billing model at boundaries
  - Centralize marketplace variant normalization in a single utility; use it both in `queryFromQuotaParams` and call sites like `useGetBillingQuotas` to prevent accidental mismatches.
- Co-locate QuotaType definitions with their consumers
  - `QuotaType` lives under wizards/common; consider moving to `components/clusters/common/quotas/` with an index that exports both params and a typed result to reduce cross-area coupling.
- Provide typed result objects for `useGetBillingQuotas`
  - Instead of returning a loose object, return a typed shape with clearly documented semantics (e.g., `hasStandardOsdClusterQuota: boolean`). This improves discoverability and IDE hints.
- Document the original AMS quota model next to selectors
  - Add a brief model doc explaining `QuotaCost.items.related_resources`, `cost`, `allowed`, `consumed`, and examples of `resource_type`/`billing_model` values. Include a sample payload in tests or fixtures linked from this note.
- Reduce duplication of cloud-provider specific flags
  - Consider a single `hasProviderResources(providerId, params)` that covers GCP/AWS instead of separate `gcpResources`/`awsResources` flags.
- Add unit tests focused on normalization and edge cases
  - Tests for: marketplace variant mapping; trial → standard mapping for quota; BYOC string mapping; `cost=0` Infinity handling; negative quota items are ignored.
- Introduce a thin domain API
  - Create helpers like `hasStandardOsdQuota(quotaList)` / `hasMarketplaceOsdQuota(quotaList)` that wrap `availableQuota` with prefilled params. Replace ad‑hoc param construction across the app with these helpers to standardize behavior.


