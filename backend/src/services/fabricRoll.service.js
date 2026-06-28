const repo = require('../repositories/fabricRoll.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');

const VALID_TRANSITIONS = {
  PRODUCED: ['IN_QC'],
  IN_QC: ['QC_PASSED', 'QC_FAILED'],
  QC_PASSED: ['PACKED'],
  QC_FAILED: ['IN_QC'], // allow rework -> re-inspection
  PACKED: ['DISPATCHED'],
  DISPATCHED: [],
};

async function listRolls(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.list({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function getRoll(id) {
  const roll = await repo.findById(id);
  if (!roll) throw ApiError.notFound('Fabric roll not found');
  return roll;
}

async function updateRollStatus(id, newStatus) {
  const roll = await getRoll(id);
  const allowed = VALID_TRANSITIONS[roll.status] || [];
  if (!allowed.includes(newStatus)) {
    throw ApiError.badRequest(`Cannot transition fabric roll from ${roll.status} to ${newStatus}`);
  }
  return repo.setStatus(id, newStatus);
}

module.exports = { listRolls, getRoll, updateRollStatus };
