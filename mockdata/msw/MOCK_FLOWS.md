# MSW Mock Flows - API Call Sequences

This document explains **exactly what happens** when the MSW middleware intercepts API calls for different pages. It shows the sequence of API calls, what gets mocked, and what data is returned.

**Purpose:** Help developers and AI understand how MSW mocking works so they can debug issues, add new features, or modify mock behavior.

---

## 🔑 MSW Mode Activation Flow

### Step 1: User Navigates with `?env=msw-mockdata`

```
User action:
  Navigate to https://prod.foo.redhat.com:1337/openshift?env=msw-mockdata

Frontend (src/config.ts):
  1. Detects ?env=msw-mockdata in URL
  2. Loads config from src/config/msw-mockdata.json
  3. Sets localStorage: ocmOverridenEnvironment=msw-mockdata
  4. Sets HTTP cookie: ocmOverridenEnvironment=msw-mockdata; path=/; max-age=604800
  5. Logs: "Loaded override config: msw-mockdata"

Config applied:
  {
    "apiGateway": "https://$SELF_PATH$/mockdata",
    "insightsGateway": "https://$SELF_PATH$/mockdata/api"
  }

Result:
  All API calls now go to https://prod.foo.redhat.com:1337/mockdata/api/*
```

### Step 2: Middleware Detection

```javascript
// In mockdata/msw/msw-middleware.js

function middleware(req, res, next) {
  const url = req.url || '';
  const referer = req.headers.referer || '';
  const cookie = req.headers.cookie || '';
  
  // Check for MSW mode
  const isMswMode = 
    url.includes('env=msw-mockdata') ||           // Initial page load
    referer.includes('env=msw-mockdata') ||       // Subsequent requests
    cookie.includes('ocmOverridenEnvironment=msw-mockdata'); // Persistent cookie
  
  if (isMswMode && req.url.startsWith('/mockdata')) {
    // MSW middleware handles request
    // Return mock data
  } else {
    // Pass to next middleware (Python server proxy)
    next();
  }
}
```

---

## 📋 Cluster List Page Flow

### Overview

```
User navigates to: /openshift/cluster-list?env=msw-mockdata
                   ↓
Frontend makes API calls → Middleware intercepts → Returns mock data
                   ↓
UI renders cluster list with "hypershift-ready" cluster
```

### Detailed API Call Sequence

#### Phase 1: Authentication & Permissions (Real SSO)

**Note:** These are NOT mocked - real Red Hat SSO handles authentication

```
1. SSO Authentication
   - User redirected to sso.redhat.com
   - User enters credentials
   - SSO returns auth token
   - User redirected back to application
   
   MSW: Does NOT intercept (handled by real SSO)
```

#### Phase 2: Authorization Checks

**Multiple rapid-fire authorization requests** to check user permissions:

```
API Call Sequence:
  POST /api/authorizations/v1/self_feature_review
  POST /api/authorizations/v1/self_access_review  
  POST /api/authorizations/v1/self_resource_review

MSW Middleware Response (for all):
  {
    "allowed": true
  }

Purpose: Check if user has permission to view clusters, create clusters, etc.
```

**Code in middleware:**
```javascript
if (req.method === 'POST' && apiPath.includes('/api/authorizations/v1/')) {
  console.log('[MSW-MIDDLEWARE] ✅ Mocking: POST /api/authorizations/v1/*');
  return res.json({ allowed: true });
}
```

#### Phase 3: Fetch Subscriptions (CRITICAL!)

**This is the MOST IMPORTANT call** - it drives the entire cluster list!

