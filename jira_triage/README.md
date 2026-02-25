# OCMUI Jira Backlog Triage Scripts

## Introduction

These scripts help the OCMUI team manage a large Jira backlog by automatically
analyzing each ticket and making four types of updates:

1. **Setting Activity Type** — If a ticket's Activity Type field is currently
   **empty**, the scripts fill it in based on the type of work (e.g., "Incidents &
   Support" for bugs, "Quality / Stability / Reliability" for tech-debt). If the
   field is already set, it is left unchanged.

2. **Setting Priority** — If a ticket's Priority field is currently **Undefined**,
   the scripts calculate what it should be and set it. If the ticket already has a
   Priority but the calculated value disagrees, the scripts leave the existing
   Priority alone and instead add a `suggested-priority:<level>` label so the team
   can review. Priority reflects **how urgent this specific ticket is** based on
   impact keywords, customer signals, and discussion activity.

3. **Setting Severity** — If a ticket's Severity field is currently **empty**, the
   scripts set it based on the ticket's SanKey tier. Severity represents **how
   important this category of work is to the company** (e.g., bug backlog
   reduction = Important, BU features = Moderate). This is separate from Priority —
   a cosmetic bug has Important severity (company says reduce bugs) but Minor
   priority (it's just alignment).

4. **Adding labels** — Each ticket gets up to two new labels based on its title
   and description: one identifying the **product** it relates to (e.g., ROSA HCP,
   OSD, ARO) and one identifying the **feature area** (e.g., cluster creation
   wizard, networking, downloads). These labels are always *added* to the ticket —
   existing labels are never removed or replaced.

---

## Overview

### Activity Type classification (SanKey tier)

Every ticket is first classified into a "tier" based on the company-wide SanKey
priority framework. The `detect_sankey_tier()` function in `scripts/analyze.sh`
checks each ticket's Jira fields — issue type, issue links, existing labels, and
the current Activity Type value — against a series of conditions, evaluated
top-to-bottom (first match wins). For the "Chore" tier, it also uses regex
matching (via `perl`) against the ticket's title and description. The tier
definitions and their base priorities are configured in `config/priority.json`
under `sankey_tiers`.

| Tier | How detected | Starting Priority | Severity |
|------|-------------|-------------------|----------|
| Support Escalation | `issuelinks` field contains a link to the RHOCPPRIO project | Blocker | Critical |
| CVE / Security | `issuetype=Vulnerability`, `SecurityTracking` label, or Activity Type = "Security & Compliance" | Critical | Critical |
| Technical Debt | `ui-feature:tech-debt` label, existing `tech-debt`/`tech-maintenance` labels, or Activity Type = "Quality / Stability / Reliability" | Normal | Important |
| Chore | Regex match for `\bchore\b` in title/description, or `chore`/`chores` label | Normal | Important |
| Bug | `issuetype=Bug`, or Activity Type = "Incidents & Support" | Normal | Important |
| Weakness | `issuetype=Weakness`, or `WeaknessTracking` label | Normal | Important |
| Strategic | Activity Type = "Future Sustainability" | Normal | Moderate |
| BU Product | Activity Type = "Product / Portfolio Work" | Normal | Moderate |
| All Else | Fallback (no higher tier matched) | Normal | Low |

### How Activity Type is set

Once a tier is determined, the script looks up the corresponding Activity Type
value in `config/priority.json` (the `tier_to_activity_type` mapping) and writes
it to the Jira custom field `customfield_12320040` via the REST API.

| Tier | Activity Type |
|------|--------------|
| Support Escalation, Bug | Incidents & Support |
| CVE / Security, Weakness | Security & Compliance |
| Technical Debt, Chore | Quality / Stability / Reliability |
| Strategic | Future Sustainability |
| BU Product | Product / Portfolio Work |
| All Else | _(not set)_ |

Activity Type is only set when the field is currently **empty**. Existing values
are left unchanged.

### How Priority is calculated

Priority starts at the tier's base value (see table above), then the scripts scan
the ticket's title and description for impact keywords that can bump it up or down.
Different keyword sets are used for bugs vs. stories/tasks.

**Bug impact keywords** — implements the team's bug priority guidelines:

| Priority | Criteria | Example phrases detected |
|----------|---------|--------------------------|
| **Blocker** | Complete halt, unusable, no workaround | "login failure", "white screen", "error page", "unusable" |
| **Critical** | Blocks functionality, no workaround | "unable to", "cannot", "broken", "crash", "failure", "not working" |
| **Major** | Significant issue, complex workaround | "data missing", "not showing", "doesn't appear", "validation prevents", "cannot enter" |
| **Normal** | Moderate impact, workaround exists | Base — assigned when no impact keywords are detected |
| **Minor** | Minimal impact, nuisance | "misalign", "alignment", "font color", "cosmetic", "text change", "typo", "pixel" |

**Story and Task impact keywords** — focused on business value rather than breakage:

| Priority | Criteria | Example phrases detected |
|----------|---------|--------------------------|
| **Blocker** | Feature is required | "required", "must have", "mandatory", "blocking release" |
| **Critical** | Critical to UX or business needs | "critical to", "urgent", "compliance", "regulatory" |
| **Major** | Highly desirable and time sensitive | "time sensitive", "deadline", "high priority", "needed by" |
| **Normal** | Typical enhancement request | Base — assigned when no impact keywords are detected |
| **Minor** | Cosmetic change | "cosmetic", "text change", "font color", "alignment", "typo" |

**Customer and activity signals** can bump the priority further:

- **Customer-originated**: If the ticket's title or description contains words
  like "customer", "SRE" (our support team), "RFE" (request for enhancement),
  or "support case", the ticket is flagged as customer-related. Normal and Minor
  tickets are bumped up one level (e.g., Normal becomes Major).
- **Hot discussion**: If a ticket has 5 or more comments, it suggests the issue
  is actively discussed and may be more urgent. This bumps the priority for
  certain work types (like tech-debt).

All pattern matching uses regular expressions against the ticket's title and
description. Patterns are configurable in `config/area_keywords.json`.

### How Severity is set

Severity represents the company's SanKey capacity allocation priority — "fix bugs
and security issues first (Important), then strategic work (Moderate), then
everything else (Low)." Severity is mapped directly from the SanKey tier (see
table above) and does not change based on individual ticket content.

### How labels are assigned

Each ticket's title and description are compared against a set of text patterns to
determine which product and feature area it relates to. These patterns are
configurable in `config/area_keywords.json`. A ticket can receive at most one
product label and one feature label.

| Ticket text contains | Labels applied |
|---------------------|----------------|
| "[ROSA HCP] Create cluster fails..." | `ui-product:rosa-hcp` `ui-feature:wizard` |
| "OSD on GCP machine pool autoscaling..." | `ui-product:osd-gcp` `ui-feature:machine-pools` |
| "Download page shows broken CLI link..." | `ui-feature:downloads` |
| "[ARO] Network configuration for subnets..." | `ui-product:aro` `ui-feature:networking` |
| "Refactor unused cluster detail code..." | `ui-feature:cluster-details` |
| "FedRAMP identity provider setup..." | `ui-feature:fedramp` |
| "ROSA cluster list page loading slow..." | `ui-product:rosa` `ui-feature:cluster-list` |

### What is NOT changed

- Existing Activity Type values are never overwritten (only empty is set)
- Existing Priority values are never overwritten (only Undefined is set)
- Existing labels are never removed
- Certain tickets are skipped entirely: E2E/CI/Post-merge automation tickets
  and SPIKEs (investigation tasks)
- Nothing is written to Jira without explicit confirmation (`--apply` flag)

---

## Setup

```bash
cp .env.example .env
# Edit .env — paste your Jira PAT from:
# https://issues.redhat.com → Profile → Personal Access Tokens
```

## Scripts

### `fetch_tickets.sh`

Pull all open Stories and Tasks from OCMUI. Paginates through the full backlog.
Fetches `issuelinks`, Activity Type (`customfield_12320040`), and Severity (`customfield_12316142`) for SanKey tier detection.

```bash
source .env
./scripts/fetch_tickets.sh
```

**Output:** `output/raw_tickets.json`

---

### `analyze.sh`

Classify each ticket and produce a markdown report. For each ticket:
1. Detects SanKey tier (support-escalation → all-else)
2. Calculates Activity Type from tier mapping
3. Calculates priority from tier + impact keywords + customer signal + comment heat
4. Calculates severity from SanKey tier band
5. Assigns `ui-product:` / `ui-feature:` labels from title and description patterns

**Test specific tickets** (fetches live, no fetch step needed):

```bash
./scripts/analyze.sh --ticket OCMUI-3500 OCMUI-3200 OCMUI-2800
```

**Full backlog** (requires `fetch_tickets.sh` first):

```bash
./scripts/analyze.sh
```

**Report columns:**

| Column | Description |
|--------|-------------|
| KEY | Jira ticket ID |
| SUMMARY | Ticket summary |
| TYPE | Issue type (Story, Task, Bug) |
| STATUS | Current Jira status |
| CUR_PRI | Current Jira priority |
| CALC_PRI | Calculated priority from impact/customer/heat signals |
| CALC_SEV | Severity from SanKey tier band (always set — field is unused) |
| CUR_ACT | Current Activity Type field value |
| CALC_ACT | Calculated Activity Type from tier mapping |
| LABELS | All labels that would be applied (space-separated) |
| CMTS | Comment count |
| HEAT | hot/warm/cold from comment count |
| CUST | Customer-originated (true/false) |

Comparing CUR vs CALC columns shows what the scripts would change:
- **Activity Type**: Empty → will be SET to CALC_ACT. Existing → left unchanged.
- **Priority**: Undefined → will be SET to CALC_PRI. Existing but different → `suggested-priority:` label added (visible in LABELS).
- **Severity**: Always SET to CALC_SEV (SanKey band). This field is currently unused on OCMUI tickets.

The **LABELS** column shows all labels that would be applied: `ui-product:*`, `ui-feature:*`, and `suggested-priority:*` (space-separated).

**Skipped automatically:** E2E/CI/Post-merge automation tickets, SPIKEs

**Output:** `output/analysis_report.md` (markdown table — open directly in any markdown viewer)

---

### `apply_labels.sh`

Write Activity Type, priority, severity, and labels to Jira from the reviewed report.

```bash
./scripts/apply_labels.sh              # dry-run
./scripts/apply_labels.sh --apply      # write to Jira
```

**Output:** `output/apply_log.txt`

Activity Type handling:
- **Empty** → SET to calculated value from SanKey tier mapping
- **Already set** → no change

Priority handling:
- **Undefined** → SET directly based on SanKey calculation
- **Existing but differs** → add `suggested-priority:<level>` label
- **Matches** → no change

Severity handling (SanKey company priority band):
- Always SET based on SanKey tier (Critical/Important/Moderate/Low)
- This field is currently unused on OCMUI tickets

Labels are always **appended** — existing labels on tickets are never removed or replaced.

---

## Recommended Workflow

```bash
source .env

# 1. Test a few tickets
./scripts/analyze.sh -t OCMUI-3500 OCMUI-3200

# 2. Tweak config/area_keywords.json if needed, re-test

# 3. Fetch full backlog
./scripts/fetch_tickets.sh

# 4. Run full analysis
./scripts/analyze.sh

# 5. Review output/analysis_report.md

# 6. Dry-run
./scripts/apply_labels.sh

# 7. Apply
./scripts/apply_labels.sh --apply
```

---

## Labels

A ticket can receive up to two labels — one for the **product** and one for the **feature area**.

### Product labels

| Label | Matches |
|-------|---------|
| `ui-product:rosa-hcp` | ROSA HCP (Hosted Control Plane) |
| `ui-product:rosa-classic` | ROSA Classic (explicitly mentioned) |
| `ui-product:rosa` | ROSA (generic, not specifically classic or HCP) |
| `ui-product:aro` | ARO (Azure Red Hat OpenShift) |
| `ui-product:rhoic` | RHOIC (Red Hat OpenShift on IBM Cloud) |
| `ui-product:osd-gcp` | OSD on GCP |
| `ui-product:osd-aws` | OSD on AWS |
| `ui-product:osd` | OSD (generic) |
| `ui-product:ocp-ai` | OCP Assisted Installer |
| `ui-product:ocp` | OCP (self-managed OpenShift) |

### Feature area labels

| Label | Matches |
|-------|---------|
| `ui-feature:wizard` | Cluster creation wizard (day 1) |
| `ui-feature:cluster-details` | Cluster details / overview (day 2) |
| `ui-feature:cluster-list` | Cluster list page |
| `ui-feature:machine-pools` | Machine pool operations |
| `ui-feature:autoscaling` | Cluster autoscaler |
| `ui-feature:access-control` | Access control, IDP, roles |
| `ui-feature:networking` | VPC, subnet, CIDR, ingress |
| `ui-feature:downloads` | Downloads page, CLI, binary URLs, broken download links |
| `ui-feature:billing` | Billing, marketplace, quota |
| `ui-feature:fedramp` | FedRAMP-specific |
| `ui-feature:tech-debt` | Refactoring, cleanup |
| `ui-feature:infra` | Node.js, Konflux, CI infra |
| `ui-feature:yaml-editor` | YAML editor |
| `ui-feature:docs-links` | Documentation links |
| `ui-feature:transfers` | Cluster transfers |
| `ui-feature:notifications` | Banners, alerts |
| `ui-feature:feature-flags` | Feature flag operations |
| `ui-feature:dashboard` | OCM dashboard page |
| `ui-feature:encryption` | Encryption, KMS, FIPS |
| `ui-feature:add-ons` | Add-ons, operators |
| `ui-feature:upgrades` | Version selection, upgrades |
| `ui-feature:bare-metal` | Bare metal / BM cluster types |

---

## Configuration

### `config/area_keywords.json`

| Section | Purpose |
|---------|---------|
| `skip_patterns` | Tickets excluded from analysis entirely |
| `product_patterns` | Product labels: rosa-hcp, osd-gcp, etc. |
| `feature_patterns` | Feature area labels: wizard, machine-pools, etc. |
| `customer_patterns` | Keywords detecting customer-originated tickets |
| `bug_impact_patterns` | Impact keywords for bugs (blocker → minor) — implements `_guidelines` |
| `story_impact_patterns` | Impact keywords for stories/tasks (blocker → minor) |

### `config/priority.json`

SanKey tier definitions, Severity field ID, Activity Type field ID, base priorities, and modifier rules.

### `config/thresholds.json`

Comment-count thresholds for heat classification (hot/warm/cold).

---

## Requirements

- `bash`, `curl`, `jq`, `python3` (for URL encoding), `perl` (for PCRE pattern matching)
- Jira PAT with read/write access to OCMUI
