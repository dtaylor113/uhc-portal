/**
 * MSW Fixtures - Main Export
 * 
 * This file exports all type-safe mock data fixtures for the MSW server.
 * 
 * ## Usage
 * 
 * ```typescript
 * import {
 *   mockClusterList,
 *   mockSubscriptionList,
 *   mockCurrentAccount,
 *   findClusterById,
 * } from '../fixtures/dist/index.js';
 * ```
 * 
 * ## Available Fixtures
 * 
 * ### Clusters
 * - `mockClusterList` - List of all clusters (auto-discovered from fixtures/clusters/)
 * - `mockClusters` - Array of cluster objects (auto-populated)
 * - `createCluster()` - Factory function for ad-hoc test clusters
 * - `findClusterById()` - Find cluster by ID
 * 
 * ### Subscriptions
 * - `mockSubscriptionList` - List of all subscriptions (auto-discovered from fixtures/subscriptions/)
 * - `mockSubscriptions` - Array of subscription objects (auto-populated)
 * - `createSubscriptionFromCluster()` - Factory function for subscriptions
 * - `findSubscriptionById()` - Find subscription by ID
 * - `findSubscriptionByClusterId()` - Find subscription by cluster ID
 * 
 * ### Accounts
 * - `mockCurrentAccount` - Current logged-in user
 * - `mockOrganization` - User's organization
 * - `mockQuotaCost` - Organization quota and consumption
 * - `MOCK_ORGANIZATION_ID` - Organization ID constant
 * 
 * ### Providers
 * - `mockCloudProviders` - All cloud providers with regions
 * - `mockMachineTypes` - All available machine types
 * 
 * ### Authorization
 * - `mockAccessReviewResponse` - Access review response (allowed=true)
 * - `mockFeatureReviewResponse` - Feature review response (enabled=true)
 * - `mockResourceReviewResponse` - Resource review response (allowed=true)
 * 
 * ### Access Transparency
 * - `mockAccessProtection` - Access protection status
 * - `mockAccessRequests` - Pending access requests list
 */

// ============================================================================
// Clusters
// ============================================================================

export {
  mockClusterList,
  mockClusters,
  createCluster,
  findClusterById,
} from './clusters.js';

// ============================================================================
// Subscriptions
// ============================================================================

export {
  mockSubscriptionList,
  mockSubscriptions,
  createSubscriptionFromCluster,
  findSubscriptionById,
  findSubscriptionByClusterId,
} from './subscriptions.js';

// ============================================================================
// Accounts
// ============================================================================

export {
  mockCurrentAccount,
  mockOrganization,
  mockQuotaCost,
  MOCK_ORGANIZATION_ID,
} from './accounts.js';

// ============================================================================
// Providers
// ============================================================================

export {
  mockCloudProviders,
  mockMachineTypes,
} from './providers.js';

// ============================================================================
// Authorization
// ============================================================================

export {
  mockAccessReviewResponse,
  mockFeatureReviewResponse,
  mockResourceReviewResponse,
} from './authorization.js';

// ============================================================================
// Access Transparency
// ============================================================================

export {
  mockAccessProtection,
  mockAccessRequests,
} from './access-transparency.js';

// ============================================================================
// Types (re-export for convenience)
// ============================================================================

export type {
  Cluster,
  ClusterList,
  Subscription,
  SubscriptionList,
  Account,
  Organization,
  QuotaCost,
  CloudProvider,
  CloudProviderList,
  MachineType,
  MachineTypeList,
  AccessReviewResponse,
  FeatureReviewResponse,
  ResourceReviewResponse,
} from './types';

