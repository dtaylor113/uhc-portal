# MSW Mock Server - Roadmap

**Project history, current status, and future plans**

---

## 📜 Project History

### 🎉 What We Accomplished

This project went through multiple starts and stops before achieving success:

1. **Real MSW-based mock server** on port 9001 (Node.js HTTP server)
2. **Mocks all OCM APIs** (clusters, subscriptions, accounts, auth)
3. **Integrates with real SSO** (no authentication mocking needed)
4. **Uses real Chrome framework** (only API layer is mocked)
5. **Easy to start/stop** (`yarn start:msw` / `yarn stop:msw`)
6. **Stable and reliable** (no retry loops, no errors)

### ✅ Key Technical Achievements

1. **File-Based Mode Detection**
   - Solved FEC environment variable issue with `.msw-mode` file
   - Simple and reliable across restarts

2. **Cookie-Based Frontend/Backend Coordination**
   - Frontend sets HTTP cookie `ocmOverridenEnvironment`
   - Backend can detect MSW mode
   - Proper cleanup on mode exit

3. **FEC Configuration Discovery**
   - Found that `fec.config.js` overrides `webpack.config.js`
   - Updated correct proxy configuration
   - Proxy routes to MSW server when `.msw-mode` exists

4. **Comprehensive API Coverage**
   - 23 clusters with full metadata
   - Dynamic subscription generation
   - Organizations and quota
   - Cloud providers and machine types
   - Authorization and access transparency
   - All cluster sub-resources

5. **No Maintenance Banner**
   - Automatically overrides `configuration_mode: 'read_only'`
   - Clean user experience

### 💡 Key Learnings

#### What Worked

1. **Pragmatic approach**
   - Started with custom Express middleware
   - Evolved to Node.js HTTP server
   - Ready for TypeScript fixtures

2. **File-based detection**
   - Solved FEC environment variable issue elegantly
   - Simple and reliable

3. **Cookie + localStorage combination**
   - Solved client/server coordination
   - Both frontend and backend can detect mode

4. **Real-time debugging tools**
   - `tail -f` + `grep` + `jq` were invaluable
   - Log monitoring caught issues early

#### What Didn't Work

1. **Browser-based MSW with service workers**
   - Module Federation complications
   - Chrome framework loading order issues
   - Abandoned this approach

2. **Environment variables with FEC**
   - `fec dev` doesn't pass env vars to webpack
   - File-based detection was the solution

3. **Webpack config proxy assumptions**
   - FEC uses `fec.config.js`, not `webpack.config.js`
   - Took time to discover this

#### What We'd Do Differently

1. **Start with Node.js server from day 1**
   - Skip browser service worker attempts
   - Node.js server is simpler for API mocking

2. **Check FEC configuration first**
   - Don't assume webpack config is used
   - FEC wraps webpack with its own config

3. **Use TypeScript from the start**
   - Would have saved debugging time
   - Planned for Phase 2

### 🙏 Credits

**Martin Maroši** (Chrome Team Support)
- Suggested MSW Node.js server pattern
- Reference: https://github.com/RedHatInsights/frontend-starter-app/pull/688

---

## 📊 Current Status

### ✅ Phase 1 Complete (October 2025)
- MSW Node.js server running on port 9001
- Full integration with FEC webpack configuration
- File-based mode detection (`.msw-mode`)
- Cookie-based client/server coordination
- All major API endpoints implemented
- Working cluster list and details pages

### ✅ Phase 2 Complete (October 17, 2025)

**Achievement:** Replaced all legacy JSON dependencies with type-safe TypeScript fixtures!

#### What Was Built

1. **TypeScript Fixture System**
   ```
   mockdata/msw/fixtures/
   ├── types.ts                    # Type definitions from OpenAPI
   ├── clusters.ts                 # hypershift-ready cluster
   ├── subscriptions.ts            # Subscription fixtures
   ├── accounts.ts                 # Account/organization data
   ├── providers.ts                # Cloud providers & machine types
   ├── authorization.ts            # Auth response fixtures
   ├── access-transparency.ts      # Access transparency data
   ├── index.ts                    # Main export
   ├── tsconfig.json              # TypeScript configuration
   ├── package.json               # ES module marker
   └── dist/                      # Compiled JavaScript
   ```

2. **Build System Integration**
   - `yarn msw:fixtures:build` - Compile TypeScript fixtures
   - `yarn msw:fixtures:watch` - Watch mode for development
   - `yarn start:msw` - Automatically builds before starting server

3. **Type Safety Benefits**
   - IDE auto-complete for all mock data fields
   - Compile-time type checking against OpenAPI schemas
   - Factory functions (`createCluster()`) for easy customization
   - Self-documenting code with TypeScript types

#### Current Mock Data

