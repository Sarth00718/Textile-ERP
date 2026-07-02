import api, { downloadExport } from './client';
import { createCrudService } from './crudFactory';

export const departmentApi = createCrudService('/departments');
export const employeeApi = createCrudService('/employees');

export const factorySettingsApi = {
  get: () => api.get('/factory-settings').then((r) => r.data),
  getPublic: () => api.get('/factory-settings/public').then((r) => r.data),
  update: (payload) => api.patch('/factory-settings', payload).then((r) => r.data),
};

export const attendanceApi = {
  ...createCrudService('/attendance'),
  bulkMark: (payload) => api.post('/attendance/bulk', payload).then((r) => r.data),
};

export const leaveApi = {
  ...createCrudService('/leave'),
  approve: (id) => api.post(`/leave/${id}/approve`).then((r) => r.data),
  reject: (id, rejectionReason) => api.post(`/leave/${id}/reject`, { rejectionReason }).then((r) => r.data),
  cancel: (id) => api.post(`/leave/${id}/cancel`).then((r) => r.data),
};

export const payrollApi = {
  list: (params = {}) => api.get('/payroll', { params }).then((r) => r.data),
  get: (id) => api.get(`/payroll/${id}`).then((r) => r.data),
  generate: (payload) => api.post('/payroll/generate', payload).then((r) => r.data),
  markPaid: (id) => api.post(`/payroll/${id}/mark-paid`).then((r) => r.data),
  download: (format, params = {}) => downloadExport('/payroll', { ...params, format }, 'payroll-runs'),
  downloadRun: (id, format) => downloadExport(`/payroll/${id}`, { format }, `payroll-run-${id}`),
};

export const machineApi = {
  ...createCrudService('/machines'),
  utilization: () => api.get('/machines/utilization').then((r) => r.data),
};

export const machineLogApi = {
  list: (params = {}) => api.get('/machine-ops/logs', { params }).then((r) => r.data),
  create: (payload) => api.post('/machine-ops/logs', payload).then((r) => r.data),
  download: (format, params = {}) => downloadExport('/machine-ops/logs', { ...params, format }, 'machine-logs'),
};
export const machineBreakdownApi = {
  list: (params = {}) => api.get('/machine-ops/breakdowns', { params }).then((r) => r.data),
  get: (id) => api.get(`/machine-ops/breakdowns/${id}`).then((r) => r.data),
  create: (payload) => api.post('/machine-ops/breakdowns', payload).then((r) => r.data),
  resolve: (id, payload) => api.post(`/machine-ops/breakdowns/${id}/resolve`, payload).then((r) => r.data),
  download: (format, params = {}) => downloadExport('/machine-ops/breakdowns', { ...params, format }, 'machine-breakdowns'),
};
export const machineMaintenanceApi = {
  list: (params = {}) => api.get('/machine-ops/maintenance', { params }).then((r) => r.data),
  get: (id) => api.get(`/machine-ops/maintenance/${id}`).then((r) => r.data),
  create: (payload) => api.post('/machine-ops/maintenance', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/machine-ops/maintenance/${id}`, payload).then((r) => r.data),
  download: (format, params = {}) => downloadExport('/machine-ops/maintenance', { ...params, format }, 'machine-maintenance'),
};

export const beamApi = createCrudService('/beams');
export const beamAllocationApi = {
  list: (params = {}) => api.get('/beams/allocations', { params }).then((r) => r.data),
  get: (id) => api.get(`/beams/allocations/${id}`).then((r) => r.data),
  allocate: (payload) => api.post('/beams/allocations', payload).then((r) => r.data),
  release: (id, payload) => api.post(`/beams/allocations/${id}/release`, payload).then((r) => r.data),
  download: (format, params = {}) => downloadExport('/beams/allocations', { ...params, format }, 'beam-allocations'),
};

export const fabricDesignApi = createCrudService('/fabric-designs');

export const productionPlanApi = {
  list: (params = {}) => api.get('/production/plans', { params }).then((r) => r.data),
  get: (id) => api.get(`/production/plans/${id}`).then((r) => r.data),
  create: (payload) => api.post('/production/plans', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/production/plans/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/production/plans/${id}`).then((r) => r.data),
  download: (format, params = {}) => downloadExport('/production/plans', { ...params, format }, 'production-plans'),
};
export const workOrderApi = {
  list: (params = {}) => api.get('/production/work-orders', { params }).then((r) => r.data),
  get: (id) => api.get(`/production/work-orders/${id}`).then((r) => r.data),
  create: (payload) => api.post('/production/work-orders', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/production/work-orders/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/production/work-orders/${id}`).then((r) => r.data),
  download: (format, params = {}) => downloadExport('/production/work-orders', { ...params, format }, 'work-orders'),
};
export const productionOrderApi = {
  list: (params = {}) => api.get('/production/orders', { params }).then((r) => r.data),
  get: (id) => api.get(`/production/orders/${id}`).then((r) => r.data),
  create: (payload) => api.post('/production/orders', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/production/orders/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/production/orders/${id}`).then((r) => r.data),
  download: (format, params = {}) => downloadExport('/production/orders', { ...params, format }, 'production-orders'),
};
export const dailyProductionEntryApi = {
  list: (params = {}) => api.get('/production/daily-entries', { params }).then((r) => r.data),
  get: (id) => api.get(`/production/daily-entries/${id}`).then((r) => r.data),
  create: (payload) => api.post('/production/daily-entries', payload).then((r) => r.data),
  download: (format, params = {}) => downloadExport('/production/daily-entries', { ...params, format }, 'daily-production'),
};
export const fabricRollApi = {
  ...createCrudService('/fabric-rolls'),
  updateStatus: (id, payload) => api.patch(`/fabric-rolls/${id}/status`, payload).then((r) => r.data),
};

