# MSW Mock Server - Technical Notes

**Current system architecture and implementation details**

---

## 🏗️ System Architecture

### High-Level Flow

```
Browser Request
  ↓
https://prod.foo.redhat.com:1337/openshift?env=msw-mockdata
  ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend (src/config.ts)                                    │
│ - Detects ?env=msw-mockdata                                 │
│ - Sets localStorage: ocmEnvironment='msw-mockdata'          │
│ - Sets HTTP cookie: ocmOverridenEnvironment='msw-mockdata'  │
│ - Loads config: src/config/msw-mockdata.json                │
│   → apiGateway: "https://$SELF_PATH$/mockdata"              │
└─────────────────────────────────────────────────────────────┘
  ↓
API Call: /mockdata/api/clusters_mgmt/v1/clusters
  ↓
┌─────────────────────────────────────────────────────────────┐
│ Webpack Dev Server (port 1337)                              │
│ Uses: fec.config.js proxy configuration                     │
│                                                              │
│ IF .msw-mode file exists:                                   │
│   → Proxy to http://localhost:9001 (MSW Server)             │
│ ELSE:                                                        │
│   → Proxy to http://[::1]:8010 (Python Server - legacy)     │
└─────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────┐
│ MSW Node.js Server (port 9001)                              │
│ File: mockdata/msw/server/dev-server-simple.mjs             │
│                                                              │
│ 1. Receives: GET /api/clusters_mgmt/v1/clusters             │
│ 2. Matches handler for /api/clusters_mgmt/v1/clusters       │
│ 3. Loads data from TypeScript fixtures (dist/)              │
│ 4. Returns: { kind: 'ClusterList', items: [...], total: 1 } │
└─────────────────────────────────────────────────────────────┘
  ↓
Returns JSON to browser
```

---

## 📁 File Structure

```
mockdata/msw/
├── README.md                          # User guide
├── TECH_NOTES.md                      # This file (architecture)
├── ROADMAP.md                         # History and future plans
│
├── fixtures/                          # ⭐ TypeScript fixtures
│   ├── types.ts                       # Type definitions
│   ├── clusters.ts                    # Cluster fixture aggregator
│   ├── subscriptions.ts               # Subscription fixture aggregator
│   ├── accounts.ts                    # Account/org fixtures
│   ├── providers.ts                   # Cloud providers
│   ├── authorization.ts               # Auth responses
│   ├── access-transparency.ts         # Access transparency
│   ├── index.ts                       # Main export
│   ├── tsconfig.json                  # TypeScript config
│   ├── clusters/                      # 🆕 Recorded cluster fixtures
│   │   ├── index.ts                   # Auto-generated index
│   │   └── *.ts                       # Individual cluster files
│   ├── subscriptions/                 # 🆕 Recorded subscription fixtures
│   │   ├── index.ts                   # Auto-generated index
│   │   └── *.ts                       # Individual subscription files
│   ├── recorded/                      # Local staging (git-ignored)
│   └── dist/                          # Compiled JS (auto-generated)
│       ├── clusters.js
│       ├── subscriptions.js
│       └── ...
│
├── scripts/                           # 🆕 Automation scripts
│   ├── record-cluster.sh              # Record real cluster from OCM
│   ├── rename-cluster.sh              # Rename a recorded fixture
│   ├── delete-cluster.sh              # Delete a recorded fixture
│   ├── generate-fixture-indexes.mjs   # Auto-generate index files
│   ├── README.md                      # Script documentation
│   └── ROSA_CLUSTER_FLAVORS.md        # ROSA CLI examples
│
└── server/
    └── dev-server-simple.mjs          # ⭐ MSW Server
```

### Key Files

**`fixtures/*.ts`** - Type-safe mock data
- Uses OpenAPI types from `src/types/clusters_mgmt.v1/` and `src/types/accounts_mgmt.v1/`
- Compiled to JavaScript in `fixtures/dist/`
- Factory functions for creating custom data

**`server/dev-server-simple.mjs`** - Node.js HTTP server
- Imports compiled fixtures from `fixtures/dist/`
- Manual request routing (if/else handlers)
- Runs on port 9001

---

## 🔑 Implementation Details

### 1. TypeScript Fixtures

**Location:** `mockdata/msw/fixtures/`

**Build Process:**
```bash
# Compiles TypeScript to JavaScript
yarn msw:fixtures:build

# Happens automatically when running
yarn start:msw
```

