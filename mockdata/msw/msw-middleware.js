/**
 * MSW-style Middleware for Webpack Dev Server
 * 
 * APPROACH: Works like the legacy Python mock server:
 * - Uses REAL SSO authentication (you login normally)
 * - Uses REAL Chrome framework from console.redhat.com
 * - Only mocks OCM API endpoints (/api/clusters_mgmt, /api/accounts_mgmt, /api/authorizations)
 * 
 * Webpack proxy routes:
 * - /mockdata/* → This middleware (mock responses)
 * - Everything else (Chrome, SSO, etc.) → console.redhat.com (real)
 */

// ⚠️ TECHNICAL DEBT: This creates a dependency on legacy JSON files
// TODO: Create independent fixtures in mockdata/msw/fixtures/clusters.js
// See MSW-IMPLEMENTATION-SUMMARY.md "Known Technical Debt" section
const mockClusters = require('../api/clusters_mgmt/v1/clusters.json');

// Find the "hypershift-ready" cluster for MSW
const hypershiftCluster = mockClusters.items.find(c => c.display_name === 'hypershift-ready');

// Verify cluster is loaded
if (hypershiftCluster) {
  console.log(`[MSW-MIDDLEWARE] ✅ Loaded hypershift-ready cluster:`);
  console.log(`[MSW-MIDDLEWARE]    - ID: ${hypershiftCluster.id}`);
  console.log(`[MSW-MIDDLEWARE]    - Name: ${hypershiftCluster.display_name}`);
  console.log(`[MSW-MIDDLEWARE]    - Version: ${hypershiftCluster.version?.raw_id || 'N/A'}`);
  console.log(`[MSW-MIDDLEWARE]    - Provider: ${hypershiftCluster.cloud_provider?.id || 'N/A'}`);
  console.log(`[MSW-MIDDLEWARE]    - Region: ${hypershiftCluster.region?.id || 'N/A'}`);
} else {
  console.error('[MSW-MIDDLEWARE] ❌ ERROR: hypershift-ready cluster not found in clusters.json!');
}

/**
 * Express middleware that intercepts /mockdata/* requests and returns mock data
 * 
 * Unlike the previous attempt, this does NOT try to mock SSO or Chrome services.
 * It works exactly like the legacy Python server: real auth, mock APIs only.
 */