- **Clusters:** Recorded from real OCM clusters (auto-discovered)
  - Currently: 1 recorded cluster (OSD on GCP, single-zone, private)
  - Easy to add more: `./mockdata/msw/scripts/record-cluster.sh <subscription-id>`
- **Subscriptions:** Auto-recorded alongside clusters
- **1 organization:** Mock Organization with capabilities
- **1 current account:** mnecas.openshift
- **8 cloud providers:** AWS, GCP, Azure, etc. (from legacy JSON)
- **197 machine types:** All platforms (from legacy JSON)

#### What's Working Now

| Component | Status | Details |
|-----------|--------|---------|
| MSW Server | ✅ Running | Port 9001, Node.js HTTP server |
| TypeScript Fixtures | ✅ Active | No dependency on legacy JSON |
| Type Safety | ✅ Working | OpenAPI types enforced at compile-time |
| Build System | ✅ Integrated | Automatic compilation |
| Cluster List | ✅ Working | Shows 1 comprehensive cluster |
| Cluster Details | ✅ Working | All sub-resources loading |
| Factory Functions | ✅ Available | Easy to create custom mock data |
| SSO Authentication | ✅ Real | Uses actual Red Hat SSO |
| Chrome Framework | ✅ Real | Loaded from console.redhat.com |

#### Technical Debt Resolved

✅ ~~Still using legacy JSON files~~ → **RESOLVED!** Now using TypeScript fixtures  
✅ ~~No TypeScript type checking~~ → **RESOLVED!** Full type safety with OpenAPI types  
⚠️ Manual request routing → Still using if/else, consider routing library in future

### ✅ Phase 2.5 Complete (October 18, 2025)

**Achievement:** Auto-discovery system, recording workflow, and production-ready cluster details!

#### What Was Built

1. **Auto-Discovery System**
   - Individual fixtures stored in `fixtures/clusters/` and `fixtures/subscriptions/`
   - `generate-fixture-indexes.mjs` automatically scans directories and creates index files
   - No manual imports needed - just add/remove fixture files!
   - `clusters.ts` and `subscriptions.ts` automatically import from generated indexes

2. **Recording Workflow**
   - `record-cluster.sh` - Fetch real cluster data from OCM API and generate TypeScript fixtures
   - `rename-cluster.sh` - Rename recorded fixtures (updates both cluster and subscription)
   - `delete-cluster.sh` - Delete recorded fixtures
   - `ROSA_CLUSTER_FLAVORS.md` - Documentation for creating various cluster types
   - `recorded/` directory for local staging (git-ignored)

3. **Cluster Details Page - Fully Working!**
   - Fixed missing API handlers for cluster sub-resources:
     - `/machine_pools` - Critical for details page loading
     - `/node_pools` - Node pool management
     - `/identity_providers` - IDP configuration
     - `/ingresses` - Ingress configuration
     - `/gate_agreements` - Version gate agreements
     - `/limited_support_reasons` - Limited support status
     - `/control_plane/upgrade_policies` - Control plane upgrades
     - `/version_gates` - Version gate status
     - `/inflight_checks` - Pre-flight validation
     - `/notification_contacts` - Subscription notification contacts
   - Fixed organization data structure (nested `organization.id` in account)
   - Cluster details now loads instantly, no more infinite spinner!

4. **Clean Logging System**
   - Removed excessive debug emojis and box borders
   - Clean, production-ready logging
   - Easy to read terminal output
   - Unhandled requests clearly identified

#### Key Technical Wins

1. **Path Extraction Fix**
   - Cluster ID extraction now handles sub-resources correctly
   - Uses `path.split('/')` instead of strict route matching
   - Single handler for all cluster sub-resources

2. **Subscription Routing Fix**
   - Prioritizes sub-resources before ID matching
   - `/notification_contacts` now routes correctly
   - Proper handler ordering prevents false matches

3. **Organization Data Fix**
   - `mockCurrentAccount` now has nested `organization` object
   - Matches expected structure: `organization.id`, not `organization_id`
   - `getOrganizationAndQuota()` now triggers correctly

#### Impact

- **Before:** Only 1 hand-crafted cluster, details page spinning indefinitely
- **After:** Auto-discovered real clusters, details page loads instantly!
- **Developer Experience:** Record real clusters in seconds, zero manual imports

---

## 🎯 Ultimate Goal

**Create a well-documented, type-checked, and easy-to-use MSW mocking system with the ability to easily add, edit, and delete mock data.**

### Success Criteria ✅ ACHIEVED!

Developers can now:

1. ✅ **Add new mock data** by editing TypeScript files with full IDE support
2. ✅ **Get compile-time errors** if mock data doesn't match API types
3. ✅ **Use auto-complete** to discover available fields
4. ✅ **Refactor safely** - TypeScript catches all usages when types change
5. ✅ **Understand the system** through clear documentation
6. ✅ **Debug easily** with type-safe error messages
7. ✅ **Run tests** with the same mock data used in development

