/**
 * MSW-style Mock Server
 * 
 * Simple HTTP server that mimics MSW handler patterns.
 * Uses type-safe TypeScript fixtures for all mock data.
 * 
 * ✅ Phase 2 Complete: Now using TypeScript fixtures instead of legacy JSON!
 */

import { createServer } from 'node:http';

// Import type-safe fixtures
import {
  mockClusterList,
  mockClusters,
  findClusterById,
  mockSubscriptionList,
  mockSubscriptions,
  findSubscriptionById,
  findSubscriptionByClusterId,
  mockCurrentAccount,
  mockOrganization,
  mockQuotaCost,
  mockCloudProviders,
  mockMachineTypes,
  mockAccessReviewResponse,
  mockFeatureReviewResponse,
  mockResourceReviewResponse,
  mockAccessProtection,
  mockAccessRequests,
  MOCK_ORGANIZATION_ID,
} from '../fixtures/dist/mockdata/msw/fixtures/index.js';

// Reference to mock data for easy access
const clustersData = mockClusterList;
const cloudProvidersData = mockCloudProviders;
const machineTypesData = mockMachineTypes;
const currentAccountData = mockCurrentAccount;
const accessProtectionData = mockAccessProtection;

console.log('[MSW Server] Loaded type-safe fixtures:', {
  clusters: mockClusters.length,
  subscriptions: mockSubscriptions.length,
  cloudProviders: cloudProvidersData.items?.length || 0,
  machineTypes: machineTypesData.items?.length || 0,
  currentAccount: currentAccountData.username,
  organization: mockOrganization.name,
  accessProtection: accessProtectionData.enabled ? 'enabled' : 'disabled',
});

