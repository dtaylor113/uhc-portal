# MSW Mock Server - User Guide

**Type-safe mock data system for local development using TypeScript fixtures**

---

## 🎯 How to Run

### Start the MSW Mock Server

```bash
yarn start:msw
```

This automatically:
1. Builds TypeScript fixtures (`yarn msw:fixtures:build`)
2. Starts MSW Node.js server on port 9001
3. Starts webpack dev server on port 1337
4. Enables MSW mode with `.msw-mode` flag

### Development Tip: Watch Mode

For active development where you're frequently editing fixtures:

```bash
# In one terminal
yarn msw:fixtures:watch

# In another terminal
yarn start:msw
```

This automatically rebuilds fixtures whenever you save changes to TypeScript files in `mockdata/msw/fixtures/`.

### Access the Application

```
https://prod.foo.redhat.com:1337/openshift?env=msw-mockdata
```

**Important:** The `?env=msw-mockdata` query parameter activates MSW mode.

**Tip:** To go directly to the cluster list page:
```
https://prod.foo.redhat.com:1337/openshift/cluster-list?env=msw-mockdata
```

### Stop the MSW Server

```bash
yarn stop:msw
```

This cleans up all processes and removes the `.msw-mode` flag file.

**⚠️ Important:** If you press `Ctrl+C` to stop the server manually, you **must** run `yarn stop:msw` before running `yarn start` (non-MSW mode), otherwise you'll get an "address already in use" error.

```bash
# If you manually stopped MSW with Ctrl+C:
yarn stop:msw  # Clean up first!
yarn start     # Now you can start normal mode
```

---

## ✏️ How to Edit Mock Data

### Current Mock Data

The system mocks:

- **Clusters:** Recorded from real OCM clusters (auto-discovered from `fixtures/clusters/`)
- **Subscriptions:** Recorded alongside clusters (auto-discovered from `fixtures/subscriptions/`)
- **Organization:** Mock organization with capabilities
- **Accounts:** Current user account
- **Providers:** 8 cloud providers with regions
- **Machine Types:** 197 machine types

All mock data is defined in **TypeScript fixtures** with full type safety.

### Option 1: Record a Real Cluster (Recommended!)

The fastest way to add realistic mock data is to record from a real cluster:

**1. Create a real cluster (or use existing):**
```bash
# See mockdata/msw/scripts/ROSA_CLUSTER_FLAVORS.md for examples
rosa create cluster --cluster-name my-test-cluster --sts --mode auto --hosted-cp ...
```

**2. Get the subscription ID:**
```bash
ocm list subscriptions
```

**3. Record it (auto-generates everything!):**
```bash
./mockdata/msw/scripts/record-cluster.sh <subscription-id> my-cluster-name
```

This creates:
- `fixtures/clusters/my-cluster-name.ts`
- `fixtures/subscriptions/my-cluster-name.ts`

**4. Restart:**
```bash
yarn start:msw
```

**That's it!** ✨ No manual imports needed. The fixtures are automatically discovered!

📖 **See `mockdata/msw/scripts/README.md` for the complete recording workflow!**

### Option 2: Quick Test Cluster (Ad-Hoc Only!)

For temporary local testing, you can use `createCluster()` in `fixtures/clusters.ts`:

```typescript
// mockdata/msw/fixtures/clusters.ts

// TEMPORARY: Add a quick test cluster
const myTestCluster = createCluster({
  id: 'temp-123',
  name: 'temp-test',
  display_name: 'Temporary Test Cluster',
  state: 'ready',
  cloud_provider: {
    kind: 'CloudProviderLink',
    id: 'aws',
    href: '/api/clusters_mgmt/v1/cloud_providers/aws',
  },
  region: {
    kind: 'CloudRegionLink',
    id: 'us-west-2',
    href: '/api/clusters_mgmt/v1/cloud_providers/aws/regions/us-west-2',
  },
  // ... full IDE auto-complete for all fields!
});

// Add temporarily to the array
export const mockClusters: Cluster[] = [
  ...Object.values(recordedClusters).filter(...),
  myTestCluster,  // ⚠️ Temporary only!
];
```

