const bcrypt = require('bcryptjs');
const repo = require('../repositories/employee.repository');
const authRepo = require('../repositories/auth.repository');
const { query } = require('../config/db');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');
const { withTransaction } = require('../config/db');

async function listEmployees(reqQuery) {
  if (reqQuery.format) {
    const { rows } = await repo.list({ ...reqQuery, limit: undefined, offset: undefined });
    return { items: rows };
  }
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.list({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function getEmployee(id) {
  const emp = await repo.findById(id);
  if (!emp) throw ApiError.notFound('Employee not found');
  return emp;
}

async function createEmployee(data, userId) {
  return withTransaction(async (client) => {
    const employeeCode = await repo.generateEmployeeCode();

    let linkedUserId = null;
    if (data.createUserAccount) {
      if (!data.userEmail || !data.userPassword) {
        throw ApiError.badRequest('userEmail and userPassword are required when createUserAccount is true');
      }
      const existing = await authRepo.findUserByEmail(data.userEmail);
      if (existing) throw ApiError.conflict('A user account with this email already exists');
      const passwordHash = await bcrypt.hash(data.userPassword, 12);
      const newUser = await authRepo.createUser({
        fullName: data.fullName,
        email: data.userEmail,
        phone: data.phone,
        passwordHash,
        role: data.userRole || 'WORKER',
        departmentId: data.departmentId,
      });
      linkedUserId = newUser.id;
    }

    const { rows } = await client.query(
      `INSERT INTO employees (
        employee_code, user_id, full_name, gender, date_of_birth, phone, email, address,
        department_id, designation, date_of_joining, employment_status, salary_type,
        base_salary, piece_rate, bank_account_number, bank_ifsc,
        emergency_contact_name, emergency_contact_phone, photo_url, created_by, updated_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$21)
      RETURNING *`,
      [
        employeeCode,
        linkedUserId,
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
  });
}

async function updateEmployee(id, data, userId) {
  await getEmployee(id);
  return repo.update(id, data, userId);
}

async function deleteEmployee(id) {
  await getEmployee(id);
  // Guard: cannot terminate if currently assigned as operator on a running machine
  const { rows } = await query(
    `SELECT COUNT(*) FROM machines WHERE current_operator_id = $1 AND status = 'RUNNING'`,
    [id]
  );
  if (parseInt(rows[0].count, 10) > 0) {
    throw ApiError.conflict('Cannot terminate an employee who is the current operator of a running machine. Reassign the machine first.');
  }
  // Unlink them from any machines as operator
  await query('UPDATE machines SET current_operator_id = NULL, updated_at = NOW() WHERE current_operator_id = $1', [id]);
  await repo.remove(id);
}

module.exports = { listEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee };
