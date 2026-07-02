const repo = require('../repositories/qualityControl.repository');
const fabricRollRepo = require('../repositories/fabricRoll.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');
const { withTransaction } = require('../config/db');
const { notifyRoles } = require('./notification.service');

async function listInspections(reqQuery) {
  if (reqQuery.format) {
    const { rows } = await repo.list({ ...reqQuery, limit: undefined, offset: undefined });
    return { items: rows };
  }
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

  const inspection = await withTransaction(async (client) => {
    const record = await repo.create(data, client);
    await fabricRollRepo.setStatus(data.fabricRollId, rollStatusMap[data.result], client);
    return record;
  });

  // Notify supervisors on QC failure — requires immediate attention
  if (data.result === 'FAIL') {
    await notifyRoles({
      roles: ['OWNER', 'MANAGER', 'SUPERVISOR'],
      title: 'QC Inspection Failed',
      message: `Roll ${roll.roll_no} failed quality inspection.${data.defectType ? ` Defect type: ${data.defectType}.` : ''} Immediate action required.`,
      severity: 'WARNING',
      module: 'qualityControl',
      referenceType: 'quality_inspections',
      referenceId: inspection.id,
    }).catch(() => {});
  }

  return inspection;
}

module.exports = { listInspections, getInspection, recordInspection };
