#!/usr/bin/env bash
#
# fetch_tickets.sh — Pull all open Stories + Tasks from OCMUI via Jira REST API.
# Uses the same API patterns as the ocmui-team-dashboard backend.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_FILE="$ROOT_DIR/output/raw_tickets.json"

PROJECT="OCMUI"
PAGE_SIZE=100
JIRA_HOST="issues.redhat.com"

if [[ -z "${JIRA_API_TOKEN:-}" ]]; then
  if [[ -f "$ROOT_DIR/.env" ]]; then
    source "$ROOT_DIR/.env"
  else
    echo "ERROR: JIRA_API_TOKEN not set. Copy .env.example to .env and add your token."
    exit 1
  fi
fi

JQL='project = OCMUI AND issuetype in (Story, Task) AND status not in (Closed, Done, Resolved) ORDER BY created DESC'
FIELDS="key,summary,description,status,priority,assignee,reporter,created,updated,issuetype,labels,comment,components,issuelinks,customfield_12320040,customfield_12316142"

echo "=== OCMUI Backlog Fetch (REST API) ==="
echo "JQL: $JQL"
echo ""

ALL_ISSUES="[]"
START_AT=0

while true; do
  echo "Fetching at startAt=$START_AT (maxResults=$PAGE_SIZE)..."

  ENCODED_JQL=$(python3 -c "import urllib.parse; print(urllib.parse.quote('''$JQL'''))")
  URL="https://$JIRA_HOST/rest/api/2/search?jql=$ENCODED_JQL&maxResults=$PAGE_SIZE&startAt=$START_AT&fields=$FIELDS"

  RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer $JIRA_API_TOKEN" \
    -H "Accept: application/json" \
    -H "User-Agent: OCMUI-Triage-Scripts" \
    "$URL")

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [[ "$HTTP_CODE" != "200" ]]; then
    echo "ERROR: Jira API returned HTTP $HTTP_CODE"
    echo "$BODY" | jq '.errorMessages // .errors // .' 2>/dev/null || echo "$BODY"
    exit 1
  fi

  ISSUES=$(echo "$BODY" | jq '.issues')
  COUNT=$(echo "$ISSUES" | jq 'length')
  TOTAL_AVAILABLE=$(echo "$BODY" | jq '.total')

  echo "  Got $COUNT issues (total available: $TOTAL_AVAILABLE)"

  if [[ "$COUNT" -eq 0 ]]; then
    break
  fi

  ALL_ISSUES=$(echo "$ALL_ISSUES" "$ISSUES" | jq -s '.[0] + .[1]')
  START_AT=$((START_AT + PAGE_SIZE))

  if [[ "$START_AT" -ge "$TOTAL_AVAILABLE" ]]; then
    break
  fi
done

TOTAL=$(echo "$ALL_ISSUES" | jq 'length')
echo ""
echo "Total issues fetched: $TOTAL"

echo "$ALL_ISSUES" | jq '.' > "$OUTPUT_FILE"
echo "Saved to: $OUTPUT_FILE"
echo ""
echo "Next step: run ./scripts/analyze.sh"
