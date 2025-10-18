#!/bin/bash
# Record a real cluster and subscription from OCM API to TypeScript fixtures
#
# Usage: ./record-cluster.sh <subscription-id> [output-name]
#
# Requires: ocm CLI tool (https://github.com/openshift-online/ocm-cli)
#           jq for JSON processing
#
# Example: ./record-cluster.sh 2ABC123xyz aws-ccs-public

set -e

SUBSCRIPTION_ID="${1}"
OUTPUT_NAME="${2:-recorded-cluster}"

# Convert OUTPUT_NAME to valid JavaScript identifier (camelCase)
# Example: "aws-ccs-public" -> "awsCcsPublic"
CAMEL_CASE_NAME=$(echo "$OUTPUT_NAME" | sed -E 's/-([a-z])/\U\1/g')

if [ -z "$SUBSCRIPTION_ID" ]; then
  echo "❌ Error: Subscription ID required"
  echo "Usage: $0 <subscription-id> [output-name]"
  echo ""
  echo "To find subscription IDs:"
  echo "  ocm list subscriptions"
  exit 1
fi

echo "🔍 Fetching subscription: $SUBSCRIPTION_ID..."

# Fetch subscription
SUBSCRIPTION=$(ocm get "/api/accounts_mgmt/v1/subscriptions/$SUBSCRIPTION_ID")

if [ -z "$SUBSCRIPTION" ]; then
  echo "❌ Failed to fetch subscription"
  exit 1
fi

# Extract cluster ID from subscription
CLUSTER_ID=$(echo "$SUBSCRIPTION" | jq -r '.cluster_id')

if [ -z "$CLUSTER_ID" ] || [ "$CLUSTER_ID" == "null" ]; then
  echo "❌ No cluster_id found in subscription"
  exit 1
fi

echo "✅ Found cluster ID: $CLUSTER_ID"
echo "🔍 Fetching cluster details..."

# Fetch full cluster details
CLUSTER=$(ocm get "/api/clusters_mgmt/v1/clusters/$CLUSTER_ID")

if [ -z "$CLUSTER" ]; then
  echo "❌ Failed to fetch cluster"
  exit 1
fi

# Extract key properties for summary
CLUSTER_NAME=$(echo "$CLUSTER" | jq -r '.name')
PRODUCT=$(echo "$CLUSTER" | jq -r '.product.id')
CLOUD_PROVIDER=$(echo "$CLUSTER" | jq -r '.cloud_provider.id')
HYPERSHIFT=$(echo "$CLUSTER" | jq -r '.hypershift.enabled // false')
CCS=$(echo "$CLUSTER" | jq -r '.ccs.enabled // false')
STATE=$(echo "$CLUSTER" | jq -r '.state')

echo ""
echo "📊 Cluster Summary:"
echo "  Name: $CLUSTER_NAME"
echo "  Product: $PRODUCT"
echo "  Cloud: $CLOUD_PROVIDER"
echo "  Architecture: $([ "$HYPERSHIFT" == "true" ] && echo "HCP (Hosted Control Plane)" || echo "Classic")"
echo "  Billing: $([ "$CCS" == "true" ] && echo "CCS (Customer pays)" || echo "Non-CCS (Red Hat pays)")"
echo "  State: $STATE"
echo ""

# Create output directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLUSTERS_DIR="$SCRIPT_DIR/../fixtures/clusters"
SUBSCRIPTIONS_DIR="$SCRIPT_DIR/../fixtures/subscriptions"
mkdir -p "$CLUSTERS_DIR"
mkdir -p "$SUBSCRIPTIONS_DIR"

# Generate cluster TypeScript fixture
CLUSTER_TS_FILE="$CLUSTERS_DIR/${OUTPUT_NAME}.ts"

cat > "$CLUSTER_TS_FILE" << 'EOF'
/**
 * Recorded Cluster Fixture
 * 
 * This fixture was auto-generated from a real cluster.
 * 
EOF

echo " * Cluster: $CLUSTER_NAME" >> "$CLUSTER_TS_FILE"
echo " * Product: $PRODUCT" >> "$CLUSTER_TS_FILE"
echo " * Cloud: $CLOUD_PROVIDER" >> "$CLUSTER_TS_FILE"
echo " * Architecture: $([ "$HYPERSHIFT" == "true" ] && echo "HCP" || echo "Classic")" >> "$CLUSTER_TS_FILE"
echo " * Billing: $([ "$CCS" == "true" ] && echo "CCS" || echo "Non-CCS")" >> "$CLUSTER_TS_FILE"
echo " * Recorded: $(date)" >> "$CLUSTER_TS_FILE"

cat >> "$CLUSTER_TS_FILE" << 'EOF'
 */

import type { Cluster } from '../types.js';

EOF

echo "export const ${CAMEL_CASE_NAME}Cluster: Cluster = (" >> "$CLUSTER_TS_FILE"
echo "$CLUSTER" | jq '.' >> "$CLUSTER_TS_FILE"
echo ") as any;" >> "$CLUSTER_TS_FILE"

echo "✅ Generated cluster fixture: $CLUSTER_TS_FILE"

# Generate subscription TypeScript fixture
SUBSCRIPTION_TS_FILE="$SUBSCRIPTIONS_DIR/${OUTPUT_NAME}.ts"

cat > "$SUBSCRIPTION_TS_FILE" << 'EOF'
/**
 * Recorded Subscription Fixture
 * 
 * This fixture was auto-generated from a real subscription.
 * 
EOF

echo " * Cluster: $CLUSTER_NAME" >> "$SUBSCRIPTION_TS_FILE"
echo " * Subscription ID: $SUBSCRIPTION_ID" >> "$SUBSCRIPTION_TS_FILE"
echo " * Recorded: $(date)" >> "$SUBSCRIPTION_TS_FILE"

cat >> "$SUBSCRIPTION_TS_FILE" << 'EOF'
 */

import type { Subscription } from '../types.js';

EOF

echo "export const ${CAMEL_CASE_NAME}Subscription: Subscription = (" >> "$SUBSCRIPTION_TS_FILE"
echo "$SUBSCRIPTION" | jq '.' >> "$SUBSCRIPTION_TS_FILE"
echo ") as any;" >> "$SUBSCRIPTION_TS_FILE"

echo "✅ Generated subscription fixture: $SUBSCRIPTION_TS_FILE"
echo ""
echo "📝 Next steps:"
echo "  1. Rebuild fixtures: yarn msw:fixtures:build"
echo "  2. Restart server: yarn start:msw"
echo ""
echo "✨ The fixtures will be automatically discovered and loaded!"
echo "   No manual imports needed - the index files are auto-generated."
echo ""
echo "🎉 Done!"

