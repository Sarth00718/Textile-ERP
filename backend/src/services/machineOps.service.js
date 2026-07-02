const repo = require('../repositories/machineOps.repository');
const machineRepo = require('../repositories/machine.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');
const { withTransaction } = require('../config/db');
const { notifyRoles } = require('./notification.service');

const EVENT_TO_MACHINE_STATUS = {
  START: 'RUNNING',
  STOP: 'IDLE',
  IDLE: 'IDLE',
  BREAKDOWN: 'BREAKDOWN',
  MAINTENANCE: 'MAINTENANCE',
};

/**
 * Recording a machine log event must also update the machine's current
 * status in the same transaction ("Production Entry -> Updates Machine Log
 * -> Updates Machine Utilization" from the workflow spec starts here:
 * Machine Utilization on the dashboard is derived live from machines.status).
 * A BREAKDOWN event additionally opens a machine_breakdowns record.
 */
async function recordLog(data, userId) {
  const machine = await machineRepo.findById(data.machineId);
  if (!machine) throw ApiError.notFound('Machine not found');

  return withTransaction(async (client) => {
    const log = await repo.createLog(data, client);
    const newStatus = EVENT_TO_MACHINE_STATUS[data.eventType];
    const operatorId = data.eventType === 'START' ? data.operatorId : undefined;
    await machineRepo.setStatus(data.machineId, newStatus, operatorId, client);

    if (data.eventType === 'BREAKDOWN') {
      await repo.createBreakdown(
        { machineId: data.machineId, reportedBy: data.operatorId, issueDescription: data.notes || 'Reported via machine log' },
        client
      );
    }
    return log;
  });
}

async function listLogs(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.listLogs({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

// ---- Breakdown ----

async function reportBreakdown(data, userId) {
  const machine = await machineRepo.findById(data.machineId);
  if (!machine) throw ApiError.notFound('Machine not found');

  const result = await withTransaction(async (client) => {
    const breakdown = await repo.createBreakdown(data, client);
    await machineRepo.setStatus(data.machineId, 'BREAKDOWN', undefined, client);
    return breakdown;
  });

  await notifyRoles({
    roles: ['OWNER', 'MANAGER', 'SUPERVISOR'],
    title: 'Machine Breakdown Reported',
    message: `${machine.name} (${machine.machine_code}) reported a breakdown: ${data.issueDescription}`,
    severity: 'CRITICAL',
    module: 'machineBreakdown',
    referenceType: 'machine_breakdowns',
    referenceId: result.id,
  }).catch(() => {});

  return result;
}

async function listBreakdowns(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.listBreakdowns({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function getBreakdown(id) {
  const b = await repo.findBreakdownById(id);
  if (!b) throw ApiError.notFound('Breakdown record not found');
  return b;
}

/**
 * Resolving a breakdown returns the machine to IDLE (ready for the next
 * production order) in the same transaction.
 */
async function resolveBreakdown(id, resolvedBy, resolutionNotes) {
  const breakdown = await getBreakdown(id);
  if (breakdown.status === 'RESOLVED') {
    throw ApiError.conflict('Breakdown is already resolved');
  }
  const result = await withTransaction(async (client) => {
    const resolved = await repo.resolveBreakdown(id, resolvedBy, resolutionNotes, client);
    await machineRepo.setStatus(breakdown.machine_id, 'IDLE', undefined, client);
    return resolved;
  });

  await notifyRoles({
    roles: ['OWNER', 'MANAGER', 'SUPERVISOR'],
    title: 'Breakdown Resolved',
    message: `Breakdown on machine ${breakdown.machine_name || breakdown.machine_id} has been resolved. Machine is now IDLE.`,
    severity: 'INFO',
    module: 'machineBreakdown',
    referenceType: 'machine_breakdowns',
    referenceId: id,
  }).catch(() => {});

  return result;
}

// ---- Maintenance ----

async function scheduleMaintenance(data, userId) {
  const machine = await machineRepo.findById(data.machineId);
  if (!machine) throw ApiError.notFound('Machine not found');
  const record = await repo.createMaintenance(data, userId);

  await notifyRoles({
    roles: ['OWNER', 'MANAGER', 'SUPERVISOR'],
    title: 'Maintenance Scheduled',
    message: `${data.maintenanceType || 'Preventive'} maintenance scheduled for ${machine.name} (${machine.machine_code}) on ${data.scheduledDate}.`,
    severity: 'INFO',
    module: 'machineMaintenance',
    referenceType: 'machine_maintenance',
    referenceId: record.id,
  }).catch(() => {});

  return record;
}

async function listMaintenance(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.listMaintenance({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function getMaintenance(id) {
  const m = await repo.findMaintenanceById(id);
  if (!m) throw ApiError.notFound('Maintenance record not found');
  return m;
}

async function updateMaintenance(id, data) {
  const existing = await getMaintenance(id);

  const result = await withTransaction(async (client) => {
    const updated = await repo.updateMaintenance(id, data, client);
    if (data.status === 'IN_PROGRESS') {
      await machineRepo.setStatus(existing.machine_id, 'MAINTENANCE', undefined, client);
    } else if (data.status === 'COMPLETED' || data.status === 'CANCELLED') {
      await machineRepo.setStatus(existing.machine_id, 'IDLE', undefined, client);
    }
    return updated;
  });

  if (data.status === 'COMPLETED') {
    const machine = await machineRepo.findById(existing.machine_id);
    await notifyRoles({
      roles: ['OWNER', 'MANAGER', 'SUPERVISOR'],
      title: 'Maintenance Completed',
      message: `Maintenance on ${machine?.name || 'machine'} has been completed and the machine is back IDLE.`,
      severity: 'INFO',
      module: 'machineMaintenance',
      referenceType: 'machine_maintenance',
      referenceId: id,
    }).catch(() => {});
  }

  return result;
}

module.exports = {
  recordLog, listLogs,
  reportBreakdown, listBreakdowns, getBreakdown, resolveBreakdown,
  scheduleMaintenance, listMaintenance, getMaintenance, updateMaintenance,
};
