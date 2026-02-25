#!/usr/bin/env bash
#
# apply_labels.sh — Read the reviewed analysis_report.md and apply to Jira:
#   - ui-product: / ui-feature: labels (always appended, never replaced)
#   - Priority SET when current is Undefined
#   - suggested-priority:<level> label when current differs from calculated
#   - Severity SET when current is empty (SanKey company priority band)
#   - Activity Type SET when current is empty
#
# Usage:
#   ./scripts/apply_labels.sh              # dry-run
#   ./scripts/apply_labels.sh --apply      # write to Jira

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
REPORT_FILE="$ROOT_DIR/output/analysis_report.md"
PRIORITY_FILE="$ROOT_DIR/config/priority.json"
LOG_FILE="$ROOT_DIR/output/apply_log.txt"
JIRA_HOST="issues.redhat.com"

DRY_RUN=true
if [[ "${1:-}" == "--apply" ]]; then
  DRY_RUN=false
fi

if [[ -z "${JIRA_API_TOKEN:-}" ]]; then
  if [[ -f "$ROOT_DIR/.env" ]]; then
    source "$ROOT_DIR/.env"
  else
    echo "ERROR: JIRA_API_TOKEN not set."
    exit 1
  fi
fi

if [[ ! -f "$REPORT_FILE" ]]; then
  echo "ERROR: Report file not found: $REPORT_FILE"
  echo "Run ./scripts/analyze.sh first."
  exit 1
fi

ACTIVITY_TYPE_FIELD=$(jq -r '.activity_type_field' "$PRIORITY_FILE")
SEVERITY_FIELD=$(jq -r '.severity_field' "$PRIORITY_FILE")

TOTAL=$(grep -c '^| OCMUI-' "$REPORT_FILE" || echo 0)
echo "=== OCMUI Apply (REST API) ==="
if $DRY_RUN; then
  echo "MODE: DRY RUN (pass --apply to write to Jira)"
else
  echo "MODE: APPLYING TO JIRA"
  read -r -p "Proceed with $TOTAL tickets? [y/N] " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Aborted."
    exit 0
  fi
fi
echo ""

echo "# Apply log — $(date)" > "$LOG_FILE"
echo "# Mode: $(if $DRY_RUN; then echo 'DRY RUN'; else echo 'APPLY'; fi)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

SUCCESS=0
SKIPPED=0
FAILED=0
LABELS_ADDED=0
PRIORITIES_SET=0
PRIORITIES_SUGGESTED=0
SEVERITIES_SET=0
ACTIVITY_TYPES_SET=0
COUNT=0

