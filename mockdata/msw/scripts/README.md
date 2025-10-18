# MSW Scripts

Scripts for managing MSW mock data fixtures.

## 🚀 Quick Start

```bash
# 1. Find a cluster's subscription ID
ocm list subscriptions

# 2. Record the cluster (auto-generates everything!)
./record-cluster.sh <subscription-id> my-cluster-name

# 3. Restart server (auto-discovers new fixtures!)
yarn start:msw
```

That's it! No manual imports needed. ✨

## Workflow

```
┌─────────────────────────┐
│ 1. Create Real Cluster  │  rosa create cluster ...
│    (ROSA CLI)           │  or ocm create cluster ...
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 2. Get Subscription ID  │  ocm list subscriptions
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 3. Record Cluster       │  ./record-cluster.sh <sub-id> <name>
│    (This Script)        │
└───────────┬─────────────┘
            │
            ├──→ Creates: fixtures/clusters/<name>.ts
            └──→ Creates: fixtures/subscriptions/<name>.ts
            │
            ▼
┌─────────────────────────┐
│ 4. Rebuild & Restart    │  yarn start:msw
│    (Auto-generates      │  (Index files auto-generated,
│     index files)        │   fixtures auto-discovered!)
└─────────────────────────┘
```

## Available Scripts

### `record-cluster.sh`

Records a real cluster from OCM API to TypeScript fixtures.

**Usage:**
```bash
./record-cluster.sh <subscription-id> [output-name]
```

**Example:**
```bash
# Record a ROSA HCP cluster
./record-cluster.sh 2ABC123xyz rosa-hcp-public

# This creates:
# - fixtures/clusters/rosa-hcp-public.ts
# - fixtures/subscriptions/rosa-hcp-public.ts
```

**Requirements:**
- `ocm` CLI installed and configured
- `jq` for JSON processing
- Active OCM API token

**What it does:**
1. Fetches subscription details
2. Extracts cluster ID from subscription
3. Fetches full cluster details
4. Generates cluster TypeScript fixture → `fixtures/clusters/<name>.ts`
5. Generates subscription TypeScript fixture → `fixtures/subscriptions/<name>.ts`
6. Fixtures are **automatically discovered** on next rebuild!

---

### `rename-cluster.sh`

Renames an existing recorded cluster fixture.

**Usage:**
```bash
./rename-cluster.sh <old-name> <new-name>
```

**Example:**
```bash
# Rename a fixture
./rename-cluster.sh my-gcp-cluster my-gcp-cluster-prod

# This:
# 1. Renames both cluster and subscription files
# 2. Updates all variable names inside (camelCase conversion)
# 3. Updates cluster name/display_name fields in the JSON
```

**What it does:**
- Renames `fixtures/clusters/<old-name>.ts` → `fixtures/clusters/<new-name>.ts`
- Renames `fixtures/subscriptions/<old-name>.ts` → `fixtures/subscriptions/<new-name>.ts`
- Updates exported variable names: `${oldCamel}Cluster` → `${newCamel}Cluster`
- Updates cluster data fields: `name` and `display_name` in the JSON
- Converts kebab-case names to camelCase for variable names

**After renaming:**
Just rebuild and restart!
```bash
yarn start:msw
```

The index files are auto-regenerated. ✨

---

### `delete-cluster.sh`

Deletes a recorded cluster and subscription fixture.

**Usage:**
```bash
./delete-cluster.sh <fixture-name>
```

**Example:**
```bash
# Delete a fixture
./delete-cluster.sh my-old-cluster

# This removes:
# - fixtures/clusters/my-old-cluster.ts
# - fixtures/subscriptions/my-old-cluster.ts
```

**After deleting:**
Just rebuild and restart!
```bash
yarn start:msw
```

The index files are auto-regenerated. ✨

---

### Installing Prerequisites

**OCM CLI:**
```bash
# macOS
brew install ocm-cli

# or download from
# https://github.com/openshift-online/ocm-cli/releases
```

**Login:**
```bash
# Get token from: https://console.redhat.com/openshift/token
ocm login --token=<your-token>

# Verify
ocm whoami
```

## Creating Test Clusters

See `ROSA_CLUSTER_FLAVORS.md` for detailed commands to create different cluster types:

- ROSA HCP Public/Private
- ROSA Classic CCS
- ROSA with Advanced Properties
- Single-AZ clusters
- PrivateLink clusters
- GCP clusters with WIF/SA

## Directory Structure

