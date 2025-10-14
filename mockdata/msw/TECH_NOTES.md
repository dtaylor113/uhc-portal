# MSW Mock Server - Technical Notes

**Technical implementation details for developers and AI assistants**

---

## 🏗️ Architecture Overview

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
│ 3. Loads data from JSON: mockdata/api/.../clusters.json     │
│ 4. Returns: { kind: 'ClusterList', items: [...], total: 23 }│
└─────────────────────────────────────────────────────────────┘
  ↓
Returns JSON to browser
```

---

## 📁 File Structure

```
mockdata/msw/
├── README.md                          # User guide
├── TECH_NOTES.md                      # This file (technical details)
├── ROADMAP.md                         # History and future plans
│
└── server/
    └── dev-server-simple.mjs          # ⭐ MAIN SERVER
```

### Key File

**`server/dev-server-simple.mjs`** - The working MSW server
- Pure Node.js HTTP server
- Manual request routing
- Loads data from `mockdata/api/**/*.json`
- Handles all OCM API endpoints

---

## 🔑 Critical Implementation Details

### 1. File-Based Mode Detection

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
    : 'http://[::1]:8010',       // Python server
}]
```

**Why File-Based:**
- FEC's `fec dev` command doesn't pass environment variables to webpack
- File system checks are synchronous and reliable
- No dependency on environment variable passing

### 2. Cookie-Based Mode Detection

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

### 3. Configuration File Location

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

### 4. FEC vs Webpack Configuration

**Key Point:**
- FEC (`fec dev`) uses `fec.config.js` **NOT** `webpack.config.js`
- FEC wraps webpack with its own configuration
- Proxy settings in `webpack.config.js` are **ignored** when using `fec dev`
- Must update `fec.config.js` for proxy changes

---

## 🛠️ Implemented Handlers

### Clusters Management API

```javascript
GET  /api/clusters_mgmt/v1/clusters
POST /api/clusters_mgmt/v1/clusters?method=get
GET  /api/clusters_mgmt/v1/clusters/:clusterId
GET  /api/clusters_mgmt/v1/clusters/:clusterId/upgrade_policies
GET  /api/clusters_mgmt/v1/clusters/:clusterId/machine_pools
GET  /api/clusters_mgmt/v1/clusters/:clusterId/node_pools
GET  /api/clusters_mgmt/v1/clusters/:clusterId/groups
GET  /api/clusters_mgmt/v1/clusters/:clusterId/external_auth_config
GET  /api/clusters_mgmt/v1/cloud_providers
GET  /api/clusters_mgmt/v1/machine_types
```

### Accounts Management API

```javascript
GET  /api/accounts_mgmt/v1/current_account
GET  /api/accounts_mgmt/v1/subscriptions
POST /api/accounts_mgmt/v1/subscriptions?method=get
GET  /api/accounts_mgmt/v1/subscriptions/:subscriptionId
GET  /api/accounts_mgmt/v1/organizations/:orgId
GET  /api/accounts_mgmt/v1/organizations/:orgId/quota_cost
GET  /api/accounts_mgmt/v1/regions
GET  /api/accounts_mgmt/v1/cluster_transfers
```

### Authorization API

```javascript
POST /api/authorizations/v1/self_access_review
POST /api/authorizations/v1/self_resource_review
POST /api/authorizations/v1/self_feature_review
```

### Access Transparency API

```javascript
GET /api/access_transparency/v1/access_protection
GET /api/access_transparency/v1/access_requests
```

---

## 🧪 Testing & Debugging

### Debug Strategies

#### 1. Real-Time Log Monitoring

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

#### 2. Inspect Mock Data

**View cluster data:**
```bash
cat mockdata/api/clusters_mgmt/v1/clusters.json | jq '.items[] | select(.display_name == "hypershift-ready")'
```

**Check specific fields:**
```bash
cat mockdata/api/clusters_mgmt/v1/clusters.json | jq '.items[0] | keys | sort'
```

**Count items:**
```bash
cat mockdata/api/clusters_mgmt/v1/clusters.json | jq '.items | length'
```

#### 3. Test API Directly

**Test clusters endpoint:**
```bash
curl -k 'https://prod.foo.redhat.com:1337/mockdata/api/clusters_mgmt/v1/clusters' | jq '.total'
```

**Test individual cluster:**
```bash
curl -k 'https://prod.foo.redhat.com:1337/mockdata/api/clusters_mgmt/v1/clusters/CLUSTER_ID' | jq '.name'
```

**Test subscriptions:**
```bash
curl -k 'https://prod.foo.redhat.com:1337/mockdata/api/accounts_mgmt/v1/subscriptions' | jq '.items | length'
```

#### 4. Check Server Status

```bash
# Ports in use
lsof -ti:9001 && echo "MSW running" || echo "MSW not running"
lsof -ti:1337 && echo "Webpack running" || echo "Webpack not running"

# Process list
ps aux | grep -E "msw:server|webpack" | grep -v grep

# .msw-mode file
ls -la .msw-mode && echo "MSW mode enabled" || echo "MSW mode disabled"
```

