---
id: wizards-common
area: wizards
scope: common
owners: ["@team/ocmui"]
routes:
  - "/create/osd"
  - "/create/osdtrial"
  - "/create/rosa/wizard"
entrypoints:
  - "src/components/clusters/wizards/common/ModalWizardHeader/ModalWizardHeader.tsx"
  - "src/components/clusters/wizards/common/VPCDropdown/VPCDropdown.tsx"
  - "src/components/clusters/wizards/common/ClusterSettings/MachinePool/MachinePool.tsx"
  - "src/components/clusters/wizards/common/constants.ts"
  - "src/components/clusters/wizards/common/Prerequisites/Prerequisites.tsx"
imported_by:
  - "src/components/clusters/wizards/**"
allowed_dependencies:
  - "react"
  - "@patternfly/react-core"
  - "src/components/clusters/wizards/hooks/*"
  - "src/components/clusters/wizards/form/*"
  - "src/common/utils/*"
forbidden_dependencies:
  - "src/services/*"
  - "src/redux/*"
  - "src/queries/*"
status: "current"
last_reviewed: "2025-10-07"
---

## Overview
Domain-aware shared UI, form fields, and helpers used across the OSD and ROSA creation wizards. These modules are reusable within wizard flows (OSD, OSD Trial, ROSA classic/HCP) but are not intended to be globally generic UI.

## Responsibilities
- Provide presentational components and small domain-aware composites (e.g., headers, dropdowns, field groups).
- Encapsulate wizard‑specific visual patterns (titles, sections, pills) consistent with PatternFly.
- Offer thin adapters to wizard form state where needed (e.g., using `useFormState`) without owning server data fetching.

## Non-goals
- No direct API calls or long‑running side effects.
- No Redux store access from these components.
- Do not define or mutate React Query caches.

## Data and state flow
- Server state (API‑fetched data) must be read via hooks in the consuming page/step and passed down via props.
- Client/wizard form state can be accessed via `wizards/hooks` (e.g., `useFormState`) when a component is tightly coupled to form context; prefer passing explicit props when reasonable.
- Validation and submit orchestration live in the specific wizard flows (OSD/ROSA), not in this common layer.

## Error handling
- Components surface input‑level validation messages and return errors via props/callbacks.
- Do not trigger global toasts or navigation from this layer; delegate upward to the wizard screens.

## Import rules
- Allowed: React, PatternFly, utility modules, wizard form hooks (`wizards/hooks`, `wizards/form`).
- Forbidden: direct imports from `src/services/*`, `src/redux/*`, `src/queries/*`.

## Ownership and maintenance
- Owners: `@team/cluster-experience` (update to the actual team handle as needed).
- Review cadence: update `last_reviewed` on meaningful changes; mark `status: stale` if >90 days without review.

## Related notes
- See `tech-notes/areas/wizards/osd/TECH_NOTES.md` and `tech-notes/areas/wizards/rosa/TECH_NOTES.md` for flow‑specific state, validation, and submission rules.

## Related Source Code
_See `tech-notes/bin/UPDATE_RELATED_AUTHORS.md` for how to update this section._

<!-- related-start -->
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
