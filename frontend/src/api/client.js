import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue = [];

function resolveQueue(token) {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    if (!response || response.status !== 401 || config._retry) {
      return Promise.reject(error);
    }

    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((token) => {
          if (!token) return reject(error);
          config._retry = true;
          config.headers.Authorization = `Bearer ${token}`;
          resolve(api(config));
        });
      });
    }

    isRefreshing = true;
    try {
      const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
      const { accessToken, refreshToken: newRefreshToken, user } = data.data;
      useAuthStore.getState().setSession({ accessToken, refreshToken: newRefreshToken, user });
      resolveQueue(accessToken);
      config._retry = true;
      config.headers.Authorization = `Bearer ${accessToken}`;
      return api(config);
    } catch (refreshError) {
      resolveQueue(null);
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

/**
 * Authenticated file download.
 * Uses the existing axios instance (which injects the Bearer token via the
 * request interceptor) to fetch the file as a blob, then triggers a browser
 * "Save as" download without ever opening a new tab or exposing the URL.
 *
 * @param {string} path    - API path, e.g. '/employees'
 * @param {object} params  - Query params, e.g. { format: 'csv', search: 'foo' }
 * @param {string} filename - Suggested filename without extension, e.g. 'employees'
 */
export async function downloadExport(path, params = {}, filename = 'export') {
  const response = await api.get(path, { params, responseType: 'blob' });

  // Derive extension from content-type or format param
  const contentType = response.headers['content-type'] || '';
  let ext = params.format === 'excel' ? 'xlsx' : (params.format || 'csv');
  if (contentType.includes('pdf')) ext = 'pdf';
  else if (contentType.includes('spreadsheet') || contentType.includes('excel')) ext = 'xlsx';

  // Try to use filename from Content-Disposition header if present
  const disposition = response.headers['content-disposition'] || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const finalName = match?.[1] || `${filename}.${ext}`;

  const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = finalName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default api;
