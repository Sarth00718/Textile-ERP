const repo = require('../repositories/department.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');

async function listDepartments(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.list({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function getDepartment(id) {
  const dept = await repo.findById(id);
  if (!dept) throw ApiError.notFound('Department not found');
  return dept;
}

async function createDepartment(data, userId) {
  const existing = await repo.findByCode(data.code);
  if (existing) throw ApiError.conflict('A department with this code already exists');
  return repo.create(data, userId);
}

async function updateDepartment(id, data, userId) {
  await getDepartment(id);
  if (data.code) {
    const existing = await repo.findByCode(data.code);
    if (existing && existing.id !== id) throw ApiError.conflict('A department with this code already exists');
  }
  if (data.parentDepartmentId === id) {
    throw ApiError.badRequest('A department cannot be its own parent');
  }
  return repo.update(id, data, userId);
}

async function deleteDepartment(id) {
  await getDepartment(id);
  const inUse = await repo.hasEmployees(id);
  if (inUse) {
    throw ApiError.conflict('Cannot delete a department that still has employees assigned to it');
  }
  await repo.remove(id);
}

module.exports = { listDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment };
