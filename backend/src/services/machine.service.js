const repo = require('../repositories/machine.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');

async function listMachines(reqQuery) {
  if (reqQuery.format) {
    const { rows } = await repo.list({ ...reqQuery, limit: undefined, offset: undefined });
    return { items: rows };
  }
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.list({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function getMachine(id) {
  const machine = await repo.findById(id);
  if (!machine) throw ApiError.notFound('Machine not found');
  return machine;
}

async function createMachine(data, userId) {
  const existing = await repo.findByCode(data.machineCode);
  if (existing) throw ApiError.conflict('A machine with this code already exists');
  return repo.create(data, userId);
}

async function updateMachine(id, data, userId) {
  await getMachine(id);
  return repo.update(id, data, userId);
}

async function deleteMachine(id) {
  await getMachine(id);
  await repo.remove(id);
}

async function getUtilization() {
  const summary = await repo.getUtilizationSummary();
  const counts = { RUNNING: 0, IDLE: 0, BREAKDOWN: 0, MAINTENANCE: 0, OFFLINE: 0 };
  let total = 0;
  for (const row of summary) {
    counts[row.status] = parseInt(row.count, 10);
    total += parseInt(row.count, 10);
  }
  const utilizationPercent = total > 0 ? Math.round((counts.RUNNING / total) * 1000) / 10 : 0;
  return { counts, total, utilizationPercent };
}

module.exports = { listMachines, getMachine, createMachine, updateMachine, deleteMachine, getUtilization };
