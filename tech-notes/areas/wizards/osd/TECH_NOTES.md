---
id: wizards-osd
area: wizards
flow: osd
owners: ["@team/ocmui"]
routes:
  - "/create/osd"
  - "/create/osdtrial"
entrypoints:
  - "src/components/clusters/wizards/osd/CreateOsdWizard.tsx"
  - "src/components/clusters/wizards/osd/ClusterSettings/Details/Details.tsx"
  - "src/components/clusters/wizards/osd/Networking/Configuration.tsx"
  - "src/components/clusters/wizards/osd/CreateClusterErrorModal/CreateClusterErrorModal.tsx"
imported_by:
  - "src/components/App/Router.tsx"
allowed_dependencies:
  - "react"
  - "@patternfly/react-core"
  - "src/components/clusters/wizards/common/*"
  - "src/components/clusters/wizards/hooks/*"
  - "src/components/clusters/wizards/form/*"
forbidden_dependencies:
  - "src/services/*"   # backend service logic should live in submit/orchestration layers
  - "src/redux/*"      # access wizard state via dedicated hooks/selectors, not store internals
status: "current"
last_reviewed: "2025-10-07"
---

## Overview
OSD and OSD Trial creation wizards. Guides users through cloud provider, configuration, networking, and review/submit.

## Responsibilities
- Coordinate OSD step flow and reuse shared primitives from `wizards/common`.
- Read/write wizard form state via provided hooks/selectors.

## Non-goals
- Do not embed backend service logic in step components; delegate to higher‑level submit handlers.
- Avoid direct Redux access from UI components.

## Data and state flow
- Server data is fetched via React Query hooks at the screen/container level and passed via props.
- Wizard form state is accessed via `wizards/hooks` and persisted across steps per wizard policies.

## Error handling
- Show inline validation and step‑level errors; global errors are handled by the wizard container.

## Import rules
- Allowed: React, PatternFly, wizard common, wizard hooks/form.
- Forbidden: direct imports from `src/services/*` and Redux internals.

## Step notes
- Billing model and Infrastructure type: see `steps/BillingModel.md`.

## Related Source Code
_See `tech-notes/bin/UPDATE_RELATED_AUTHORS.md` for how to update this section._

<!-- related-start -->
- `src/components/clusters/wizards/osd/BillingModel/BillingModel.scss`
  - Last updated: 2023-01-17 by Jeff Puzzo (d565dea80)
- `src/components/clusters/wizards/osd/BillingModel/BillingModel.test.tsx`
  - Last updated: 2024-05-31 by Joachim Schuler (938c467d1)
  - Prev: 2024-04-09 by Enrique Mingorance Cano (d326a57f2)
  - Prev: 2023-10-12 by Beni Paskin Cherniavsky (176044853)
- `src/components/clusters/wizards/osd/BillingModel/BillingModel.tsx`
  - Last updated: 2025-07-16 by Titani Labaj (42d4b9227)
  - Prev: 2025-06-17 by Kim Doberstein (b6b864514)
  - Prev: 2025-05-27 by Dylan Cooper (1c3a77930)
- `src/components/clusters/wizards/osd/BillingModel/MarketplaceSelectField.scss`
  - Last updated: 2025-07-16 by Titani Labaj (42d4b9227)
  - Prev: 2024-09-03 by Joachim Schuler (334cd73ef)
- `src/components/clusters/wizards/osd/BillingModel/MarketplaceSelectField.test.tsx`
  - Last updated: 2025-06-17 by Kim Doberstein (b6b864514)
  - Prev: 2025-01-22 by Enrique Mingorance Cano (50cfc6e72)
  - Prev: 2024-11-19 by Enrique Mingorance Cano (18acb8083)
- `src/components/clusters/wizards/osd/BillingModel/MarketplaceSelectField.tsx`
  - Last updated: 2025-07-16 by Titani Labaj (42d4b9227)
  - Prev: 2025-06-17 by Kim Doberstein (b6b864514)
  - Prev: 2025-01-22 by Enrique Mingorance Cano (50cfc6e72)
- `src/components/clusters/wizards/osd/BillingModel/index.ts`
  - Last updated: 2023-01-17 by Jeff Puzzo (d565dea80)
