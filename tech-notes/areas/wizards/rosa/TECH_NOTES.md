---
id: wizards-rosa
area: wizards
flow: rosa
variants: ["classic", "hcp"]
owners: ["@team/ocmui"]
routes:
  - "/create/rosa/getstarted"
  - "/create/rosa/wizard"
entrypoints:
  - "src/components/clusters/wizards/rosa/index.ts"
  - "src/components/clusters/wizards/rosa/ControlPlaneScreen/ControlPlaneScreen.tsx"
  - "src/components/clusters/wizards/rosa/ClusterSettings/Details/Details.tsx"
  - "src/components/clusters/wizards/rosa/AccountsRolesScreen/AccountsRolesScreen.tsx"
  - "src/components/clusters/wizards/rosa/ReviewClusterScreen/ReviewClusterScreen.jsx"
imported_by:
  - "src/components/App/Router.tsx"
allowed_dependencies:
  - "react"
  - "@patternfly/react-core"
  - "src/components/clusters/wizards/common/*"
  - "src/components/clusters/wizards/hooks/*"
  - "src/components/clusters/wizards/form/*"
forbidden_dependencies:
  - "src/redux/*"   # wizard state should be accessed via dedicated hooks/slices, not directly here
status: "current"
last_reviewed: "2025-10-07"
---

## Overview
ROSA creation wizard covering both Classic and Hosted Control Plane (HCP) variants. Guides users through control plane choice, account roles, cluster details, networking, and review/submit.

## Responsibilities
- Coordinate ROSA‑specific steps and variant differences.
- Use shared primitives from `wizards/common` for consistent UI and validation surfaces.
- Read/write wizard form state via dedicated hooks; delegate service calls to higher‑level submit handlers.

## Non-goals
- Do not embed backend service logic in step components.
- Avoid Redux access from UI components; prefer hooks/selectors exposed for the wizard.

## Variants
- Classic: standalone control plane; roles and permissions requirements differ.
- HCP: hosted control plane; distinct prerequisites and networking defaults.

## Data and state flow
- Server data is fetched via React Query hooks at the screen level and passed down as props.
- Wizard form state is accessed via `wizards/hooks` and saved/restored across steps per the wizard policies.

## Error handling
- Display inline validation and step‑level errors; defer global errors to the wizard container.

## Import rules
- Allowed: React, PatternFly, wizard common, wizard hooks/form.
- Forbidden: direct imports from Redux store internals.

## Related Source Code
_See `tech-notes/bin/UPDATE_RELATED_AUTHORS.md` for how to update this section._

<!-- related-start -->
- `src/components/clusters/wizards/rosa/AccountsRolesScreen/AWSAccountSelection.tsx`
  - Last updated: 2025-07-16 by Titani Labaj (42d4b9227)
  - Prev: 2024-10-30 by Joachim Schuler (e7332f664)
  - Prev: 2024-09-20 by Zac Herman (1bbf6058a)
- `src/components/clusters/wizards/rosa/AccountsRolesScreen/AWSBillingAccount/AWSBillingAccount.test.tsx`
  - Last updated: 2025-01-22 by Enrique Mingorance Cano (50cfc6e72)
  - Prev: 2024-07-30 by Dave Taylor (752ecfea3)
  - Prev: 2024-06-06 by Joachim Schuler (953bc2299)
- `src/components/clusters/wizards/rosa/AccountsRolesScreen/AWSBillingAccount/AWSBillingAccount.tsx`
  - Last updated: 2025-07-16 by Titani Labaj (42d4b9227)
  - Prev: 2025-01-22 by Enrique Mingorance Cano (50cfc6e72)
  - Prev: 2024-07-30 by Dave Taylor (752ecfea3)
- `src/components/clusters/wizards/rosa/AccountsRolesScreen/AWSBillingAccount/ContractInfo.tsx`
  - Last updated: 2024-06-06 by Joachim Schuler (0cb6a7ef6)
- `src/components/clusters/wizards/rosa/AccountsRolesScreen/AWSBillingAccount/awsBillingAccountHelper.test.ts`
  - Last updated: 2024-06-06 by Joachim Schuler (0cb6a7ef6)
- `src/components/clusters/wizards/rosa/AccountsRolesScreen/AWSBillingAccount/awsBillingAccountHelper.ts`
  - Last updated: 2025-01-22 by Enrique Mingorance Cano (50cfc6e72)
  - Prev: 2024-06-06 by Joachim Schuler (953bc2299)
- `src/components/clusters/wizards/rosa/AccountsRolesScreen/AccountRolesARNsSection/AccountRolesARNsSection.jsx`
  - Last updated: 2025-07-29 by Lior Keren (3d51b611d)
  - Prev: 2025-07-28 by Dave Taylor (fa0be1117)
  - Prev: 2025-07-16 by Titani Labaj (42d4b9227)
