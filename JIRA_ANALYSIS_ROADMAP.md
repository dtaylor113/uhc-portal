# OCMUI Jira Backlog Analysis — Roadmap

## Goal

Systematically analyze, categorize, and prioritize the OCMUI Jira backlog using
`ui-product:` / `ui-feature:` labels for classification and the company SanKey
priority framework for urgency.

---

## Scope

- **Project:** OCMUI
- **Issue types:** Stories, Tasks
- **Statuses:** Everything not in Closed / Done / Resolved
- **Skipped:** E2E Automation / CI Automation / Post-merge testing (QE auto-created), SPIKEs
- **Approach:** Dry-run first, review markdown report, then apply

---

## Scripts Summary

### `fetch_tickets.sh` — Pull backlog from Jira

Fetches all open Stories + Tasks via REST API. Paginates automatically.
Saves raw JSON to `output/raw_tickets.json`.
Fields include `issuelinks`, `customfield_12320040` (Activity Type), and `customfield_12316142` (Severity) for SanKey tier detection.

### `analyze.sh` — Categorize and determine priority

Classifies each ticket by product, feature area, customer origin, and heat.
Detects SanKey tier and calculates priority using tier + modifier signals.

- `./scripts/analyze.sh` — full backlog
- `./scripts/analyze.sh --ticket OCMUI-123 OCMUI-456` — test specific tickets live

### `apply_labels.sh` — Write labels, priority, severity, and Activity Type to Jira

- `./scripts/apply_labels.sh` — dry-run
- `./scripts/apply_labels.sh --apply` — write to Jira

Labels are always **appended** (never replaced). Priority handling:
- **Undefined priority** → SET directly based on SanKey tier + modifiers
- **Existing priority that disagrees** → add `suggested-priority:<level>` label

Severity handling (SanKey company priority band):
- **Empty** → SET based on SanKey tier (Critical/Important/Moderate/Low)
- **Already set** → left unchanged

Activity Type handling:
- **Empty** → SET to calculated value from SanKey tier mapping
- **Already set** → left unchanged

---

## API Approach

Scripts use **`curl` + Jira REST API v2** — same patterns as the
[ocmui-team-dashboard](../../../work/ocmui-team-dashboard) backend.

| Operation | Endpoint |
|-----------|----------|
| **Search** | `GET /rest/api/2/search?jql={jql}&fields={fields}&maxResults=100&startAt={n}` |
| **Single ticket** | `GET /rest/api/2/issue/{KEY}?fields={fields}` |
| **Add labels + set priority + severity + Activity Type** | `PUT /rest/api/2/issue/{KEY}` |

Label writes use `{"update":{"labels":[{"add":"ui-product:rosa-hcp"}]}}` — this **appends**
to the existing label list and never removes or replaces anything.

Priority writes use `{"fields":{"priority":{"name":"Major"}}}` in the same PUT request.

Severity writes use `{"fields":{"customfield_12316142":{"value":"Important"}}}` in the same PUT.

Activity Type writes use `{"fields":{"customfield_12320040":{"value":"Incidents & Support"}}}` in the same PUT.

---

## Label Taxonomy

A ticket can receive up to two labels — one **product** label and one **feature** label.

### Product labels (`ui-product:<product>`)

| Label | Matches |
|-------|---------|
| `ui-product:rosa-hcp` | ROSA HCP (Hosted Control Plane) |
| `ui-product:rosa-classic` | ROSA Classic (explicitly mentioned) |
| `ui-product:rosa` | ROSA (generic — not specifically classic or HCP) |
| `ui-product:aro` | ARO (Azure Red Hat OpenShift) |
| `ui-product:rhoic` | RHOIC (Red Hat OpenShift on IBM Cloud) |
| `ui-product:osd-gcp` | OSD on GCP |
| `ui-product:osd-aws` | OSD on AWS |
| `ui-product:osd` | OSD (generic) |
| `ui-product:ocp-ai` | OCP Assisted Installer |
| `ui-product:ocp` | OCP (self-managed OpenShift) |

### Feature labels (`ui-feature:<feature>`)

| Label | Matches |
|-------|---------|
| `ui-feature:wizard` | Cluster creation wizard (day 1) |
| `ui-feature:cluster-details` | Cluster details / overview (day 2) |
| `ui-feature:cluster-list` | Cluster list page |
| `ui-feature:machine-pools` | Machine pool operations |
| `ui-feature:autoscaling` | Cluster autoscaler |
| `ui-feature:access-control` | Access control, IDP, roles |
| `ui-feature:networking` | VPC, subnet, CIDR, ingress |
| `ui-feature:downloads` | Downloads page, CLI |
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

> Product types sourced from `src/common/subscriptionTypes.ts` (`productFilterOptions`).
> Feature patterns derived from ~400 real OCMUI ticket summaries.
> Edit `config/area_keywords.json` to add or refine.

---

## SanKey Priority Framework

Priority is determined by the company SanKey matrix. Each ticket is assigned to
a **tier** (first match wins, evaluated top-to-bottom), then the base priority
is adjusted by **modifier signals** (customer origin, comment heat).

### Tier hierarchy

| Tier | Name | Detection | Base Priority | Severity | Calc Activity Type |
|------|------|-----------|---------------|----------|-------------------|
| 1 | **Support Escalation** | Issue linked to RHOCPPRIO | Blocker | Critical | Incidents & Support |
| 2 | **CVE / Security** | `issuetype=Vulnerability` OR `SecurityTracking` label OR Activity Type = "Security & Compliance" | Critical | Critical | Security & Compliance |
| 3 | **Technical Debt** | `ui-feature:tech-debt` label OR existing Jira labels `tech-debt`/`tech-maintenance` OR Activity Type = "Quality / Stability / Reliability" | Normal | Important | Quality / Stability / Reliability |
| 4 | **Chore** | Summary or labels contain "chore" | Normal | Important | Quality / Stability / Reliability |
| 5 | **Bug** | `issuetype=Bug` OR Activity Type = "Incidents & Support" | Normal (base); blocker→Blocker, critical→Critical, major→Major, minor→Minor | Important | Incidents & Support |
| 6 | **Weakness** | `issuetype=Weakness` OR `WeaknessTracking` label | Normal | Important | Security & Compliance |
| 7 | **Strategic** | Activity Type = "Future Sustainability" | Normal | Moderate | Future Sustainability |
| 8 | **BU Product** | Activity Type = "Product / Portfolio Work" | Normal | Moderate | Product / Portfolio Work |
| 9 | **All Else** | Fallback | Normal | Low | _(not set)_ |

**Severity** (SanKey band) represents the company's capacity allocation priority — "fix bugs and
security first, then strategic, then features, then everything else." Separate from per-ticket Priority.

### Bug impact detection

For bug-tier tickets, summary keywords implement the team's priority guidelines
(`_guidelines` in priority.json). Three impact levels are detected from `bug_impact_patterns`
in `area_keywords.json`. Order: blocker → major-specific → broad critical.

| Impact | Definition | Example Keywords | Priority |
|--------|-----------|-----------------|----------|
| **blocker** | Complete halt, unusable, no workaround | login failure, white screen, error page, form submission failure | Blocker |
| **critical** | Significant degradation, no workaround | unable to, cannot, broken, crash, fails to, not working | Critical |
| **major** | Important features affected, complex workaround | data missing/incorrect, validation prevents, not showing, cannot enter/reach | Major |
| **minor** | Minimal impact, cosmetic | misalign, alignment, font color, cosmetic, text change, typo, pixel | Minor |
| _(none)_ | Moderate impact, straightforward workaround | no impact keywords | Normal (base) |

Customer signal bumps one level: Minor→Normal, Normal→Major, Major→Critical, Critical→Blocker.

### Modifier signals

| Signal | How detected |
|--------|-------------|
| **Customer-originated** | Keywords: "RFE", "SRE", "customer", "escalation", "CEE" |
| **Hot discussion** | 5+ comments |
| **Bug impact** | Summary keywords → blocker/critical/major levels |

### Tier modifier resolution

