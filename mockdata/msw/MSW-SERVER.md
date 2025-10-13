# MSW Mock Server - User Guide

> **Note:** This guide shows you **how to use** the MSW server. For architecture, technical details, and customization, see `MSW-IMPLEMENTATION-SUMMARY.md`.

## 🚀 Quick Start

### 1. Start the Server
```bash
yarn start:msw
```

Wait for compilation (about 30 seconds). You'll see:
```
webpack 5.99.9 compiled successfully
```

### 2. Stop the Server
```bash
yarn stop:msw
```

Kills all processes and frees ports 1337 and 8010.

### 3. Access the Application

**Login with Real SSO:**
```
https://prod.foo.redhat.com:1337/openshift?env=msw-mockdata
```

1. You'll be redirected to Red Hat SSO login
2. Enter your Red Hat credentials (normal login)
3. After authentication, you'll see the cluster list with **one cluster: "hypershift-ready"**

---

## 🎯 What Gets Mocked

The MSW server uses **real authentication** and only mocks OCM API endpoints (same approach as the legacy Python mock server).

### ✅ Real (Not Mocked)
- Red Hat SSO authentication
- Chrome framework from console.redhat.com
- All non-API requests

### 🎭 Mocked (API Endpoints Only)

**Clusters**
- `GET/POST /api/clusters_mgmt/v1/clusters` - Returns "hypershift-ready" cluster
- `GET /api/clusters_mgmt/v1/clusters/:id` - Individual cluster details
- `GET /api/clusters_mgmt/v1/clusters/:id/upgrade_policies` - Empty list
- `GET /api/clusters_mgmt/v1/clusters/:id/machine_pools` - Empty list
- `GET /api/clusters_mgmt/v1/clusters/:id/node_pools` - Empty list
- `GET /api/clusters_mgmt/v1/clusters/:id/groups` - Empty list
- `GET /api/clusters_mgmt/v1/cloud_providers` - Empty list
- `GET /api/clusters_mgmt/v1/machine_types` - Empty list

**Accounts**
- `GET /api/accounts_mgmt/v1/current_account` - Mock user (dtaylor-ocm)
- `GET /api/accounts_mgmt/v1/organizations/*` - Mock organization
- `GET /api/accounts_mgmt/v1/subscriptions` - Returns subscription for hypershift-ready
- `GET /api/accounts_mgmt/v1/subscriptions/:id` - Individual subscription
- `GET /api/accounts_mgmt/v1/cluster_transfers` - Empty list
- `GET /api/accounts_mgmt/v1/regions` - Empty list

**Authorization**
- `POST /api/authorizations/v1/self_access_review` - Always allowed
- `POST /api/authorizations/v1/self_feature_review` - Always enabled
- `POST /api/authorizations/v1/self_resource_review` - Always allowed
- `POST /api/authorizations/v1/self_terms_review` - No terms required

---

## 🔄 Switching Environments

| Environment | URL | Authentication |
|-------------|-----|----------------|
| **MSW Mock** | `?env=msw-mockdata` | Real SSO → Mock APIs |
| **Legacy Mock** | `?env=mockdata` | Real SSO → Python server |
| **Real Production** | No `?env` param | Real SSO → Real APIs |

The environment choice is saved in localStorage (`ocmOverridenEnvironment`) and persists across page reloads.

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
yarn stop:msw
```

This will kill all processes on ports 1337 and 8010.

### Cluster List Shows "N/A" for Version/Provider

This was a known issue that's been fixed. The middleware now handles both GET and POST requests for the clusters endpoint.

**Test the fix:**
```bash
curl -k -H "Cookie: ocmOverridenEnvironment=msw-mockdata" \
  https://localhost:1337/mockdata/api/clusters_mgmt/v1/clusters
