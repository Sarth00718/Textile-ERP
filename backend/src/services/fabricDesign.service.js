const repo = require('../repositories/fabricDesign.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');

async function listDesigns(reqQuery) {
  if (reqQuery.format) {
    const { rows } = await repo.list({ ...reqQuery, limit: undefined, offset: undefined });
    return { items: rows };
  }
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.list({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function getDesign(id) {
  const design = await repo.findById(id);
  if (!design) throw ApiError.notFound('Fabric design not found');
  return design;
}

async function createDesign(data, userId) {
  const existing = await repo.findByCode(data.designCode);
  if (existing) throw ApiError.conflict('A fabric design with this code already exists');
  return repo.create(data, userId);
}

async function updateDesign(id, data) {
  await getDesign(id);
  return repo.update(id, data);
}

async function deleteDesign(id) {
  await getDesign(id);
  await repo.remove(id);
}

module.exports = { listDesigns, getDesign, createDesign, updateDesign, deleteDesign };
