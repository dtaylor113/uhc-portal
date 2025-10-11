import { http, HttpResponse } from 'msw';
import clustersJson from '../../api/clusters_mgmt/v1/clusters.json';

export const handlers = [
  // Cluster list
  http.get('/api/clusters_mgmt/v1/clusters', () => {
    return HttpResponse.json(clustersJson, { headers: { 'x-msw-mock': 'true' } });
  }),
  http.post('/api/clusters_mgmt/v1/clusters', () => {
    return HttpResponse.json(clustersJson, { headers: { 'x-msw-mock': 'true' } });
  }),
  http.get('/mockdata/api/clusters_mgmt/v1/clusters', () => {
    return HttpResponse.json(clustersJson, { headers: { 'x-msw-mock': 'true' } });
  }),
  http.post('/mockdata/api/clusters_mgmt/v1/clusters', () => {
    return HttpResponse.json(clustersJson, { headers: { 'x-msw-mock': 'true' } });
  }),
  http.get('/api/clusters_mgmt/v1/clusters/:cluster_id', ({ params }) => {
    const id = String(params.cluster_id);
    const item = clustersJson?.items?.find((c) => c?.id === id);
    if (item) {
      return HttpResponse.json(item);
    }
    return new HttpResponse(null, { status: 404 });
  }),
  http.get('/mockdata/api/clusters_mgmt/v1/clusters/:cluster_id', ({ params }) => {
    const id = String(params.cluster_id);
    const item = clustersJson?.items?.find((c) => c?.id === id);
    if (item) {
      return HttpResponse.json(item);
    }
    return new HttpResponse(null, { status: 404 });
  }),
  http.get('/api/clusters_mgmt/v1/clusters/:cluster_id/status', () => {
    return HttpResponse.json({});
  }),
  http.get('/mockdata/api/clusters_mgmt/v1/clusters/:cluster_id/status', () => {
    return HttpResponse.json({});
  }),

  // Demo: make this subresource fail ONLY in MSW mode so you can see a difference
  // Identity providers (list view often calls this on background)
  http.get('/api/clusters_mgmt/v1/clusters/:cluster_id/identity_providers', () => {
    return new HttpResponse(null, { status: 500, statusText: 'MSW simulated failure' });
  }),
  http.get('/mockdata/api/clusters_mgmt/v1/clusters/:cluster_id/identity_providers', () => {
    return new HttpResponse(null, { status: 500, statusText: 'MSW simulated failure' });
  }),
];


