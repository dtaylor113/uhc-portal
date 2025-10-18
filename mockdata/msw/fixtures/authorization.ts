/**
 * Authorization Fixtures
 * 
 * Mock responses for authorization API endpoints.
 * These control access permissions within the portal.
 */

import type { AccessReviewResponse, FeatureReviewResponse, ResourceReviewResponse } from './types.js';

/**
 * Mock Access Review Response
 * 
 * Returns allowed=true for all access review requests.
 * In a real system, this would check actual permissions.
 */
export const mockAccessReviewResponse: AccessReviewResponse = {
  allowed: true,
};

/**
 * Mock Feature Review Response
 * 
 * Returns enabled=true for all feature review requests.
 * This enables all features in the portal.
 */
export const mockFeatureReviewResponse: FeatureReviewResponse = {
  enabled: true,
};

/**
 * Mock Resource Review Response
 * 
 * Returns allowed=true for all resource review requests.
 * This grants access to all cluster resources.
 */
export const mockResourceReviewResponse: ResourceReviewResponse = {
  allowed: true,
};

