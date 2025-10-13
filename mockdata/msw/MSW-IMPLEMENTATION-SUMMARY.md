# MSW Mock Data System - Implementation Summary

## ⚠️ CRITICAL: This is NOT Real MSW! 

**Current Status:** A working **custom Express middleware** mock system has been implemented - but this is **NOT a proper MSW (Mock Service Worker) implementation!**

### 🚨 What We Actually Built

**This is another custom solution** - just like the legacy Python server:
- ✅ Server-side HTTP interception (Express middleware in webpack dev server)
- ✅ Uses **REAL Red Hat SSO authentication** (you login normally)
- ✅ Uses **REAL Chrome framework** from console.redhat.com
- ✅ Only **mocks OCM API endpoints** (/api/clusters_mgmt, /api/accounts_mgmt, /api/authorizations)
- ❌ **Does NOT use MSW library** (`msw/browser` or `msw/node`)
- ❌ **Does NOT use Service Workers**
- ❌ **NOT a standard/typical MSW implementation**

### 🎯 The Original Goal (Not Yet Achieved)

**What we should have:** A proper MSW implementation using the `msw` library with browser service workers
- Uses `msw/browser` and `setupWorker()`
- Intercepts requests in the browser
- Standard, modern, maintainable approach
- Industry-standard mocking solution

**What we have:** Another custom server-side mock system (like the legacy Python server)
- Plain Express middleware
- Intercepts requests on the server
- Works, but misses the point of modernizing to MSW

---

## 📖 What Real MSW Looks Like (Reference for Future Refactor)

### Why Use Real MSW?

**Industry Standard:**
- ✅ Used by thousands of projects worldwide
- ✅ Active community and extensive documentation
- ✅ Battle-tested patterns and best practices
- ✅ Browser DevTools integration
- ✅ TypeScript support with excellent type safety
- ✅ Testing framework integrations (Jest, Vitest, Playwright)

**Technical Benefits:**
- ✅ Intercepts requests in the browser (closer to real behavior)
- ✅ Can mock external domains (SSO, analytics, etc.)
- ✅ Works across all tabs/windows in the browser
- ✅ Hot reload support for handler changes
- ✅ Request logging and debugging built-in
- ✅ Can be used for unit tests, integration tests, and development

### Real MSW Implementation Example

**File Structure:**
```
src/
├── mocks/
│   ├── browser.ts              ← Worker setup
│   ├── handlers/
│   │   ├── index.ts            ← Handler exports
│   │   ├── clusters.ts         ← Cluster endpoints
│   │   ├── subscriptions.ts    ← Subscription endpoints
│   │   └── auth.ts             ← Auth endpoints
│   └── fixtures/
│       ├── clusters.ts         ← Mock cluster data
│       └── subscriptions.ts    ← Mock subscription data
```

**Worker Setup (`src/mocks/browser.ts`):**
```typescript
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

// Initialize early in application lifecycle
export function startMockWorker() {
  if (typeof window !== 'undefined' && window.location.search.includes('env=msw-mockdata')) {
    return worker.start({
      onUnhandledRequest: 'warn',
      serviceWorker: {
        url: '/mockServiceWorker.js'
      }
    })
  }
  return Promise.resolve()
}
```

**Handler Example (`src/mocks/handlers/clusters.ts`):**
```typescript
import { http, HttpResponse } from 'msw'
import { hypershiftCluster, mockClusters } from '../fixtures/clusters'

export const clusterHandlers = [
  // List clusters
  http.get('/api/clusters_mgmt/v1/clusters', () => {
    return HttpResponse.json({
      kind: 'ClusterList',
      items: [hypershiftCluster],
      page: 1,
      size: 1,
      total: 1,
    })
  }),
  
  // Get individual cluster
  http.get('/api/clusters_mgmt/v1/clusters/:id', ({ params }) => {
    const { id } = params
    if (id === hypershiftCluster.id) {
      return HttpResponse.json(hypershiftCluster)
    }
    return HttpResponse.json(
      { kind: 'Error', code: 'CLUSTERS-MGMT-404', reason: 'Not found' },
      { status: 404 }
    )
  }),
  
  // Cluster sub-resources
  http.get('/api/clusters_mgmt/v1/clusters/:id/upgrade_policies', () => {
    return HttpResponse.json({
      kind: 'UpgradePolicyList',
      items: [],
      page: 1,
      size: 0,
      total: 0,
    })
  }),
  
  // ... more handlers
]
```

**Fixtures Example (`src/mocks/fixtures/clusters.ts`):**
```typescript
import { Cluster } from '@/types/cluster'

export const hypershiftCluster: Cluster = {
  id: '21696acc0dbkvh0mh4lranlmvvqb11lg',
  kind: 'Cluster',
  href: '/api/clusters_mgmt/v1/clusters/21696acc0dbkvh0mh4lranlmvvqb11lg',
  name: 'hypershift-ready',
  display_name: 'hypershift-ready',
  state: 'ready',
  region: {
    id: 'us-east-1',
    kind: 'CloudRegion',
  },
  cloud_provider: {
    id: 'aws',
    kind: 'CloudProvider',
    display_name: 'Amazon Web Services',
  },
  version: {
    id: 'openshift-v4.12.0-rc.8',
    kind: 'Version',
    raw_id: '4.12.0-rc.8',
  },
  hypershift: {
    enabled: true,
  },
  multi_az: true,
  // ... full cluster object
}

// Factory function for creating clusters
export function createMockCluster(overrides?: Partial<Cluster>): Cluster {
  return {
    ...hypershiftCluster,
    ...overrides,
  }
}
```

**Early Initialization (before Chrome framework):**
```typescript
// src/index.ts or src/bootstrap.ts
import { startMockWorker } from './mocks/browser'

// Start MSW FIRST, before anything else
startMockWorker().then(() => {
  // Then load the rest of the application
  import('./chrome-main')
})
```

### Key Differences: Real MSW vs Current Middleware

| Aspect | Current Middleware | Real MSW |
|--------|-------------------|----------|
| **Library** | None (plain Express) | `msw` npm package |
| **Intercepts at** | Server (webpack) | Browser (Service Worker) |
| **Code location** | `mockdata/msw/` | `src/mocks/` |
| **Handler syntax** | Custom `if/else` | `http.get()`, `http.post()` |
| **Fixtures** | Requires legacy JSON | Independent TypeScript files |
| **Type safety** | None | Full TypeScript support |
| **DevTools** | No integration | Shows in Network tab with `[MSW]` |
| **Community** | No community | Large, active community |
| **Testing** | Webpack-only | Works in Jest, Vitest, Playwright |
| **Documentation** | Custom docs | Official MSW docs apply |
| **Maintainability** | Custom, hard to maintain | Standard, easy to maintain |

---

## 🎯 What Was Actually Built (Current State)

### 1. **MSW Middleware** (Server-Side)
- Implemented as Express middleware in webpack dev server
- File: `mockdata/msw/msw-middleware.js`
- Intercepts `/mockdata/api/*` requests and returns mock responses
- Works **before** proxying to external services

### 2. **Configuration**
- `src/config/msw-mockdata.json` - Routes API calls through `/mockdata` prefix
  - **Note:** This file MUST stay in `src/config/` (not moved to `mockdata/msw/`)
  - Reason: Loaded by webpack via `import('./config/msw-mockdata.json')`
  - All environment configs must be in `src/config/` for the config system to work
- Routes configured to match legacy system behavior:
  - `apiGateway`: `https://$SELF_PATH$/mockdata`
  - `insightsGateway`: `https://$SELF_PATH$/mockdata/api`
- Frontend sets HTTP cookie: `ocmOverridenEnvironment=msw-mockdata`

### 3. **Webpack Integration**
- MSW middleware registered in `webpack.config.js` via `setupMiddlewares`
- Runs BEFORE proxy configuration, intercepting requests early
- No Python server needed for MSW mode!

### 4. **Mock Data Source** ⚠️ TECHNICAL DEBT
- **Current (Temporary):** Uses legacy JSON file: `mockdata/api/clusters_mgmt/v1/clusters.json`
  - Creates a dependency on legacy system
  - **Must be fixed:** Need to create independent MSW fixtures in `mockdata/msw/fixtures/`
  - For now: Finds "hypershift-ready" cluster dynamically from legacy JSON
- **Future:** MSW should have its own self-contained mock data that survives legacy system deletion

### 5. **API Handlers**
Implemented middleware handlers for:

**Cluster Management**
- `GET/POST /api/clusters_mgmt/v1/clusters` - List clusters (supports POST for complex queries)
- `GET /api/clusters_mgmt/v1/clusters/:id` - Get cluster details
- `GET /api/clusters_mgmt/v1/clusters/:id/upgrade_policies` - Upgrade schedules
- `GET /api/clusters_mgmt/v1/clusters/:id/machine_pools` - Machine pools
- `GET /api/clusters_mgmt/v1/clusters/:id/node_pools` - Node pools
- `GET /api/clusters_mgmt/v1/clusters/:id/groups` - Identity provider groups
- `GET /api/clusters_mgmt/v1/clusters/:id/external_auth_config` - External auth config
- `GET /api/clusters_mgmt/v1/clusters/:id/aws_infrastructure_access_role_grants` - AWS IAM roles
- `GET /api/clusters_mgmt/v1/cloud_providers` - Cloud providers
- `GET /api/clusters_mgmt/v1/machine_types` - Machine types
- `GET /api/clusters_mgmt/v1/aws_infrastructure_access_roles` - AWS IAM roles
- `POST /api/clusters_mgmt/v1/aws_inquiries/vpcs` - AWS VPC inquiry

**Account Management**
- `GET /api/accounts_mgmt/v1/current_account` - Current user account
- `GET /api/accounts_mgmt/v1/organizations/:id` - Organization details
- `GET /api/accounts_mgmt/v1/organizations/:id/quota_cost` - Quota and cost info
- `GET /api/accounts_mgmt/v1/subscriptions` - List subscriptions
- `GET /api/accounts_mgmt/v1/subscriptions/:id` - Individual subscription (CRITICAL for cluster list)
- `GET /api/accounts_mgmt/v1/cluster_transfers` - Cluster ownership transfers
- `GET /api/accounts_mgmt/v1/regions` - Available regions

**Authorization**
- `POST /api/authorizations/v1/self_access_review` - Access permissions
- `POST /api/authorizations/v1/self_feature_review` - Feature toggles
- `POST /api/authorizations/v1/self_resource_review` - Resource permissions
- `POST /api/authorizations/v1/self_terms_review` - Terms acceptance

**Catch-All Handler**
- Returns empty/success responses for unhandled endpoints to prevent crashes

### 6. **Yarn Commands**
- **`yarn start:msw`** - Start webpack dev server with MSW middleware (no Python server)
- **`yarn stop:msw`** - Kill all MSW-related processes and free ports

---

## 🚀 How to Use

### Quick Start (3 Steps)

1. **Start the dev server:**
   ```bash
   yarn start:msw
   ```
   Wait for: `webpack 5.99.9 compiled successfully`

2. **Open browser and login with SSO:**
   ```
   https://prod.foo.redhat.com:1337/openshift?env=msw-mockdata
   ```
   
3. **Login normally:**
   - You'll be redirected to Red Hat SSO login page
   - Enter your Red Hat credentials (just like normal development)
   - After login, you'll see the cluster list with **one cluster: "hypershift-ready"**

### What Happens Behind the Scenes

```
Browser Request: https://prod.foo.redhat.com:1337/openshift?env=msw-mockdata
                 ↓
Frontend sets HTTP cookie: ocmOverridenEnvironment=msw-mockdata
                 ↓
Real SSO Authentication (you login normally)
                 ↓
Real Chrome Framework (from console.redhat.com)
                 ↓
App makes API call: /mockdata/api/clusters_mgmt/v1/clusters
                 ↓
MSW Middleware detects cookie → Intercepts request → Returns mock cluster data
                 ↓
Cluster list shows: "hypershift-ready" cluster ✅
```

### Testing API Directly (Without Browser)

You can test the middleware directly with curl:
```bash
curl -k -H "Cookie: ocmOverridenEnvironment=msw-mockdata" \
  "https://localhost:1337/mockdata/api/clusters_mgmt/v1/clusters"
```

---

## 📁 File Structure

### Project Organization

```
uhc-portal/
├── mockdata/
│   ├── msw/
│   │   ├── msw-middleware.js        ← **CORE IMPLEMENTATION** (Express middleware)
│   │   ├── MSW-IMPLEMENTATION-SUMMARY.md ← This file (architecture & technical details)
│   │   ├── MSW-SERVER.md            ← User guide (how to use)
│   │   └── README.md                ← Directory guide
│   ├── LEGACY-PYTHON-SERVER.md      ← Legacy system docs
│   ├── mockserver.py                ← Legacy Python server (for yarn start)
│   └── api/                         ← Legacy JSON files
│       └── clusters_mgmt/v1/
│           └── clusters.json        ← **SOURCE** for hypershift-ready cluster
│
├── src/
│   ├── config/
│   │   ├── msw-mockdata.json        ← **NOTE**: Must stay here (loaded by webpack)
│   │   ├── mockdata.json            ← Legacy mockdata config
│   │   ├── production.json
│   │   ├── staging.json
│   │   └── integration.json
│   │
│   ├── config.ts                    ← **MODIFIED**: Sets HTTP cookie for MSW mode
│   ├── components/App/
│   │   └── EnvOverrideMessage.tsx   ← **MODIFIED**: Clears cookie on environment reset
│   └── chrome-main.tsx              ← MSW mode detection logging
│
├── webpack.config.js                ← **MODIFIED**: Registered MSW middleware
└── package.json                     ← **MODIFIED**: Added yarn start:msw, stop:msw
```

### Core Implementation File

**`mockdata/msw/msw-middleware.js`** (350 lines)
- Express middleware function
- Checks for MSW mode activation (URL param, referer, or cookie)
- Intercepts `/mockdata/api/*` requests
- Returns mock responses based on endpoint
- Uses data from `mockdata/api/clusters_mgmt/v1/clusters.json`

### Key Modified Files

1. **`src/config.ts`** (Lines 172-175)
   - Sets HTTP cookie when `?env=msw-mockdata` is loaded:
   ```javascript
   document.cookie = `ocmOverridenEnvironment=${queryEnv}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
   ```

2. **`src/components/App/EnvOverrideMessage.tsx`** (Lines 16-17)
   - Clears cookie when user clicks "Go back to normal":
   ```javascript
   document.cookie = 'ocmOverridenEnvironment=; path=/; max-age=0';
   ```

3. **`webpack.config.js`** (Lines 288-292)
   - Registers MSW middleware in dev server:
   ```javascript
   middlewares.unshift({
     name: 'msw-mock-middleware',
     middleware: mswMiddleware,
   });
   ```

4. **`package.json`** (Lines 214-215)
   - Added yarn commands:
   ```json
   {
     "start:msw": "yarn stop:msw && yarn dev-server --env noproxy",
     "stop:msw": "pkill -9 -f 'yarn start:msw'; pkill -9 -f 'webpack serve'; lsof -ti:1337 | xargs kill -9 2>/dev/null || true; sleep 2; echo 'All MSW processes killed'"
   }
   ```

---

## 🍪 Cookie-Based Mode Detection (Critical Implementation Detail)

The MSW middleware needs to detect when to intercept requests. This is done via an **HTTP cookie** that works alongside localStorage.

### Why Both localStorage AND Cookie?

**localStorage alone is NOT enough:**
- ✅ Frontend can read it: `localStorage.getItem('ocmOverridenEnvironment')`
- ❌ Backend cannot read it: localStorage is client-side only, not sent in HTTP headers
- ❌ Result: Middleware can't detect MSW mode

**HTTP cookie solves this:**
- ✅ Frontend can read it: `document.cookie`
- ✅ Backend can read it: Sent in `Cookie:` HTTP header with every request
- ✅ Result: Middleware can detect MSW mode reliably

### The Complete Cookie Lifecycle

#### 1. **Entering MSW Mode** (`src/config.ts` lines 165-175)

**When:** User navigates with `?env=msw-mockdata`

**What happens:**
```typescript
const queryEnv = parseEnvQueryParam() || localStorage.getItem(ENV_OVERRIDE_LOCALSTORAGE_KEY);
if (queryEnv && configs[queryEnv]) {
  configs[queryEnv]!.then(async (data) => {
    // Load the msw-mockdata config
    this.loadConfig(data, chrome);
    that.envOverride = queryEnv;
    
    // Store in localStorage (for frontend)
    localStorage.setItem(ENV_OVERRIDE_LOCALSTORAGE_KEY, queryEnv);
    
    // CRITICAL: Also set as HTTP cookie (for backend middleware)
    document.cookie = `ocmOverridenEnvironment=${queryEnv}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    //                                                                        ↑
    //                                              Expires in 7 days (604800 seconds)
  });
}
```

**Result:**
- ✅ localStorage: `ocmOverridenEnvironment = "msw-mockdata"`
- ✅ HTTP cookie: `ocmOverridenEnvironment=msw-mockdata; path=/; max-age=604800; SameSite=Lax`
- ✅ Yellow banner appears: "Using the msw-mockdata environment API"
- ✅ All subsequent HTTP requests include the cookie in headers

#### 2. **Middleware Detection** (`mockdata/msw/msw-middleware.js` lines 36-48)

**When:** Any HTTP request is made

**What happens:**
```javascript
function mswMiddleware(req, res, next) {
  const url = req.url || '';
  const referer = req.headers.referer || '';
  const cookie = req.headers.cookie || '';  // ← HTTP cookie sent by browser
  
  // Check for MSW mode in 3 places (in priority order)
  const isMswMode = 
    url.includes('env=msw-mockdata') ||              // Initial page load
    referer.includes('env=msw-mockdata') ||          // Subsequent navigation
    cookie.includes('ocmOverridenEnvironment=msw-mockdata'); // ← Cookie check!
  
  if (isMswMode && req.url.startsWith('/mockdata')) {
    // MSW mode detected! Intercept and return mock data
    // ... handle mocking ...
  } else {
    // Not MSW mode, pass to next middleware
    next();
  }
}
```

**Result:**
- ✅ Middleware detects MSW mode from cookie
- ✅ API requests are intercepted and mocked
- ✅ Cluster list shows 1 cluster (hypershift-ready)

#### 3. **Exiting MSW Mode** (`src/components/App/EnvOverrideMessage.tsx` lines 14-18)

**When:** User clicks "Go back to normal" in the yellow banner

**What happens:**
```typescript
const goBackToNormal = () => {
  // Remove from localStorage
  localStorage.removeItem(ENV_OVERRIDE_LOCALSTORAGE_KEY);
  
  // CRITICAL: Also clear the HTTP cookie
  document.cookie = 'ocmOverridenEnvironment=; path=/; max-age=0';
  //                                                       ↑
  //                                      max-age=0 expires cookie immediately
};
```

**Result:**
- ✅ localStorage: `ocmOverridenEnvironment` removed
- ✅ HTTP cookie: Expired (deleted)
- ✅ Yellow banner disappears
- ✅ Subsequent HTTP requests no longer include the cookie
- ✅ Middleware no longer detects MSW mode
- ✅ App returns to normal operation (real APIs or Python mock server)

### Why Both Changes Are REQUIRED

**Without cookie SET (config.ts):**
```
User navigates to ?env=msw-mockdata
         ↓
localStorage set ✅
Cookie NOT set ❌
         ↓
Middleware checks HTTP headers
         ↓
No cookie found! Assumes NOT MSW mode
         ↓
Passes request to Python server or real APIs
         ↓
BUG: MSW system doesn't work at all!
```

**Without cookie CLEAR (EnvOverrideMessage.tsx):**
```
User clicks "Go back to normal"
         ↓
localStorage cleared ✅
Cookie NOT cleared ❌
         ↓
User navigates to /openshift (no ?env parameter)
         ↓
Middleware checks HTTP headers
         ↓
Cookie still there! Assumes STILL in MSW mode
         ↓
Continues intercepting and mocking requests
         ↓
BUG: User stuck in MSW mode for 7 days!
```

**With both changes (current implementation):**
```
User navigates to ?env=msw-mockdata
         ↓
localStorage + Cookie SET ✅
         ↓
Middleware detects MSW mode ✅
         ↓
API calls mocked correctly ✅
         ↓
User clicks "Go back to normal"
         ↓
localStorage + Cookie CLEARED ✅
         ↓
Middleware stops detecting MSW mode ✅
         ↓
App returns to normal operation ✅
```

### Testing the Cookie Behavior

**Verify cookie is set:**
```javascript
// In browser console after navigating to ?env=msw-mockdata
document.cookie.split(';').find(c => c.includes('ocmOverridenEnvironment'))
// Should return: " ocmOverridenEnvironment=msw-mockdata"
```

**Verify cookie is sent in requests:**
```bash
# Watch requests include the cookie
curl -k -H "Cookie: ocmOverridenEnvironment=msw-mockdata" \
  https://localhost:1337/mockdata/api/clusters_mgmt/v1/clusters
```

**Verify cookie is cleared:**
```javascript
// In browser console after clicking "Go back to normal"
document.cookie.split(';').find(c => c.includes('ocmOverridenEnvironment'))
// Should return: undefined
```

### Cookie Attributes Explained

```javascript
document.cookie = `ocmOverridenEnvironment=${queryEnv}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
```

- `ocmOverridenEnvironment=${queryEnv}` - Cookie name and value
- `path=/` - Available to all paths on the domain
- `max-age=604800` - Expires in 7 days (60 * 60 * 24 * 7 seconds)
- `SameSite=Lax` - Sent with same-site requests and top-level navigation (secure, prevents CSRF)

### Common Issues

**Issue:** "Middleware not detecting MSW mode on initial load"
- **Cause:** Cookie not set correctly in config.ts
- **Fix:** Verify `document.cookie = ...` line exists and runs
- **Test:** Check DevTools → Application → Cookies

**Issue:** "Can't exit MSW mode, still seeing 1 cluster"
- **Cause:** Cookie not cleared in EnvOverrideMessage.tsx
- **Fix:** Verify `document.cookie = '...max-age=0'` line exists and runs
- **Test:** Check cookie is gone in DevTools → Application → Cookies

**Issue:** "Cookie doesn't persist across page reloads"
- **Cause:** `max-age` is 0 or cookie is being cleared somewhere
- **Fix:** Verify `max-age=${60 * 60 * 24 * 7}` is set correctly
- **Test:** Reload page and check cookie still exists

---

## 📊 Mock Data Summary

The system currently provides **1 test cluster**:

| Property | Value |
|----------|-------|
| ID | 21696acc0dbkvh0mh4lranlmvvqb11lg |
| Name | hypershift-ready |
| Display Name | hypershift-ready |
| State | ready |
| Cloud Provider | AWS |
| Region | us-east-1 |
| OpenShift Version | 4.12.0-rc.8 |
| Type | ROSA (Hosted Control Plane / HyperShift) |
| Multi-AZ | Yes |
| Created | 2023-01-11 |

---

## 🔄 Switching Between Systems

### Use New MSW System
```bash
yarn start:msw
# Navigate to: https://prod.foo.redhat.com:1337/openshift?env=msw-mockdata
```

### Use Legacy Python System
```bash
yarn start
# Navigate to: https://prod.foo.redhat.com:1337/openshift?env=mockdata
```

### Use Real APIs
```bash
yarn start:msw  # or yarn start
# Navigate to: https://prod.foo.redhat.com:1337/openshift
# (no ?env parameter)
```

---

## 🎓 Documentation

Three documentation files:

1. **MSW-SERVER.md** (`mockdata/msw/MSW-SERVER.md`)
   - User guide - how to use the MSW server
   - Quick start instructions
   - Troubleshooting
   - Testing tips

2. **MOCK_FLOWS.md** (`mockdata/msw/MOCK_FLOWS.md`) ⭐ NEW!
   - Detailed API call sequences
   - Cluster List page flow (step-by-step)
   - Cluster Details page flow (step-by-step)
   - What gets mocked and in what order
   - Debugging tips for developers and AI
   - How to add new mocked pages

3. **MSW-IMPLEMENTATION-SUMMARY.md** (this file)
   - Technical architecture
   - Implementation details
   - File structure
   - Known technical debt
   - Customization guide
   - Problem solving history
   - AI debugging guide

---

## ⚠️ Implementation Challenges & Solutions

### The Core Problem: Authentication

**Initial Approach (Failed):** Tried to bypass SSO and mock Chrome framework endpoints
- Service worker registration was too slow
- Chrome framework requests happened before MSW activated
- Required reverse-engineering undocumented Chrome API structures
- Constant race conditions and redirects

**Discovery:** The legacy Python mock server works because it:
- Uses **real** SSO authentication
- Uses **real** Chrome framework
- Only mocks **OCM API endpoints**

**Final Solution:** Adopted the same approach as legacy system
1. ✅ User authenticates with real Red Hat SSO
2. ✅ Chrome framework loads from real console.redhat.com
3. ✅ Only OCM API calls are intercepted by middleware
4. ✅ Simple, reliable, maintainable

### Key Technical Challenges Solved

#### 1. **Cookie Detection** 
**Problem:** localStorage is not sent in HTTP headers, so middleware couldn't detect MSW mode

**Solution:** Modified frontend to set HTTP cookie alongside localStorage:
```javascript
document.cookie = `ocmOverridenEnvironment=${queryEnv}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
```

#### 2. **Cluster Sub-Resources**
**Problem:** Cluster details page showed errors for missing sub-resources (upgrade_policies, machine_pools, etc.)

**Solution:** Added handlers for all cluster sub-resources:
- `/clusters/:id/upgrade_policies`
- `/clusters/:id/machine_pools`
- `/clusters/:id/node_pools`
- `/clusters/:id/groups`
- `/clusters/:id/external_auth_config`
- `/clusters/:id/aws_infrastructure_access_role_grants`

#### 3. **Mode Detection on Initial Load**
**Problem:** Middleware checked referer header, but referer is often empty on initial page load

**Solution:** Check multiple sources in order of priority:
1. URL parameter: `url.includes('env=msw-mockdata')`
2. Referer header: `referer.includes('env=msw-mockdata')`
3. HTTP cookie: `cookie.includes('ocmOverridenEnvironment=msw-mockdata')`

---

## 🤖 AI Debugging Guide

This section documents debugging techniques and tools that were effective during implementation. These are useful for AI assistants working on similar issues.

### 1. **Real-Time Log Monitoring**

**Monitor all middleware activity:**
```bash
tail -f /tmp/msw-debug.log | grep "MSW-MIDDLEWARE"
```

**Filter out noisy authorization requests:**
```bash
tail -f /tmp/msw-debug.log | grep "MSW-MIDDLEWARE" | grep -v "self_feature_review\|self_access_review"
```

**Watch specific request types:**
```bash
tail -f /tmp/msw-debug.log | grep "MSW-MIDDLEWARE" | grep -E "(clusters|subscriptions|undefined)"
```

**Watch for errors:**
```bash
tail -f /tmp/msw-debug.log | grep -E "(MSW-MIDDLEWARE|ECONNREFUSED|Error)"
```

**Why this works:** The `yarn start:msw` command pipes output to `/tmp/msw-debug.log`, allowing real-time monitoring without cluttering the terminal.

### 2. **JSON Data Inspection**

**Find specific cluster data:**
```bash
cat mockdata/api/clusters_mgmt/v1/clusters.json | \
  jq '.items[] | select(.display_name == "hypershift-ready") | {display_name, openshift_version, cloud_provider, region}'
```

**List all cluster names:**
```bash
cat mockdata/api/clusters_mgmt/v1/clusters.json | jq '.items[].display_name'
```

**Check cluster structure:**
```bash
cat mockdata/api/clusters_mgmt/v1/clusters.json | jq '.items[0] | keys | sort'
```

**Why this works:** Using `jq` allows precise inspection of complex JSON structures without manual parsing.

### 3. **Direct API Testing**

**Test with cookie:**
```bash
curl -k -H "Cookie: ocmOverridenEnvironment=msw-mockdata" \
  https://localhost:1337/mockdata/api/clusters_mgmt/v1/clusters | jq
```

**Test specific cluster:**
```bash
curl -k -H "Cookie: ocmOverridenEnvironment=msw-mockdata" \
  https://localhost:1337/mockdata/api/clusters_mgmt/v1/clusters/21696acc0dbkvh0mh4lranlmvvqb11lg | jq
```

**Test subscription:**
```bash
curl -k -H "Cookie: ocmOverridenEnvironment=msw-mockdata" \
  https://localhost:1337/mockdata/api/accounts_mgmt/v1/subscriptions/2KBhQVMVQx0CEoXuYZUMBQrQG8y | jq
```

**Why this works:** Testing APIs directly with curl eliminates browser/frontend variables and confirms middleware behavior.

### 4. **Server Restart with Logging**

**Clean restart with log capture:**
```bash
yarn stop:msw && sleep 2 && yarn start:msw 2>&1 | tee /tmp/msw-debug.log &
```

**Why this works:**
- `yarn stop:msw` kills all processes
- `sleep 2` ensures ports are freed
- `2>&1` captures both stdout and stderr
- `tee` writes to both file and terminal
- `&` runs in background

### 5. **Debugging Middleware Logic**

**Check middleware startup:**
```bash
grep "Loaded hypershift-ready cluster" /tmp/msw-debug.log
```

**Check mode detection:**
```bash
grep "MSW mode check" /tmp/msw-debug.log | head -10
```

**Check cookie values:**
```bash
grep "Cookie contains msw-mockdata" /tmp/msw-debug.log | head -5
```

**Why this works:** Middleware logs include structured debug messages that help trace execution flow.

### 6. **Interactive Request Monitoring**

**Watch requests while refreshing browser:**
```bash
echo "Please refresh the browser now..." && \
tail -f /tmp/msw-debug.log | grep --line-buffered "MSW-MIDDLEWARE" | head -30
```

**Why this works:**
- `--line-buffered` ensures grep doesn't wait for full buffer
- `head -30` automatically stops after 30 lines
- User can see immediate feedback from browser actions

### 7. **Comparing Legacy vs MSW**

**Check legacy cluster data:**
```bash
cat mockdata/api/clusters_mgmt/v1/clusters.json | \
  jq '.items[] | select(.display_name == "hypershift-ready") | .id'
```

**Test legacy endpoint:**
```bash
curl -k "https://localhost:8010/api/clusters_mgmt/v1/clusters" | jq '.items[0].display_name'
```

**Why this works:** Comparing responses helps ensure MSW matches legacy behavior.

### 8. **Port and Process Management**

**Check what's using port 1337:**
```bash
lsof -ti:1337
```

**Kill process on port:**
```bash
lsof -ti:1337 | xargs kill -9
```

**Check if Python server is running:**
```bash
ps aux | grep mockserver.py
```

**Why this works:** Port conflicts are common; these commands quickly identify and resolve them.

### 9. **Browser State Inspection**

**Check localStorage:**
```javascript
// In browser console
localStorage.getItem('ocmOverridenEnvironment')
```

**Check cookies:**
```javascript
// In browser console
document.cookie.split(';').find(c => c.includes('ocmOverridenEnvironment'))
```

**Clear everything:**
```javascript
// In browser console
localStorage.clear();
document.cookie.split(';').forEach(c => {
  document.cookie = c.split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
});
location.reload();
```

**Why this works:** Browser state (localStorage, cookies) affects middleware detection; inspecting and clearing helps debug issues.

### 10. **Webpack Compilation Monitoring**

**Watch for compilation success:**
```bash
tail -f /tmp/msw-debug.log | grep "compiled"
```

**Check for errors during build:**
```bash
tail -f /tmp/msw-debug.log | grep -i "error\|warning"
```

**Why this works:** Webpack must successfully compile changes before they take effect.

### Key Debugging Principles for AI Assistants

1. **Use structured logging:** Add `console.log` statements with prefixes like `[MSW-MIDDLEWARE]` for easy grepping
2. **Test at multiple layers:** Test middleware directly (curl), then browser, to isolate issues
3. **Check state:** Always verify localStorage, cookies, and URL parameters
4. **Monitor in real-time:** Use `tail -f` to watch logs while interacting with the system
5. **Compare with known-good:** Check legacy system behavior to understand expected responses
6. **Isolate variables:** Test one thing at a time (cookie detection, then endpoint handling, then data structure)
7. **Document findings:** Add debug logs that explain what's being checked and why

### Common Debugging Patterns

**Pattern 1: "Feature works in curl but not browser"**
- Likely cause: Cookie/localStorage state issue
- Solution: Check browser DevTools → Application → Storage

**Pattern 2: "Middleware not intercepting requests"**
- Likely cause: Mode detection failing
- Solution: Check `isMswMode` logic in middleware, verify cookie is set

**Pattern 3: "Empty/undefined data in UI"**
- Likely cause: Missing fields in mock response or wrong endpoint
- Solution: Compare curl response with browser Network tab, check response structure

**Pattern 4: "Changes not taking effect"**
- Likely cause: Webpack not recompiling or browser cache
- Solution: Check webpack logs for "compiled successfully", hard refresh browser (Cmd+Shift+R)

---

## ⚠️ Known Technical Debt

### 🔴 #1 CRITICAL: Refactor to Real MSW Implementation (HIGHEST PRIORITY)

**Current State:**
```javascript
// mockdata/msw/msw-middleware.js
// This is plain Express middleware - NOT MSW!
module.exports = function mswMiddleware(req, res, next) {
  // Custom HTTP interception logic...
}
```

**Problem:**
- **This defeats the entire purpose of replacing the legacy system!**
- We built another custom solution instead of adopting a standard, modern approach
- Not using MSW library means:
  - No industry-standard patterns
  - No MSW community support
  - No MSW tooling/debugging
  - Not maintainable by developers familiar with MSW
  - Just swapped one custom system for another

**Why This Happened:**
During implementation, we hit race conditions and service worker initialization issues:
1. Service worker registration was too slow
2. Chrome framework made requests before MSW could intercept
3. Module Federation bypassed standard entry points
4. SSO redirects happened before browser-side mocking could activate

**However, these are solvable problems!** We took the "quick fix" path instead of solving the real MSW challenges.

**Impact:**
- ❌ **Defeats the modernization goal**
- ❌ Not using industry-standard mocking
- ❌ Still have a custom, hard-to-maintain solution
- ❌ Future developers expect real MSW, not custom middleware
- ❌ Can't leverage MSW ecosystem, tooling, or community

**Solution Needed:**
1. **Research proper MSW initialization** for Module Federation apps
2. **Solve the race condition** - initialize MSW before Chrome framework loads
3. **Convert to real MSW handlers** using `msw/browser` and `setupWorker()`
4. **Create proper fixtures/factories** in `mockdata/msw/fixtures/` using MSW patterns
5. **Remove custom middleware** and use standard MSW service worker
6. **Test with real MSW tooling** (DevTools, MSW browser extension, etc.)

**Reference for Real MSW Implementation:**
```javascript
// src/mocks/browser.ts (FUTURE)
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

// Start worker BEFORE any other code
if (window.location.search.includes('env=msw-mockdata')) {
  worker.start()
}
```

```javascript
// src/mocks/handlers.ts (FUTURE)
import { http, HttpResponse } from 'msw'
import { hypershiftCluster } from './fixtures/clusters'

export const handlers = [
  http.get('/api/clusters_mgmt/v1/clusters', () => {
    return HttpResponse.json({
      kind: 'ClusterList',
      items: [hypershiftCluster],
    })
  }),
  // ... more handlers
]
```

**Status:** 🔴 CRITICAL - Must be fixed to achieve original goal

---

### #2. **Dependency on Legacy JSON Files** 🔴 HIGH PRIORITY

**Current State:**
```javascript
// mockdata/msw/msw-middleware.js line 14
const mockClusters = require('../api/clusters_mgmt/v1/clusters.json');
```

**Problem:**
- MSW system depends on legacy Python mock server's JSON files
- Creates tight coupling that defeats the purpose of having an independent MSW system
- When legacy system is deleted, MSW breaks

**Impact:**
- Cannot delete legacy system without breaking MSW
- Changes to legacy JSON files affect MSW
- Not truly independent systems

**Solution Needed:**
1. Create `mockdata/msw/fixtures/clusters.js` with MSW's own cluster data
2. Update `msw-middleware.js` to use `require('./fixtures/clusters.js')`
3. MSW becomes fully self-contained and independent
4. Can delete legacy system without affecting MSW

**Status:** Documented, needs implementation

---

## 🎨 Customizing the MSW System

### Adding More Mocked Endpoints

Edit `mockdata/msw/msw-middleware.js`:

```javascript
// Example: Add a new endpoint
if (req.method === 'GET' && apiPath.includes('/api/your/new/endpoint')) {
  console.log('[MSW-MIDDLEWARE] ✅ Mocking: GET /api/your/new/endpoint');
  return res.json({
    kind: 'YourResponseKind',
    items: [],
    page: 1,
    size: 0,
    total: 0,
  });
}
```

### Changing the Mock Cluster

**Current approach (uses legacy JSON):**
```javascript
const mockClusters = require('../api/clusters_mgmt/v1/clusters.json');
const hypershiftCluster = mockClusters.items.find(c => c.display_name === 'hypershift-ready');
```

To use a different cluster, change the `find()` condition or modify the cluster data in `mockdata/api/clusters_mgmt/v1/clusters.json`.

**Future approach (independent fixtures):**
```javascript
const { hypershiftCluster } = require('./fixtures/clusters.js');
```

### Adding Delays (Simulate Slow Network)

```javascript
if (req.method === 'GET' && apiPath.includes('/api/clusters_mgmt/v1/clusters')) {
  // Add a 2-second delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('[MSW-MIDDLEWARE] ✅ Mocking: GET /api/clusters_mgmt/v1/clusters');
  return res.json({ /* ... */ });
}
```

### Simulating Errors

```javascript
if (req.method === 'GET' && apiPath.includes('/api/clusters_mgmt/v1/clusters/error-test')) {
  console.log('[MSW-MIDDLEWARE] ❌ Returning error for test cluster');
  return res.status(404).json({
    kind: 'Error',
    id: '404',
    href: '/api/clusters_mgmt/v1/errors/404',
    code: 'CLUSTERS-MGMT-404',
    reason: 'Cluster not found',
  });
}
```

---

## 🎯 Goals Status

❌ **Goal 1**: Introduce new MSW mock data system (FAILED - built custom middleware instead)
⚠️ **Goal 2**: Totally independent of legacy system (NOT YET - see Technical Debt #2)
⚠️ **Goal 3**: References JSON structure but uses middleware (Wrong approach - should use MSW fixtures)
✅ **Goal 4**: Shows one cluster ("hypershift-ready") in cluster list (Works, but not with MSW)
✅ **Goal 5**: Uses yarn commands (`yarn start:msw`, `yarn stop:msw`)
✅ **Goal 6**: Triggered via `?env=msw-mockdata`
✅ **Goal 7**: Works with real SSO authentication
❌ **Goal 8**: No service worker complexity (Wrong - service workers ARE the MSW approach!)

### Reality Check

**Original Intent:** Replace custom legacy system with modern, standard MSW

**What Happened:** Built another custom system (server-side middleware) instead of real MSW

**Why This is Wrong:**
- MSW **IS** service workers - that's the whole point!
- "No service worker complexity" was the problem, not the goal
- We avoided the challenges instead of solving them
- Result: Another custom, non-standard solution

---

## 🏁 Conclusion

### Current State: Working but Wrong Approach ⚠️

**Yes, it works:**
- ✅ Custom middleware intercepts API calls
- ✅ Shows "hypershift-ready" cluster in cluster list with all details
- ✅ Version and Provider columns display correctly
- ✅ Cluster details page works without errors
- ✅ Uses HTTP cookies for reliable mode detection
- ✅ Handles both GET and POST requests
- ✅ Works with real SSO authentication

**But this is NOT what we set out to build:**
- ❌ **This is NOT MSW** - it's custom Express middleware
- ❌ **This is NOT modern** - it's another custom solution like the legacy system
- ❌ **This defeats the purpose** - we wanted to replace custom with standard
- ❌ **This is NOT maintainable** - future devs expect real MSW, not custom code
- ❌ **This is NOT the industry standard** - no MSW tooling, community, or patterns

### What This Really Is

**Honest assessment:**
```
Legacy Python Server → "MSW" Middleware
(Custom HTTP server) → (Custom Express middleware)
```

**We just replaced one custom solution with another!** This is like saying "let's modernize from Perl to a custom Node.js script" - we changed the language but kept the problem.

### What Needs to Happen Next

**IMMEDIATE PRIORITY:**
1. 🔴 **#1: Refactor to real MSW** using `msw/browser` and service workers
   - Solve the race condition issues properly
   - Initialize MSW before Chrome framework loads
   - Use standard MSW handlers, not custom middleware
   - Create proper fixtures with MSW patterns

2. 🔴 **#2: Remove dependency on legacy JSON files**
   - Create independent MSW fixtures
   - No coupling to legacy system

**How to Use (Current System):**
```bash
# Start the server
yarn start:msw

# Open in browser (login with real SSO)
https://prod.foo.redhat.com:1337/openshift?env=msw-mockdata
```

**⚠️ But remember:** This is a **temporary working solution**, NOT the final goal!

### The Real Learning

**Wrong conclusion (from before):**
> "The solution wasn't to bypass SSO, but to embrace it."

**Correct conclusion:**
> "We hit service worker initialization challenges and took the easy path of custom middleware instead of solving the real MSW problems. This gave us a working system but defeated the modernization goal."

### Path Forward

**This system can serve as a bridge:**
1. ✅ Use it NOW for development/testing (it works!)
2. 🔴 Refactor to real MSW using the current mock data as reference
3. ✅ Delete the middleware approach once real MSW works
4. ✅ Finally achieve the goal: Modern, standard, maintainable MSW implementation

**Important:** The current system documents exactly what needs to be mocked (see `MOCK_FLOWS.md`), which will make the real MSW refactor much easier!

---

**Last Updated:** 2025-10-13  
**Status:** ⚠️ Working but NOT final solution - Needs refactor to real MSW  
**Current Implementation:** Custom Express Middleware (NOT actual MSW)  
**Next Step:** 🔴 #1 Priority - Refactor to proper MSW with service workers