### Common Debug Patterns

**Pattern 1: Missing Handler**
```bash
# Symptom in logs:
[MSW Server] ❌ No handler for: /api/some/endpoint

# Solution:
1. Note the endpoint
2. Add handler to dev-server-simple.mjs
3. Restart: yarn stop:msw && yarn start:msw
```

**Pattern 2: Wrong Data Structure**
```bash
# Symptom: Browser console shows undefined errors

# Debug:
curl -k 'https://prod.foo.redhat.com:1337/mockdata/api/endpoint' | jq '.'

# Fix: Update handler to return correct structure
```

**Pattern 3: Retry Loop**
```bash
# Symptom: Same request repeating in logs

# Cause: Frontend retrying failed request
# Fix: Add missing handler
```

---

## 🔄 Data Flow: Cluster List Example

### Step-by-Step

1. **User visits:** `https://prod.foo.redhat.com:1337/openshift?env=msw-mockdata`

2. **Frontend detects `?env=msw-mockdata`:**
   - Sets `localStorage.ocmEnvironment = 'msw-mockdata'`
   - Sets cookie: `ocmOverridenEnvironment=msw-mockdata`
   - Loads config: `src/config/msw-mockdata.json`

3. **App makes API call:**
   ```javascript
   fetch('https://prod.foo.redhat.com:1337/mockdata/api/clusters_mgmt/v1/clusters')
   ```

4. **Webpack intercepts:**
   - Checks for `.msw-mode` file
   - File exists → proxy to `http://localhost:9001`
   - Transforms: `/mockdata/api/...` → `/api/...`

5. **MSW server receives:**
   ```
   GET /api/clusters_mgmt/v1/clusters
   ```

6. **Handler matches and returns:**
   ```json
   {
     "kind": "ClusterList",
     "items": [ /* 23 clusters */ ],
     "total": 23
   }
   ```

7. **Browser renders:** Cluster list with 23 clusters

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

Configures webpack proxy routing.

### 4. Package.json Scripts

**File:** `package.json`

```json
{
  "msw:server": "node mockdata/msw/server/dev-server-simple.mjs",
  "start:msw": "yarn stop:msw && touch .msw-mode && concurrently --kill-others --names=MSW,WEBPACK 'yarn msw:server' 'HOT=true yarn dev:fec --clouddotEnv prod'",
  "stop:msw": "rm -f .msw-mode; pkill -9 -f 'msw:server'; ... echo 'All MSW processes killed'"
}
```

---

## 📊 Current Implementation Stats

### Performance

- **Startup time:** ~2 minutes (MSW + webpack cold start)
- **Request latency:** < 100ms (including proxy)
- **Server response:** < 50ms

### Mock Data

- **23 clusters** from `mockdata/api/clusters_mgmt/v1/clusters.json`
- **23 subscriptions** generated dynamically per cluster
- **8 cloud providers**
- **197 machine types**
- **1 organization** with quota
- **1 current account**

### Data Source

All mock data currently comes from: `mockdata/api/**/*.json`

---

## 🐛 AI Debugging Guide

**For AI assistants working on MSW issues:**

### Start Here

1. **Check what's running:**
   ```bash
   lsof -ti:9001 && echo "MSW ✅" || echo "MSW ❌"
   lsof -ti:1337 && echo "Webpack ✅" || echo "Webpack ❌"
   ```

2. **Check mode detection:**
   ```bash
   ls -la .msw-mode && echo "MSW mode ✅" || echo "Normal mode"
   ```

3. **View recent logs:**
   ```bash
   tail -100 $(ls -t /tmp/msw*.log | head -1) | grep -E "(MSW|Error|❌)"
   ```

### Common Investigation Commands

**Find missing handlers:**
```bash
tail -200 $(ls -t /tmp/msw*.log | head -1) | grep "❌ No handler" | sort | uniq
```

**Check proxy routing:**
```bash
tail -100 $(ls -t /tmp/msw*.log | head -1) | grep "FEC PROXY"
```

**Inspect endpoint:**
```bash
curl -k 'https://prod.foo.redhat.com:1337/mockdata/api/endpoint' | jq '.'
```

### Decision Tree

```
Is page loading?
├─ No → Check if servers are running
│       ├─ Not running → yarn start:msw
│       └─ Running → Check logs for errors
│
└─ Yes, but errors/missing data
    ├─ Check browser console for API errors
    ├─ Check terminal for "❌ No handler"
    ├─ Add missing handler to dev-server-simple.mjs
    └─ Restart: yarn stop:msw && yarn start:msw
```

---

## 📖 Related Documentation

- **`README.md`** - User guide and quick start
- **`ROADMAP.md`** - Project history and future plans

---

**Last Updated:** October 15, 2025  
**Status:** Production Ready
