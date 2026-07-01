const repo = require('../repositories/payroll.repository');
const attendanceRepo = require('../repositories/attendance.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');
const { withTransaction } = require('../config/db');

function collectAffectedPeriods(startDate, endDate) {
  const periods = [];
  const cursor = new Date(startDate);
  const last = new Date(endDate);
  cursor.setDate(1);
  last.setDate(1);

  while (cursor <= last) {
    periods.push({ periodMonth: cursor.getMonth() + 1, periodYear: cursor.getFullYear() });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return periods;
}

function lastDayOfMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

function periodRange(month, year) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = `${year}-${String(month).padStart(2, '0')}-${lastDayOfMonth(month, year)}`;
  return { start, end };
}

async function listPayrollRuns(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.listRuns({ ...reqQuery, limit: reqQuery.format ? undefined : limit, offset: reqQuery.format ? undefined : offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function getPayrollRun(id) {
  const run = await repo.findRunById(id);
  if (!run) throw ApiError.notFound('Payroll run not found');
  const items = await repo.listItemsByRun(id);
  return { ...run, items };
}

/**
 * Generates (or regenerates, while DRAFT) a payroll run for the given month/year.
 * For every active employee:
 *  - Pulls the attendance summary for the period (days present/absent/on-leave, overtime)
 *  - Computes pro-rated base salary for MONTHLY staff, or daily/piece-rate equivalents
 *  - Applies a simple overtime rate (1.5x of (base/working hours)) — kept transparent
 *    and auditable rather than hidden inside a black-box formula.
 *  - Persists one payroll_items row per employee inside a single transaction.
 */
async function rebuildPayrollRun(periodMonth, periodYear, userId, client) {
  let run = await repo.findRunByPeriod(periodMonth, periodYear, client);
  if (run && run.status === 'PAID') {
    throw ApiError.conflict(`Payroll for ${periodMonth}/${periodYear} is already paid and cannot be regenerated`);
  }

  const { start, end } = periodRange(periodMonth, periodYear);
  const employees = await repo.listActiveEmployeesWithRange(client);

  if (!run) {
    run = await repo.createRun(periodMonth, periodYear, userId, client);
  }

  let totalAmount = 0;
  const STANDARD_WORKING_HOURS_PER_DAY = 8;
  const OVERTIME_MULTIPLIER = 1.5;

  for (const emp of employees) {
    const summary = await attendanceRepo.getSummaryForPeriod(emp.id, start, end, client);
    const daysPresent = Number(summary.days_present) || 0;
    const daysAbsent = Number(summary.days_absent) || 0;
    const daysOnLeave = Number(summary.days_on_leave) || 0;
    const halfDays = Number(summary.half_days) || 0;
    const overtimeHours = Number(summary.total_overtime_hours) || 0;

    const totalWorkingDaysInMonth = lastDayOfMonth(periodMonth, periodYear);
    let baseSalary = 0;
    let paidLeaveDays = daysOnLeave;

    if (emp.salary_type === 'MONTHLY') {
      const payableDays = daysPresent + halfDays * 0.5 + paidLeaveDays;
      baseSalary = (Number(emp.base_salary) / totalWorkingDaysInMonth) * payableDays;
    } else if (emp.salary_type === 'DAILY') {
      const payableDays = daysPresent + halfDays * 0.5;
      baseSalary = Number(emp.base_salary) * payableDays;
    } else if (emp.salary_type === 'PIECE_RATE') {
      baseSalary = Number(emp.base_salary || 0) * daysPresent;
    }

    const hourlyRate = Number(emp.base_salary) / totalWorkingDaysInMonth / STANDARD_WORKING_HOURS_PER_DAY;
    const overtimeAmount = isFinite(hourlyRate) ? hourlyRate * OVERTIME_MULTIPLIER * overtimeHours : 0;

    const productionBonus = 0;
    const deductions = 0;
    const netSalary = Math.round((baseSalary + overtimeAmount + productionBonus - deductions) * 100) / 100;

    await repo.insertItem(
      {
        payrollRunId: run.id,
        employeeId: emp.id,
        daysPresent,
        daysAbsent,
        daysOnLeave,
        paidLeaveDays,
        overtimeHours,
        baseSalary: Math.round(baseSalary * 100) / 100,
        overtimeAmount: Math.round(overtimeAmount * 100) / 100,
        productionBonus,
        deductions,
        netSalary,
      },
      client
    );

    totalAmount += netSalary;
  }

  const updatedRun = await repo.setRunStatus(run.id, 'GENERATED', Math.round(totalAmount * 100) / 100, client);
  const items = await repo.listItemsByRun(run.id, client);
  return { ...updatedRun, items };
}

async function generatePayrollRun({ periodMonth, periodYear }, userId) {
  return withTransaction((client) => rebuildPayrollRun(periodMonth, periodYear, userId, client));
}

async function recalculatePayrollForPeriods(periods, userId, client = null) {
  const uniquePeriods = [...new Map(periods.map((period) => [`${period.periodMonth}-${period.periodYear}`, period])).values()];
  const runRebuild = async (txClient) => {
    const results = [];
    for (const period of uniquePeriods) {
      const existingRun = await repo.findRunByPeriod(period.periodMonth, period.periodYear, txClient);
      if (existingRun && existingRun.status === 'PAID') {
        continue;
      }
      results.push(await rebuildPayrollRun(period.periodMonth, period.periodYear, userId, txClient));
    }
    return results;
  };

  return client ? runRebuild(client) : withTransaction(runRebuild);
}

async function markPayrollPaid(id) {
  const run = await repo.findRunById(id);
  if (!run) throw ApiError.notFound('Payroll run not found');
  if (run.status !== 'GENERATED') {
    throw ApiError.conflict('Only a generated payroll run can be marked as paid');
  }
  return withTransaction(async (client) => {
    const updated = await repo.setRunStatus(id, 'PAID', run.total_amount, client);
    await repo.markItemsPaid(id, client);
    return updated;
  });
}

module.exports = { listPayrollRuns, getPayrollRun, generatePayrollRun, markPayrollPaid, recalculatePayrollForPeriods, collectAffectedPeriods };
