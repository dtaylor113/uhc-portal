/**
 * Account Fixtures
 * 
 * Type-safe account and organization mock data.
 */

import type { Account, Organization, QuotaCost } from './types.js';

/**
 * Mock Organization ID
 */
export const MOCK_ORGANIZATION_ID = '1KgB0Wb3dqTJ9ZM5X1KmkqxFvou';

/**
 * Mock Current Account
 * 
 * Represents the currently logged-in user's account.
 */
export const mockCurrentAccount: Account = {
  kind: 'Account',
  id: '1KgB0XNILKvnMh9aT9xqkqxFvou',
  href: '/api/accounts_mgmt/v1/accounts/1KgB0XNILKvnMh9aT9xqkqxFvou',
  username: 'mnecas.openshift',
  email: 'mnecas@redhat.com',
  first_name: 'Martin',
  last_name: 'Necas',
  banned: false,
  service_account: false,
  organization: {
    kind: 'OrganizationLink',
    id: MOCK_ORGANIZATION_ID,
    href: `/api/accounts_mgmt/v1/organizations/${MOCK_ORGANIZATION_ID}`,
  } as any,
  created_at: '2019-01-15T12:00:00Z',
  updated_at: '2024-01-15T12:00:00Z',
};

/**
 * Mock Organization
 * 
 * Organization associated with the current account.
 * Includes capabilities required for cluster operations.
 */
export const mockOrganization: Organization = {
  kind: 'Organization',
  id: MOCK_ORGANIZATION_ID,
  href: `/api/accounts_mgmt/v1/organizations/${MOCK_ORGANIZATION_ID}`,
  name: 'Mock Organization',
  external_id: 'mock-external-id-12345',
  ebs_account_id: '1234567890',
  created_at: '2021-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  capabilities: [
    {
      kind: 'Capability',
      id: 'cap-hypershift',
      href: `/api/accounts_mgmt/v1/organizations/${MOCK_ORGANIZATION_ID}/capabilities/cap-hypershift`,
      name: 'capability.organization.hypershift',
      value: 'true',
      inherited: false,
    },
    {
      kind: 'Capability',
      id: 'cap-cluster-create',
      href: `/api/accounts_mgmt/v1/organizations/${MOCK_ORGANIZATION_ID}/capabilities/cap-cluster-create`,
      name: 'capability.cluster.create',
      value: 'true',
      inherited: false,
    },
    {
      kind: 'Capability',
      id: 'cap-autoscale',
      href: `/api/accounts_mgmt/v1/organizations/${MOCK_ORGANIZATION_ID}/capabilities/cap-autoscale`,
      name: 'capability.cluster.autoscale_clusters',
      value: 'true',
      inherited: false,
    },
  ],
};

/**
 * Mock Quota Cost
 * 
 * Represents the organization's quota and resource consumption.
 */
export const mockQuotaCost: QuotaCost = {
  kind: 'QuotaCost',
  href: `/api/accounts_mgmt/v1/organizations/${MOCK_ORGANIZATION_ID}/quota_cost`,
  organization_id: MOCK_ORGANIZATION_ID,
  quota_id: 'mock-quota-001',
  allowed: 100,
  consumed: 1, // Only 1 cluster (hypershift-ready)
  version: '1.0',
  related_resources: [],
  cloud_accounts: [],
};

