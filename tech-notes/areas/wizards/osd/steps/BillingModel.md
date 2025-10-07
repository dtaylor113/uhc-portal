---
id: osd-step-billing-model
area: wizards
flow: osd
step: "Billing model"
owners: ["@team/ocmui"]
entrypoints:
  - "src/components/clusters/wizards/osd/BillingModel/BillingModel.tsx"
related:
  - "../../osd/TECH_NOTES.md"
last_reviewed: "2025-10-07"
status: "current"
---

## Subscription type options
- Free trial (upgradeable)
  - Value: `STANDARD_TRIAL_BILLING_MODEL_TYPE`
  - Visible if `useGetBillingQuotas().osdTrial`
  - Side effects: `FieldId.Product = OSDTrial`, `FieldId.Byoc = 'true'`
- Annual (standard)
  - Value: `SubscriptionCommonFieldsClusterBillingModel.standard`
  - Uses pre-purchased quota
- On-Demand (Marketplace)
  - Parent value: `marketplace-select`; specific selection via `MarketplaceSelectField`
  - Disabled if `(!quotas.marketplace || HIDE_RH_MARKETPLACE) && !quotas.gcpResources`
  - Auto-select marketplace if only marketplace quota is available
  - `source=gcp` query param forces GCP marketplace and sets: `CloudProvider = Gcp`, `BillingModel = marketplace_gcp`, `Byoc = 'true'`, `Product = OSD`

Additional behavior:
- Changing subscription type clears previously loaded installable versions.

## Infrastructure type options
- Customer cloud subscription (BYOC)
  - Value: `'true'`
  - Disabled if no BYOC quota (`!quotas.byoc` or `!quotas.marketplaceByoc` for marketplace)
  - On change: recalculates `NodesCompute` and `MinReplicas` using BYOC and Multi-AZ
- Red Hat cloud account
  - Value: `'false'`
  - Disabled if no RH infra quota (`!quotas.rhInfra` or `!quotas.marketplaceRhInfra` for marketplace)

## Guards and redirects
- If org quota disallows selected product, navigation redirects to `/create`.

## Quota flags and what they mean
- `useGetBillingQuotas().osdTrial` → `availableQuota(quotaList, { resourceType: 'cluster', product: OSDTrial }) > 0`
- `!quotas.marketplace` → no cluster quota for `product: OSD`, `billing_model: marketplace`
- `!quotas.gcpResources` → no cluster quota with `cloud_provider: gcp` for current `product/billing/isBYOC`
- `!quotas.byoc` → no standard billing BYOC quota (`isBYOC: true`)
- `!quotas.marketplaceByoc` → no marketplace BYOC quota
- `!quotas.rhInfra` → no standard billing Red Hat infra quota (`isBYOC: false`)
- `!quotas.marketplaceRhInfra` → no marketplace Red Hat infra quota

See `tech-notes/areas/quotas/TECH_NOTES.md` for details on how `availableQuota` computes these flags and the billing model mapping rules.

Also see: `[Quotas overview](../../../../quotas/TECH_NOTES.md)`.

## Related Source Code
_See `tech-notes/bin/UPDATE_RELATED_AUTHORS.md` for how to update this section._

<!-- related-start -->
- `src/components/clusters/wizards/osd/BillingModel/BillingModel.tsx`
  - Last updated: 2025-07-16 by Titani Labaj (42d4b9227)
  - Prev: 2025-06-17 by Kim Doberstein (b6b864514)
  - Prev: 2025-05-27 by Dylan Cooper (1c3a77930)
- `src/components/clusters/wizards/osd/BillingModel/useGetBillingQuotas.ts`
  - Last updated: 2025-01-20 by Enrique Mingorance Cano (6f6b70348)
  - Prev: 2024-04-09 by Enrique Mingorance Cano (087cc66bf)
  - Prev: 2023-11-14 by Enrique Mingorance Cano (113a8e12f)
- `src/components/clusters/wizards/common/utils/quotas.ts`
  - Last updated: 2025-01-31 by Roberto Emanuel (38edd6782)
  - Prev: 2025-01-30 by eliran (d9aa1fdcd)
  - Prev: 2025-01-22 by Enrique Mingorance Cano (50cfc6e72)
<!-- related-end -->
<!-- related-end -->
<!-- related-end -->
<!-- related-end -->
<!-- related-end -->