```
API Call:
  GET /api/accounts_mgmt/v1/subscriptions?page=1&size=50&orderBy=created_at+desc
      &search=(cluster_id!='')+AND+(plan.id+IN+('OSD','OSDTrial','OCP','RHMI','ROSA','RHOIC','MOA','MOA-HostedControlPlane','ROSA-HyperShift','ARO','OCP-AssistedInstall'))
      &fetchAccounts=true&fetchCapabilities=true

MSW Middleware Response:
  {
    "kind": "SubscriptionList",
    "page": 1,
    "size": 1,
    "total": 1,
    "items": [
      {
        "id": "2KBhQVMVQx0CEoXuYZUMBQrQG8y",
        "kind": "Subscription",
        "href": "/api/accounts_mgmt/v1/subscriptions/2KBhQVMVQx0CEoXuYZUMBQrQG8y",
        "plan": {
          "category": "HostedControlPlane",
          "type": "MOA"
        },
        "cluster_id": "21696acc0dbkvh0mh4lranlmvvqb11lg",  // ← Links to hypershift-ready cluster
        "external_cluster_id": "124a44e7-28ed-4841-8ae4-0916adb936ea",
        "organization_id": "2KBain48N90sMZ8zhjcHDcILVUw",
        "display_name": "hypershift-ready",
        "creator": {
          "id": "2KBaiuIoEMEdjyfWwQrTMtU8C8O",
          "username": "dtaylor-ocm"
        },
        "managed": true,
        "status": "Active",
        "created_at": "2023-01-11T16:17:47.696969Z",
        "updated_at": "2023-01-17T16:36:38.50756Z"
      }
    ]
  }

Why this matters:
  - The frontend uses subscriptions to determine which clusters to fetch
  - Each subscription has a cluster_id field
  - Without subscriptions, NO clusters appear in the list!
```

**Code in middleware:**
```javascript
if (req.method === 'GET' && apiPath.includes('/api/accounts_mgmt/v1/subscriptions')) {
  const subscriptionIdMatch = apiPath.match(/\/api\/accounts_mgmt\/v1\/subscriptions\/([^/?]+)/);
  
  if (subscriptionIdMatch && subscriptionIdMatch[1]) {
    // Individual subscription request (used when drilling down)
    return res.json(mockSubscription);
  }
  
  // Subscription list request
  return res.json({
    kind: 'SubscriptionList',
    page: 1,
    size: 1,
    total: 1,
    items: [mockSubscription],
  });
}
```

#### Phase 4: Fetch Clusters

**Frontend now knows cluster IDs from subscriptions, fetches cluster details:**

```
API Call (POST request with search query):
  POST /api/clusters_mgmt/v1/clusters?method=get
  Body: { search: "id IN ('21696acc0dbkvh0mh4lranlmvvqb11lg')" }

MSW Middleware Response:
  {
    "kind": "ClusterList",
    "page": 1,
    "size": 1,
    "total": 1,
    "items": [
      {
        "id": "21696acc0dbkvh0mh4lranlmvvqb11lg",
        "kind": "Cluster",
        "href": "/api/clusters_mgmt/v1/clusters/21696acc0dbkvh0mh4lranlmvvqb11lg",
        "name": "hypershift-ready",
        "display_name": "hypershift-ready",
        "state": "ready",
        "region": {
          "id": "us-east-1",
          "kind": "CloudRegion"
        },
        "cloud_provider": {
          "id": "aws",
          "kind": "CloudProvider",
          "display_name": "Amazon Web Services"
        },
        "version": {
          "id": "openshift-v4.12.0-rc.8",
          "kind": "Version",
          "raw_id": "4.12.0-rc.8"
        },
        "hypershift": {
          "enabled": true
        },
        "multi_az": true,
        "created_at": "2023-01-11T16:17:47.696969Z",
        "updated_at": "2023-01-17T16:36:38.50756Z"
        // ... many more fields ...
      }
    ]
  }

UI Impact:
  - Cluster appears in list
  - Version column shows: "4.12.0-rc.8"
  - Provider column shows: "AWS (us-east-1)"
  - Status column shows: "Ready"
```

**Code in middleware:**
```javascript
if ((req.method === 'GET' || req.method === 'POST') && apiPath.includes('/api/clusters_mgmt/v1/clusters')) {
  const clusterIdMatch = apiPath.match(/\/api\/clusters_mgmt\/v1\/clusters\/([^/?]+)(?:\/|$)/);
  
  if (clusterIdMatch && clusterIdMatch[1]) {
    // Individual cluster request (see Cluster Details section)
    // ...
  }
  
  // Cluster list request
  return res.json({
    kind: 'ClusterList',
    items: [hypershiftCluster], // From legacy JSON (technical debt)
    page: 1,
    size: 1,
    total: 1,
  });
}
```

#### Phase 5: Supporting Data

**Additional requests for dropdowns, filters, etc.:**