# Columns: | KEY | SUMMARY | TYPE | STATUS | CUR_PRI | CALC_PRI | CALC_SEV | CUR_ACT | CALC_ACT | LABELS | CMTS | HEAT | CUST |
while IFS='|' read -r _ KEY SUMMARY TYPE STATUS CUR_PRI CALC_PRI CALC_SEV CUR_ACT CALC_ACT LABELS_COL CMTS HEAT CUST _; do
  KEY=$(echo "$KEY" | xargs)
  CUR_PRI=$(echo "$CUR_PRI" | xargs)
  CALC_PRI=$(echo "$CALC_PRI" | xargs)
  CALC_SEV=$(echo "$CALC_SEV" | xargs)
  CUR_ACT=$(echo "$CUR_ACT" | xargs)
  CALC_ACT=$(echo "$CALC_ACT" | xargs)
  LABELS_COL=$(echo "$LABELS_COL" | xargs)

  [[ -z "$KEY" || ! "$KEY" =~ ^OCMUI- ]] && continue

  ((COUNT++)) || true

  LABELS_TO_ADD=()
  SET_PRIORITY=""
  SET_SEVERITY=""
  SET_ACTIVITY=""
  CHANGES=""

  # Parse labels from the LABELS column (space-separated), skip suggested-priority
  for LABEL in $LABELS_COL; do
    [[ -z "$LABEL" ]] && continue
    if [[ "$LABEL" == suggested-priority:* ]]; then
      continue
    fi
    LABELS_TO_ADD+=("$LABEL")
  done

  # Priority: SET when Undefined, SUGGEST label when differs
  if [[ "$CUR_PRI" == "Undefined" || -z "$CUR_PRI" ]]; then
    SET_PRIORITY="$CALC_PRI"
  elif [[ "$CUR_PRI" != "$CALC_PRI" ]]; then
    LABELS_TO_ADD+=("suggested-priority:${CALC_PRI}")
  fi

  # Severity: always SET (field is currently unused on OCMUI tickets)
  if [[ -n "$CALC_SEV" ]]; then
    SET_SEVERITY="$CALC_SEV"
  fi

  # Activity Type: SET when empty and we have a calculated value
  if [[ -z "$CUR_ACT" && -n "$CALC_ACT" ]]; then
    SET_ACTIVITY="$CALC_ACT"
  fi

  if [[ ${#LABELS_TO_ADD[@]} -eq 0 && -z "$SET_PRIORITY" && -z "$SET_SEVERITY" && -z "$SET_ACTIVITY" ]]; then
    ((SKIPPED++)) || true
    continue
  fi

  if [[ ${#LABELS_TO_ADD[@]} -gt 0 ]]; then
    CHANGES="labels: ${LABELS_TO_ADD[*]}"
  fi
  if [[ -n "$SET_PRIORITY" ]]; then
    [[ -n "$CHANGES" ]] && CHANGES="$CHANGES | "
    CHANGES="${CHANGES}priority: Undefined → $SET_PRIORITY"
  fi
  if [[ -n "$SET_SEVERITY" ]]; then
    [[ -n "$CHANGES" ]] && CHANGES="$CHANGES | "
    CHANGES="${CHANGES}severity: → $SET_SEVERITY"
  fi
  if [[ -n "$SET_ACTIVITY" ]]; then
    [[ -n "$CHANGES" ]] && CHANGES="$CHANGES | "
    CHANGES="${CHANGES}activity: → $SET_ACTIVITY"
  fi

  PAYLOAD='{"update":{}}'

  if [[ ${#LABELS_TO_ADD[@]} -gt 0 ]]; then
    LABEL_OPS=$(printf '%s\n' "${LABELS_TO_ADD[@]}" | jq -R '{"add": .}' | jq -s '.')
    PAYLOAD=$(echo "$PAYLOAD" | jq --argjson ops "$LABEL_OPS" '.update.labels = $ops')
  fi

  if [[ -n "$SET_PRIORITY" ]]; then
    PAYLOAD=$(echo "$PAYLOAD" | jq --arg p "$SET_PRIORITY" '.fields.priority.name = $p')
  fi

  if [[ -n "$SET_SEVERITY" ]]; then
    PAYLOAD=$(echo "$PAYLOAD" | jq --arg f "$SEVERITY_FIELD" --arg v "$SET_SEVERITY" '.fields[$f] = {"value": $v}')
  fi

  if [[ -n "$SET_ACTIVITY" ]]; then
    PAYLOAD=$(echo "$PAYLOAD" | jq --arg f "$ACTIVITY_TYPE_FIELD" --arg v "$SET_ACTIVITY" '.fields[$f] = {"value": $v}')
  fi

  if $DRY_RUN; then
    echo "  [$COUNT/$TOTAL] $KEY — would: $CHANGES"
    echo "DRY  $KEY — $CHANGES" >> "$LOG_FILE"
    ((SUCCESS++)) || true
  else
    echo "  [$COUNT/$TOTAL] $KEY — applying: $CHANGES"

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
      -X PUT \
      -H "Authorization: Bearer $JIRA_API_TOKEN" \
      -H "Content-Type: application/json" \
      -H "User-Agent: OCMUI-Triage-Scripts" \
      -d "$PAYLOAD" \
      "https://$JIRA_HOST/rest/api/2/issue/$KEY")

    if [[ "$HTTP_CODE" == "204" || "$HTTP_CODE" == "200" ]]; then
      echo "OK   $KEY — $CHANGES" >> "$LOG_FILE"
      ((SUCCESS++)) || true
    else
      echo "  WARNING: Failed to update $KEY (HTTP $HTTP_CODE)"
      echo "FAIL $KEY — HTTP $HTTP_CODE — $CHANGES" >> "$LOG_FILE"
      ((FAILED++)) || true
    fi

    sleep 0.2
  fi

  for L in "${LABELS_TO_ADD[@]}"; do
    if [[ "$L" == suggested-priority:* ]]; then
      ((PRIORITIES_SUGGESTED++)) || true
    else
      ((LABELS_ADDED++)) || true
    fi
  done
  if [[ -n "$SET_PRIORITY" ]]; then
    ((PRIORITIES_SET++)) || true
  fi
  if [[ -n "$SET_SEVERITY" ]]; then
    ((SEVERITIES_SET++)) || true
  fi
  if [[ -n "$SET_ACTIVITY" ]]; then
    ((ACTIVITY_TYPES_SET++)) || true
  fi

done < "$REPORT_FILE"

echo ""
echo "=== Summary ==="
echo "Processed:              $COUNT"
echo "Updated:                $SUCCESS"
echo "Skipped (no changes):   $SKIPPED"
echo "Failed:                 $FAILED"
echo ""
echo "Labels added:           $LABELS_ADDED"
echo "Priority SET:           $PRIORITIES_SET (Undefined → calculated)"
echo "Priority SUGGESTED:     $PRIORITIES_SUGGESTED (suggested-priority: label added)"
echo "Severity SET:           $SEVERITIES_SET (empty → SanKey band)"
echo "Activity Type SET:      $ACTIVITY_TYPES_SET (empty → calculated)"
echo ""
echo "Log saved to: $LOG_FILE"

if $DRY_RUN; then
  echo ""
  echo "This was a dry run. To apply:"
  echo "  ./scripts/apply_labels.sh --apply"
fi
