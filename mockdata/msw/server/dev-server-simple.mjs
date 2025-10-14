/**
 * MSW-style Mock Server
 * 
 * Simple HTTP server that mimics MSW handler patterns.
 * Uses real MSW Response objects but handles routing manually.
 */

import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load mock data from legacy JSON files
// ⚠️ TECHNICAL DEBT: Still using legacy JSON files - need to create independent fixtures
const clustersData = JSON.parse(
  readFileSync(join(__dirname, '../../api/clusters_mgmt/v1/clusters.json'), 'utf-8')
);
const cloudProvidersData = JSON.parse(
  readFileSync(join(__dirname, '../../api/clusters_mgmt/v1/cloud_providers.json'), 'utf-8')
);
const machineTypesData = JSON.parse(
  readFileSync(join(__dirname, '../../api/clusters_mgmt/v1/machine_types.json'), 'utf-8')
);
const currentAccountData = JSON.parse(
  readFileSync(join(__dirname, '../../api/accounts_mgmt/v1/current_account.json'), 'utf-8')
);
const accessProtectionData = JSON.parse(
  readFileSync(join(__dirname, '../../api/access_transparency/v1/access_protection.json'), 'utf-8')
);

// Clean up cluster data - remove read_only mode to prevent maintenance banner
if (clustersData.items) {
  clustersData.items = clustersData.items.map(cluster => {
    if (cluster.status?.configuration_mode === 'read_only') {
      return {
        ...cluster,
        status: {
          ...cluster.status,
          configuration_mode: 'read_write', // Override to prevent maintenance banner
        },
      };
    }
    return cluster;
  });
}

