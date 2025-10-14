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

## 📊 Current Status (Phase 1 Complete)

### What's Working

| Component | Status | Details |
|-----------|--------|---------|
| MSW Server | ✅ Running | Port 9001, Node.js HTTP server |
| Webpack Dev Server | ✅ Running | Port 1337, FEC-based |
| Proxy Routing | ✅ Working | Routes `/mockdata` to MSW server |
| Mode Detection | ✅ Working | File-based (`.msw-mode`) |
| Cluster List | ✅ Working | Shows all 23 clusters |
| Cluster Details | ✅ Working | All sub-resources loading |
| SSO Authentication | ✅ Real | Uses actual Red Hat SSO |
| Chrome Framework | ✅ Real | Loaded from console.redhat.com |

### Mock Data Stats

- **23 clusters** from `mockdata/api/clusters_mgmt/v1/clusters.json`
- **23 subscriptions** (generated dynamically per cluster)
- **8 cloud providers** (AWS, GCP, Azure, etc.)
- **197 machine types**
- **1 organization** with quota
- **1 current account** (mnecas.openshift)

### Technical Debt

1. **Still using legacy JSON files** ⚠️ HIGH PRIORITY
   - Dependency on `mockdata/api/**/*.json`
   - No type safety
   - **Solution:** Phase 2 (TypeScript fixtures)

2. **No TypeScript type checking** ⚠️
   - Server is JavaScript (`.mjs`)
   - Mock data can have wrong types
   - **Solution:** Phase 2

3. **Manual request routing** ⚠️
   - Lots of if/else statements
   - Verbose code
   - **Solution:** Consider routing library or Phase 2 refactor

---

## 🎯 Ultimate Goal

**Create a well-documented, type-checked, and easy-to-use MSW mocking system with the ability to easily add, edit, and delete mock data.**

### Success Criteria

When Phase 2 is complete, developers will be able to:

1. ✅ **Add new mock data** by editing TypeScript files with full IDE support
2. ✅ **Get compile-time errors** if mock data doesn't match API types
3. ✅ **Use auto-complete** to discover available fields
4. ✅ **Refactor safely** - TypeScript catches all usages when types change
5. ✅ **Understand the system** through clear documentation
6. ✅ **Debug easily** with type-safe error messages
7. ✅ **Run tests** with the same mock data used in development

---

## 🚀 Phase 2: TypeScript Fixtures with Type Safety

**Goal:** Replace legacy JSON dependencies with independent TypeScript fixtures using OpenAPI-generated types.

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

### 3.4: Request Recording

```bash
# Record real API responses to create fixtures
yarn msw:record
```

### 3.5: OpenAPI Validation

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