```
API Call 1: Cloud Providers
  GET /api/clusters_mgmt/v1/cloud_providers?size=-1&fetchRegions=true
  
  MSW Response:
    { kind: 'CloudProviderList', items: [], page: 1, size: 0, total: 0 }
  
  Purpose: Populate "Cloud Provider" filter dropdown
  Note: Returns empty list, so filter shows no options (doesn't affect cluster display)

API Call 2: Machine Types  
  GET /api/clusters_mgmt/v1/machine_types?size=-1
  
  MSW Response:
    { kind: 'MachineTypeList', items: [], page: 1, size: 0, total: 0 }
  
  Purpose: Populate machine type options for cluster creation
  Note: Returns empty list (cluster list still works)

API Call 3: Current Account
  GET /api/accounts_mgmt/v1/current_account
  
  MSW Response:
    {
      id: '2KBain48N90sMZ8zhjcHDcILVUw',
      kind: 'Account',
      username: 'dtaylor-ocm',
      email: 'dtaylor@redhat.com',
      first_name: 'David',
      last_name: 'Taylor',
      organization: { id: '2KBain48N90sMZ8zhjcHDcILVUw' }
    }
  
  Purpose: Display current user info, quota information

API Call 4: Cluster Transfers
  GET /api/accounts_mgmt/v1/cluster_transfers?search=...
  
  MSW Response:
    { kind: 'ClusterTransferList', items: [], page: 1, size: 0, total: 0 }
  
  Purpose: Show pending cluster ownership transfers
```

#### Phase 6: Continuous Authorization Polling

**While page is open, authorization checks repeat every few seconds:**

```
Continuous requests:
  POST /api/authorizations/v1/self_feature_review (every 5s)
  POST /api/authorizations/v1/self_access_review (every 5s)

MSW Response:
  { "allowed": true }

Purpose: Keep checking if user still has permissions
Note: These are NOISY in logs - filter them out when debugging
```

### Complete Cluster List Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ User navigates to /openshift/cluster-list?env=msw-mockdata │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend sets cookie & loads msw-mockdata.json config       │
│ All APIs now route through /mockdata prefix                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Real SSO authentication (NOT mocked)                        │
│ User logs in with Red Hat credentials                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Authorization Checks                                        │
│ POST /api/authorizations/v1/self_*                         │
│ MSW → { "allowed": true }                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 🔑 CRITICAL: Fetch Subscriptions                           │
│ GET /api/accounts_mgmt/v1/subscriptions                    │
│ MSW → Returns 1 subscription with cluster_id               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Fetch Cluster Details                                      │
│ POST /api/clusters_mgmt/v1/clusters (with cluster_id)     │
│ MSW → Returns "hypershift-ready" cluster                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Fetch Supporting Data                                       │
│ - Cloud providers (empty)                                   │
│ - Machine types (empty)                                     │
│ - Current account (mock user)                               │
│ - Cluster transfers (empty)                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ ✅ Cluster List Displays                                    │
│ Shows 1 cluster: "hypershift-ready"                        │
│ Version: 4.12.0-rc.8                                       │
│ Provider: AWS (us-east-1)                                  │
│ Status: Ready                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Cluster Details Page Flow

### Overview

```
User clicks on "hypershift-ready" cluster in list
                   ↓
Frontend navigates to: /openshift/clusters/21696acc0dbkvh0mh4lranlmvvqb11lg
                   ↓
Frontend makes API calls → Middleware intercepts → Returns mock data
                   ↓
UI renders cluster details page
```

### Detailed API Call Sequence

#### Phase 1: Fetch Individual Cluster

**Get full cluster details for the details page:**

```
API Call:
  GET /api/clusters_mgmt/v1/clusters/21696acc0dbkvh0mh4lranlmvvqb11lg

MSW Middleware Response:
  {
    "id": "21696acc0dbkvh0mh4lranlmvvqb11lg",
    "kind": "Cluster",
    "href": "/api/clusters_mgmt/v1/clusters/21696acc0dbkvh0mh4lranlmvvqb11lg",
    "name": "hypershift-ready",
    "display_name": "hypershift-ready",
    "state": "ready",
    "region": { "id": "us-east-1" },
    "cloud_provider": { "id": "aws", "display_name": "Amazon Web Services" },
    "version": { "id": "openshift-v4.12.0-rc.8", "raw_id": "4.12.0-rc.8" },
    "console": { "url": "https://console-openshift-console.apps.hypershift-ready.example.com" },
    "api": { "url": "https://api.hypershift-ready.example.com:6443" },
    "nodes": {
      "master": 3,
      "infra": 3,
      "compute": 4,
      "total": 10,
      "availability_zones": ["us-east-1a", "us-east-1b", "us-east-1c"]
    },
    "network": {
      "type": "OVNKubernetes",
      "machine_cidr": "10.0.0.0/16",
      "service_cidr": "172.30.0.0/16",
      "pod_cidr": "10.128.0.0/14"
    },
    "multi_az": true,
    "hypershift": { "enabled": true },
    "created_at": "2023-01-11T16:17:47.696969Z",
    "updated_at": "2023-01-17T16:36:38.50756Z"
    // ... full cluster object ...
  }

UI Impact:
  - Overview tab shows all cluster details
  - Networking tab shows network configuration
  - Nodes tab shows node counts
```