function mswMiddleware(req, res, next) {
  const url = req.url;
  
  // Only handle /mockdata/* requests (skip everything else)
  if (!url.startsWith('/mockdata')) {
    return next();
  }
  
  // CRITICAL: Check if MSW mode is active before intercepting
  // Frontend now sets an HTTP cookie when ?env=msw-mockdata is used
  const referer = req.headers.referer || '';
  const cookie = req.headers.cookie || '';
  
  // Check for MSW mode in multiple places:
  // 1. URL parameter in current request
  // 2. Referer header
  // 3. Cookie - frontend now sets ocmOverridenEnvironment=msw-mockdata as HTTP cookie
  const isMswMode = url.includes('env=msw-mockdata') ||
                    referer.includes('env=msw-mockdata') || 
                    cookie.includes('ocmOverridenEnvironment=msw-mockdata');
  
  if (!isMswMode) {
    // Not MSW mode - pass through to Python server proxy for legacy ?env=mockdata
    return next();
  }
  
  // Log incoming requests
  console.log(`[MSW-MIDDLEWARE] 📥 ${req.method} ${url}`);
  
  // Strip /mockdata prefix to get the API path
  // Examples:
  // /mockdata/api/clusters_mgmt/v1/clusters → /api/clusters_mgmt/v1/clusters
  let apiPath = url.replace('/mockdata', '');
  
  // Ensure it starts with /api/
  if (!apiPath.startsWith('/api/')) {
    apiPath = '/api' + apiPath;
  }
  
  // Now handle the actual API endpoints
  // These are OCM API endpoints that we want to mock
  
  // Clusters List or individual cluster
  // Note: Some requests use POST with ?method=get for complex search queries
  if ((req.method === 'GET' || req.method === 'POST') && apiPath.includes('/api/clusters_mgmt/v1/clusters')) {
    // Check if it's a specific cluster request (e.g., /clusters/21696acc0dbkvh0mh4lranlmvvqb11lg)
    const clusterIdMatch = apiPath.match(/\/api\/clusters_mgmt\/v1\/clusters\/([^/?]+)(?:\/|$)/);
    
    if (clusterIdMatch && clusterIdMatch[1]) {
      const clusterId = clusterIdMatch[1];
      
      // Check if it's a sub-resource (e.g., upgrade_policies, machine_pools, etc.)
      if (apiPath.includes('/upgrade_policies')) {
        console.log(`[MSW-MIDDLEWARE] ✅ Mocking: GET /api/clusters_mgmt/v1/clusters/${clusterId}/upgrade_policies`);
        return res.json({
          kind: 'UpgradePolicyList',
          items: [],
          page: 1,
          size: 0,
          total: 0,
        });
      }
      
      if (apiPath.includes('/machine_pools')) {
        console.log(`[MSW-MIDDLEWARE] ✅ Mocking: GET /api/clusters_mgmt/v1/clusters/${clusterId}/machine_pools`);
        return res.json({
          kind: 'MachinePoolList',
          items: [],
          page: 1,
          size: 0,
          total: 0,
        });
      }
      
      if (apiPath.includes('/groups')) {
        console.log(`[MSW-MIDDLEWARE] ✅ Mocking: GET /api/clusters_mgmt/v1/clusters/${clusterId}/groups`);
        return res.json({
          kind: 'GroupList',
          items: [],
          page: 1,
          size: 0,
          total: 0,
        });
      }
      
      if (apiPath.includes('/node_pools')) {
        console.log(`[MSW-MIDDLEWARE] ✅ Mocking: GET /api/clusters_mgmt/v1/clusters/${clusterId}/node_pools`);
        return res.json({
          kind: 'NodePoolList',
          items: [],
          page: 1,
          size: 0,
          total: 0,
        });
      }
      
      if (apiPath.includes('/external_auth_config')) {
        console.log(`[MSW-MIDDLEWARE] ✅ Mocking: GET /api/clusters_mgmt/v1/clusters/${clusterId}/external_auth_config`);
        return res.json({
          kind: 'ExternalAuthList',
          items: [],
          page: 1,
          size: 0,
          total: 0,
        });
      }
      
      if (apiPath.includes('/aws_infrastructure_access_role_grants')) {
        console.log(`[MSW-MIDDLEWARE] ✅ Mocking: GET /api/clusters_mgmt/v1/clusters/${clusterId}/aws_infrastructure_access_role_grants`);
        return res.json({
          kind: 'AWSInfrastructureAccessRoleGrantList',
          items: [],
          page: 1,
          size: 0,
          total: 0,
        });
      }
      
      // Individual cluster request (not a sub-resource)
      console.log(`[MSW-MIDDLEWARE] ✅ Mocking: GET /api/clusters_mgmt/v1/clusters/${clusterId}`);
      
      if (clusterId === hypershiftCluster.id) {
        return res.json(hypershiftCluster);
      } else {
        return res.status(404).json({
          kind: 'Error',
          id: '404',
          href: `/api/clusters_mgmt/v1/errors/404`,
          code: 'CLUSTERS-MGMT-404',
          reason: `Cluster with id '${clusterId}' not found`,
        });
      }
    }
    
    // Cluster list request
    console.log('[MSW-MIDDLEWARE] ✅ Mocking: GET /api/clusters_mgmt/v1/clusters');
    return res.json({
      kind: 'ClusterList',
      items: [hypershiftCluster], // Return the hypershift-ready cluster
      page: 1,
      size: 1,
      total: 1,
    });
  }

  // Current Account
  if (req.method === 'GET' && apiPath.includes('/api/accounts_mgmt/v1/current_account')) {
    console.log('[MSW-MIDDLEWARE] ✅ Mocking: GET /api/accounts_mgmt/v1/current_account');
    return res.json({
      id: 'mock-account-001',
      username: 'dtaylor-ocm',
      email: 'dtaylor@redhat.com',
      first_name: 'Dave',
      last_name: 'Taylor',
      organization: { id: 'mock-org-001', name: 'Red Hat' },
    });
  }

  // Authorization endpoints - allow everything
  if (req.method === 'POST' && apiPath.includes('/api/authorizations/v1/self_access_review')) {
    console.log('[MSW-MIDDLEWARE] ✅ Mocking: POST /api/authorizations/v1/self_access_review');
    return res.json({ allowed: true });
  }

  if (req.method === 'POST' && apiPath.includes('/api/authorizations/v1/self_feature_review')) {
    console.log('[MSW-MIDDLEWARE] ✅ Mocking: POST /api/authorizations/v1/self_feature_review');
    return res.json({ enabled: true });
  }

  if (req.method === 'POST' && apiPath.includes('/api/authorizations/v1/self_resource_review')) {
    console.log('[MSW-MIDDLEWARE] ✅ Mocking: POST /api/authorizations/v1/self_resource_review');
    return res.json({ allowed: true });
  }

  if (req.method === 'POST' && apiPath.includes('/api/authorizations/v1/self_terms_review')) {
    console.log('[MSW-MIDDLEWARE] ✅ Mocking: POST /api/authorizations/v1/self_terms_review');
    return res.json({
      account_id: 'mock-account-001',
      terms_required: false,
      terms_available: false,
    });
  }

  // Subscriptions - CRITICAL: Must return subscription for the cluster to be fetched
  if (req.method === 'GET' && apiPath.includes('/api/accounts_mgmt/v1/subscriptions')) {
    // Mock subscription object
    const mockSubscription = {
      id: '2KBhQVMVQx0CEoXuYZUMBQrQG8y',
      kind: 'Subscription',
      href: '/api/accounts_mgmt/v1/subscriptions/2KBhQVMVQx0CEoXuYZUMBQrQG8y',
      plan: {
        category: 'HostedControlPlane',
        href: '/api/accounts_mgmt/v1/plans/MOA-HostedControlPlane',
        id: 'MOA-HostedControlPlane',
        kind: 'Plan',
        type: 'MOA',
      },
      cluster_id: '21696acc0dbkvh0mh4lranlmvvqb11lg', // CRITICAL: Links to hypershift-ready cluster
      external_cluster_id: '124a44e7-28ed-4841-8ae4-0916adb936ea',
      organization_id: '2KBain48N90sMZ8zhjcHDcILVUw',
      display_name: 'hypershift-ready',
      creator: {
        id: '2KBaiuIoEMEdjyfWwQrTMtU8C8O',
        username: 'dtaylor-ocm',
      },
      managed: true,
      status: 'Active',
      created_at: '2023-01-11T16:17:47.696969Z',
      updated_at: '2023-01-17T16:36:38.50756Z',
    };
    
    // Check if it's a specific subscription request
    const subscriptionIdMatch = apiPath.match(/\/api\/accounts_mgmt\/v1\/subscriptions\/([^/?]+)/);
    
    if (subscriptionIdMatch && subscriptionIdMatch[1]) {
      // Individual subscription request
      const subscriptionId = subscriptionIdMatch[1];
      console.log(`[MSW-MIDDLEWARE] ✅ Mocking: GET /api/accounts_mgmt/v1/subscriptions/${subscriptionId}`);
      
      if (subscriptionId === mockSubscription.id) {
        return res.json(mockSubscription);
      } else {
        return res.status(404).json({
          kind: 'Error',
          id: '404',
          href: `/api/accounts_mgmt/v1/errors/404`,
          code: 'ACCT-MGMT-404',
          reason: `Subscription with id '${subscriptionId}' not found`,
        });
      }
    }
    
    // Subscription list request
    console.log('[MSW-MIDDLEWARE] ✅ Mocking: GET /api/accounts_mgmt/v1/subscriptions (list)');
    return res.json({
      kind: 'SubscriptionList',
      page: 1,
      size: 1,
      total: 1,
      items: [mockSubscription],
    });
  }

  if (req.method === 'GET' && apiPath.includes('/api/accounts_mgmt/v1/cluster_transfers')) {
    console.log('[MSW-MIDDLEWARE] ✅ Mocking: GET /api/accounts_mgmt/v1/cluster_transfers');
    return res.json({ items: [], page: 1, size: 0, total: 0 });
  }

  if (req.method === 'GET' && apiPath.includes('/api/accounts_mgmt/v1/regions')) {
    console.log('[MSW-MIDDLEWARE] ✅ Mocking: GET /api/accounts_mgmt/v1/regions');
    return res.json({ items: [], page: 1, size: 0, total: 0 });
  }

  if (req.method === 'GET' && apiPath.includes('/api/clusters_mgmt/v1/cloud_providers')) {
    console.log('[MSW-MIDDLEWARE] ✅ Mocking: GET /api/clusters_mgmt/v1/cloud_providers');
    return res.json({ items: [], page: 1, size: 0, total: 0 });
  }

  if (req.method === 'GET' && apiPath.includes('/api/clusters_mgmt/v1/machine_types')) {
    console.log('[MSW-MIDDLEWARE] ✅ Mocking: GET /api/clusters_mgmt/v1/machine_types');
    return res.json({ items: [], page: 1, size: 0, total: 0 });
  }
  
  if (req.method === 'GET' && apiPath.includes('/api/clusters_mgmt/v1/aws_infrastructure_access_roles')) {
    console.log('[MSW-MIDDLEWARE] ✅ Mocking: GET /api/clusters_mgmt/v1/aws_infrastructure_access_roles');
    return res.json({ items: [], page: 1, size: 0, total: 0 });
  }
  
  if (req.method === 'POST' && apiPath.includes('/api/clusters_mgmt/v1/aws_inquiries/vpcs')) {
    console.log('[MSW-MIDDLEWARE] ✅ Mocking: POST /api/clusters_mgmt/v1/aws_inquiries/vpcs');
    return res.json({ items: [], page: 1, size: 0, total: 0 });
  }

  // Organization endpoints
  if (req.method === 'GET' && apiPath.includes('/api/accounts_mgmt/v1/organizations/')) {
    console.log('[MSW-MIDDLEWARE] ✅ Mocking: GET /api/accounts_mgmt/v1/organizations/*');
    
    // If it's quota_cost
    if (apiPath.includes('/quota_cost')) {
      return res.json({
        allowed: 100,
        consumed: 0,
        organization_id: 'mock-org-001',
        related_resources: []
      });
    }
    
    // Otherwise return organization details
    return res.json({
      id: 'mock-org-001',
      name: 'Red Hat',
      external_id: 'mock-external-001',
      capabilities: []
    });
  }

  // Catch-all: Return empty data for unhandled API endpoints to prevent crashes
  console.log(`[MSW-MIDDLEWARE] ⚠️  No specific handler, returning empty response for: ${req.method} ${apiPath}`);
  
  // Return appropriate empty response based on request method
  if (req.method === 'GET') {
    return res.json({ items: [], data: [], page: 1, size: 0, total: 0 });
  } else if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    return res.json({ success: true });
  } else if (req.method === 'DELETE') {
    return res.status(204).send();
  }
  
  // Fallback
  next();
}

module.exports = mswMiddleware;