export const inventoryApi = {
  ...createCrudService('/inventory'),
  lowStock: () => api.get('/inventory/low-stock').then((r) => r.data),
};
export const inventoryTransactionApi = {
  list: (params = {}) => api.get('/inventory/transactions', { params }).then((r) => r.data),
  create: (payload) => api.post('/inventory/transactions', payload).then((r) => r.data),
  download: (format, params = {}) => downloadExport('/inventory/transactions', { ...params, format }, 'inventory-transactions'),
};
export const rawMaterialConsumptionApi = {
  list: (params = {}) => api.get('/raw-material-consumption', { params }).then((r) => r.data),
  download: (format, params = {}) => downloadExport('/raw-material-consumption', { ...params, format }, 'raw-material-consumption'),
};

export const supplierApi = createCrudService('/suppliers');
export const purchaseOrderApi = {
  list: (params = {}) => api.get('/purchase-orders', { params }).then((r) => r.data),
  get: (id) => api.get(`/purchase-orders/${id}`).then((r) => r.data),
  create: (payload) => api.post('/purchase-orders', payload).then((r) => r.data),
  send: (id) => api.post(`/purchase-orders/${id}/send`).then((r) => r.data),
  cancel: (id) => api.post(`/purchase-orders/${id}/cancel`).then((r) => r.data),
  receive: (id, payload) => api.post(`/purchase-orders/${id}/receive`, payload).then((r) => r.data),
  download: (format, params = {}) => downloadExport('/purchase-orders', { ...params, format }, 'purchase-orders'),
};

export const customerApi = createCrudService('/customers');
export const salesOrderApi = {
  list: (params = {}) => api.get('/sales-orders', { params }).then((r) => r.data),
  get: (id) => api.get(`/sales-orders/${id}`).then((r) => r.data),
  create: (payload) => api.post('/sales-orders', payload).then((r) => r.data),
  updateStatus: (id, payload) => api.patch(`/sales-orders/${id}/status`, payload).then((r) => r.data),
  recordPayment: (id, payload) => api.post(`/sales-orders/${id}/payments`, payload).then((r) => r.data),
  download: (format, params = {}) => downloadExport('/sales-orders', { ...params, format }, 'sales-orders'),
};