```
mockdata/msw/
├── scripts/
│   ├── README.md              # This file
│   ├── ROSA_CLUSTER_FLAVORS.md  # Cluster creation guide
│   └── record-cluster.sh      # Recording script
│
└── fixtures/
    ├── clusters.ts            # Main cluster fixtures
    ├── recorded/              # Auto-generated fixtures
    │   ├── rosa-hcp-public-cluster.json
    │   ├── rosa-hcp-public-subscription.json
    │   └── rosa-hcp-public.ts
    └── ...
```

## Example: Recording a ROSA HCP Cluster

### Step 1: Create the Cluster

```bash
rosa create cluster \
  --cluster-name test-hcp \
  --sts \
  --mode auto \
  --hosted-cp \
  --region us-east-1 \
  --multi-az \
  --yes

# Wait for cluster to be ready (~10 minutes for HCP)
rosa describe cluster --cluster test-hcp --watch
```

### Step 2: Find Subscription ID

```bash
# List all subscriptions
ocm list subscriptions

# Or search by cluster name
ocm list subscriptions \
  --parameter search="display_name like 'test-hcp'"

# Output will show:
# ID                           DISPLAY NAME  STATUS  ...
# 2ABC123xyz456...             test-hcp      Active  ...
```

### Step 3: Record It

```bash
cd mockdata/msw/scripts
./record-cluster.sh 2ABC123xyz456 test-hcp

# Output:
# 🔍 Fetching subscription: 2ABC123xyz456...
# ✅ Found cluster ID: 21abc...
# 🔍 Fetching cluster details...
#
# 📊 Cluster Summary:
#   Name: test-hcp
#   Product: rosa
#   Cloud: aws
#   Architecture: HCP (Hosted Control Plane)
#   Billing: CCS (Customer pays)
#   State: ready
#
# ✅ Saved cluster data to: ../fixtures/recorded/test-hcp-cluster.json
# ✅ Saved subscription data to: ../fixtures/recorded/test-hcp-subscription.json
# ✅ Generated TypeScript fixture: ../fixtures/recorded/test-hcp.ts
```

### Step 4: Add to Fixtures

```typescript
// mockdata/msw/fixtures/clusters.ts
import { testHcpCluster } from './recorded/test-hcp.js';

export const mockClusters: Cluster[] = [
  hypershiftReadyCluster,
  testHcpCluster,  // ← Your new cluster!
];
```

### Step 5: Test It

If you edited fixtures without restarting, rebuild first:
```bash
yarn msw:fixtures:build
```

Then restart (or start) the server:
```bash
yarn start:msw
```

**Note:** `yarn start:msw` automatically runs `yarn msw:fixtures:build`, so if you're starting fresh, you don't need the manual build step.

Access the app:
```
https://prod.foo.redhat.com:1337/openshift?env=msw-mockdata
```

You should see your cluster in the list!

### Step 6: Clean Up Real Cluster

```bash
# Delete the real cluster to avoid AWS charges
rosa delete cluster --cluster test-hcp --yes

# The mock data will remain in your fixtures!
```

## Tips

1. **Naming Convention:** Use descriptive names that indicate the flavor
   - `rosa-hcp-public` 
   - `rosa-classic-private`
   - `gcp-wif-multizone`

2. **Git Tracking:** The `recorded/` directory should be in git
   - Commit the generated `.ts` files
   - Optionally commit the `.json` files for reference

3. **Cleanup:** The JSON files are for reference
   - The `.ts` files are what get imported
   - You can delete old JSON files if needed

4. **Customization:** After recording, you can edit the `.ts` file
   - Add missing fields
   - Remove sensitive data
   - Adjust for testing scenarios

5. **Multiple Recordings:** Record the same cluster at different states
   - `rosa-hcp-installing.ts` - Capture during installation
   - `rosa-hcp-ready.ts` - Capture when ready
   - `rosa-hcp-upgrading.ts` - Capture during upgrade

## Troubleshooting

**"ocm: command not found"**
```bash
brew install ocm-cli
# or
go install github.com/openshift-online/ocm-cli/cmd/ocm@latest
```

**"Authentication error"**
```bash
# Get fresh token from: https://console.redhat.com/openshift/token
ocm login --token=<new-token>
```

**"Subscription not found"**
```bash
# Verify the subscription ID
ocm get /api/accounts_mgmt/v1/subscriptions/<subscription-id>

# Or list all subscriptions
ocm list subscriptions
```

**"jq: command not found"**
```bash
brew install jq
```

## Future Enhancements

- [ ] Add support for recording multiple clusters at once
- [ ] Auto-detect cluster flavor and suggest appropriate name
- [ ] Validate recorded data against OpenAPI schemas
- [ ] Generate test cases based on cluster configuration
- [ ] Support recording from different environments (stage, prod)
- [ ] Add diff tool to compare recorded vs existing fixtures

