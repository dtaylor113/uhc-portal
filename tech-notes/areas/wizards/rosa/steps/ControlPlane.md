---
id: rosa-step-control-plane
area: wizards
flow: rosa
step: "Control plane"
owners: ["@team/ocmui"]
entrypoints:
  - "src/components/clusters/wizards/rosa/ControlPlaneScreen/ControlPlaneScreen.tsx"
  - "src/components/clusters/wizards/rosa/ControlPlaneScreen/HostedTile.tsx"
  - "src/components/clusters/wizards/rosa/ControlPlaneScreen/StandAloneTile.tsx"
related:
  - "../../TECH_NOTES.md"
last_reviewed: "2025-10-07"
status: "current"
---

## Options
- Hosted control plane (HCP)
  - Enabled only if org quota for ROSA HCP exists; HCP billing model variants normalize to `billing_model = marketplace` via `clusterBillingModelToRelatedResource`. See quotas note for details.
  - On select: merges `initialValuesHypershift(true)` and resets/clears network‑related toggles and role fields.
- Standalone (classic)
  - On select: merges `initialValuesHypershift(false)` and resets relevant toggles/fields accordingly.

## Side effects on selection
- Resets: `InstallToVpc = false`, clears `MachinePoolsSubnets` to `[emptyAWSSubnet()]`, unchecks `ConfigureProxy`, unchecks `FipsCryptography`.
- Accounts and roles: sets installer/support/worker (and control plane for classic) ARNs to `NO_ROLE_DETECTED`.
- Multi‑region feature gate: if enabled and HCP is selected, clears `Region` to force selection.

## Guards and UX
- If HCP lacks quota, the Hosted option is disabled and toggling defaults to classic.
- Intro includes welcome + prerequisites and links to control plane docs.

See `tech-notes/areas/quotas/TECH_NOTES.md` for quota normalization and checks used to evaluate HCP eligibility.

## Related Source Code
_See `tech-notes/bin/UPDATE_RELATED_AUTHORS.md` for how to update this section._

<!-- related-start -->
- `src/components/clusters/wizards/rosa/ControlPlaneScreen/ControlPlaneScreen.tsx`
  - Last updated: 2025-09-12 by Kim Doberstein (70b99a985)
  - Prev: 2025-07-29 by Lior Keren (3d51b611d)
  - Prev: 2025-07-29 by Lior Keren (4594ba463)
- `src/components/clusters/wizards/rosa/ControlPlaneScreen/HostedTile.tsx`
  - Last updated: 2025-09-12 by Kim Doberstein (70b99a985)
  - Prev: 2025-07-29 by Lior Keren (3d51b611d)
  - Prev: 2025-07-16 by Titani Labaj (42d4b9227)
- `src/components/clusters/wizards/rosa/ControlPlaneScreen/StandAloneTile.tsx`
  - Last updated: 2025-09-12 by Kim Doberstein (70b99a985)
  - Prev: 2025-07-29 by Lior Keren (3d51b611d)
  - Prev: 2025-07-16 by Titani Labaj (42d4b9227)
<!-- related-end -->
<!-- related-end -->
<!-- related-end -->
<!-- related-end -->
<!-- related-end -->
