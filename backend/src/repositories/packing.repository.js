const { query } = require('../config/db');

async function nextPackageNumber(client = null) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `SELECT 'PKG-' || LPAD((COALESCE(MAX(SUBSTRING(package_no FROM 5)::INT), 0) + 1)::TEXT, 6, '0') AS next_no
     FROM packing_records WHERE package_no ~ '^PKG-[0-9]+$'`
  );
  return rows[0].next_no;
}

async function create(data, client = null) {
  const executor = client || { query };
  const packageNo = await nextPackageNumber(executor);
  const { rows } = await executor.query(
    `INSERT INTO packing_records (package_no, fabric_roll_id, packed_by, package_weight_kg, package_type, status)
     VALUES ($1,$2,$3,$4,$5,'PENDING') RETURNING *`,
    [packageNo, data.fabricRollId, data.packedBy || null, data.packageWeightKg || null, data.packageType || 'ROLL_BAG']
  );
  return rows[0];
}

async function list({ status, limit, offset }) {
  const conditions = [];
  const params = [];
  if (status) {
    params.push(status);
    conditions.push(`pr.status = $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM packing_records pr ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const baseQuery = `SELECT pr.*, fr.roll_no, fr.length_meters FROM packing_records pr
     JOIN fabric_rolls fr ON fr.id = pr.fabric_roll_id
     ${whereClause} ORDER BY pr.packed_at DESC`;

  if (limit === undefined) {
    const { rows } = await query(baseQuery, params);
    return { rows, total };
  }
  params.push(limit, offset);
  const { rows } = await query(`${baseQuery} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { rows, total };
}

async function findById(id) {
  const { rows } = await query(
    `SELECT pr.*, fr.roll_no, fr.length_meters, fr.fabric_design_id FROM packing_records pr
     JOIN fabric_rolls fr ON fr.id = pr.fabric_roll_id WHERE pr.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function setStatus(id, status, client = null) {
  const executor = client || { query };
  const { rows } = await executor.query('UPDATE packing_records SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
  return rows[0];
}

module.exports = { create, list, findById, setStatus, nextPackageNumber };