**Type System:**
```typescript
// fixtures/types.ts
import type { components as ClustersMgmtComponents } from '../../../src/types/clusters_mgmt.v1';

export type Cluster = ClustersMgmtComponents['schemas']['Cluster'];

// fixtures/clusters.ts
export function createCluster(overrides?: any): Cluster {
  // Factory with defaults
  const defaults: any = { /* ... */ };
  return { ...defaults, ...overrides } as Cluster;
}
```

**Why `as any` in some places:**
- OpenAPI types are sometimes overly strict for nested objects
- We use type assertions for deeply nested link objects
- Still get type safety at the top level

### 2. File-Based Mode Detection

**How It Works:**
- `.msw-mode` file in project root signals MSW mode is active
- `yarn start:msw` creates this file
- `fec.config.js` checks for file existence
- `yarn stop:msw` removes the file

**Code (`fec.config.js`):**
```javascript
customProxy: [{
  context: ['/mockdata'],
  pathRewrite: { '^/mockdata': '' },
  target: require('fs').existsSync('.msw-mode') 
    ? 'http://localhost:9001'   // MSW server
    : 'http://[::1]:8010',       // Python server (legacy)
}]
```

**Why File-Based:**
- FEC's `fec dev` command doesn't pass environment variables to webpack
- File system checks are synchronous and reliable
- No dependency on environment variable passing

### 3. Auto-Discovery System (Phase 2.5)

**How It Works:**
- Individual cluster/subscription fixtures stored in `fixtures/clusters/` and `fixtures/subscriptions/`
- `generate-fixture-indexes.mjs` scans these directories
- Auto-generates `index.ts` files that re-export all fixtures
- `clusters.ts` and `subscriptions.ts` import from these index files
- No manual imports needed!

**Workflow:**
```bash
# 1. Record a cluster (creates both cluster and subscription files)
./mockdata/msw/scripts/record-cluster.sh <subscription-id> my-cluster

# 2. Build fixtures (auto-generates indexes + compiles TypeScript)
yarn msw:fixtures:build
  → Runs generate-fixture-indexes.mjs
  → Creates fixtures/clusters/index.ts
  → Creates fixtures/subscriptions/index.ts
  → Compiles all TypeScript to dist/

# 3. Start server (fixtures are automatically discovered)
yarn start:msw
```

**Generated Index File (`fixtures/clusters/index.ts`):**
```typescript
// This file is auto-generated by generate-fixture-indexes.mjs
// Do not edit this file directly.

export * from './osd-annual-redhataccount-gcp-singlezone-private.js';
export * from './rosa-classic-aws-sts.js';
// ... all clusters auto-exported
```

**Consumer (`fixtures/clusters.ts`):**
```typescript
import * as recordedClusters from './clusters/index.js';

export const mockClusters: Cluster[] = Object.values(recordedClusters)
  .filter((exp): exp is Cluster => 
    exp != null && 
    typeof exp === 'object' && 
    'kind' in exp && 
    exp.kind === 'Cluster'
  );
```

### 4. Cookie-Based Client/Server Coordination

**The Problem:**
- `localStorage` is client-side only
- Server-side code can't read `localStorage`
- HTTP requests don't include `localStorage` data

**The Solution:**
- Set **both** `localStorage` AND HTTP cookie
- Cookie is sent with every request
- Server can check cookie value

**Code (`src/config.ts`):**
```typescript
// Set localStorage (for frontend)
localStorage.setItem('ocmEnvironment', 'msw-mockdata');

// Set HTTP cookie (for backend/middleware)
document.cookie = `ocmOverridenEnvironment=msw-mockdata; path=/; max-age=${60*60*24*7}; SameSite=Lax`;
```

**Exit MSW Mode (`src/components/App/EnvOverrideMessage.tsx`):**
```typescript
// Clear localStorage
localStorage.removeItem('ocmEnvironment');

// Clear HTTP cookie
document.cookie = 'ocmOverridenEnvironment=; path=/; max-age=0';
```

### 5. FEC vs Webpack Configuration

**Key Point:**
- FEC (`fec dev`) uses `fec.config.js` **NOT** `webpack.config.js`
- FEC wraps webpack with its own configuration
- Proxy settings in `webpack.config.js` are **ignored** when using `fec dev`
- Must update `fec.config.js` for proxy changes

### 6. Configuration File Location

**Location:** `src/config/msw-mockdata.json`

**Why here:**
- Webpack uses **dynamic imports** based on environment name
- Import path: `./config/${envName}.json`
- Relative to `src/` directory
- Cannot import from outside `src/`

**Content:**
```json
{
  "apiGateway": "https://$SELF_PATH$/mockdata",
  "insightsGateway": "https://$SELF_PATH$/mockdata/api"
}
```

---

## 🛠️ API Handlers

### Current Implementation

**Server:** `mockdata/msw/server/dev-server-simple.mjs`

**Pattern:**
```javascript
if (req.method === 'GET' && path === '/api/clusters_mgmt/v1/clusters') {
  console.log('[MSW] ✅ GET /api/clusters_mgmt/v1/clusters');
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(mockClusterList));
  return;
}
```

### Implemented Endpoints

**Clusters Management API:**
```
GET  /api/clusters_mgmt/v1/clusters
POST /api/clusters_mgmt/v1/clusters?method=get
GET  /api/clusters_mgmt/v1/clusters/:clusterId
GET  /api/clusters_mgmt/v1/clusters/:clusterId/upgrade_policies
GET  /api/clusters_mgmt/v1/clusters/:clusterId/machine_pools
GET  /api/clusters_mgmt/v1/clusters/:clusterId/node_pools
GET  /api/clusters_mgmt/v1/clusters/:clusterId/groups
GET  /api/clusters_mgmt/v1/clusters/:clusterId/identity_providers
GET  /api/clusters_mgmt/v1/clusters/:clusterId/ingresses
GET  /api/clusters_mgmt/v1/clusters/:clusterId/external_auth_config
GET  /api/clusters_mgmt/v1/clusters/:clusterId/aws_infrastructure_access_role_grants
GET  /api/clusters_mgmt/v1/clusters/:clusterId/gate_agreements
GET  /api/clusters_mgmt/v1/clusters/:clusterId/limited_support_reasons
GET  /api/clusters_mgmt/v1/clusters/:clusterId/control_plane/upgrade_policies
GET  /api/clusters_mgmt/v1/clusters/:clusterId/version_gates
GET  /api/clusters_mgmt/v1/clusters/:clusterId/inflight_checks
GET  /api/clusters_mgmt/v1/clusters/:clusterId/notification_contacts
GET  /api/clusters_mgmt/v1/cloud_providers
GET  /api/clusters_mgmt/v1/machine_types
```

**Accounts Management API:**
```
GET  /api/accounts_mgmt/v1/current_account
GET  /api/accounts_mgmt/v1/subscriptions
POST /api/accounts_mgmt/v1/subscriptions?method=get
GET  /api/accounts_mgmt/v1/subscriptions/:subscriptionId
GET  /api/accounts_mgmt/v1/subscriptions/:subscriptionId/notification_contacts
GET  /api/accounts_mgmt/v1/organizations/:orgId
GET  /api/accounts_mgmt/v1/organizations/:orgId/quota_cost
GET  /api/accounts_mgmt/v1/regions
GET  /api/accounts_mgmt/v1/cluster_transfers
```

**Authorization API:**
```
POST /api/authorizations/v1/self_access_review
POST /api/authorizations/v1/self_resource_review
POST /api/authorizations/v1/self_feature_review
```

**Access Transparency API:**
```
GET /api/access_transparency/v1/access_protection
GET /api/access_transparency/v1/access_requests
```

**Other APIs:**
```
GET /api/cost-management/v1/user-access/
GET /insights-results-aggregator/* (all paths - proxied/empty response)
```

---

## 🧪 Debugging

### Real-Time Log Monitoring

**Find current log file:**
```bash
ls -t /tmp/msw*.log | head -1
```

**Watch all MSW activity:**
```bash
tail -f $(ls -t /tmp/msw*.log | head -1) | grep "\[MSW\]"
```

**Filter out noise:**
```bash
tail -f $(ls -t /tmp/msw*.log | head -1) | grep "\[MSW\]" | grep -v "self_feature_review\|self_access_review"
```

### Check Server Status

```bash
# Ports in use
lsof -ti:9001 && echo "MSW running" || echo "MSW not running"
lsof -ti:1337 && echo "Webpack running" || echo "Webpack not running"

# .msw-mode file
ls -la .msw-mode && echo "MSW mode enabled" || echo "MSW mode disabled"
```

### Test API Directly

```bash
# Test clusters endpoint
curl -k 'https://prod.foo.redhat.com:1337/mockdata/api/clusters_mgmt/v1/clusters' | jq '.total'

# Test individual cluster
curl -k 'https://prod.foo.redhat.com:1337/mockdata/api/clusters_mgmt/v1/clusters/21696acc0dbkvh0mh4lranlmvvqb11lg' | jq '.display_name'
```

### TypeScript Compilation

```bash
# Check for TypeScript errors
yarn msw:fixtures:build

# Watch mode (auto-rebuild)
yarn msw:fixtures:watch
```

---

## 📊 Current Mock Data

### What's Mocked

- **Clusters:** Recorded from real OCM clusters (auto-discovered from `fixtures/clusters/`)
- **Subscriptions:** Recorded alongside clusters (auto-discovered from `fixtures/subscriptions/`)
- **1 organization:** `Mock Organization` with capabilities
- **1 current account:** `mnecas.openshift`
- **8 cloud providers:** AWS, GCP, Azure, etc. (from legacy JSON)
- **197 machine types:** (from legacy JSON)

### Data Sources

- **Recorded Fixtures (Recommended):** Real cluster/subscription data from OCM API
- **TypeScript Fixtures:** Accounts, auth, access transparency
- **Legacy JSON:** Cloud providers and machine types (large static datasets)

### Adding More Data

**Option 1: Record a Real Cluster (Recommended)**
```bash
# Record from real cluster
./mockdata/msw/scripts/record-cluster.sh <subscription-id> my-cluster-name

# Restart
yarn start:msw
```

**Option 2: Ad-Hoc Test Cluster**
```typescript
// mockdata/msw/fixtures/clusters.ts
const myTestCluster = createCluster({ /* your cluster */ });

export const mockClusters: Cluster[] = [
  ...Object.values(recordedClusters).filter(...),
  myTestCluster,  // Temporary only!
];
```

Then restart: `yarn start:msw`

---

## 🔄 Data Flow Example

### GET /api/clusters_mgmt/v1/clusters

1. **Browser:** `fetch('https://prod.foo.redhat.com:1337/mockdata/api/clusters_mgmt/v1/clusters')`
2. **Webpack:** Checks `.msw-mode` → proxies to `localhost:9001`
3. **MSW Server:** Matches `/api/clusters_mgmt/v1/clusters` handler
4. **Handler:** Returns `mockClusterList` from fixtures (auto-discovered clusters)
5. **Browser:** Receives `{ kind: 'ClusterList', items: [...], total: N }`

---

## 📋 Package.json Scripts

```json
{
  "msw:fixtures:build": "node mockdata/msw/scripts/generate-fixture-indexes.mjs && tsc -p mockdata/msw/fixtures/tsconfig.json",
  "msw:fixtures:watch": "tsc -p mockdata/msw/fixtures/tsconfig.json --watch",
  "msw:fixtures:clean": "rm -rf mockdata/msw/fixtures/dist",
  "msw:server": "yarn msw:fixtures:build && node mockdata/msw/server/dev-server-simple.mjs",
  "start:msw": "yarn stop:msw && touch .msw-mode && concurrently --kill-others --names=MSW,WEBPACK 'yarn msw:server' 'HOT=true yarn dev:fec --clouddotEnv prod'",
  "stop:msw": "rm -f .msw-mode; pkill -9 -f 'msw:server'; ... echo 'All MSW processes killed'"
}
```

**Note:** `msw:fixtures:build` now runs `generate-fixture-indexes.mjs` first to auto-generate index files before TypeScript compilation.

---

## 🧩 Integration Points

### 1. Frontend Config
**File:** `src/config.ts`  
Detects `?env` query parameter and configures environment.

### 2. Environment Override Banner
**File:** `src/components/App/EnvOverrideMessage.tsx`  
Shows warning banner when using mock data.

### 3. FEC Configuration
**File:** `fec.config.js`  
Configures webpack proxy routing based on `.msw-mode` file.

### 4. MSW Config
**File:** `src/config/msw-mockdata.json`  
Defines API gateway URLs for MSW mode.

---

## 📖 Related Documentation

- **`README.md`** - How to run and edit mock data
- **`ROADMAP.md`** - Project history and future plans

---

**Last Updated:** October 18, 2025
