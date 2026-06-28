const repo = require('../repositories/beam.repository');
const machineRepo = require('../repositories/machine.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');
const { withTransaction } = require('../config/db');

async function listBeams(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.listBeams({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function getBeam(id) {
  const beam = await repo.findBeamById(id);
  if (!beam) throw ApiError.notFound('Beam not found');
  return beam;
}

async function createBeam(data, userId) {
  const existing = await repo.findBeamByCode(data.beamCode);
  if (existing) throw ApiError.conflict('A beam with this code already exists');
  return repo.createBeam(data, userId);
}

async function updateBeam(id, data) {
  await getBeam(id);
  return repo.updateBeam(id, data);
}

async function deleteBeam(id) {
  const beam = await getBeam(id);
  if (beam.status === 'ALLOCATED' || beam.status === 'IN_USE') {
    throw ApiError.conflict('Cannot delete a beam that is currently allocated or in use');
  }
  await repo.removeBeam(id);
}

/**
 * Beam Allocation: Beam Preparation -> Beam Allocation -> Machine Assignment
 * (workflow spec). Allocating a beam to a machine must, in one transaction:
 *  - Verify beam is IN_STOCK and machine exists
 *  - Mark beam ALLOCATED and link it to the machine
 *  - Create the beam_allocations record
 */
async function allocateBeam(data, userId) {
  const beam = await repo.findBeamById(data.beamId);
  if (!beam) throw ApiError.notFound('Beam not found');
  if (beam.status !== 'IN_STOCK') {
    throw ApiError.conflict(`Beam must be IN_STOCK to be allocated (current status: ${beam.status})`);
  }
  const machine = await machineRepo.findById(data.machineId);
  if (!machine) throw ApiError.notFound('Machine not found');

  return withTransaction(async (client) => {
    const allocation = await repo.createAllocation(data, userId, client);
    await repo.setBeamStatus(data.beamId, 'ALLOCATED', data.machineId, client);
    return allocation;
  });
}

async function listAllocations(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.listAllocations({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function getAllocation(id) {
  const a = await repo.findAllocationById(id);
  if (!a) throw ApiError.notFound('Beam allocation not found');
  return a;
}

/**
 * Releasing an allocation frees the beam (EMPTY if fully consumed, else
 * back to IN_STOCK) and detaches it from the machine.
 */
async function releaseAllocation(id, metersUsed) {
  const allocation = await getAllocation(id);
  if (!allocation.is_active) {
    throw ApiError.conflict('This allocation has already been released');
  }
  const beam = await repo.findBeamById(allocation.beam_id);
  const remaining = Number(beam.length_meters || 0) - Number(metersUsed || 0);
  const newStatus = remaining <= 0 ? 'EMPTY' : 'IN_STOCK';

  return withTransaction(async (client) => {
    const released = await repo.releaseAllocation(id, metersUsed, client);
    await repo.setBeamStatus(allocation.beam_id, newStatus, null, client);
    return released;
  });
}

module.exports = {
  listBeams, getBeam, createBeam, updateBeam, deleteBeam,
  allocateBeam, listAllocations, getAllocation, releaseAllocation,
};
