const utilityRepo = require('../repositories/utilityMonitoring.repository');
const productivityRepo = require('../repositories/workerProductivity.repository');
const wasteRepo = require('../repositories/waste.repository');
const { getPagination, buildMeta } = require('../utils/queryHelpers');

// ---- Electricity ----
async function createElectricityReading(data, userId) {
  return utilityRepo.createElectricityReading(data, userId);
}
async function listElectricityReadings(reqQuery) {
  if (reqQuery.format) {
    const { rows } = await utilityRepo.listElectricityReadings({ ...reqQuery, limit: undefined, offset: undefined });
    return { items: rows };
  }
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await utilityRepo.listElectricityReadings({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

// ---- Water ----
async function createWaterReading(data, userId) {
  return utilityRepo.createWaterReading(data, userId);
}
async function listWaterReadings(reqQuery) {
  if (reqQuery.format) {
    const { rows } = await utilityRepo.listWaterReadings({ ...reqQuery, limit: undefined, offset: undefined });
    return { items: rows };
  }
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await utilityRepo.listWaterReadings({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

// ---- Worker Productivity ----
async function recordProductivity(data) {
  return productivityRepo.upsert(data);
}
async function listProductivity(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await productivityRepo.list({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

// ---- Waste Management ----
async function createWasteRecord(data, userId) {
  return wasteRepo.create(data, userId);
}
async function listWasteRecords(reqQuery) {
  if (reqQuery.format) {
    const { rows } = await wasteRepo.list({ ...reqQuery, limit: undefined, offset: undefined });
    return { items: rows };
  }
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await wasteRepo.list({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

module.exports = {
  createElectricityReading, listElectricityReadings,
  createWaterReading, listWaterReadings,
  recordProductivity, listProductivity,
  createWasteRecord, listWasteRecords,
};
