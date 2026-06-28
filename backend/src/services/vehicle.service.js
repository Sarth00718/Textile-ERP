const repo = require('../repositories/vehicle.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');

async function listVehicles(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.list({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function getVehicle(id) {
  const v = await repo.findById(id);
  if (!v) throw ApiError.notFound('Vehicle not found');
  return v;
}

async function createVehicle(data) {
  const existing = await repo.findByNumber(data.vehicleNumber);
  if (existing) throw ApiError.conflict('A vehicle with this number already exists');
  return repo.create(data);
}

async function updateVehicle(id, data) {
  await getVehicle(id);
  return repo.update(id, data);
}

async function deleteVehicle(id) {
  const v = await getVehicle(id);
  if (v.status === 'ON_TRIP') throw ApiError.conflict('Cannot delete a vehicle that is currently on a trip');
  await repo.remove(id);
}

module.exports = { listVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle };
