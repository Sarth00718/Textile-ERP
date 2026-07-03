const repo = require('../repositories/fabricRoll.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');

/**
 * Valid manual status transitions for fabric rolls.
 * The only transition an operator can trigger manually via the UI is
 * PRODUCED -> IN_QC (sending a roll to the QC queue).
 * All other transitions are driven automatically:
 *   QC service: IN_QC -> QC_PASSED | QC_FAILED | IN_QC (rework)
 *   Packing service: QC_PASSED -> PACKED
 *   Dispatch service: PACKED -> DISPATCHED
 *
 * This prevents operators from skipping stages (e.g. PRODUCED -> PACKED).
 */
const VALID_MANUAL_TRANSITIONS = {
  PRODUCED:   ['IN_QC'],
  IN_QC:      [],          // controlled by QC service
  QC_PASSED:  [],          // controlled by packing service
  QC_FAILED:  ['IN_QC'],   // allow re-submission to QC queue
  PACKED:     [],          // controlled by dispatch service
  DISPATCHED: [],
};

async function listRolls(reqQuery) {
  if (reqQuery.format) {
    const { rows } = await repo.list({ ...reqQuery, limit: undefined, offset: undefined });
    return { items: rows };
  }
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
  const allowed = VALID_MANUAL_TRANSITIONS[roll.status] || [];
  if (!allowed.includes(newStatus)) {
    throw ApiError.badRequest(
      `Cannot manually transition fabric roll from ${roll.status} to ${newStatus}. ` +
      `Valid transitions: ${allowed.length ? allowed.join(', ') : 'none (this stage is system-controlled)'}.`
    );
  }
  return repo.setStatus(id, newStatus);
}

module.exports = { listRolls, getRoll, updateRollStatus };