Candidate keys tried in order (first match in tier's modifiers wins):

**Bug tier:**

| Signals | Keys tried → Result |
|---------|---------------------|
| blocker + customer | `blocker_customer` → Blocker |
| blocker | `blocker` → Blocker |
| critical + customer | `critical_customer` → Blocker |
| critical | `critical` → Critical |
| major + customer | `major_customer` → Critical |
| major | `major` → Major |
| minor + customer | `minor_customer` → Normal |
| minor | `minor` → Minor |
| customer + hot | `customer_and_hot` → Critical |
| customer | `customer` → Major |
| no signals | base → Normal |

**Other tiers:** `customer_or_hot` → Major (tech-debt, weakness); `customer` → Major (strategic, bu-product)

### Write logic (determined by comparing CUR vs CALC columns)

**Priority:**
- Undefined → SET directly to calculated value
- Existing but differs → add `suggested-priority:<level>` label
- Matches → no change

**Severity (SanKey band):**
- Empty → SET based on SanKey tier (Critical/Important/Moderate/Low)
- Already set → no change

**Activity Type:**
- Empty → SET to calculated value from tier mapping
- Already set → no change

### Severity field

Custom field `customfield_12316142`. Allowed values: Critical, Important, Moderate, Low, Informational.
Mapped from SanKey tier — represents company capacity allocation priority band.

### Activity Type field

Custom field `customfield_12320040`. Discovered values on OCMUI tickets:

| Activity Type Value | SanKey Tier Mapping |
|--------------------|--------------------|
| Security & Compliance | Tier 2: CVE/Security |
| Quality / Stability / Reliability | Tier 3: Technical Debt |
| Incidents & Support | Tier 5: Bug |
| Future Sustainability | Tier 7: Strategic |
| Product / Portfolio Work | Tier 8: BU Product |

### RHOCPPRIO links

No OCMUI tickets currently link to RHOCPPRIO (0 of 151 bugs checked). Detection
is implemented and future-proofed via the `issuelinks` field.

### Priority definitions (from team guidelines)

| Priority | Bug | Story |
|----------|-----|-------|
| **Blocker** | Breakage/outage/unrecoverable; blocks epic closure | Feature is required |
| **Critical** | Blocks major functionality; blocks epic closure | Critical to UX or RH business |
| **Major** | Blocks functionality; may delay epic closure | Highly desirable, time sensitive |
| **Normal** | Impacts functionality but critical ops remain | Typical enhancement request |
| **Minor** | Impacts under specific circumstances | Cosmetic change |

---

## Skipped Tickets

| Pattern | Reason |
|---------|--------|
| `^E2E Automation:` | QE auto-created subtask |
| `^CI Automation:` | QE auto-created subtask |
| `^Post-merge testing:` | QE auto-created subtask |
| `spike` | Investigation — not actionable work |

---

## File Structure

```
jira_triage/
├── .env.example               # JIRA_API_TOKEN placeholder
├── .env                       # (git-ignored) your actual token
├── .gitignore                 # Keeps .env and output/ out of git
├── README.md                  # Script usage and label reference
├── config/
│   ├── area_keywords.json     # Skip / product / feature / customer patterns
│   ├── priority.json          # SanKey tiers, Activity Type field ID, modifiers
│   └── thresholds.json        # Comment-count heat thresholds
├── scripts/
│   ├── fetch_tickets.sh       # Pull all open stories/tasks as JSON
│   ├── analyze.sh             # Categorize tickets, SanKey tier, produce markdown report
│   └── apply_labels.sh        # Apply labels + priority from approved report
└── output/                    # (git-ignored) all generated files
    ├── raw_tickets.json       # Raw Jira API response data
    ├── analysis_report.md     # Categorized report (markdown table) — labels + priority in one view
    └── apply_log.txt          # Application log
```

---

## Open Questions / Future Work

- [ ] Should Blocker priority be auto-suggested? (currently only for RHOCPPRIO-linked support escalations)
- [ ] Tag by **age** (stale tickets)?
- [ ] Add `sankey-tier:` labels to tickets for Jira filtering?
- [ ] JQL saved filters or Jira dashboard for each label category?
- [ ] Automate periodic re-analysis?
- [ ] Integrate with ocmui-team-dashboard — add a "Backlog Triage" panel?

---

## Status

| Phase | Status |
|-------|--------|
| Roadmap & planning | ✅ Done |
| Config scaffolding | ✅ Done |
| REST API scripts (fetch, analyze, apply) | ✅ Done |
| Area patterns built from real ticket data | ✅ Done |
| Label normalization (`ui-product:` / `ui-feature:`) | ✅ Done |
| SanKey tier discovery (RHOCPPRIO, Activity Type) | ✅ Done |
| SanKey priority framework integration | ✅ Done |
| Expanded product patterns (ARO, RHOIC, OCP, OCP-AI) | ✅ Done |
| Tech-debt detection from existing Jira labels | ✅ Done |
| Markdown report output (replaces TSV) | ✅ Done |
| Consolidated LABELS column (product + feature + suggested-priority) | ✅ Done |
| Enhanced downloads pattern (binary URLs, broken links) | ✅ Done |
| Priority suggestion logic (SET / SUGGEST / OK) | ✅ Done |
| Skip patterns (E2E/CI/Post-merge, spike) | ✅ Done |
| Single-ticket test mode (`--ticket`) | ✅ Done |
| Activity Type calculation and SET from tier mapping | ✅ Done |
| Report columns: KEY, SUMMARY, CUR/CALC_PRI, CALC_SEV, CUR/CALC_ACT, LABELS | ✅ Done |
| Bug impact detection: 4 levels (blocker/critical/major/minor) from `_guidelines` | ✅ Done |
| Bug base_priority Normal, bumped by impact + customer signals | ✅ Done |
| Full bug priority definitions with examples in `_guidelines` | ✅ Done |
| Story/Task impact detection (blocker/critical/major/minor) from `story_impact_patterns` | ✅ Done |
| Severity field (SanKey band): Critical/Important/Moderate/Low per tier | ✅ Done |
| Minor impact patterns for bugs (alignment, cosmetic, font, typo) and stories | ✅ Done |
| First fetch + analysis dry-run | ⏳ Ready to run |
| Review & refine keyword patterns | ⏳ Pending |
| Label + priority + Activity Type application | ⏳ Pending |