console.log('[MSW Server] Loaded mock data:', {
  clusters: clustersData.items?.length || 0,
  cloudProviders: cloudProvidersData.items?.length || 0,
  machineTypes: machineTypesData.items?.length || 0,
  currentAccount: currentAccountData.username || 'unknown',
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
      console.log('[MSW] ✅ GET /api/clusters_mgmt/v1/clusters');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(clustersData));
      return;
    }

    if (req.method === 'POST' && path.startsWith('/api/clusters_mgmt/v1/clusters')) {
      const method = url.searchParams.get('method');
      console.log('[MSW] ✅ POST /api/clusters_mgmt/v1/clusters', { method });
      if (method === 'get') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(clustersData));
        return;
      }
    }

    const clusterMatch = matchRoute('/api/clusters_mgmt/v1/clusters/:clusterId', path);
    if (req.method === 'GET' && clusterMatch) {
      const { clusterId } = clusterMatch;
      console.log('[MSW] ✅ GET /api/clusters_mgmt/v1/clusters/:id', { clusterId });

      const cluster = clustersData.items?.find((c) => c.id === clusterId);
      if (!cluster) {
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
        res.end(JSON.stringify({ kind: 'MachinePoolList', items: [] }));
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
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(cluster));
      return;
    }

    // Accounts Management API
    if (path.startsWith('/api/accounts_mgmt/v1/subscriptions')) {
      const subscriptionMatch = matchRoute('/api/accounts_mgmt/v1/subscriptions/:subscriptionId?', path);
      
      // Generate subscriptions for all clusters dynamically
      const mockSubscriptions = (clustersData.items || []).map((cluster, index) => ({
        id: `2d5bnMR2k7nh${index.toString().padStart(24, '0')}`,
        plan: { id: 'OCP', type: 'OCP' },
        cluster_id: cluster.id,
        cluster_billing_model: cluster.billing_model || 'standard',
        display_name: cluster.display_name || cluster.name,
        external_cluster_id: cluster.external_id,
        managed: cluster.managed !== false,
        status: 'Active',
        creator: { username: 'dtaylor-ocm' },
        organization_id: 'mock-org-001',
        created_at: cluster.creation_timestamp || '2024-01-15T00:00:00Z',
        updated_at: cluster.creation_timestamp || '2024-01-15T00:00:00Z',
        capabilities: ['capability.organization.hypershift', 'capability.cluster.create'],
        support_level: 'Self-Support',
        console_url: cluster.console?.url,
      }));

      if (req.method === 'GET' && subscriptionMatch && subscriptionMatch.subscriptionId) {
        const subscriptionId = subscriptionMatch.subscriptionId;
        console.log('[MSW] ✅ GET /api/accounts_mgmt/v1/subscriptions/:id', { subscriptionId });
        
        const subscription = mockSubscriptions.find(s => s.id === subscriptionId);
        if (!subscription) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Subscription not found' }));
          return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(subscription));
        return;
      }

      if (req.method === 'GET') {
        console.log('[MSW] ✅ GET /api/accounts_mgmt/v1/subscriptions', { count: mockSubscriptions.length });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          kind: 'SubscriptionList',
          items: mockSubscriptions,
          page: 1,
          size: mockSubscriptions.length,
          total: mockSubscriptions.length,
        }));
        return;
      }

      if (req.method === 'POST') {
        const method = url.searchParams.get('method');
        console.log('[MSW] ✅ POST /api/accounts_mgmt/v1/subscriptions', { method, count: mockSubscriptions.length });
        if (method === 'get') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            kind: 'SubscriptionList',
            items: mockSubscriptions,
            page: 1,
            size: mockSubscriptions.length,
            total: mockSubscriptions.length,
          }));
          return;
        }
      }
    }

    // Authorizations API
    if (req.method === 'POST' && path === '/api/authorizations/v1/self_access_review') {
      console.log('[MSW] ✅ POST /api/authorizations/v1/self_access_review');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ allowed: true }));
      return;
    }

    if (req.method === 'POST' && path === '/api/authorizations/v1/self_feature_review') {
      console.log('[MSW] ✅ POST /api/authorizations/v1/self_feature_review');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ enabled: true }));
      return;
    }

    if (req.method === 'POST' && path === '/api/authorizations/v1/self_resource_review') {
      console.log('[MSW] ✅ POST /api/authorizations/v1/self_resource_review');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ allowed: true }));
      return;
    }

    // Regions API
    if (req.method === 'GET' && path === '/api/accounts_mgmt/v1/regions') {
      console.log('[MSW] ✅ GET /api/accounts_mgmt/v1/regions');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ kind: 'RegionList', items: [], page: 1, size: 0, total: 0 }));
      return;
    }

    // Cluster Transfers API
    if (req.method === 'GET' && path.startsWith('/api/accounts_mgmt/v1/cluster_transfers')) {
      console.log('[MSW] ✅ GET /api/accounts_mgmt/v1/cluster_transfers');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ kind: 'ClusterTransferList', items: [], page: 1, size: 0, total: 0 }));
      return;
    }

    // Current Account API
    if (req.method === 'GET' && path === '/api/accounts_mgmt/v1/current_account') {
      console.log('[MSW] ✅ GET /api/accounts_mgmt/v1/current_account');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(currentAccountData));
      return;
    }

    // Organization API
    const orgMatch = matchRoute('/api/accounts_mgmt/v1/organizations/:orgId', path);
    if (req.method === 'GET' && orgMatch && !path.includes('/quota_cost')) {
      const { orgId } = orgMatch;
      console.log('[MSW] ✅ GET /api/accounts_mgmt/v1/organizations/:id', { orgId });
      
      // Return mock organization with capabilities
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        id: orgId,
        kind: 'Organization',
        name: 'Mock Organization',
        href: `/api/accounts_mgmt/v1/organizations/${orgId}`,
        created_at: '2021-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        external_id: 'mock-external-id',
        ebs_account_id: 'mock-ebs-account',
        capabilities: [
          { name: 'capability.organization.hypershift', value: 'true', inherited: false },
          { name: 'capability.cluster.create', value: 'true', inherited: false },
          { name: 'capability.cluster.autoscale_clusters', value: 'true', inherited: false },
        ],
      }));
      return;
    }

    // Organization Quota Cost API
    const quotaCostMatch = matchRoute('/api/accounts_mgmt/v1/organizations/:orgId/quota_cost', path);
    if (req.method === 'GET' && quotaCostMatch) {
      const { orgId } = quotaCostMatch;
      console.log('[MSW] ✅ GET /api/accounts_mgmt/v1/organizations/:id/quota_cost', { orgId });
      
      // Return minimal quota cost structure
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        kind: 'QuotaCost',
        href: `/api/accounts_mgmt/v1/organizations/${orgId}/quota_cost`,
        organization_id: orgId,
        allowed: 100,
        consumed: 23,
        version: '1.0',
        items: [],
        related_resources: [],
        cloud_accounts: [],
      }));
      return;
    }

    // Cloud Providers API
    if (req.method === 'GET' && path.startsWith('/api/clusters_mgmt/v1/cloud_providers')) {
      console.log('[MSW] ✅ GET /api/clusters_mgmt/v1/cloud_providers');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(cloudProvidersData));
      return;
    }

    // Machine Types API
    if (req.method === 'GET' && path.startsWith('/api/clusters_mgmt/v1/machine_types')) {
      console.log('[MSW] ✅ GET /api/clusters_mgmt/v1/machine_types');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(machineTypesData));
      return;
    }

    // Access Protection API
    if (req.method === 'GET' && path.startsWith('/api/access_transparency/v1/access_protection')) {
      console.log('[MSW] ✅ GET /api/access_transparency/v1/access_protection');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(accessProtectionData));
      return;
    }

    // Access Requests API (for pending access requests)
    if (req.method === 'GET' && path.startsWith('/api/access_transparency/v1/access_requests')) {
      console.log('[MSW] ✅ GET /api/access_transparency/v1/access_requests');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        kind: 'AccessRequestList',
        items: [],  // No pending access requests
        page: 0,
        size: 10,
        total: 0,
      }));
      return;
    }

    // No handler matched
    console.log('[MSW Server] ❌ No handler for:', path);
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