---

## 🚀 Phase 2: TypeScript Fixtures with Type Safety ✅ COMPLETE

**Goal:** Replace legacy JSON dependencies with independent TypeScript fixtures using OpenAPI-generated types.

**Status:** ✅ Completed October 17, 2025

### Why Phase 2?

**Current Problem:**
```javascript
// No type checking ❌
const cluster = {
  display_nam: 'Test',  // Typo! No error
  version: 123,          // Wrong type! No error
};
```

**Phase 2 Solution:**
```typescript
// Type-safe ✅
import type { components } from '../../../src/types/clusters_mgmt.v1';
type Cluster = components['schemas']['Cluster'];

const cluster: Cluster = {
  display_nam: 'Test',  // ❌ TypeScript error!
  version: 123,          // ❌ TypeScript error!
};
```

### Phase 2 Architecture

```
mockdata/msw/
├── fixtures/                       # NEW: TypeScript fixtures
│   ├── clusters.ts                 # Type-safe cluster factories
│   ├── subscriptions.ts            # Type-safe subscription factories
│   ├── accounts.ts                 # Type-safe account fixtures
│   ├── providers.ts                # Type-safe provider data
│   ├── index.ts                    # Export all fixtures
│   ├── tsconfig.json               # TypeScript config
│   └── dist/                       # Compiled output (.js files)
│       ├── clusters.js
│       ├── subscriptions.js
│       └── ...
│
├── server/
│   └── dev-server-simple.mjs       # UPDATED: Import from fixtures/dist
│
└── [docs...]
```

### Phase 2.1: Create TypeScript Fixtures

**File:** `mockdata/msw/fixtures/clusters.ts`

```typescript
import type { components } from '../../../src/types/clusters_mgmt.v1';

type Cluster = components['schemas']['Cluster'];
type ClusterList = components['schemas']['ClusterList'];

/**
 * Create a mock cluster with type safety
 */
export function createMockCluster(overrides?: Partial<Cluster>): Cluster {
  const defaults: Cluster = {
    kind: 'Cluster',
    id: `cluster-${Math.random().toString(36).substring(2, 11)}`,
    href: '/api/clusters_mgmt/v1/clusters/...',
    name: 'mock-cluster',
    display_name: 'Mock Cluster',
    state: 'ready',
    status: {
      state: 'ready',
      configuration_mode: 'read_write',
    },
    openshift_version: '4.15.0',
    cloud_provider: {
      kind: 'CloudProviderLink',
      id: 'aws',
      name: 'aws',
    },
    region: {
      kind: 'CloudRegionLink',
      id: 'us-east-1',
    },
    multi_az: true,
    managed: true,
    creation_timestamp: '2024-01-15T00:00:00Z',
    // ... all required fields with correct types
  };
  
  return { ...defaults, ...overrides };
}

// Pre-defined realistic clusters
export const mockClusters: Cluster[] = [
  createMockCluster({
    id: 'cluster-001',
    name: 'production-cluster',
    display_name: 'Production Cluster',
  }),
  createMockCluster({
    id: 'hypershift-001',
    name: 'hypershift-ready',
    display_name: 'hypershift-ready',
    hypershift: { enabled: true },
  }),
  // ... 21 more clusters
];

// Type-safe cluster list
export const mockClusterList: ClusterList = {
  kind: 'ClusterList',
  items: mockClusters,
  page: 1,
  size: mockClusters.length,
  total: mockClusters.length,
};
```

**Benefits:**
- ✅ IDE auto-complete for all fields
- ✅ Compile-time type checking
- ✅ Can't use non-existent fields
- ✅ Can't use wrong types
- ✅ Easy to create variations

### Phase 2.2: TypeScript Build System

**File:** `mockdata/msw/fixtures/tsconfig.json`

```json
{
  "extends": "../../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./",
    "declaration": true,
    "declarationMap": true,
    "module": "ES2022",
    "moduleResolution": "node"
  },
  "include": ["./**/*.ts"],
  "exclude": ["./dist"]
}
```

**File:** `package.json` (add scripts)

```json
{
  "scripts": {
    "msw:fixtures:build": "tsc -p mockdata/msw/fixtures/tsconfig.json",
    "msw:fixtures:watch": "tsc -p mockdata/msw/fixtures/tsconfig.json --watch",
    "msw:server": "yarn msw:fixtures:build && node mockdata/msw/server/dev-server-simple.mjs"
  }
}
```

### Phase 2.3: Update MSW Server

**BEFORE:**
```javascript
// Depends on legacy JSON
const clustersData = JSON.parse(
  readFileSync(join(__dirname, '../../api/clusters_mgmt/v1/clusters.json'), 'utf-8')
);
```