- `src/components/clusters/wizards/rosa/AccountsRolesScreen/AccountRolesARNsSection/components/AWSAccountRolesError.tsx`
  - Last updated: 2025-09-02 by Kim Doberstein (836c31972)
  - Prev: 2024-06-19 by Lior Keren (4b817d1b2)
- `src/components/clusters/wizards/rosa/AccountsRolesScreen/AccountsRolesScreen.scss`
  - Last updated: 2025-07-16 by Titani Labaj (42d4b9227)
  - Prev: 2024-06-06 by Joachim Schuler (0cb6a7ef6)
- `src/components/clusters/wizards/rosa/AccountsRolesScreen/AccountsRolesScreen.tsx`
  - Last updated: 2025-09-09 by David Aznaurov (e8aece7a0)
  - Prev: 2025-09-02 by Kim Doberstein (836c31972)
  - Prev: 2025-07-16 by Titani Labaj (42d4b9227)
- `src/components/clusters/wizards/common/ClusterRequestTranslator/ClusterRequestTranslatorFactory.ts`
  - Last updated: 2024-10-04 by Enrique Mingorance Cano (5c4397308)
- `src/components/clusters/wizards/common/ClusterRequestTranslator/IClusterRequestTranslator.ts`
  - Last updated: 2024-10-04 by Enrique Mingorance Cano (5c4397308)
- `src/components/clusters/wizards/common/ClusterRequestTranslator/NotDefinedRequestTranslator.ts`
  - Last updated: 2024-10-04 by Enrique Mingorance Cano (5c4397308)
- `src/components/clusters/wizards/common/ClusterRequestTranslator/RosaRequestTranslator.ts`
  - Last updated: 2024-10-04 by Enrique Mingorance Cano (5c4397308)
- `src/components/clusters/wizards/common/ClusterSettings/Details/ClassicEtcdFipsSection.test.tsx`
  - Last updated: 2024-09-19 by Joachim Schuler (69038dd29)
- `src/components/clusters/wizards/common/ClusterSettings/Details/ClassicEtcdFipsSection.tsx`
  - Last updated: 2024-09-19 by Joachim Schuler (69038dd29)
  - Prev: 2024-06-06 by Joachim Schuler (0cb6a7ef6)
  - Prev: 2024-04-09 by Enrique Mingorance Cano (d326a57f2)
- `src/components/clusters/wizards/common/ClusterSettings/Details/CloudRegionSelectField/CloudRegionSelectField.tsx`
  - Last updated: 2025-09-02 by Kim Doberstein (836c31972)
  - Prev: 2025-02-07 by Kim Doberstein (cf829ac3b)
  - Prev: 2024-04-09 by Enrique Mingorance Cano (087cc66bf)
- `src/components/clusters/wizards/common/ClusterSettings/Details/CloudRegionSelectField/MultiRegionCloudRegionSelectField.test.tsx`
  - Last updated: 2025-01-08 by Dylan Cooper (9e0cb41e7)
  - Prev: 2024-12-16 by Dylan Cooper (216b635d6)
  - Prev: 2024-10-16 by Dylan Cooper (ded652d90)
- `src/components/clusters/wizards/common/ClusterSettings/Details/CloudRegionSelectField/MultiRegionCloudRegionSelectField.tsx`
  - Last updated: 2025-07-16 by Titani Labaj (42d4b9227)
  - Prev: 2025-02-07 by Kim Doberstein (cf829ac3b)
  - Prev: 2025-01-08 by Dylan Cooper (9e0cb41e7)
- `src/components/clusters/wizards/common/ClusterSettings/Details/CloudRegionSelectField/index.ts`
  - Last updated: 2025-09-02 by Kim Doberstein (836c31972)
  - Prev: 2025-07-16 by Titani Labaj (42d4b9227)
  - Prev: 2024-04-09 by Enrique Mingorance Cano (d326a57f2)
- `src/components/clusters/wizards/hooks/index.ts`
  - Last updated: 2023-01-17 by Jeff Puzzo (d565dea80)
- `src/components/clusters/wizards/hooks/useClusterWizardResetStepsHook.test.ts`
  - Last updated: 2025-02-18 by Zac Herman (01a9fb02a)
- `src/components/clusters/wizards/hooks/useClusterWizardResetStepsHook.ts`
  - Last updated: 2025-02-18 by Zac Herman (01a9fb02a)
- `src/components/clusters/wizards/hooks/useFormState.ts`
  - Last updated: 2023-01-17 by Jeff Puzzo (d565dea80)
<!-- related-end -->
<!-- related-end -->
<!-- related-end -->
<!-- related-end -->
<!-- related-end -->
