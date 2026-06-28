const ALL_ROLES = ['OWNER', 'MANAGER', 'SUPERVISOR', 'WORKER', 'ACCOUNTANT'];

export const PERMISSIONS = {
  dashboard: { view: ALL_ROLES },
  factorySettings: { view: ['OWNER', 'MANAGER'], manage: ['OWNER'] },
  departments: { view: ALL_ROLES, manage: ['OWNER', 'MANAGER'] },
  employees: { view: ['OWNER', 'MANAGER', 'SUPERVISOR', 'ACCOUNTANT'], manage: ['OWNER', 'MANAGER'] },
  attendance: { view: ['OWNER', 'MANAGER', 'SUPERVISOR', 'ACCOUNTANT'], manage: ['OWNER', 'MANAGER', 'SUPERVISOR'] },
  leave: { view: ALL_ROLES, manage: ['OWNER', 'MANAGER', 'SUPERVISOR'], request: ['WORKER', 'SUPERVISOR'] },
  payroll: { view: ['OWNER', 'MANAGER', 'ACCOUNTANT'], manage: ['OWNER', 'ACCOUNTANT'] },
  machines: { view: ALL_ROLES, manage: ['OWNER', 'MANAGER', 'SUPERVISOR'] },
  machineLogs: { view: ALL_ROLES, manage: ['OWNER', 'MANAGER', 'SUPERVISOR', 'WORKER'] },
  machineBreakdown: { view: ALL_ROLES, manage: ['OWNER', 'MANAGER', 'SUPERVISOR', 'WORKER'] },
  machineMaintenance: { view: ['OWNER', 'MANAGER', 'SUPERVISOR'], manage: ['OWNER', 'MANAGER', 'SUPERVISOR'] },
  beams: { view: ['OWNER', 'MANAGER', 'SUPERVISOR', 'WORKER'], manage: ['OWNER', 'MANAGER', 'SUPERVISOR'] },
  beamAllocation: { view: ['OWNER', 'MANAGER', 'SUPERVISOR', 'WORKER'], manage: ['OWNER', 'MANAGER', 'SUPERVISOR'] },
  fabricDesign: { view: ALL_ROLES, manage: ['OWNER', 'MANAGER'] },
  productionPlanning: { view: ['OWNER', 'MANAGER', 'SUPERVISOR'], manage: ['OWNER', 'MANAGER'] },
  workOrders: { view: ['OWNER', 'MANAGER', 'SUPERVISOR'], manage: ['OWNER', 'MANAGER'] },
  productionOrders: { view: ['OWNER', 'MANAGER', 'SUPERVISOR', 'WORKER'], manage: ['OWNER', 'MANAGER', 'SUPERVISOR'] },
  dailyProductionEntry: { view: ['OWNER', 'MANAGER', 'SUPERVISOR', 'WORKER'], manage: ['OWNER', 'MANAGER', 'SUPERVISOR', 'WORKER'] },
  fabricRolls: { view: ALL_ROLES, manage: ['OWNER', 'MANAGER', 'SUPERVISOR'] },
  inventory: { view: ['OWNER', 'MANAGER', 'SUPERVISOR', 'ACCOUNTANT'], manage: ['OWNER', 'MANAGER'] },
  inventoryTransactions: { view: ['OWNER', 'MANAGER', 'SUPERVISOR', 'ACCOUNTANT'], manage: ['OWNER', 'MANAGER', 'SUPERVISOR'] },
  rawMaterialConsumption: { view: ['OWNER', 'MANAGER', 'SUPERVISOR'] },
  suppliers: { view: ['OWNER', 'MANAGER', 'ACCOUNTANT'], manage: ['OWNER', 'MANAGER'] },
  purchaseOrders: { view: ['OWNER', 'MANAGER', 'ACCOUNTANT'], manage: ['OWNER', 'MANAGER'] },
  customers: { view: ['OWNER', 'MANAGER', 'ACCOUNTANT'], manage: ['OWNER', 'MANAGER'] },
  salesOrders: { view: ['OWNER', 'MANAGER', 'ACCOUNTANT'], manage: ['OWNER', 'MANAGER'] },
  qualityControl: { view: ALL_ROLES, manage: ['OWNER', 'MANAGER', 'SUPERVISOR'] },
  packing: { view: ['OWNER', 'MANAGER', 'SUPERVISOR', 'WORKER'], manage: ['OWNER', 'MANAGER', 'SUPERVISOR', 'WORKER'] },
  dispatch: { view: ['OWNER', 'MANAGER', 'SUPERVISOR'], manage: ['OWNER', 'MANAGER', 'SUPERVISOR'] },
  vehicles: { view: ['OWNER', 'MANAGER', 'SUPERVISOR'], manage: ['OWNER', 'MANAGER'] },
  expenses: { view: ['OWNER', 'MANAGER', 'ACCOUNTANT'], manage: ['OWNER', 'ACCOUNTANT'] },
  electricityMonitoring: { view: ['OWNER', 'MANAGER', 'SUPERVISOR'], manage: ['OWNER', 'MANAGER', 'SUPERVISOR'] },
  waterMonitoring: { view: ['OWNER', 'MANAGER', 'SUPERVISOR'], manage: ['OWNER', 'MANAGER', 'SUPERVISOR'] },
  workerProductivity: { view: ['OWNER', 'MANAGER', 'SUPERVISOR'], manage: ['OWNER', 'MANAGER', 'SUPERVISOR'] },
  wasteManagement: { view: ['OWNER', 'MANAGER', 'SUPERVISOR'], manage: ['OWNER', 'MANAGER', 'SUPERVISOR'] },
  reports: { view: ['OWNER', 'MANAGER', 'ACCOUNTANT'] },
  notifications: { view: ALL_ROLES },
  auditLogs: { view: ['OWNER', 'MANAGER'] },
};

export function can(role, moduleName, action) {
  if (role === 'OWNER') return true;
  const moduleDef = PERMISSIONS[moduleName];
  if (!moduleDef) return false;
  const allowedRoles = moduleDef[action];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}