**Code in middleware:**
```javascript
if ((req.method === 'GET' || req.method === 'POST') && apiPath.includes('/api/clusters_mgmt/v1/clusters')) {
  const clusterIdMatch = apiPath.match(/\/api\/clusters_mgmt\/v1\/clusters\/([^/?]+)(?:\/|$)/);
  
  if (clusterIdMatch && clusterIdMatch[1]) {
    const clusterId = clusterIdMatch[1];
    
    // Check for sub-resources first (see next sections)
    if (apiPath.includes('/upgrade_policies')) { /* ... */ }
    if (apiPath.includes('/machine_pools')) { /* ... */ }
    // ...
    
    // Individual cluster request
    if (clusterId === hypershiftCluster.id) {
      return res.json(hypershiftCluster);
    } else {
      return res.status(404).json({
        kind: 'Error',
        code: 'CLUSTERS-MGMT-404',
        reason: `Cluster with id '${clusterId}' not found`,
      });
    }
  }
}
```

#### Phase 2: Fetch Subscription Details

**Get subscription info for the cluster:**

```
API Call:
  GET /api/accounts_mgmt/v1/subscriptions/2KBhQVMVQx0CEoXuYZUMBQrQG8y

MSW Middleware Response:
  {
    "id": "2KBhQVMVQx0CEoXuYZUMBQrQG8y",
    "kind": "Subscription",
    "cluster_id": "21696acc0dbkvh0mh4lranlmvvqb11lg",
    "display_name": "hypershift-ready",
    "plan": {
      "category": "HostedControlPlane",
      "type": "MOA"
    },
    "status": "Active",
    "creator": { "username": "dtaylor-ocm" },
    // ...
  }

UI Impact:
  - Subscription tab shows subscription details
  - Billing information
  - Support level
```

#### Phase 3: Fetch Cluster Sub-Resources

**Multiple requests for different tabs/sections of the details page:**

##### A. Upgrade Policies (Upgrade Schedule Tab)

```
API Call:
  GET /api/clusters_mgmt/v1/clusters/21696acc0dbkvh0mh4lranlmvvqb11lg/upgrade_policies

MSW Middleware Response:
  {
    "kind": "UpgradePolicyList",
    "items": [],
    "page": 1,
    "size": 0,
    "total": 0
  }

UI Impact:
  - "Upgrade Schedule" tab shows "No upgrade policies configured"
```

**Code in middleware:**
```javascript
if (apiPath.includes('/upgrade_policies')) {
  console.log(`[MSW-MIDDLEWARE] ✅ Mocking: GET .../clusters/${clusterId}/upgrade_policies`);
  return res.json({
    kind: 'UpgradePolicyList',
    items: [],
    page: 1,
    size: 0,
    total: 0,
  });
}
```

##### B. Machine Pools (Machine Pools Tab)

```
API Call:
  GET /api/clusters_mgmt/v1/clusters/21696acc0dbkvh0mh4lranlmvvqb11lg/machine_pools

MSW Middleware Response:
  {
    "kind": "MachinePoolList",
    "items": [],
    "page": 1,
    "size": 0,
    "total": 0
  }

UI Impact:
  - "Machine Pools" tab shows "No machine pools"
```

##### C. Node Pools (Node Pools Tab - HyperShift only)

```
API Call:
  GET /api/clusters_mgmt/v1/clusters/21696acc0dbkvh0mh4lranlmvvqb11lg/node_pools

MSW Middleware Response:
  {
    "kind": "NodePoolList",
    "items": [],
    "page": 1,
    "size": 0,
    "total": 0
  }

UI Impact:
  - "Node Pools" tab shows "No node pools configured"
```

##### D. Identity Provider Groups

