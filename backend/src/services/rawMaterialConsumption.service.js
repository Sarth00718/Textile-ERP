const repo = require('../repositories/rawMaterialConsumption.repository');
const { getPagination, buildMeta } = require('../utils/queryHelpers');

async function listConsumptions(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.list({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

module.exports = { listConsumptions };
