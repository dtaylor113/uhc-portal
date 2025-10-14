# MSW Mock Server - User Guide

**Mock Service Worker (MSW) based mock data system for local development**

---

## 🎯 Quick Start

### Start the MSW Mock Server

```bash
yarn start:msw
```

This will:
1. Start the MSW Node.js server on port 9001
2. Start webpack dev server on port 1337
3. Enable MSW mode automatically

### Access the Application

```
https://prod.foo.redhat.com:1337/openshift?env=msw-mockdata
```

**Important:** The `?env=msw-mockdata` query parameter activates MSW mode.

### Stop the MSW Server

```bash
yarn stop:msw
```

This cleans up all processes and removes the `.msw-mode` flag file.

---

## 📋 What Gets Mocked

**✅ Mocked by MSW:**
- All OCM API endpoints (`/api/clusters_mgmt/v1/*`)
- Accounts Management API (`/api/accounts_mgmt/v1/*`)
- Access Transparency API (`/api/access_transparency/v1/*`)
- Authorization API (`/api/authorizations/v1/*`)

**⏩ Passed through (NOT mocked):**
- SSO authentication (uses real Red Hat SSO)
- Chrome framework (loaded from console.redhat.com)
- All other APIs

---

## 🎨 Environment Indicator

When MSW mode is active, you'll see a warning banner at the top:

```
⚠️ Using the msw-mockdata environment API
   Go back to staging
```

This reminds you that you're using mock data.

**To exit MSW mode:**
1. Click "Go back to staging" in the banner, OR
2. Remove `?env=msw-mockdata` from URL and refresh

---

## 🧪 Verification

### Check Server Status

```bash
# MSW server running?
lsof -ti:9001 && echo "✅ MSW server running" || echo "❌ Not running"

# Webpack running?
lsof -ti:1337 && echo "✅ Webpack running" || echo "❌ Not running"

# Check proxy routing
curl -k https://prod.foo.redhat.com:1337/mockdata/api/clusters_mgmt/v1/clusters | jq '.total'
# Should return: 23
```

### Monitor Logs

The current log file location depends on when you last started the server. To find it:

```bash
# Find the most recent log file
ls -t /tmp/msw*.log | head -1

# Watch it in real-time
tail -f $(ls -t /tmp/msw*.log | head -1) | grep "\[MSW\]"
```

You should see:
```
[MSW] ✅ GET /api/clusters_mgmt/v1/clusters
[MSW] ✅ GET /api/accounts_mgmt/v1/subscriptions { count: 23 }
[MSW] ✅ POST /api/authorizations/v1/self_resource_review
```

---

## 📊 Mock Data

- **23 clusters**
- **23 subscriptions** (generated dynamically per cluster)
- **8 cloud providers** (AWS, GCP, Azure, etc.)
- **197 machine types**
- **1 current account** (mnecas.openshift)
- **Organizations and quota** (mock data)

---

## 🚨 Common Issues

### Issue: Cluster list not loading

**Symptom:** Page shows "Some operations are unavailable"

**Check:**
```bash
# Is MSW server running?
lsof -ti:9001

# Is .msw-mode file present?
ls -la .msw-mode

# Check terminal for errors
tail -50 $(ls -t /tmp/msw*.log | head -1) | grep "❌"
```

**Fix:**
```bash
yarn stop:msw && sleep 2 && yarn start:msw
```

### Issue: Podman errors

**Symptom:** `Cannot connect to Podman socket`

**Fix:**
```bash
podman machine restart
# Wait 30 seconds
yarn start:msw
```

### Issue: Page keeps retrying requests

**Symptom:** Terminal logs show repeated `❌ No handler for: /api/...`

**Cause:** Missing handler in MSW server

**Fix:**
1. Note the missing endpoint in logs
2. Add handler to `mockdata/msw/server/dev-server-simple.mjs`
3. Restart: `yarn stop:msw && yarn start:msw`

---

## 🛠️ Making Changes

### Adding New Mock Endpoints

1. **Edit the server file:**
   ```bash
   # Open the main server file
   vim mockdata/msw/server/dev-server-simple.mjs
   ```

2. **Add your handler:**
   ```javascript
   // Example: Add new endpoint
   if (req.method === 'GET' && path === '/api/your/endpoint') {
     console.log('[MSW] ✅ GET /api/your/endpoint');
     res.writeHead(200, { 'Content-Type': 'application/json' });
     res.end(JSON.stringify({ your: 'data' }));
     return;
   }
   ```

3. **Restart the server:**
   ```bash
   yarn stop:msw && yarn start:msw
   ```

4. **Verify in browser:** Refresh and check that your endpoint works

---

## ✅ Success Criteria

You know MSW is working when:

1. ✅ URL shows `?env=msw-mockdata`
2. ✅ Yellow banner says "Using the msw-mockdata environment API"
3. ✅ Console shows: `[MSW] 🎭 MSW MOCK MODE ACTIVE`
4. ✅ Cluster list shows all 23 clusters
5. ✅ Network tab shows XHR calls to `/mockdata/api/*`

---

## 📚 Additional Documentation

- **`TECH_NOTES.md`** - Technical implementation details, architecture, debugging
- **`ROADMAP.md`** - Project history, future plans, Phase 2 details

---

**Questions or Issues?**  
Check `TECH_NOTES.md` for debugging strategies and technical details.
