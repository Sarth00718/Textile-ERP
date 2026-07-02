const repo = require('../repositories/packing.repository');
const fabricRollRepo = require('../repositories/fabricRoll.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');
const { withTransaction } = require('../config/db');
const { notifyRoles } = require('./notification.service');

async function listPackingRecords(reqQuery) {
  if (reqQuery.format) {
    const { rows } = await repo.list({ ...reqQuery, limit: undefined, offset: undefined });
    return { items: rows };
  }
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.list({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function getPackingRecord(id) {
  const rec = await repo.findById(id);
  if (!rec) throw ApiError.notFound('Packing record not found');
  return rec;
}

/**
 * Packing a roll requires it to be QC_PASSED first (per workflow spec:
 * QC Pass -> Updates Roll Status -> Enables Packing). On success the roll
 * transitions to PACKED, which is the prerequisite the Dispatch module
 * checks before a roll can be loaded onto a dispatch.
 */
async function createPackingRecord(data) {
  const roll = await fabricRollRepo.findById(data.fabricRollId);
  if (!roll) throw ApiError.notFound('Fabric roll not found');
  if (roll.status !== 'QC_PASSED') {
    throw ApiError.conflict(`Roll must be QC_PASSED before packing (current status: ${roll.status})`);
  }

  const packed = await withTransaction(async (client) => {
    const record = await repo.create(data, client);
    await fabricRollRepo.setStatus(data.fabricRollId, 'PACKED', client);
    return repo.setStatus(record.id, 'PACKED', client);
  });

  // Notify managers that a roll is packed and ready to be included in a dispatch
  await notifyRoles({
    roles: ['OWNER', 'MANAGER'],
    title: 'Roll Ready for Dispatch',
    message: `Roll ${roll.roll_no} has been packed (${packed.package_no}) and is ready for dispatch.`,
    severity: 'INFO',
    module: 'packing',
    referenceType: 'packing_records',
    referenceId: packed.id,
  }).catch(() => {});

  return packed;
}

module.exports = { listPackingRecords, getPackingRecord, createPackingRecord };
