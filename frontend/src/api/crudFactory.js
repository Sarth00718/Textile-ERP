import api from './client';

/**
 * Creates a standard set of CRUD methods for a REST resource.
 * Used as the basis for every module's API service so that list/get/create/
 * update/delete calls are consistent across all 42 modules.
 */
export function createCrudService(basePath) {
  return {
    list: (params = {}) => api.get(basePath, { params }).then((r) => r.data),
    get: (id) => api.get(`${basePath}/${id}`).then((r) => r.data),
    create: (payload) => api.post(basePath, payload).then((r) => r.data),
    update: (id, payload) => api.patch(`${basePath}/${id}`, payload).then((r) => r.data),
    remove: (id) => api.delete(`${basePath}/${id}`).then((r) => r.data),
    /** Builds a download URL for CSV/Excel/PDF export, to be used as an <a href> target */
    exportUrl: (format, params = {}) => {
      const query = new URLSearchParams({ ...params, format }).toString();
      return `${api.defaults.baseURL}${basePath}?${query}`;
    },
  };
}
