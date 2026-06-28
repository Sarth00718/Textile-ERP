const repo = require('../repositories/dashboard.repository');

async function getDashboardSummary() {
  const [
    todaysProduction, machineCounts, pendingCounts, openBreakdowns, attendanceToday,
    inventoryAlerts, revenue, expenses, waste, yarnConsumption, utilities,
  ] = await Promise.all([
    repo.getTodaysProduction(),
    repo.getMachineCounts(),
    repo.getPendingCounts(),
    repo.getOpenBreakdownsCount(),
    repo.getAttendanceToday(),
    repo.getInventoryAlerts(),
    repo.getRevenueThisMonth(),
    repo.getExpensesThisMonth(),
    repo.getWasteThisMonth(),
    repo.getYarnConsumptionThisMonth(),
    repo.getElectricityWaterThisMonth(),
  ]);

  const totalActiveMachines = Object.values(machineCounts).reduce((a, b) => a + b, 0);
  const machineUtilization = totalActiveMachines > 0
    ? Math.round((machineCounts.RUNNING / totalActiveMachines) * 1000) / 10
    : 0;

  return {
    todaysProduction: {
      meters: Number(todaysProduction.total_meters),
      rejectedMeters: Number(todaysProduction.total_rejected),
    },
    machines: {
      running: machineCounts.RUNNING,
      idle: machineCounts.IDLE,
      breakdown: machineCounts.BREAKDOWN,
      maintenance: machineCounts.MAINTENANCE,
      offline: machineCounts.OFFLINE,
      utilizationPercent: machineUtilization,
    },
    breakdowns: { open: openBreakdowns },
    pending: pendingCounts,
    attendance: {
      present: Number(attendanceToday.present || 0),
      absent: Number(attendanceToday.absent || 0),
      onLeave: Number(attendanceToday.on_leave || 0),
      totalActiveEmployees: Number(attendanceToday.total_active || 0),
    },
    inventoryAlerts,
    financials: {
      revenueThisMonth: revenue,
      expensesThisMonth: expenses,
      netThisMonth: Math.round((revenue - expenses) * 100) / 100,
    },
    wasteThisMonthKg: waste,
    yarnConsumptionThisMonthKg: yarnConsumption,
    electricityUnitsThisMonth: utilities.electricityUnits,
    waterUnitsThisMonth: utilities.waterUnits,
  };
}

async function getCharts() {
  const [productionTrend, revenueTrend] = await Promise.all([
    repo.getProductionTrend(14),
    repo.getRevenueTrend(6),
  ]);
  return {
    production: productionTrend.map((r) => ({ date: r.entry_date, meters: Number(r.total) })),
    revenue: revenueTrend.map((r) => ({ month: r.month, amount: Number(r.total) })),
  };
}

module.exports = { getDashboardSummary, getCharts };