// Simple route matching
function matchRoute(pattern, path) {
  // Convert :param to regex groups
  const regexPattern = pattern
    .replace(/\//g, '\\/')
    .replace(/:(\w+)\?/g, '([^/]*)')  // Optional params
    .replace(/:(\w+)/g, '([^/]+)');   // Required params
  
  const regex = new RegExp(`^${regexPattern}$`);
  const match = path.match(regex);
  
  if (!match) return null;
  
  // Extract param names and values
  const paramNames = (pattern.match(/:(\w+)\??/g) || []).map(p => p.replace(/[:?]/g, ''));
  const params = {};
  paramNames.forEach((name, i) => {
    params[name] = match[i + 1];
  });
  
  return params;
}

// Request handler
async function handleRequest(req, res) {
  const url = new URL(req.url, 'http://localhost:9001');
  const path = url.pathname;
  
  console.log(`[MSW Server] ${req.method} ${path}`);

  try {
    // Clusters Management API
    if (req.method === 'GET' && path === '/api/clusters_mgmt/v1/clusters') {
      console.log('[MSW] GET /api/clusters_mgmt/v1/clusters -', clustersData.items?.length, 'clusters');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(clustersData));
      return;
    }

    if (req.method === 'POST' && path.startsWith('/api/clusters_mgmt/v1/clusters')) {
      const method = url.searchParams.get('method');
      console.log('[MSW] POST /api/clusters_mgmt/v1/clusters?method=' + method);
      if (method === 'get') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(clustersData));
        return;
      }
    }

    // Check if path is for a specific cluster (base or sub-resource)
    if (req.method === 'GET' && path.startsWith('/api/clusters_mgmt/v1/clusters/') && path !== '/api/clusters_mgmt/v1/clusters') {
      // Extract clusterId from path (supports both base cluster and sub-resources)
      const pathParts = path.split('/');
      const clusterId = pathParts[5]; // /api/clusters_mgmt/v1/clusters/:clusterId/...

      const cluster = clustersData.items?.find((c) => c.id === clusterId);
      if (!cluster) {
        console.log('[MSW] Cluster not found:', clusterId);
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Cluster not found' }));
        return;
      }

      // Handle sub-resources
      if (path.includes('/upgrade_policies')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ kind: 'UpgradePolicyList', items: [] }));
        return;
      }
      if (path.includes('/machine_pools')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ kind: 'MachinePoolList', href: path, page: 1, size: 0, total: 0, items: [] }));
        return;
      }
      if (path.includes('/node_pools')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ kind: 'NodePoolList', items: [] }));
        return;
      }
      if (path.includes('/groups')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ kind: 'GroupList', items: [] }));
        return;
      }
      if (path.includes('/external_auth_config')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ kind: 'ExternalAuthConfig', items: [] }));
        return;
      }
      if (path.includes('/aws_infrastructure_access_role_grants')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ kind: 'AWSInfrastructureAccessRoleGrantList', items: [] }));
        return;
      }
      if (path.includes('/aws_infrastructure_access_roles')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ kind: 'AWSInfrastructureAccessRoleList', items: [] }));
        return;
      }

      // Return cluster itself
      console.log('[MSW] GET /api/clusters_mgmt/v1/clusters/' + clusterId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(cluster));
      return;
    }

    // Accounts Management API - Subscriptions
    if (path.startsWith('/api/accounts_mgmt/v1/subscriptions')) {
      // Handle sub-resources first (e.g., /subscriptions/:id/notification_contacts)
      if (path.includes('/notification_contacts')) {
        console.log('[MSW] GET /subscriptions/.../notification_contacts');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ kind: 'NotificationContactList', items: [], page: 1, size: 0, total: 0 }));
        return;
      }

      // Match single subscription by ID
      const subscriptionMatch = matchRoute('/api/accounts_mgmt/v1/subscriptions/:subscriptionId', path);
      
      if (req.method === 'GET' && subscriptionMatch && subscriptionMatch.subscriptionId) {
        const subscriptionId = subscriptionMatch.subscriptionId;
        
        const subscription = findSubscriptionById(subscriptionId);
        if (!subscription) {
          console.log('[MSW] Subscription not found:', subscriptionId);
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Subscription not found' }));
          return;
        }
        
        console.log('[MSW] GET /api/accounts_mgmt/v1/subscriptions/' + subscriptionId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(subscription));
        return;
      }

      if (req.method === 'GET') {
        console.log('[MSW] GET /api/accounts_mgmt/v1/subscriptions -', mockSubscriptions.length, 'subscriptions');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(mockSubscriptionList));
        return;
      }

      if (req.method === 'POST') {
        const method = url.searchParams.get('method');
        console.log('[MSW] POST /api/accounts_mgmt/v1/subscriptions?method=' + method);
        if (method === 'get') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(mockSubscriptionList));
          return;
        }
      }
    }

    // Authorizations API
    if (req.method === 'POST' && path === '/api/authorizations/v1/self_access_review') {
      console.log('[MSW] POST /api/authorizations/v1/self_access_review');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mockAccessReviewResponse));
      return;
    }

    if (req.method === 'POST' && path === '/api/authorizations/v1/self_feature_review') {
      console.log('[MSW] POST /api/authorizations/v1/self_feature_review');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mockFeatureReviewResponse));
      return;
    }

    if (req.method === 'POST' && path === '/api/authorizations/v1/self_resource_review') {
      console.log('[MSW] POST /api/authorizations/v1/self_resource_review');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mockResourceReviewResponse));
      return;
    }

    // Regions API
    if (req.method === 'GET' && path === '/api/accounts_mgmt/v1/regions') {
      console.log('[MSW] GET /api/accounts_mgmt/v1/regions');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ kind: 'RegionList', items: [], page: 1, size: 0, total: 0 }));
      return;
    }

    // Cluster Transfers API
    if (req.method === 'GET' && path.startsWith('/api/accounts_mgmt/v1/cluster_transfers')) {
      console.log('[MSW] GET /api/accounts_mgmt/v1/cluster_transfers');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ kind: 'ClusterTransferList', items: [], page: 1, size: 0, total: 0 }));
      return;
    }

    // Regions API
    if (req.method === 'GET' && path === '/api/accounts_mgmt/v1/regions') {
      console.log('[MSW] GET /api/accounts_mgmt/v1/regions');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ kind: 'RegionList', items: [], page: 1, size: 0, total: 0 }));
      return;
    }

    // Current Account API
    if (req.method === 'GET' && path === '/api/accounts_mgmt/v1/current_account') {
      console.log('[MSW] GET /api/accounts_mgmt/v1/current_account');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(currentAccountData));
      return;
    }

    // Organization API
    const orgMatch = matchRoute('/api/accounts_mgmt/v1/organizations/:orgId', path);
    if (req.method === 'GET' && orgMatch && !path.includes('/quota_cost')) {
      const { orgId } = orgMatch;
      console.log('[MSW] GET /api/accounts_mgmt/v1/organizations/' + orgId);
      
      // Return mock organization with capabilities
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mockOrganization));
      return;
    }

    // Organization Quota Cost API
    const quotaCostMatch = matchRoute('/api/accounts_mgmt/v1/organizations/:orgId/quota_cost', path);
    if (req.method === 'GET' && quotaCostMatch) {
      const { orgId } = quotaCostMatch;
      console.log('[MSW] GET /api/accounts_mgmt/v1/organizations/' + orgId + '/quota_cost');
      
      // Return quota cost from fixtures
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mockQuotaCost));
      return;
    }

    // Cloud Providers API
    if (req.method === 'GET' && path.startsWith('/api/clusters_mgmt/v1/cloud_providers')) {
      console.log('[MSW] GET /api/clusters_mgmt/v1/cloud_providers');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(cloudProvidersData));
      return;
    }

    // Machine Types API
    if (req.method === 'GET' && path.startsWith('/api/clusters_mgmt/v1/machine_types')) {
      console.log('[MSW] GET /api/clusters_mgmt/v1/machine_types');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(machineTypesData));
      return;
    }

    // Access Protection API
    if (req.method === 'GET' && path.startsWith('/api/access_transparency/v1/access_protection')) {
      console.log('[MSW] GET /api/access_transparency/v1/access_protection');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(accessProtectionData));
      return;
    }

    // Access Requests API (for pending access requests)
    if (req.method === 'GET' && path.startsWith('/api/access_transparency/v1/access_requests')) {
      console.log('[MSW] GET /api/access_transparency/v1/access_requests');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mockAccessRequests));
      return;
    }

    // ============================================================================
    // Cluster Sub-Resources (for cluster details page)
    // ============================================================================

    // Gate Agreements - agreements the cluster must comply with
    if (req.method === 'GET' && path.includes('/gate_agreements')) {
      console.log('[MSW] GET /gate_agreements');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ kind: 'VersionGateAgreementList', items: [], page: 1, size: 0, total: 0 }));
      return;
    }

    // Limited Support Reasons - why cluster might have limited support
    if (req.method === 'GET' && path.includes('/limited_support_reasons')) {
      console.log('[MSW] GET /limited_support_reasons');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ kind: 'LimitedSupportReasonList', items: [], page: 1, size: 0, total: 0 }));
      return;
    }

    // Identity Providers - authentication providers for the cluster
    if (req.method === 'GET' && path.includes('/identity_providers')) {
      console.log('[MSW] GET /identity_providers');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ kind: 'IdentityProviderList', items: [], page: 1, size: 0, total: 0 }));
      return;
    }

    // Groups - user/admin groups for the cluster
    if (req.method === 'GET' && path.includes('/groups')) {
      console.log('[MSW] GET /groups');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ kind: 'GroupList', items: [], page: 1, size: 0, total: 0 }));
      return;
    }

    // Ingresses - ingress controllers for the cluster
    if (req.method === 'GET' && path.includes('/ingresses')) {
      console.log('[MSW] GET /ingresses');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ kind: 'IngressList', items: [], page: 1, size: 0, total: 0 }));
      return;
    }

    // Control Plane Upgrade Policies - scheduled upgrades for control plane
    if (req.method === 'GET' && path.includes('/control_plane/upgrade_policies')) {
      console.log('[MSW] GET /control_plane/upgrade_policies');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ kind: 'ControlPlaneUpgradePolicyList', items: [], page: 1, size: 0, total: 0 }));
      return;
    }

    // Version Gates - version upgrade requirements and blockers
    if (req.method === 'GET' && path.includes('/version_gates')) {
      console.log('[MSW] GET /version_gates');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ kind: 'VersionGateList', items: [], page: 1, size: 0, total: 0 }));
      return;
    }

    // Inflight Checks - cluster preflight validation checks
    if (req.method === 'GET' && path.includes('/inflight_checks')) {
      console.log('[MSW] GET /inflight_checks');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ kind: 'InflightCheckList', items: [], page: 1, size: 0, total: 0 }));
      return;
    }

    // Upgrade Policies - cluster upgrade policies (not control plane)
    if (req.method === 'GET' && path.includes('/upgrade_policies') && !path.includes('control_plane')) {
      console.log('[MSW] GET /upgrade_policies');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ kind: 'UpgradePolicyList', items: [], page: 1, size: 0, total: 0 }));
      return;
    }

    // Notification Contacts - subscription notification contacts
    if (req.method === 'GET' && path.includes('/notification_contacts')) {
      console.log('[MSW] GET /notification_contacts');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ kind: 'NotificationContactList', items: [], page: 1, size: 0, total: 0 }));
      return;
    }

    // Insights Results Aggregator - cluster health/advisory reports
    if (req.method === 'GET' && path.includes('/insights-results-aggregator/')) {
      console.log('[MSW] GET /insights-results-aggregator/*');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ report: { data: [] }, meta: { count: 0 } }));
      return;
    }

    // Cost Management - user access and cost data
    if (req.method === 'GET' && path.includes('/cost-management/')) {
      console.log('[MSW] GET /cost-management/*');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      // Return permission granted for user access endpoints
      if (path.includes('user-access')) {
        res.end(JSON.stringify({ data: { has_access: true } }));
      } else {
        res.end(JSON.stringify({ data: [] }));
      }
      return;
    }

    // No handler matched
    console.log('[MSW] Unhandled request:', req.method, path);
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'No handler matched', path }));

  } catch (error) {
    console.error('[MSW Server] Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Server error', details: error.message }));
  }
}

// Create HTTP server
const httpServer = createServer(handleRequest);

const PORT = 9001;

httpServer.listen(PORT, () => {
  console.log(`[MSW Server] Listening on http://localhost:${PORT}`);
  console.log('[MSW Server] Ready to handle mock requests');
  console.log('[MSW Server] Access app at: https://prod.foo.redhat.com:1337/openshift?env=msw-mockdata');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[MSW Server] SIGTERM received, shutting down...');
  httpServer.close(() => {
    console.log('[MSW Server] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[MSW Server] SIGINT received, shutting down...');
  httpServer.close(() => {
    console.log('[MSW Server] Server closed');
    process.exit(0);
  });
});

