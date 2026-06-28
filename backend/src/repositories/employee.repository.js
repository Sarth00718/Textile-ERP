const { query } = require('../config/db');
const { safeSortColumn, safeSortDirection } = require('../utils/queryHelpers');

const SORTABLE = ['full_name', 'employee_code', 'date_of_joining', 'created_at'];

function nextEmployeeCodeQuery() {
  return `SELECT 'EMP-' || LPAD((COALESCE(MAX(SUBSTRING(employee_code FROM 5)::INT), 0) + 1)::TEXT, 5, '0') AS next_code
          FROM employees WHERE employee_code ~ '^EMP-[0-9]+$'`;
}

async function generateEmployeeCode() {
  const { rows } = await query(nextEmployeeCodeQuery());
  return rows[0].next_code;
}

async function list({ search, departmentId, employmentStatus, sortBy, sortDir, limit, offset }) {
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(e.full_name ILIKE $${params.length} OR e.employee_code ILIKE $${params.length} OR e.phone ILIKE $${params.length})`);
  }
  if (departmentId) {
    params.push(departmentId);
    conditions.push(`e.department_id = $${params.length}`);
  }
  if (employmentStatus) {
    params.push(employmentStatus);
    conditions.push(`e.employment_status = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortCol = safeSortColumn(sortBy, SORTABLE, 'full_name');
  const sortDirection = safeSortDirection(sortDir);

  const countRes = await query(`SELECT COUNT(*) FROM employees e ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const baseQuery = `
    SELECT e.*, d.name AS department_name
    FROM employees e
    LEFT JOIN departments d ON d.id = e.department_id
    ${whereClause}
    ORDER BY e.${sortCol} ${sortDirection}`;

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
    `SELECT e.*, d.name AS department_name FROM employees e
     LEFT JOIN departments d ON d.id = e.department_id WHERE e.id = $1`,
    [id]
  );
  return rows[0] || null;
}

const COLUMN_MAP = {
  fullName: 'full_name',
  gender: 'gender',
  dateOfBirth: 'date_of_birth',
  phone: 'phone',
  email: 'email',
  address: 'address',
  departmentId: 'department_id',
  designation: 'designation',
  dateOfJoining: 'date_of_joining',
  dateOfLeaving: 'date_of_leaving',
  employmentStatus: 'employment_status',
  salaryType: 'salary_type',
  baseSalary: 'base_salary',
  pieceRate: 'piece_rate',
  bankAccountNumber: 'bank_account_number',
  bankIfsc: 'bank_ifsc',
  emergencyContactName: 'emergency_contact_name',
  emergencyContactPhone: 'emergency_contact_phone',
  photoUrl: 'photo_url',
};

async function create(data, employeeCode, userId, linkedUserId) {
  const { rows } = await query(
    `INSERT INTO employees (
      employee_code, user_id, full_name, gender, date_of_birth, phone, email, address,
      department_id, designation, date_of_joining, employment_status, salary_type,
      base_salary, piece_rate, bank_account_number, bank_ifsc,
      emergency_contact_name, emergency_contact_phone, photo_url, created_by, updated_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$21)
    RETURNING *`,
    [
      employeeCode,
      linkedUserId || null,
      data.fullName,
      data.gender || null,
      data.dateOfBirth || null,
      data.phone || null,
      data.email || null,
      data.address || null,
      data.departmentId || null,
      data.designation || null,
      data.dateOfJoining || new Date().toISOString().slice(0, 10),
      data.employmentStatus || 'ACTIVE',
      data.salaryType || 'MONTHLY',
      data.baseSalary || 0,
      data.pieceRate || null,
      data.bankAccountNumber || null,
      data.bankIfsc || null,
      data.emergencyContactName || null,
      data.emergencyContactPhone || null,
      data.photoUrl || null,
      userId,
    ]
  );
  return rows[0];
}

async function update(id, data, userId) {
  const fields = [];
  const params = [];
  for (const [key, col] of Object.entries(COLUMN_MAP)) {
    if (data[key] !== undefined) {
      params.push(data[key]);
      fields.push(`${col} = $${params.length}`);
    }
  }
  if (!fields.length) return findById(id);
  params.push(userId);
  fields.push(`updated_by = $${params.length}`);
  fields.push('updated_at = NOW()');
  params.push(id);
  const { rows } = await query(`UPDATE employees SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] || null;
}

async function remove(id) {
  await query('DELETE FROM employees WHERE id = $1', [id]);
}

module.exports = { list, findById, create, update, remove, generateEmployeeCode };
