const repo = require('../repositories/attendance.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');
const { withTransaction } = require('../config/db');

async function listAttendance(reqQuery) {
  if (reqQuery.format) {
    const { rows } = await repo.list({ ...reqQuery, limit: undefined, offset: undefined });
    return { items: rows };
  }
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.list({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function getAttendance(id) {
  const record = await repo.findById(id);
  if (!record) throw ApiError.notFound('Attendance record not found');
  return record;
}

async function markAttendance(data, userId) {
  return repo.upsert(data, userId);
}

async function bulkMarkAttendance(data, userId) {
  return withTransaction(async (client) => {
    const results = [];
    for (const record of data.records) {
      const result = await repo.upsert(
        { ...record, attendanceDate: data.attendanceDate },
        userId,
        client
      );
      results.push(result);
    }
    return results;
  });
}

async function updateAttendance(id, data) {
  await getAttendance(id);
  return repo.update(id, data);
}

async function deleteAttendance(id) {
  await getAttendance(id);
  await repo.remove(id);
}

module.exports = { listAttendance, getAttendance, markAttendance, bulkMarkAttendance, updateAttendance, deleteAttendance };