export const qualityControlApi = {
  list: (params = {}) => api.get('/quality-control', { params }).then((r) => r.data),
  get: (id) => api.get(`/quality-control/${id}`).then((r) => r.data),
  create: (payload) => api.post('/quality-control', payload).then((r) => r.data),
  download: (format, params = {}) => downloadExport('/quality-control', { ...params, format }, 'quality-control'),
};
export const packingApi = {
  list: (params = {}) => api.get('/packing', { params }).then((r) => r.data),
  get: (id) => api.get(`/packing/${id}`).then((r) => r.data),
  create: (payload) => api.post('/packing', payload).then((r) => r.data),
  download: (format, params = {}) => downloadExport('/packing', { ...params, format }, 'packing'),
};
export const vehicleApi = createCrudService('/vehicles');
export const dispatchApi = {
  list: (params = {}) => api.get('/dispatch', { params }).then((r) => r.data),
  get: (id) => api.get(`/dispatch/${id}`).then((r) => r.data),
  create: (payload) => api.post('/dispatch', payload).then((r) => r.data),
  markInTransit: (id) => api.post(`/dispatch/${id}/in-transit`).then((r) => r.data),
  markDelivered: (id) => api.post(`/dispatch/${id}/delivered`).then((r) => r.data),
  download: (format, params = {}) => downloadExport('/dispatch', { ...params, format }, 'dispatch'),
};

export const expenseApi = {
  ...createCrudService('/expenses'),
  summary: (params = {}) => api.get('/expenses/summary', { params }).then((r) => r.data),
};

export const electricityApi = {
  list: (params = {}) => api.get('/operations/electricity', { params }).then((r) => r.data),
  create: (payload) => api.post('/operations/electricity', payload).then((r) => r.data),
  download: (format, params = {}) => downloadExport('/operations/electricity', { ...params, format }, 'electricity'),
};
export const waterApi = {
  list: (params = {}) => api.get('/operations/water', { params }).then((r) => r.data),
  create: (payload) => api.post('/operations/water', payload).then((r) => r.data),
  download: (format, params = {}) => downloadExport('/operations/water', { ...params, format }, 'water'),
};
export const productivityApi = {
  list: (params = {}) => api.get('/operations/productivity', { params }).then((r) => r.data),
  create: (payload) => api.post('/operations/productivity', payload).then((r) => r.data),
  download: (format, params = {}) => downloadExport('/operations/productivity', { ...params, format }, 'worker-productivity'),
};
export const wasteApi = {
  list: (params = {}) => api.get('/operations/waste', { params }).then((r) => r.data),
  create: (payload) => api.post('/operations/waste', payload).then((r) => r.data),
  download: (format, params = {}) => downloadExport('/operations/waste', { ...params, format }, 'waste'),
};

export const notificationApi = {
  list: (params = {}) => api.get('/notifications', { params }).then((r) => r.data),
  unreadCount: () => api.get('/notifications/unread-count').then((r) => r.data),
  markRead: (id) => api.post(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.post('/notifications/mark-all-read').then((r) => r.data),
};

export const auditLogApi = {
  list: (params = {}) => api.get('/audit-logs', { params }).then((r) => r.data),
  download: (format, params = {}) => downloadExport('/audit-logs', { ...params, format }, 'audit-logs'),
};

export const dashboardApi = {
  summary: () => api.get('/dashboard/summary').then((r) => r.data),
  charts: () => api.get('/dashboard/charts').then((r) => r.data),
};

export const reportsApi = {
  list: (type, params = {}) => api.get(`/reports/${type}`, { params }).then((r) => r.data),
  download: (type, params = {}, format = 'csv') =>
    downloadExport(`/reports/${type}`, { ...params, format }, `${type}-report`),
};
