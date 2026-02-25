#!/usr/bin/env bash
#
# analyze.sh — Categorize OCMUI Jira tickets and produce a markdown report.
#
# For each ticket:
#   - Assigns ui-product: / ui-feature: labels
#   - Detects SanKey tier and calculates priority + Activity Type
#   - Empty/Undefined fields will be SET; differing priorities get a suggested-priority label
#
# Usage:
#   ./scripts/analyze.sh                                  # full backlog
#   ./scripts/analyze.sh --ticket OCMUI-123 OCMUI-456    # test specific tickets

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

AREA_FILE="$ROOT_DIR/config/area_keywords.json"
THRESHOLDS_FILE="$ROOT_DIR/config/thresholds.json"
PRIORITY_FILE="$ROOT_DIR/config/priority.json"
JIRA_HOST="issues.redhat.com"

TICKET_MODE=false
TICKET_KEYS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ticket|-t)
      TICKET_MODE=true
      shift
      while [[ $# -gt 0 && ! "$1" =~ ^-- ]]; do
        TICKET_KEYS+=("$1")
        shift
      done
      ;;
    *) shift ;;
  esac
done

for f in "$AREA_FILE" "$THRESHOLDS_FILE" "$PRIORITY_FILE"; do
  if [[ ! -f "$f" ]]; then
    echo "ERROR: Missing file: $f"
    exit 1
  fi
done

HOT_THRESHOLD=$(jq '.heat.hot' "$THRESHOLDS_FILE")
WARM_THRESHOLD=$(jq '.heat.warm' "$THRESHOLDS_FILE")

SKIP_PATTERNS=()
while IFS= read -r p; do
  SKIP_PATTERNS+=("$p")
done < <(jq -r '.skip_patterns[]' "$AREA_FILE")

CUSTOMER_PATTERN=$(jq -r '.customer_patterns[0]' "$AREA_FILE")

ACTIVITY_TYPE_FIELD=$(jq -r '.activity_type_field' "$PRIORITY_FILE")
SEVERITY_FIELD=$(jq -r '.severity_field' "$PRIORITY_FILE")

# Portable PCRE match (macOS grep lacks -P)
pcre_match() {
  printf '%s\n' "$1" | perl -e '
    my $pat = shift;
    while (<STDIN>) { exit 0 if /$pat/i }
    exit 1
  ' "$2"
}

# --- Detect SanKey tier ---
detect_sankey_tier() {
  local issuetype="$1"
  local labels="$2"
  local feature_label="$3"
  local activity_type="$4"
  local has_rhocpprio="$5"
  local summary_lower="$6"

  if [[ "$has_rhocpprio" == "true" ]]; then
    echo "support-escalation"; return
  fi

  if [[ "$issuetype" == "vulnerability" ]]; then
    echo "cve-security"; return
  fi
  if echo ",$labels," | grep -qi ",SecurityTracking,"; then
    echo "cve-security"; return
  fi
  if [[ "$activity_type" == "Security & Compliance" ]]; then
    echo "cve-security"; return
  fi

  if [[ "$feature_label" == "ui-feature:tech-debt" ]]; then
    echo "tech-debt"; return
  fi
  if [[ "$activity_type" == "Quality / Stability / Reliability" ]]; then
    echo "tech-debt"; return
  fi
  if echo ",$labels," | grep -qi ",tech-debt,\|,tech-maintenance,"; then
    echo "tech-debt"; return
  fi

  if echo ",$labels," | grep -qi ",chore,\|,chores,"; then
    echo "chore"; return
  fi
  if pcre_match "$summary_lower" '\bchore\b'; then
    echo "chore"; return
  fi

  if [[ "$issuetype" == "bug" ]]; then
    echo "bug"; return
  fi
  if [[ "$activity_type" == "Incidents & Support" ]]; then
    echo "bug"; return
  fi

  if [[ "$issuetype" == "weakness" ]]; then
    echo "weakness"; return
  fi
  if echo ",$labels," | grep -qi ",WeaknessTracking,"; then
    echo "weakness"; return
  fi

  if [[ "$activity_type" == "Future Sustainability" ]]; then
    echo "strategic"; return
  fi

  if [[ "$activity_type" == "Product / Portfolio Work" ]]; then
    echo "bu-product"; return
  fi

  echo "all-else"
}

# --- Calculate priority from SanKey tier + customer + heat + impact modifiers ---
# Builds a list of candidate modifier keys (most specific first),
# then uses the first one the tier actually defines.
calc_priority() {
  local tier="$1" is_customer="$2" heat="$3" impact="$4"

  local base
  base=$(jq -r --arg t "$tier" '.sankey_tiers[] | select(.tier == $t) | .base_priority' "$PRIORITY_FILE")
  [[ -z "$base" || "$base" == "null" ]] && base="Normal"

  local candidates=()

  # Impact + customer combinations (highest severity first)
  if [[ "$impact" == "blocker" && "$is_customer" == "true" ]]; then
    candidates+=(blocker_customer)
  fi
  [[ "$impact" == "blocker" ]] && candidates+=(blocker)

  if [[ "$impact" == "critical" && "$is_customer" == "true" ]]; then
    candidates+=(critical_customer)
  fi
  [[ "$impact" == "critical" ]] && candidates+=(critical)

  if [[ "$impact" == "major" && "$is_customer" == "true" ]]; then
    candidates+=(major_customer)
  fi
  [[ "$impact" == "major" ]] && candidates+=(major)

  if [[ "$impact" == "minor" && "$is_customer" == "true" ]]; then
    candidates+=(minor_customer)
  fi
  [[ "$impact" == "minor" ]] && candidates+=(minor)

  # Customer + heat combinations
  if [[ "$is_customer" == "true" && "$heat" == "hot" ]]; then
    candidates+=(customer_and_hot)
  fi
  if [[ "$is_customer" == "true" || "$heat" == "hot" ]]; then
    candidates+=(customer_or_hot)
  fi
  [[ "$is_customer" == "true" ]] && candidates+=(customer)

  for key in "${candidates[@]}"; do
    local val
    val=$(jq -r --arg t "$tier" --arg k "$key" \
      '.sankey_tiers[] | select(.tier == $t) | .modifiers[$k] // empty' "$PRIORITY_FILE")
    if [[ -n "$val" ]]; then
      echo "$val"
      return
    fi
  done

  echo "$base"
}

# --- Build input JSON ---
if $TICKET_MODE; then
  if [[ ${#TICKET_KEYS[@]} -eq 0 ]]; then
    echo "ERROR: --ticket requires at least one ticket key (e.g., OCMUI-123)"
    exit 1
  fi

  if [[ -z "${JIRA_API_TOKEN:-}" ]]; then
    if [[ -f "$ROOT_DIR/.env" ]]; then
      source "$ROOT_DIR/.env"
    else
      echo "ERROR: JIRA_API_TOKEN not set."
      exit 1
    fi
  fi

  FIELDS="key,summary,description,status,priority,assignee,reporter,created,updated,issuetype,labels,comment,components,issuelinks,$ACTIVITY_TYPE_FIELD,$SEVERITY_FIELD"
  INPUT_JSON="[]"

  echo "=== OCMUI Ticket Analysis (single-ticket mode) ==="
  echo ""

  for TKEY in "${TICKET_KEYS[@]}"; do
    echo "Fetching $TKEY..."
    RESPONSE=$(curl -s -w "\n%{http_code}" \
      -H "Authorization: Bearer $JIRA_API_TOKEN" \
      -H "Accept: application/json" \
      -H "User-Agent: OCMUI-Triage-Scripts" \
      "https://$JIRA_HOST/rest/api/2/issue/$TKEY?fields=$FIELDS")

    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [[ "$HTTP_CODE" != "200" ]]; then
      echo "  WARNING: Could not fetch $TKEY (HTTP $HTTP_CODE), skipping"
      continue
    fi

    INPUT_JSON=$(echo "$INPUT_JSON" | jq --argjson ticket "$BODY" '. + [$ticket]')
  done

  echo ""
else
  RAW_FILE="$ROOT_DIR/output/raw_tickets.json"
  if [[ ! -f "$RAW_FILE" ]]; then
    echo "ERROR: Missing $RAW_FILE — run ./scripts/fetch_tickets.sh first"
    exit 1
  fi
  INPUT_JSON=$(cat "$RAW_FILE")

  echo "=== OCMUI Backlog Analysis ==="
fi

REPORT_FILE="$ROOT_DIR/output/analysis_report.md"
TOTAL=$(echo "$INPUT_JSON" | jq 'length')
echo "Analyzing $TOTAL tickets..."
echo ""

MD_HEADER="| KEY | SUMMARY | TYPE | STATUS | CUR_PRI | CALC_PRI | CALC_SEV | CUR_ACT | CALC_ACT | LABELS | CMTS | HEAT | CUST |"
MD_SEP="|-----|---------|------|--------|---------|----------|----------|---------|----------|--------|------|------|------|"

{
  echo "# OCMUI Backlog Analysis Report"
  echo ""
  echo "_Generated: $(date '+%Y-%m-%d %H:%M')_"
  echo ""
  echo "$MD_HEADER"
  echo "$MD_SEP"
} > "$REPORT_FILE"

if $TICKET_MODE; then
  echo "$MD_HEADER"
  echo "$MD_SEP"
fi

product_count=0
feature_count=0
customer_count=0
priority_set_count=0
priority_suggest_count=0
severity_set_count=0
activity_set_count=0
skipped=0

declare -A tier_counts

for i in $(seq 0 $((TOTAL - 1))); do
  TICKET=$(echo "$INPUT_JSON" | jq ".[$i]")

  KEY=$(echo "$TICKET" | jq -r '.key')
  TYPE=$(echo "$TICKET" | jq -r '.fields.issuetype.name // "unknown"')
  STATUS=$(echo "$TICKET" | jq -r '.fields.status.name // "unknown"')
  CURRENT_PRIORITY=$(echo "$TICKET" | jq -r '.fields.priority.name // "Undefined"')
  SUMMARY=$(echo "$TICKET" | jq -r '.fields.summary // ""')
  REPORTER=$(echo "$TICKET" | jq -r '.fields.reporter.displayName // "unknown"')
  COMMENT_COUNT=$(echo "$TICKET" | jq '.fields.comment.total // .fields.comment.comments // [] | if type == "number" then . else length end')
  EXISTING_LABELS=$(echo "$TICKET" | jq -r '(.fields.labels // []) | join(",")')

  ACTIVITY_TYPE=$(echo "$TICKET" | jq -r --arg f "$ACTIVITY_TYPE_FIELD" '.fields[$f].value // ""')

  HAS_RHOCPPRIO="false"
  RHOCPPRIO_CHECK=$(echo "$TICKET" | jq -r '
    [.fields.issuelinks // [] | .[] |
      (if .outwardIssue then .outwardIssue.key else null end),
      (if .inwardIssue then .inwardIssue.key else null end)
    ] | map(select(. != null and startswith("RHOCPPRIO"))) | length')
  if [[ "$RHOCPPRIO_CHECK" -gt 0 ]]; then
    HAS_RHOCPPRIO="true"
  fi

  SUMMARY_LOWER=$(echo "$SUMMARY" | tr '[:upper:]' '[:lower:]')
  DESCRIPTION=$(echo "$TICKET" | jq -r '.fields.description // ""')
  DESC_LOWER=$(echo "$DESCRIPTION" | tr '[:upper:]' '[:lower:]')
  MATCH_TEXT="${SUMMARY_LOWER} ${DESC_LOWER}"

  # --- Skip check (title only — patterns use ^ anchors) ---
  SHOULD_SKIP=false
  for skip_pat in "${SKIP_PATTERNS[@]}"; do
    if pcre_match "$SUMMARY_LOWER" "$skip_pat"; then
      SHOULD_SKIP=true
      break
    fi
  done

  if $SHOULD_SKIP; then
    ((skipped++)) || true
    continue
  fi

  # --- Product label (matches title + description) ---
  PRODUCT_LABEL=""
  while IFS= read -r rule; do
    pattern=$(echo "$rule" | jq -r '.pattern')
    label=$(echo "$rule" | jq -r '.label')
    if pcre_match "$MATCH_TEXT" "$pattern"; then
      PRODUCT_LABEL="$label"
      break
    fi
  done < <(jq -c '.product_patterns[]' "$AREA_FILE")

  if [[ -n "$PRODUCT_LABEL" ]]; then
    ((product_count++)) || true
  fi

  # --- Feature label (matches title + description) ---
  FEATURE_LABEL=""
  while IFS= read -r rule; do
    pattern=$(echo "$rule" | jq -r '.pattern')
    label=$(echo "$rule" | jq -r '.label')
    if pcre_match "$MATCH_TEXT" "$pattern"; then
      FEATURE_LABEL="$label"
      break
    fi
  done < <(jq -c '.feature_patterns[]' "$AREA_FILE")

  if [[ -n "$FEATURE_LABEL" ]]; then
    ((feature_count++)) || true
  fi

  # --- Customer detection (matches title + description) ---
  IS_CUSTOMER="false"
  if pcre_match "$MATCH_TEXT" "$CUSTOMER_PATTERN"; then
    IS_CUSTOMER="true"
    ((customer_count++)) || true
  fi

  # --- Heat (from comment count) ---
  if [[ "$COMMENT_COUNT" -ge "$HOT_THRESHOLD" ]]; then
    HEAT="hot"
  elif [[ "$COMMENT_COUNT" -ge "$WARM_THRESHOLD" ]]; then
    HEAT="warm"
  else
    HEAT="cold"
  fi

  # --- SanKey tier detection ---
  TYPE_LOWER=$(echo "$TYPE" | tr '[:upper:]' '[:lower:]')
  SANKEY_TIER=$(detect_sankey_tier "$TYPE_LOWER" "$EXISTING_LABELS" "$FEATURE_LABEL" "$ACTIVITY_TYPE" "$HAS_RHOCPPRIO" "$MATCH_TEXT")

  tier_counts["$SANKEY_TIER"]=$(( ${tier_counts["$SANKEY_TIER"]:-0} + 1 ))

  # --- Impact detection (matches title + description) ---
  # Bug tier uses bug_impact_patterns; all other tiers use story_impact_patterns
  IMPACT="none"
  if [[ "$SANKEY_TIER" == "bug" ]]; then
    IMPACT_PATTERNS_KEY="bug_impact_patterns"
  else
    IMPACT_PATTERNS_KEY="story_impact_patterns"
  fi
  while IFS= read -r rule; do
    pattern=$(echo "$rule" | jq -r '.pattern')
    impact=$(echo "$rule" | jq -r '.impact')
    if pcre_match "$MATCH_TEXT" "$pattern"; then
      IMPACT="$impact"
      break
    fi
  done < <(jq -c --arg k "$IMPACT_PATTERNS_KEY" '.[$k][]' "$AREA_FILE")

  # --- Calculate priority from SanKey tier + modifiers ---
  CALC_PRIORITY=$(calc_priority "$SANKEY_TIER" "$IS_CUSTOMER" "$HEAT" "$IMPACT")

  # --- Calculate Severity from SanKey tier ---
  CALC_SEVERITY=$(jq -r --arg t "$SANKEY_TIER" '.tier_to_severity[$t] // ""' "$PRIORITY_FILE")
  [[ "$CALC_SEVERITY" == "null" ]] && CALC_SEVERITY=""

  # --- Calculate Activity Type from SanKey tier ---
  CALC_ACTIVITY=$(jq -r --arg t "$SANKEY_TIER" '.tier_to_activity_type[$t] // ""' "$PRIORITY_FILE")
  [[ "$CALC_ACTIVITY" == "null" ]] && CALC_ACTIVITY=""

  # --- Priority: track SET / SUGGEST ---
  if [[ "$CURRENT_PRIORITY" == "Undefined" || -z "$CURRENT_PRIORITY" ]]; then
    ((priority_set_count++)) || true
  elif [[ "$CURRENT_PRIORITY" != "$CALC_PRIORITY" ]]; then
    ((priority_suggest_count++)) || true
  fi

  # --- Severity: track SET (always set — field is unused on OCMUI tickets) ---
  if [[ -n "$CALC_SEVERITY" ]]; then
    ((severity_set_count++)) || true
  fi

  # --- Activity Type: track SET ---
  if [[ -z "$ACTIVITY_TYPE" && -n "$CALC_ACTIVITY" ]]; then
    ((activity_set_count++)) || true
  fi

  # --- Build LABELS column: product, feature, suggested-priority (space-separated) ---
  LABELS_COL=""
  [[ -n "$PRODUCT_LABEL" ]] && LABELS_COL="$PRODUCT_LABEL"
  if [[ -n "$FEATURE_LABEL" ]]; then
    [[ -n "$LABELS_COL" ]] && LABELS_COL="$LABELS_COL "
    LABELS_COL="${LABELS_COL}${FEATURE_LABEL}"
  fi
  if [[ "$CURRENT_PRIORITY" != "Undefined" && -n "$CURRENT_PRIORITY" && "$CURRENT_PRIORITY" != "$CALC_PRIORITY" ]]; then
    [[ -n "$LABELS_COL" ]] && LABELS_COL="$LABELS_COL "
    LABELS_COL="${LABELS_COL}suggested-priority:${CALC_PRIORITY}"
  fi

  SAFE_SUMMARY=$(echo "$SUMMARY" | tr '\t' ' ' | tr '\n' ' ' | sed 's/|/∣/g')
  SAFE_LABELS=$(echo "$LABELS_COL" | sed 's/|/∣/g')
  SAFE_CALC_SEV=$(echo "$CALC_SEVERITY" | sed 's/|/∣/g')
  SAFE_CUR_ACT=$(echo "$ACTIVITY_TYPE" | sed 's/|/∣/g')
  SAFE_CALC_ACT=$(echo "$CALC_ACTIVITY" | sed 's/|/∣/g')

  MD_ROW="| ${KEY} | ${SAFE_SUMMARY} | ${TYPE} | ${STATUS} | ${CURRENT_PRIORITY} | ${CALC_PRIORITY} | ${SAFE_CALC_SEV} | ${SAFE_CUR_ACT} | ${SAFE_CALC_ACT} | ${SAFE_LABELS} | ${COMMENT_COUNT} | ${HEAT} | ${IS_CUSTOMER} |"

  echo "$MD_ROW" >> "$REPORT_FILE"

  if $TICKET_MODE; then
    echo "$MD_ROW"
  elif (( (i + 1) % 25 == 0 )); then
    echo "  Processed $((i + 1)) / $TOTAL"
  fi
done

ANALYZED=$((TOTAL - skipped))
echo ""
echo "=== Analysis Complete ==="
echo "Total tickets:            $TOTAL"
echo "Skipped (auto/spike):     $skipped"
echo "Analyzed:                 $ANALYZED"
echo "Product label assigned:   $product_count / $ANALYZED"
echo "Feature label assigned:   $feature_count / $ANALYZED"
echo "Customer-originated:      $customer_count / $ANALYZED"
echo ""
echo "=== SanKey Tier Distribution ==="
for tier in support-escalation cve-security tech-debt chore bug weakness strategic bu-product all-else; do
  count=${tier_counts["$tier"]:-0}
  if [[ "$count" -gt 0 ]]; then
    printf "  %-24s %d\n" "$tier" "$count"
  fi
done
echo ""
echo "=== Priority ==="
echo "SET (undefined→calc):     $priority_set_count"
echo "SUGGEST (differs):        $priority_suggest_count"
echo "OK (matches):             $((ANALYZED - priority_set_count - priority_suggest_count))"
echo ""
echo "=== Severity (SanKey band) ==="
echo "SET (empty→calc):         $severity_set_count"
echo ""
echo "=== Activity Type ==="
echo "SET (empty→calc):         $activity_set_count"
echo ""
echo "Report saved to: $REPORT_FILE"

if ! $TICKET_MODE; then
  echo ""
  echo "To test specific tickets:  ./scripts/analyze.sh --ticket OCMUI-123 OCMUI-456"
  echo "To apply:                  ./scripts/apply_labels.sh          # dry-run"
  echo "                           ./scripts/apply_labels.sh --apply  # write to Jira"
fi
