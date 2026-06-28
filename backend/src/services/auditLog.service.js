const repo = require('../repositories/auditLog.repository');
const { getPagination, buildMeta } = require('../utils/queryHelpers');

async function listAuditLogs(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery, 50);
  const { rows, total } = await repo.list({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

module.exports = { listAuditLogs };