```
API Call:
  GET /api/clusters_mgmt/v1/clusters/21696acc0dbkvh0mh4lranlmvvqb11lg/groups

MSW Middleware Response:
  {
    "kind": "GroupList",
    "items": [],
    "page": 1,
    "size": 0,
    "total": 0
  }

UI Impact:
  - "Access Control" tab shows "No groups configured"
```

##### E. External Authentication Config

```
API Call:
  GET /api/clusters_mgmt/v1/clusters/21696acc0dbkvh0mh4lranlmvvqb11lg/external_auth_config

MSW Middleware Response:
  {
    "kind": "ExternalAuthList",
    "items": [],
    "page": 1,
    "size": 0,
    "total": 0
  }

UI Impact:
  - "External Authentication" section shows "Not configured"
```

##### F. AWS Infrastructure Access Roles

```
API Call 1:
  GET /api/clusters_mgmt/v1/clusters/21696acc0dbkvh0mh4lranlmvvqb11lg/aws_infrastructure_access_role_grants

MSW Middleware Response:
  {
    "kind": "AWSInfrastructureAccessRoleGrantList",
    "items": [],
    "page": 1,
    "size": 0,
    "total": 0
  }

API Call 2:
  GET /api/clusters_mgmt/v1/aws_infrastructure_access_roles

MSW Middleware Response:
  {
    "kind": "AWSInfrastructureAccessRoleList",
    "items": [],
    "page": 1,
    "size": 0,
    "total": 0
  }

UI Impact:
  - "AWS IAM Roles" section shows "No roles granted"
```

#### Phase 4: Authorization Checks (Per-Cluster)

**Check permissions for this specific cluster:**

```
API Calls:
  POST /api/authorizations/v1/self_resource_review
  Body: { resource: "cluster", cluster_id: "21696acc0dbkvh0mh4lranlmvvqb11lg", action: "update" }
  
  POST /api/authorizations/v1/self_resource_review
  Body: { resource: "cluster", cluster_id: "21696acc0dbkvh0mh4lranlmvvqb11lg", action: "delete" }

MSW Middleware Response (both):
  { "allowed": true }

UI Impact:
  - "Edit" button is enabled
  - "Delete" button is enabled
  - "Upgrade" button is enabled
```

### Complete Cluster Details Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ User clicks cluster in list → Navigate to cluster details  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Fetch Individual Cluster                                    │
│ GET /api/clusters_mgmt/v1/clusters/:id                     │
│ MSW → Returns full "hypershift-ready" cluster object      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Fetch Subscription                                          │
│ GET /api/accounts_mgmt/v1/subscriptions/:id                │
│ MSW → Returns subscription for cluster                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Fetch Sub-Resources (Parallel Requests)                    │
│ ├─ GET .../upgrade_policies → Empty list                   │
│ ├─ GET .../machine_pools → Empty list                      │
│ ├─ GET .../node_pools → Empty list                         │
│ ├─ GET .../groups → Empty list                             │
│ ├─ GET .../external_auth_config → Empty list               │
│ └─ GET .../aws_infrastructure_access_role_grants → Empty   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Check Cluster Permissions                                   │
│ POST /api/authorizations/v1/self_resource_review (update)  │
│ POST /api/authorizations/v1/self_resource_review (delete)  │
│ MSW → { "allowed": true }                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ ✅ Cluster Details Page Displays                            │
│ - Overview tab: Full cluster info                          │
│ - Nodes tab: Node counts and zones                         │
│ - Networking tab: CIDR ranges                              │
│ - Upgrade Schedule: No policies (empty)                    │
│ - Machine Pools: None configured (empty)                   │
│ - Access Control: No groups (empty)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Learnings for Developers & AI

### 1. **Subscriptions Drive Everything**

The most critical mock is the **subscriptions endpoint**. Without subscriptions containing `cluster_id` fields, the cluster list will be empty even if the clusters endpoint returns data.

**Order matters:**
1. First: Fetch subscriptions (get cluster IDs)
2. Then: Fetch clusters (using those IDs)

### 2. **Middleware Detection Logic**

The middleware checks THREE places for MSW mode (in order):
1. `req.url` - Initial page load with `?env=msw-mockdata`
2. `req.headers.referer` - Subsequent navigation within the app
3. `req.headers.cookie` - Persistent detection across reloads

**If MSW mode is NOT detected:**
- Middleware calls `next()` 
- Request passes to Python server proxy
- This is why legacy mode still works!