**⚠️ Warning:** This is for quick local tests only! For production fixtures, use **Option 1** (record real clusters).

**Restart the server:**
```bash
yarn start:msw
```

The fixtures will rebuild automatically and your new cluster will appear!

### Edit Existing Cluster

To modify an existing recorded cluster, edit its file directly (e.g., `mockdata/msw/fixtures/clusters/my-cluster-name.ts`). You'll get full IDE auto-complete for all available fields.

You can also use the rename script:
```bash
./mockdata/msw/scripts/rename-cluster.sh old-name new-name
```

Or the delete script:
```bash
./mockdata/msw/scripts/delete-cluster.sh cluster-name
```

### Edit Organization or Account

- **Organization:** Edit `mockOrganization` in `mockdata/msw/fixtures/accounts.ts`
- **Current Account:** Edit `mockCurrentAccount` in `mockdata/msw/fixtures/accounts.ts`
- **Quota:** Edit `mockQuotaCost` in `mockdata/msw/fixtures/accounts.ts`

### Available Fixture Files

```
mockdata/msw/fixtures/
├── clusters.ts              # Cluster definitions
├── subscriptions.ts         # Subscriptions
├── accounts.ts             # Organizations, accounts, quota
├── providers.ts            # Cloud providers, machine types
├── authorization.ts        # Auth responses
├── access-transparency.ts  # Access transparency data
└── index.ts               # Main export (auto-imports all)
```

---

## 🧪 Verification

### Check What's Running

```bash
# MSW server running?
lsof -ti:9001 && echo "✅ MSW server running" || echo "❌ Not running"

# Webpack running?
lsof -ti:1337 && echo "✅ Webpack running" || echo "❌ Not running"
```

### Test API Directly

```bash
# Test clusters endpoint
curl -k https://prod.foo.redhat.com:1337/mockdata/api/clusters_mgmt/v1/clusters | jq '.total'
# Should return: 1 (currently only hypershift-ready)

# Test specific cluster
curl -k https://prod.foo.redhat.com:1337/mockdata/api/clusters_mgmt/v1/clusters/21696acc0dbkvh0mh4lranlmvvqb11lg | jq '.display_name'
# Should return: "hypershift-ready"
```

### Monitor Server Logs

```bash
# Find and watch the log file
tail -f $(ls -t /tmp/msw*.log | head -1) | grep "\[MSW\]"
```

---

## 🚨 Common Issues & Troubleshooting

### Issue: Server hangs at "Starting chrome server..."

**Symptoms:**
- `yarn start:msw` hangs at:
  ```
  [WEBPACK] [fec] Info:  Starting chrome server...
  ```
- Webpack never finishes compiling

**Cause:** Not connected to company VPN. The webpack server needs to pull a Docker image from the internal registry.

**Fix:**
1. **Connect to VPN**
2. Stop the server: `Ctrl+C` or `yarn stop:msw`
3. Restart: `yarn start:msw`

---

### Issue: Server shows wrong fixture counts (Node.js module caching)

**Symptoms:**
- Server logs show `subscriptions: 1` but you have 2 defined
- Changes to fixtures don't appear even after restart

**Cause:** Node.js caches compiled modules in memory

**Fix:**
```bash
# Always use stop before start to clear cache
yarn stop:msw
yarn start:msw

# If that doesn't work, nuclear option:
yarn stop:msw
pkill -9 node
yarn start:msw
```

### Issue: "Address already in use" error

**Cause:** Pressed `Ctrl+C` to stop MSW, leaving background processes running

**Fix:**
```bash
# Always run this before starting normal mode:
yarn stop:msw
yarn start  # Now this will work
```

**What `yarn stop:msw` does:**
- Kills all MSW-related processes
- Frees up ports 1337 and 9001
- Removes the `.msw-mode` flag file

