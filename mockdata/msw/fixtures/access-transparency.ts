/**
 * Access Transparency Fixtures
 * 
 * Mock data for access transparency API endpoints.
 * Access transparency provides visibility into Red Hat support access to clusters.
 */

/**
 * Access Protection Response
 * 
 * Indicates whether access protection is enabled for clusters.
 */
export interface AccessProtection {
  kind: string;
  enabled: boolean;
}

/**
 * Access Request
 * 
 * Represents a pending access request for cluster support.
 */
export interface AccessRequest {
  id: string;
  kind: string;
  href: string;
  cluster_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Access Request List
 */
export interface AccessRequestList {
  kind: string;
  items: AccessRequest[];
  page: number;
  size: number;
  total: number;
}

/**
 * Mock Access Protection
 * 
 * Access protection is disabled for the mock cluster.
 */
export const mockAccessProtection: AccessProtection = {
  kind: 'AccessProtection',
  enabled: false,
};

/**
 * Mock Access Requests
 * 
 * No pending access requests for the hypershift-ready cluster.
 */
export const mockAccessRequests: AccessRequestList = {
  kind: 'AccessRequestList',
  items: [],
  page: 0,
  size: 10,
  total: 0,
};

