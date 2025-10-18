/**
 * Subscription Fixtures
 * 
 * Type-safe subscription mock data.
 * 
 * Subscriptions are automatically recorded alongside clusters.
 * Each cluster recording generates both a cluster and subscription fixture.
 * 
 * See clusters.ts for the main workflow.
 */

import type { Subscription, SubscriptionList } from './types.js';
// Import all recorded subscriptions from the subscriptions/ directory
import * as recordedSubscriptions from './subscriptions/index.js';

/**
 * Create a subscription from a cluster
 * 
 * @param cluster - The cluster to create a subscription for
 * @param subscriptionId - Optional custom subscription ID
 * @returns A subscription object matching the cluster
 */
export function createSubscriptionFromCluster(
  cluster: { id: string; display_name?: string; name?: string; external_id?: string; creation_timestamp?: string; console?: { url?: string }; billing_model?: string; managed?: boolean },
  subscriptionId?: string
): Subscription {
  const defaultId = subscriptionId || `sub-${Math.random().toString(36).substring(2, 15)}`;
  
  return {
    id: defaultId,
    plan: {
      id: 'OCP',
      type: 'OCP',
    },
    cluster_id: cluster.id,
    cluster_billing_model: cluster.billing_model || 'standard',
    display_name: cluster.display_name || cluster.name || 'Unknown Cluster',
    external_cluster_id: cluster.external_id,
    managed: cluster.managed !== false,
    status: 'Active',
    creator: {
      username: 'dtaylor-ocm',
    },
    organization_id: 'mock-org-001',
    created_at: cluster.creation_timestamp || new Date().toISOString(),
    updated_at: cluster.creation_timestamp || new Date().toISOString(),
    capabilities: [
      'capability.organization.hypershift',
      'capability.cluster.create',
    ],
    support_level: 'Self-Support',
    console_url: cluster.console?.url,
  };
}

/**
 * All mock subscriptions
 * 
 * Automatically populated from all recorded subscriptions in the subscriptions/ directory.
 * Each recorded subscription is exported from its own file and collected here.
 * 
 * Subscriptions are recorded automatically when you record a cluster.
 * To add a new subscription:
 * 1. Record a cluster: `./mockdata/msw/scripts/record-cluster.sh <subscription-id>`
 * 2. Rebuild: `yarn msw:fixtures:build`
 * 3. Restart: `yarn start:msw`
 */
export const mockSubscriptions: Subscription[] = Object.values(recordedSubscriptions)
  .filter((exp): exp is Subscription => 
    exp != null && 
    typeof exp === 'object' && 
    'id' in exp &&
    'cluster_id' in exp
  );

/**
 * Type-safe subscription list response
 * 
 * This matches the OCM API response format for GET /api/accounts_mgmt/v1/subscriptions
 */
export const mockSubscriptionList: SubscriptionList = {
  kind: 'SubscriptionList',
  items: mockSubscriptions,
  page: 1,
  size: mockSubscriptions.length,
  total: mockSubscriptions.length,
};

/**
 * Find a subscription by ID
 * 
 * @param subscriptionId - The subscription ID to search for
 * @returns The subscription if found, undefined otherwise
 */
export function findSubscriptionById(subscriptionId: string): Subscription | undefined {
  return mockSubscriptions.find((s) => s.id === subscriptionId);
}

/**
 * Find a subscription by cluster ID
 * 
 * @param clusterId - The cluster ID to search for
 * @returns The subscription if found, undefined otherwise
 */
export function findSubscriptionByClusterId(clusterId: string): Subscription | undefined {
  return mockSubscriptions.find((s) => s.cluster_id === clusterId);
}