```

You should see the cluster with `openshift_version` and `cloud_provider` fields.

### "Access Denied" or SSO Redirect Loop

1. **Clear browser cache** (especially localStorage and cookies)
2. **Check the yellow banner** at the top of the page - it should say "Using the msw-mockdata environment API"
3. **Verify the cookie** in DevTools → Application → Cookies → look for `ocmOverridenEnvironment=msw-mockdata`

### Middleware Not Activating

Check if the middleware is running:

**Terminal logs:**
```bash
tail -f /tmp/msw-debug.log | grep "MSW-MIDDLEWARE"
```

You should see:
```
[MSW-MIDDLEWARE] 📥 GET /mockdata/api/...
[MSW-MIDDLEWARE] ✅ Mocking: GET /api/...
```

**Test directly:**
```bash
curl -k -H "Cookie: ocmOverridenEnvironment=msw-mockdata" \
  https://localhost:1337/mockdata/api/clusters_mgmt/v1/clusters
```

### Expected Console Warnings (Can Ignore)

These warnings are **normal** and can be safely ignored:
- `[alloy] [DataCollector] Network request failed` - Adobe analytics
- `[rh-footer-links] doesn't have a valid header` - Footer component
- Cookie warnings for `__Secure-YEC` - Intercom messenger
- `Unsatisfied version` - Module Federation version mismatches

---

## 🧪 Testing

### Test Individual API Endpoints

```bash
# Set cookie to activate MSW mode
COOKIE="Cookie: ocmOverridenEnvironment=msw-mockdata"

# Test cluster list
curl -k -H "$COOKIE" https://localhost:1337/mockdata/api/clusters_mgmt/v1/clusters

# Test individual cluster
curl -k -H "$COOKIE" https://localhost:1337/mockdata/api/clusters_mgmt/v1/clusters/21696acc0dbkvh0mh4lranlmvvqb11lg

# Test current account
curl -k -H "$COOKIE" https://localhost:1337/mockdata/api/accounts_mgmt/v1/current_account

# Test subscriptions
curl -k -H "$COOKIE" https://localhost:1337/mockdata/api/accounts_mgmt/v1/subscriptions
```

### Monitor Middleware Activity

```bash
# Watch all middleware activity
tail -f /tmp/msw-debug.log | grep "MSW-MIDDLEWARE"

# Filter out noisy authorization checks
tail -f /tmp/msw-debug.log | grep "MSW-MIDDLEWARE" | grep -v "self_feature_review\|self_access_review"

# Watch only cluster-related requests
tail -f /tmp/msw-debug.log | grep "MSW-MIDDLEWARE" | grep clusters
```

---

## 📚 Additional Documentation

For developers and architects:
- **MOCK_FLOWS.md** - Detailed API call sequences for Cluster List and Cluster Details pages (NEW!)
- **MSW-IMPLEMENTATION-SUMMARY.md** - Technical architecture, file structure, customization guide, AI debugging guide, known technical debt
- **LEGACY-PYTHON-SERVER.md** - Documentation for the legacy Python mock server
- **Project README.md** - Root project documentation

---

## 💡 Pro Tips

1. **Use DevTools Network Tab**: Filter by `/api/` to see which requests are being mocked
2. **Check the Yellow Banner**: Confirms you're in MSW mode
3. **Watch Terminal Logs**: `tail -f /tmp/msw-debug.log` shows real-time middleware activity
4. **Clear Everything**: If things get weird, run `yarn stop:msw`, clear browser cache, and start fresh
5. **Test with curl**: Easier than browser for debugging individual endpoints

---

## 🎉 Quick Reference

```bash
# Start MSW server
yarn start:msw

# Stop MSW server  
yarn stop:msw

# Monitor logs
tail -f /tmp/msw-debug.log | grep "MSW-MIDDLEWARE"

# Test API
curl -k -H "Cookie: ocmOverridenEnvironment=msw-mockdata" \
  https://localhost:1337/mockdata/api/clusters_mgmt/v1/clusters

# Access in browser
https://prod.foo.redhat.com:1337/openshift?env=msw-mockdata
```

Happy mocking! 🎭

