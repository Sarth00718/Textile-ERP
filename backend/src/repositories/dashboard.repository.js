const { query } = require('../config/db');

async function getTodaysProduction() {
  const { rows } = await query(
    `SELECT COALESCE(SUM(quantity_produced_meters),0) AS total_meters, COALESCE(SUM(quantity_rejected_meters),0) AS total_rejected
     FROM daily_production_entries WHERE entry_date = CURRENT_DATE`
  );
  return rows[0];
}

async function getMachineCounts() {
  const { rows } = await query(`SELECT status, COUNT(*) AS count FROM machines WHERE is_active = TRUE GROUP BY status`);
  const counts = { RUNNING: 0, IDLE: 0, BREAKDOWN: 0, MAINTENANCE: 0, OFFLINE: 0 };
  for (const r of rows) counts[r.status] = parseInt(r.count, 10);
  return counts;
}

async function getPendingCounts() {
  const qc = await query(`SELECT COUNT(*) FROM fabric_rolls WHERE status IN ('PRODUCED','IN_QC')`);
  const packing = await query(`SELECT COUNT(*) FROM fabric_rolls WHERE status = 'QC_PASSED'`);
  const dispatch = await query(`SELECT COUNT(*) FROM packing_records WHERE status = 'PACKED'`);
  return {
    pendingQC: parseInt(qc.rows[0].count, 10),
    pendingPacking: parseInt(packing.rows[0].count, 10),
    pendingDispatch: parseInt(dispatch.rows[0].count, 10),
  };
}

async function getOpenBreakdownsCount() {
  const { rows } = await query(`SELECT COUNT(*) FROM machine_breakdowns WHERE status != 'RESOLVED'`);
  return parseInt(rows[0].count, 10);
}

async function getAttendanceToday() {
  const { rows } = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'PRESENT') AS present,
       COUNT(*) FILTER (WHERE status = 'ABSENT') AS absent,
       COUNT(*) FILTER (WHERE status = 'ON_LEAVE') AS on_leave,
       (SELECT COUNT(*) FROM employees WHERE employment_status = 'ACTIVE') AS total_active
     FROM attendance WHERE attendance_date = CURRENT_DATE`
  );
  return rows[0];
}

async function getInventoryAlerts() {
  const { rows } = await query(`SELECT COUNT(*) FROM inventory_items WHERE current_stock <= reorder_level AND is_active = TRUE`);
  return parseInt(rows[0].count, 10);
}

async function getRevenueThisMonth() {
  const { rows } = await query(
    `SELECT COALESCE(SUM(amount_paid),0) AS total FROM sales_orders
     WHERE date_trunc('month', order_date) = date_trunc('month', CURRENT_DATE)`
  );
  return Number(rows[0].total);
}

async function getExpensesThisMonth() {
  const { rows } = await query(
    `SELECT COALESCE(SUM(amount),0) AS total FROM expenses
     WHERE date_trunc('month', expense_date) = date_trunc('month', CURRENT_DATE)`
  );
  return Number(rows[0].total);
}

async function getWasteThisMonth() {
  const { rows } = await query(
    `SELECT COALESCE(SUM(quantity_kg),0) AS total FROM waste_records
     WHERE date_trunc('month', waste_date) = date_trunc('month', CURRENT_DATE)`
  );
  return Number(rows[0].total);
}

async function getYarnConsumptionThisMonth() {
  const { rows } = await query(
    `SELECT COALESCE(SUM(quantity_consumed),0) AS total FROM raw_material_consumptions rmc
     JOIN inventory_items ii ON ii.id = rmc.inventory_item_id
     WHERE ii.category = 'YARN' AND date_trunc('month', rmc.consumption_date) = date_trunc('month', CURRENT_DATE)`
  );
  return Number(rows[0].total);
}

async function getElectricityWaterThisMonth() {
  const elec = await query(
    `SELECT COALESCE(SUM(units_consumed),0) AS units FROM electricity_readings
     WHERE date_trunc('month', reading_date) = date_trunc('month', CURRENT_DATE)`
  );
  const water = await query(
    `SELECT COALESCE(SUM(units_consumed),0) AS units FROM water_readings
     WHERE date_trunc('month', reading_date) = date_trunc('month', CURRENT_DATE)`
  );
  return { electricityUnits: Number(elec.rows[0].units), waterUnits: Number(water.rows[0].units) };
}

async function getProductionTrend(days = 14) {
  const { rows } = await query(
    `SELECT entry_date, SUM(quantity_produced_meters) AS total
     FROM daily_production_entries
     WHERE entry_date >= CURRENT_DATE - INTERVAL '${days} days'
     GROUP BY entry_date ORDER BY entry_date`
  );
  return rows;
}

async function getRevenueTrend(months = 6) {
  const { rows } = await query(
    `SELECT date_trunc('month', order_date) AS month, SUM(total_amount) AS total
     FROM sales_orders
     WHERE order_date >= CURRENT_DATE - INTERVAL '${months} months'
     GROUP BY month ORDER BY month`
  );
  return rows;
}

module.exports = {
  getTodaysProduction, getMachineCounts, getPendingCounts, getOpenBreakdownsCount,
  getAttendanceToday, getInventoryAlerts, getRevenueThisMonth, getExpensesThisMonth,
  getWasteThisMonth, getYarnConsumptionThisMonth, getElectricityWaterThisMonth,
  getProductionTrend, getRevenueTrend,
};
