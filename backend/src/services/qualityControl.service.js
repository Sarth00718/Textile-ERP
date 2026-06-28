const repo = require('../repositories/qualityControl.repository');
const fabricRollRepo = require('../repositories/fabricRoll.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');
const { withTransaction } = require('../config/db');

async function listInspections(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.list({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function getInspection(id) {
  const insp = await repo.findById(id);
  if (!insp) throw ApiError.notFound('Quality inspection record not found');
  return insp;
}

/**
 * Recording a QC inspection result must, in one transaction, also advance
 * the fabric roll's status: PASS -> QC_PASSED (enabling Packing per the
 * workflow spec), FAIL -> QC_FAILED, REWORK -> back to IN_QC for re-check.
 */
async function recordInspection(data) {
  const roll = await fabricRollRepo.findById(data.fabricRollId);
  if (!roll) throw ApiError.notFound('Fabric roll not found');
  if (!['PRODUCED', 'IN_QC', 'QC_FAILED'].includes(roll.status)) {
    throw ApiError.conflict(`Cannot record a QC inspection for a roll with status ${roll.status}`);
  }

  const rollStatusMap = { PASS: 'QC_PASSED', FAIL: 'QC_FAILED', REWORK: 'IN_QC' };

  return withTransaction(async (client) => {
    const inspection = await repo.create(data, client);
    await fabricRollRepo.setStatus(data.fabricRollId, rollStatusMap[data.result], client);
    return inspection;
  });
}

module.exports = { listInspections, getInspection, recordInspection };
