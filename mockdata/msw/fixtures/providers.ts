/**
 * Provider Fixtures
 * 
 * Cloud providers and machine types data.
 * 
 * NOTE: For now, we're importing from the legacy JSON files since these
 * are large, static datasets (8 providers with hundreds of regions, 197 machine types).
 * In the future, we could generate TypeScript fixtures for these as well.
 */

import type { CloudProviderList, MachineTypeList } from './types.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Calculate the correct path to legacy JSON files
// Compiled file is at: mockdata/msw/fixtures/dist/mockdata/msw/fixtures/providers.js
// Legacy files are at: mockdata/api/...
// Going up 6 levels from dist/mockdata/msw/fixtures/ gets us to mockdata/
const mockdataDir = join(__dirname, '../../../../../../');

/**
 * Cloud Providers List
 * 
 * Includes AWS, GCP, Azure, and other cloud providers with their regions.
 * Total: 8 providers with hundreds of regions.
 */
export const mockCloudProviders: CloudProviderList = JSON.parse(
  readFileSync(join(mockdataDir, 'api/clusters_mgmt/v1/cloud_providers.json'), 'utf-8')
) as CloudProviderList;

/**
 * Machine Types List
 * 
 * Available machine types across all cloud providers.
 * Total: 197 machine types.
 */
export const mockMachineTypes: MachineTypeList = JSON.parse(
  readFileSync(join(mockdataDir, 'api/clusters_mgmt/v1/machine_types.json'), 'utf-8')
) as MachineTypeList;