**AFTER:**
```javascript
// Independent TypeScript fixtures
import { mockClusterList } from '../fixtures/dist/clusters.js';
import { mockSubscriptions } from '../fixtures/dist/subscriptions.js';

const clustersData = mockClusterList;
const subscriptionsData = mockSubscriptions;
```

### Phase 2.4: Testing Integration

```typescript
// tests/fixtures/clusterFixtures.test.ts
import { createMockCluster, mockClusters } from '../../mockdata/msw/fixtures/clusters';

describe('Cluster Fixtures', () => {
  it('creates valid cluster', () => {
    const cluster = createMockCluster();
    expect(cluster.kind).toBe('Cluster');
  });
});
```

### Phase 2 Timeline

- **Effort:** 2-3 days for experienced developer
- **Priority:** HIGH (removes major technical debt)

**Breakdown:**
- Day 1: Create fixtures for clusters and subscriptions
- Day 2: Create fixtures for accounts, providers, auth
- Day 3: Update server, test, document

---

## 🔮 Phase 3: Advanced Features (Future)

### 3.1: Scenario-Based Testing

```typescript
export const scenarios = {
  happyPath: {
    clusters: [createMockCluster({ state: 'ready' })],
  },
  installing: {
    clusters: [createMockCluster({ state: 'installing' })],
  },
  errors: {
    clusters: [createMockCluster({ 
      state: 'error',
      status: { error: 'Installation failed' }
    })],
  },
};
```

### 3.2: Faker Integration

```typescript
import { faker } from '@faker-js/faker';

export function createRandomCluster(): Cluster {
  return createMockCluster({
    id: faker.string.uuid(),
    name: faker.word.slug(),
    display_name: faker.company.name(),
  });
}
```

### 3.3: Stateful Mocking

```typescript
let clusters = [...mockClusters];

export function handleCreateCluster(req) {
  const newCluster = createMockCluster(req.body);
  clusters.push(newCluster);
  return newCluster;
}
```

**Note on Recording:** Phase 2 delivered a **targeted recording solution** via `./mockdata/msw/scripts/record-cluster.sh`, which is better suited for QE workflows than automatic session recording. See `mockdata/msw/scripts/README.md` and `mockdata/msw/scripts/ROSA_CLUSTER_FLAVORS.md` for the complete workflow.

### 3.4: OpenAPI Validation

```typescript
import { validateResponse } from 'openapi-validator';

validateResponse(cluster, 'GET /api/clusters_mgmt/v1/clusters/{id}');
```

---

## 📅 Estimated Timeline

### Phase 2: TypeScript Fixtures
- **Effort:** 2-3 days
- **Priority:** HIGH
- **Status:** Ready to start

### Phase 3: Advanced Features
- **Effort:** 1-2 weeks (all features)
- **Priority:** MEDIUM
- **Status:** Depends on Phase 2

---

## 🎓 Learning Resources

### Official Docs
- MSW: https://mswjs.io/docs/getting-started
- OpenAPI TypeScript: https://www.npmjs.com/package/openapi-typescript

### Reference Implementations
- Martin's MSW setup: https://github.com/RedHatInsights/frontend-starter-app/pull/688
- Our working implementation: `mockdata/msw/server/dev-server-simple.mjs`

---

## 💡 Contributing to Phase 2

### Getting Started

1. **Read the docs:**
   - `README.md` - How to use MSW
   - `TECH_NOTES.md` - Current implementation
   - This file - The plan

2. **Set up environment:**
   ```bash
   yarn start:msw
   # Verify in browser
   ```

3. **Create first fixture:**
   ```bash
   mkdir -p mockdata/msw/fixtures
   touch mockdata/msw/fixtures/clusters.ts
   # Copy Phase 2.1 example code
   ```

4. **Test compilation:**
   ```bash
   yarn tsc --noEmit mockdata/msw/fixtures/clusters.ts
   ```

### Pull Request Checklist

- [ ] TypeScript fixtures compile without errors
- [ ] All fixtures use OpenAPI types
- [ ] MSW server uses compiled fixtures
- [ ] Browser testing passes
- [ ] No dependencies on legacy JSON
- [ ] Documentation updated
- [ ] Tests added (if applicable)

---

## 📞 Getting Help

**Have questions?**
- Read `TECH_NOTES.md` for technical details
- Check `README.md` for usage
- Review existing code in `mockdata/msw/server/`

**Want to contribute?**
- Start with Phase 2.1 (TypeScript fixtures)
- Follow examples in this document
- Test thoroughly

---

**Last Updated:** October 15, 2025  
**Current Phase:** Phase 1 Complete ✅  
**Next Phase:** Phase 2 (TypeScript Fixtures) - Ready to Start! 🚀  
**End Goal:** Well-documented, type-checked, easy-to-use MSW mocking system 🎯