### 3. **Empty Lists Are OK**

Most sub-resources (machine pools, upgrade policies, etc.) return **empty lists**. This is fine! The UI handles empty states gracefully:
- "No upgrade policies configured"
- "No machine pools"
- etc.

### 4. **POST vs GET for Cluster List**

The frontend makes a **POST** request to `/api/clusters_mgmt/v1/clusters?method=get` with a search query in the body. This is why the middleware must handle both GET and POST:

```javascript
if ((req.method === 'GET' || req.method === 'POST') && apiPath.includes('/api/clusters_mgmt/v1/clusters'))
```

### 5. **Cluster Data Source (Technical Debt)**

Currently, cluster data comes from legacy JSON file:
```javascript
const mockClusters = require('../api/clusters_mgmt/v1/clusters.json');
const hypershiftCluster = mockClusters.items.find(c => c.display_name === 'hypershift-ready');
```

**This should be replaced with independent MSW fixtures** (see MSW-IMPLEMENTATION-SUMMARY.md "Known Technical Debt").

### 6. **Debugging Tips**

**Watch specific request types:**
```bash
# Watch cluster-related requests only
tail -f /tmp/msw-debug.log | grep "MSW-MIDDLEWARE" | grep -E "(clusters|subscriptions)"

# Exclude noisy authorization checks
tail -f /tmp/msw-debug.log | grep "MSW-MIDDLEWARE" | grep -v "self_feature_review\|self_access_review"
```

**Test individual endpoints:**
```bash
COOKIE="Cookie: ocmOverridenEnvironment=msw-mockdata"

# Test cluster list
curl -k -H "$COOKIE" https://localhost:1337/mockdata/api/clusters_mgmt/v1/clusters

# Test individual cluster
curl -k -H "$COOKIE" https://localhost:1337/mockdata/api/clusters_mgmt/v1/clusters/21696acc0dbkvh0mh4lranlmvvqb11lg

# Test subscription
curl -k -H "$COOKIE" https://localhost:1337/mockdata/api/accounts_mgmt/v1/subscriptions
```

### 7. **Common Issues & Solutions**

| Issue | Cause | Solution |
|-------|-------|----------|
| Cluster list empty | Subscriptions endpoint returns empty list | Check subscription mock includes `cluster_id` |
| "N/A" for Version/Provider | Individual cluster mock missing `version` or `cloud_provider` fields | Ensure cluster object has all required fields |
| Cluster details page error | Sub-resource endpoint not mocked | Add handler for the missing endpoint (return empty list) |
| Middleware not activating | Cookie not set or detected | Check `ocmOverridenEnvironment` cookie in DevTools |
| "ECONNREFUSED" errors | Middleware passes to non-running Python server | Ensure MSW mode is detected (check logs for "MSW mode check: true") |

---

## 🔄 Adding New Mocked Pages

If you want to mock a new page (e.g., "Cluster Metrics"), follow this pattern:

### Step 1: Identify API Calls

1. Open the page in **legacy mode** (`?env=mockdata`)
2. Open DevTools → Network tab
3. Filter by `/api/`
4. Note all API calls, their order, and responses

### Step 2: Add Middleware Handlers

```javascript
// In mockdata/msw/msw-middleware.js

if (req.method === 'GET' && apiPath.includes('/api/your/new/endpoint')) {
  console.log('[MSW-MIDDLEWARE] ✅ Mocking: GET /api/your/new/endpoint');
  return res.json({
    // Your mock response
  });
}
```

### Step 3: Test with curl

```bash
curl -k -H "Cookie: ocmOverridenEnvironment=msw-mockdata" \
  https://localhost:1337/mockdata/api/your/new/endpoint
```

### Step 4: Test in Browser

Navigate to the page with `?env=msw-mockdata` and verify it loads correctly.

### Step 5: Document the Flow

Add a new section to this file (MOCK_FLOWS.md) documenting:
- Page URL
- API call sequence
- What each endpoint returns
- UI impact

---

## 📚 Related Documentation

- **MSW-SERVER.md** - How to use the MSW server (start, stop, test)
- **MSW-IMPLEMENTATION-SUMMARY.md** - Architecture, technical details, customization
- **LEGACY-PYTHON-SERVER.md** - Documentation for the legacy Python mock system

---

**Last Updated:** 2025-10-13  
**Maintainer:** MSW Middleware System

