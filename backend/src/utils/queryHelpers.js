/**
 * Builds OFFSET/LIMIT clause + safe pagination metadata from req.query.
 * Expects query.page (1-based) and query.pageSize.
 */
function getPagination(reqQuery, defaultPageSize = 20, maxPageSize = 200) {
  const page = Math.max(parseInt(reqQuery.page, 10) || 1, 1);
  let pageSize = parseInt(reqQuery.pageSize, 10) || defaultPageSize;
  pageSize = Math.min(Math.max(pageSize, 1), maxPageSize);
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset, limit: pageSize };
}

function buildMeta(total, page, pageSize) {
  return {
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

/**
 * Safely whitelist a sort column to avoid SQL injection via dynamic ORDER BY.
 */
function safeSortColumn(requested, allowedColumns, fallback) {
  if (requested && allowedColumns.includes(requested)) return requested;
  return fallback;
}

function safeSortDirection(requested) {
  return String(requested).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
}

module.exports = { getPagination, buildMeta, safeSortColumn, safeSortDirection };