### Issue: Cluster details page spins indefinitely

**Symptoms:**
- Cluster list loads fine
- Clicking cluster shows infinite spinner
- Terminal shows `❌ No handler for: /api/clusters_mgmt/v1/clusters/{id}/<sub-resource>`

**Fix:**
1. Check terminal for `❌ No handler for:` messages
2. Add missing handlers in `mockdata/msw/server/dev-server-simple.mjs`
3. Restart: `yarn stop:msw && yarn start:msw`

### Issue: Only one cluster showing when you have two defined

**Cause:** Missing cluster or subscription fixture file, or fixture file is malformed.

**Fix:** Ensure both cluster AND subscription files exist:
```bash
# Check what fixtures exist
ls mockdata/msw/fixtures/clusters/
ls mockdata/msw/fixtures/subscriptions/

# If files are missing, use record-cluster.sh to regenerate
./mockdata/msw/scripts/record-cluster.sh <subscription-id> my-cluster-name
```

The fixtures are **auto-discovered** - no manual imports needed! Just ensure both files exist in their respective directories.

Then restart: `yarn stop:msw && yarn start:msw`

### Issue: TypeScript errors after editing fixtures

**Fix:**
```bash
# Check for errors without starting server
yarn msw:fixtures:build

# Fix the TypeScript errors, then restart
yarn start:msw
```

### Issue: Build artifacts in `src/types/` directory

**Symptoms:** New `*.js`, `*.d.ts` files appearing in `src/types/`

**Cause:** TypeScript compiler outputs compiled versions of imported OpenAPI types

**Fix:** These are now in `.gitignore` and can be safely deleted:
```bash
rm -rf src/types/**/*.js src/types/**/*.d.ts
```

**Are they harmful?** No - they're just build artifacts and don't overwrite your `.ts` source files.

### Debugging Tips

**Check server logs:**
```bash
# Look for these in terminal:
[MSW] GET /api/clusters_mgmt/v1/clusters - 2 clusters
[MSW Server] GET /api/some/endpoint
[MSW] Unhandled request: GET /api/some/endpoint
```
- Successful requests log the endpoint and count
- Unhandled requests explicitly log "Unhandled request:"

**Verify fixture compilation:**
```bash
cat mockdata/msw/fixtures/dist/mockdata/msw/fixtures/clusters.js
```

**Check for stale processes:**
```bash
# List all MSW-related processes
ps aux | grep -E "node.*msw|yarn.*msw"
```

### Complete Clean Restart

If nothing else works:
```bash
yarn stop:msw
pkill -9 node
rm -rf mockdata/msw/fixtures/dist
rm -f .msw-mode
yarn start:msw
```

---

## ✅ Success Criteria

You know MSW is working when:

1. ✅ URL shows `?env=msw-mockdata` (or yellow banner: "Using the msw-mockdata environment API")
2. ✅ Cluster list shows your mock clusters
3. ✅ Cluster details pages load without spinning
4. ✅ Network tab shows XHR calls to `/mockdata/api/*`
5. ✅ Terminal shows: `[MSW Server] Loaded type-safe fixtures:`

---

## 🎓 Type Safety Benefits

**Before (Legacy JSON):**
```javascript
// No type checking, easy to make mistakes
const cluster = {
  display_nam: 'Test',  // Typo! No error 😱
  version: 123,          // Wrong type! No error 😱
};
```

**After (TypeScript Fixtures):**
```typescript
// Type-safe with IDE auto-complete
const cluster = createCluster({
  display_nam: 'Test',  // ❌ TypeScript error!
  version: 123,          // ❌ TypeScript error!
});
```

---

## 📚 Additional Documentation

- **`TECH_NOTES.md`** - Current system architecture and debugging
- **`ROADMAP.md`** - Project history and future plans

---

**Need Help?**  
Check `TECH_NOTES.md` for technical details and troubleshooting.
