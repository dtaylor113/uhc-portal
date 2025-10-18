/**
 * Cluster Fixtures
 * 
 * Type-safe cluster mock data using OpenAPI-generated types.
 * 
 * ## Workflow:
 * 1. Record a real cluster: `./mockdata/msw/scripts/record-cluster.sh <subscription-id>`
 * 2. Clusters are automatically saved to `./mockdata/msw/fixtures/clusters/`
 * 3. Run `yarn msw:fixtures:build` to regenerate the index
 * 4. Restart: `yarn start:msw`
 * 
 * ## createCluster() - For Ad-Hoc Testing Only
 * 
 * Use this factory function to quickly create a cluster for local testing.
 * NOT recommended for production fixtures - use recorded clusters instead.
 * 
 * @example Quick test cluster
 * ```typescript
 * const testCluster = createCluster({
 *   id: 'test-123',
 *   name: 'my-test-cluster',
 *   display_name: 'My Test Cluster',
 *   state: 'ready',
 *   cloud_provider: { id: 'aws', kind: 'CloudProviderLink', href: '...' },
 *   region: { id: 'us-east-1', kind: 'CloudRegionLink', href: '...' }
 * });
 * 
 * // Add to mockClusters array temporarily:
 * // mockClusters.push(testCluster);
 * ```
 */

import type { Cluster, ClusterList } from './types.js';
// Import all recorded clusters from the clusters/ directory
import * as recordedClusters from './clusters/index.js';

/**
 * Create a mock cluster with type safety
 * 
 * @param overrides - Partial cluster object to override defaults
 * @returns Complete Cluster object with all required fields
 * 
 * **Note:** This is for ad-hoc testing only. For production fixtures, use `record-cluster.sh`.
 */
export function createCluster(overrides?: any): Cluster {
  const defaults: any = {
    kind: 'Cluster',
    id: `cluster-${Math.random().toString(36).substring(2, 11)}`,
    href: '/api/clusters_mgmt/v1/clusters/placeholder',
    name: 'mock-cluster',
    external_id: `ext-${Math.random().toString(36).substring(2, 11)}`,
    creation_timestamp: new Date().toISOString(),
    activity_timestamp: new Date().toISOString(),
    cloud_provider: {
      kind: 'CloudProviderLink',
      id: 'aws',
      href: '/api/clusters_mgmt/v1/cloud_providers/aws',
    },
    openshift_version: '4.12.0',
    region: {
      kind: 'CloudRegionLink',
      id: 'us-east-1',
      href: '/api/clusters_mgmt/v1/cloud_providers/aws/regions/us-east-1',
    },
    state: 'ready',
    multi_az: false,
    managed: true,
    api: {
      url: 'https://api.mock-cluster.example.com:443',
      listening: 'external',
    },
    console: {
      url: 'https://console-openshift-console.apps.mock-cluster.example.com',
    },
    nodes: {
      master: 3,
      compute: 2,
    },
    status: {
      state: 'ready',
      dns_ready: true,
      configuration_mode: 'full',
    },
  };

  const cluster = { ...defaults, ...overrides };
  
  // Update href to match id
  if (cluster.id) {
    cluster.href = `/api/clusters_mgmt/v1/clusters/${cluster.id}`;
  }

  return cluster as Cluster;
}

/**
 * All mock clusters
 * 
 * Automatically populated from all recorded clusters in the clusters/ directory.
 * Each recorded cluster is exported from its own file and collected here.
 * 
 * To add a new cluster:
 * 1. Record it: `./mockdata/msw/scripts/record-cluster.sh <subscription-id>`
 * 2. Rebuild: `yarn msw:fixtures:build`
 * 3. Restart: `yarn start:msw`
 */
export const mockClusters: Cluster[] = Object.values(recordedClusters)
  .filter((exp): exp is Cluster => 
    exp != null && 
    typeof exp === 'object' && 
    'kind' in exp && 
    exp.kind === 'Cluster'
  );

/**
 * Type-safe cluster list response
 * 
 * This matches the OCM API response format for GET /api/clusters_mgmt/v1/clusters
 */
export const mockClusterList: ClusterList = {
  kind: 'ClusterList',
  items: mockClusters,
  page: 1,
  size: mockClusters.length,
  total: mockClusters.length,
};

/**
 * Find a cluster by ID
 * 
 * @param clusterId - The cluster ID to search for
 * @returns The cluster if found, undefined otherwise
 */
export function findClusterById(clusterId: string): Cluster | undefined {
  return mockClusters.find((c) => c.id === clusterId);
}

