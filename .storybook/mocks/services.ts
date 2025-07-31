console.log('🔍 MOCK LOADED: services.ts');

export const clusterService = {
  getCloudProviders: () => Promise.resolve({ data: { items: [] } }),
  getMachineTypesByRegionARN: () => Promise.resolve({ data: { items: [] } }),
  getInstallableVersions: () => Promise.resolve({ data: { items: [] } }),
};

export const accountsService = {
  getRegionalInstances: () => Promise.resolve({ data: { items: [] } }),
};

export const authorizationsService = {
  postSelfFeatureReview: () => Promise.resolve({ data: { enabled: true } }),
};

export const assistedService = {
  getAICluster: () => Promise.resolve({ data: {} }),
  getAIFeatureSupportLevels: () => Promise.resolve({ data: {} }),
};

export const costService = {
  getCostModels: () => Promise.resolve({ data: { items: [] } }),
  getClusterCost: () => Promise.resolve({ data: {} }),
  getQuotaCost: () => Promise.resolve({ data: {} }),
};

const services = {
  clusterService,
  accountsService,
  authorizationsService,
  assistedService,
  costService,
};

export default services;
