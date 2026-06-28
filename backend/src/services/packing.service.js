const repo = require('../repositories/packing.repository');
const fabricRollRepo = require('../repositories/fabricRoll.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');
const { withTransaction } = require('../config/db');

async function listPackingRecords(reqQuery) {
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

  return withTransaction(async (client) => {
    const record = await repo.create(data, client);
    await fabricRollRepo.setStatus(data.fabricRollId, 'PACKED', client);
    const packed = await repo.setStatus(record.id, 'PACKED', client);
    return packed;
  });
}

module.exports = { listPackingRecords, getPackingRecord, createPackingRecord };
