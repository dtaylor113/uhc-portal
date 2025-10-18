#!/bin/bash

# Delete a recorded cluster and subscription fixture

set -e

if [ -z "$1" ]; then
  echo "❌ Usage: $0 <fixture-name>"
  echo ""
  echo "Example: $0 aws-ccs-public"
  echo ""
  echo "Available fixtures:"
  ls -1 ../fixtures/clusters/*.ts 2>/dev/null | xargs -n 1 basename | sed 's/.ts$//' | grep -v 'index' || echo "  (none)"
  exit 1
fi

# Strip any leading "./" or "../" from the fixture name
FIXTURE_NAME="${1#./}"
FIXTURE_NAME="${FIXTURE_NAME#../}"

CLUSTER_FILE="../fixtures/clusters/${FIXTURE_NAME}.ts"
SUBSCRIPTION_FILE="../fixtures/subscriptions/${FIXTURE_NAME}.ts"

# Check if at least one file exists
if [ ! -f "$CLUSTER_FILE" ] && [ ! -f "$SUBSCRIPTION_FILE" ]; then
  echo "❌ Error: No fixtures found for: $FIXTURE_NAME"
  echo ""
  echo "Available fixtures:"
  ls -1 ../fixtures/clusters/*.ts 2>/dev/null | xargs -n 1 basename | sed 's/.ts$//' | grep -v 'index' || echo "  (none)"
  exit 1
fi

echo "🗑️  Deleting fixtures for: $FIXTURE_NAME"
echo ""

# Delete the files
if [ -f "$CLUSTER_FILE" ]; then
  rm -f "$CLUSTER_FILE"
  echo "✅ Deleted cluster fixture: $CLUSTER_FILE"
fi

if [ -f "$SUBSCRIPTION_FILE" ]; then
  rm -f "$SUBSCRIPTION_FILE"
  echo "✅ Deleted subscription fixture: $SUBSCRIPTION_FILE"
fi

echo ""
echo "📝 Next steps:"
echo "  1. Rebuild fixtures: yarn msw:fixtures:build"
echo "  2. Restart server: yarn start:msw"
echo ""
echo "✨ The index files will be auto-regenerated!"
echo ""
echo "🎉 Done!"

