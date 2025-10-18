/**
 * Type Helper Utilities
 * 
 * This file provides helper types for extracting OpenAPI-generated types
 * from the src/types directory.
 */

import type { components as ClustersMgmtComponents } from '../../../src/types/clusters_mgmt.v1';
import type { components as AccountsMgmtComponents } from '../../../src/types/accounts_mgmt.v1';

// ============================================================================
// Clusters Management API Types
// ============================================================================

export type Cluster = ClustersMgmtComponents['schemas']['Cluster'];
export type CloudProvider = ClustersMgmtComponents['schemas']['CloudProvider'];
export type MachineType = ClustersMgmtComponents['schemas']['MachineType'];
export type UpgradePolicy = ClustersMgmtComponents['schemas']['UpgradePolicy'];
export type MachinePool = ClustersMgmtComponents['schemas']['MachinePool'];
export type NodePool = ClustersMgmtComponents['schemas']['NodePool'];
export type Group = ClustersMgmtComponents['schemas']['Group'];

// List types - these don't exist in the OpenAPI schema, so we define them
export interface ClusterList {
  kind: string;
  items?: Cluster[];
  page?: number;
  size?: number;
  total?: number;
}

export interface CloudProviderList {
  kind: string;
  items?: CloudProvider[];
  page?: number;
  size?: number;
  total?: number;
}

export interface MachineTypeList {
  kind: string;
  items?: MachineType[];
  page?: number;
  size?: number;
  total?: number;
}

export interface UpgradePolicyList {
  kind: string;
  items?: UpgradePolicy[];
  page?: number;
  size?: number;
  total?: number;
}

export interface MachinePoolList {
  kind: string;
  items?: MachinePool[];
  page?: number;
  size?: number;
  total?: number;
}

export interface NodePoolList {
  kind: string;
  items?: NodePool[];
  page?: number;
  size?: number;
  total?: number;
}

export interface GroupList {
  kind: string;
  items?: Group[];
  page?: number;
  size?: number;
  total?: number;
}

// ============================================================================
// Accounts Management API Types
// ============================================================================

export type Account = AccountsMgmtComponents['schemas']['Account'];
export type Organization = AccountsMgmtComponents['schemas']['Organization'];
export type QuotaCost = AccountsMgmtComponents['schemas']['QuotaCost'];

// ============================================================================
// Authorization Types
// ============================================================================

export interface AccessReviewResponse {
  allowed: boolean;
  account_id?: string;
  organization_id?: string;
  subscription_id?: string;
  cluster_id?: string;
}

export interface FeatureReviewResponse {
  enabled: boolean;
}

export interface ResourceReviewResponse {
  allowed: boolean;
}

// ============================================================================
// Helper Types for Subscriptions (from legacy system)
// ============================================================================

export interface Subscription {
  id: string;
  plan: {
    id: string;
    type: string;
  };
  cluster_id: string;
  cluster_billing_model: string;
  display_name: string;
  external_cluster_id?: string;
  managed: boolean;
  status: string;
  creator: {
    username: string;
  };
  organization_id: string;
  created_at: string;
  updated_at: string;
  capabilities: string[];
  support_level: string;
  console_url?: string;
}

export interface SubscriptionList {
  kind: string;
  items: Subscription[];
  page: number;
  size: number;
  total: number;
}

