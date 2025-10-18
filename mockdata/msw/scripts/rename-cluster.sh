#!/bin/bash

# Rename a recorded cluster fixture
# Usage: ./rename-cluster.sh <old-name> <new-name>
#
# Example: ./rename-cluster.sh osd-annual-redhataccount-gcp-singlezone-private my-gcp-cluster

set -e

# Strip leading "./" from arguments if present
OLD_NAME="${1#./}"
NEW_NAME="${2#./}"

if [ -z "$OLD_NAME" ] || [ -z "$NEW_NAME" ]; then
  echo "❌ Usage: ./rename-cluster.sh <old-name> <new-name>"
  echo ""
  echo "Example:"
  echo "  ./rename-cluster.sh osd-annual-redhataccount-gcp-singlezone-private my-gcp-cluster"
  exit 1
fi

# Detect if we're in the scripts directory or project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$SCRIPT_DIR" == */mockdata/msw/scripts ]]; then
  # Running from scripts directory - go up to project root
  PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
else
  # Assume we're at project root
  PROJECT_ROOT="$(pwd)"
fi

FIXTURES_DIR="${PROJECT_ROOT}/mockdata/msw/fixtures/recorded"
OLD_FILE="${FIXTURES_DIR}/${OLD_NAME}.ts"
NEW_FILE="${FIXTURES_DIR}/${NEW_NAME}.ts"

# Check if old file exists
if [ ! -f "$OLD_FILE" ]; then
  echo "❌ Error: File not found: $OLD_FILE"
  echo ""
  echo "Available recorded fixtures:"
  ls -1 "$FIXTURES_DIR"/*.ts 2>/dev/null | xargs -n1 basename | sed 's/\.ts$//' || echo "  (none)"
  exit 1
fi

# Check if new file already exists
if [ -f "$NEW_FILE" ]; then
  echo "❌ Error: Target file already exists: $NEW_FILE"
  echo "Please choose a different name or delete the existing file first."
  exit 1
fi

# Convert names to camelCase for variable names
# Function to convert kebab-case to camelCase
to_camel_case() {
  echo "$1" | awk -F'-' '{
    printf "%s", $1
    for (i=2; i<=NF; i++) {
      printf "%s%s", toupper(substr($i,1,1)), substr($i,2)
    }
  }'
}

OLD_CAMEL=$(to_camel_case "$OLD_NAME")
NEW_CAMEL=$(to_camel_case "$NEW_NAME")

echo "🔄 Renaming cluster fixture..."
echo "   Old: $OLD_NAME ($OLD_CAMEL)"
echo "   New: $NEW_NAME ($NEW_CAMEL)"
echo ""

# Create new file with updated variable names AND cluster data fields
sed "s/${OLD_CAMEL}Cluster/${NEW_CAMEL}Cluster/g; s/${OLD_CAMEL}Subscription/${NEW_CAMEL}Subscription/g; s/\"name\": \"${OLD_NAME}\"/\"name\": \"${NEW_NAME}\"/g; s/\"display_name\": \"${OLD_NAME}\"/\"display_name\": \"${NEW_NAME}\"/g" "$OLD_FILE" > "$NEW_FILE"

# Verify the new file was created
if [ ! -f "$NEW_FILE" ]; then
  echo "❌ Error: Failed to create new file: $NEW_FILE"
  exit 1
fi

# Remove old file
rm "$OLD_FILE"

echo "✅ Successfully renamed fixture!"
echo ""
echo "📝 Next steps:"
echo "  1. Update imports in fixtures/clusters.ts:"
echo "     OLD: import { ${OLD_CAMEL}Cluster } from './recorded/${OLD_NAME}.js';"
echo "     NEW: import { ${NEW_CAMEL}Cluster } from './recorded/${NEW_NAME}.js';"
echo ""
echo "  2. Update mockClusters array in fixtures/clusters.ts:"
echo "     export const mockClusters: Cluster[] = ["
echo "       hypershiftReadyCluster,"
echo "       ${NEW_CAMEL}Cluster,  // <- Updated name"
echo "     ];"
echo ""
echo "  3. Update imports in fixtures/subscriptions.ts:"
echo "     OLD: import { ${OLD_CAMEL}Subscription } from './recorded/${OLD_NAME}.js';"
echo "     NEW: import { ${NEW_CAMEL}Subscription } from './recorded/${NEW_NAME}.js';"
echo ""
echo "  4. Update mockSubscriptions array in fixtures/subscriptions.ts:"
echo "     export const mockSubscriptions: Subscription[] = ["
echo "       hypershiftReadySubscription,"
echo "       ${NEW_CAMEL}Subscription,  // <- Updated name"
echo "     ];"
echo ""
echo "  5. Rebuild and restart:"
echo "     yarn start:msw"
echo ""
echo "🎉 Done!"