- `src/components/clusters/wizards/osd/BillingModel/useGetBillingQuotas.ts`
  - Last updated: 2025-01-20 by Enrique Mingorance Cano (6f6b70348)
  - Prev: 2024-04-09 by Enrique Mingorance Cano (087cc66bf)
  - Prev: 2023-11-14 by Enrique Mingorance Cano (113a8e12f)
- `src/components/clusters/wizards/osd/ClusterSettings/CloudProvider/AwsByocFields/AwsAccountDetails.tsx`
  - Last updated: 2025-09-16 by Lior Keren (ded0c0801)
  - Prev: 2025-07-16 by Titani Labaj (42d4b9227)
  - Prev: 2024-09-18 by David Aznaurov (878e7a907)
- `src/components/clusters/wizards/osd/ClusterSettings/CloudProvider/AwsByocFields/AwsByocFields.tsx`
  - Last updated: 2025-07-16 by Titani Labaj (42d4b9227)
  - Prev: 2024-04-09 by Enrique Mingorance Cano (d326a57f2)
  - Prev: 2024-01-08 by Dave Taylor (c8b8b1441)
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
- `src/components/clusters/wizards/form/BooleanDropdownField.scss`
  - Last updated: 2025-07-16 by Titani Labaj (42d4b9227)
  - Prev: 2024-09-13 by Joachim Schuler (7818133bf)
- `src/components/clusters/wizards/form/BooleanDropdownField.tsx`
  - Last updated: 2024-09-13 by Joachim Schuler (7818133bf)
  - Prev: 2024-07-15 by David Aznaurov (046c18b51)
  - Prev: 2024-04-09 by Enrique Mingorance Cano (d326a57f2)
- `src/components/clusters/wizards/form/CheckboxField.test.tsx`
  - Last updated: 2025-09-16 by Lior Keren (ded0c0801)
  - Prev: 2024-06-25 by Roberto Emanuel (9e2749a03)
- `src/components/clusters/wizards/form/CheckboxField.tsx`
  - Last updated: 2025-09-16 by Lior Keren (ded0c0801)
  - Prev: 2025-07-16 by Titani Labaj (42d4b9227)
  - Prev: 2024-06-25 by Roberto Emanuel (9e2749a03)
- `src/components/clusters/wizards/form/CustomRadioButtonField.tsx`
  - Last updated: 2024-04-09 by Enrique Mingorance Cano (d326a57f2)
  - Prev: 2024-01-08 by Dave Taylor (c8b8b1441)
  - Prev: 2023-09-22 by Beni Cherniavsky-Paskin (001010cbe)
- `src/components/clusters/wizards/form/FileUploadField.tsx`
  - Last updated: 2024-04-09 by Enrique Mingorance Cano (d326a57f2)
  - Prev: 2024-02-08 by Enrique Mingorance Cano (f461fcab8)
  - Prev: 2024-01-08 by Dave Taylor (c8b8b1441)
- `src/components/clusters/wizards/form/RadioGroupField.tsx`
  - Last updated: 2025-07-16 by Titani Labaj (42d4b9227)
  - Prev: 2024-04-09 by Enrique Mingorance Cano (d326a57f2)
  - Prev: 2024-01-08 by Dave Taylor (c8b8b1441)
- `src/components/clusters/wizards/form/RichInputField/RichInputField.scss`
  - Last updated: 2025-07-16 by Titani Labaj (42d4b9227)
  - Prev: 2024-01-08 by Dave Taylor (c8b8b1441)
  - Prev: 2023-01-17 by Jeff Puzzo (d565dea80)
- `src/components/clusters/wizards/form/RichInputField/RichInputField.tsx`
  - Last updated: 2025-07-16 by Titani Labaj (42d4b9227)
  - Prev: 2025-01-10 by Kim Doberstein (dd5741280)
  - Prev: 2024-09-16 by Kevin Cormier (63529fe7f)
- `src/components/clusters/wizards/form/TextInputField.tsx`
  - Last updated: 2025-07-16 by Titani Labaj (42d4b9227)
  - Prev: 2024-09-18 by David Aznaurov (878e7a907)
  - Prev: 2024-07-25 by David Aznaurov (85cbe2b0d)
<!-- related-end -->
<!-- related-end -->
<!-- related-end -->
<!-- related-end -->
<!-- related-end -->
