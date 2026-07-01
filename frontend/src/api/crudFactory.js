import api, { downloadExport } from './client';

/**
 * Creates a standard set of CRUD methods for a REST resource.
 * Used as the basis for every module's API service.
 */
export function createCrudService(basePath) {
  // Derive a clean filename from the path, e.g. '/employees' → 'employees'
  const filename = basePath.replace(/^\//, '').replace(/\//g, '-');

  return {
    list: (params = {}) => api.get(basePath, { params }).then((r) => r.data),
    get: (id) => api.get(`${basePath}/${id}`).then((r) => r.data),
    create: (payload) => api.post(basePath, payload).then((r) => r.data),
    update: (id, payload) => api.patch(`${basePath}/${id}`, payload).then((r) => r.data),
    remove: (id) => api.delete(`${basePath}/${id}`).then((r) => r.data),
    /**
     * Authenticated download — sends the Bearer token so the backend can
     * serve the file. Triggers a browser Save-As dialog.
     *
     * @param {string} format  'csv' | 'excel' | 'pdf'
     * @param {object} params  current filter/search params to export
     */
    download: (format, params = {}) =>
      downloadExport(basePath, { ...params, format }, filename),
  };
}
