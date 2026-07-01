import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useUIStore } from './store/uiStore';
import ProtectedRoute from './routes/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import { NotFoundPage, ForbiddenPage } from './pages/ErrorPages';

import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import FactorySettingsPage from './pages/settings/FactorySettingsPage';
import DepartmentsPage from './pages/departments/DepartmentsPage';
import EmployeesPage from './pages/employees/EmployeesPage';
import AttendancePage from './pages/attendance/AttendancePage';
import LeavePage from './pages/leave/LeavePage';
import PayrollPage from './pages/payroll/PayrollPage';
import MachinesPage from './pages/machines/MachinesPage';
import MachineLogsPage from './pages/machines/MachineLogsPage';
import MachineBreakdownsPage from './pages/machines/MachineBreakdownsPage';
import MachineMaintenancePage from './pages/machines/MachineMaintenancePage';
import BeamsPage from './pages/beams/BeamsPage';
import BeamAllocationPage from './pages/beams/BeamAllocationPage';
import FabricDesignsPage from './pages/fabricDesigns/FabricDesignsPage';
import ProductionPlansPage from './pages/production/ProductionPlansPage';
import WorkOrdersPage from './pages/production/WorkOrdersPage';
import ProductionOrdersPage from './pages/production/ProductionOrdersPage';
import DailyProductionEntryPage from './pages/production/DailyProductionEntryPage';
import FabricRollsPage from './pages/production/FabricRollsPage';
import InventoryPage from './pages/inventory/InventoryPage';
import RawMaterialConsumptionPage from './pages/inventory/RawMaterialConsumptionPage';
import SuppliersPage from './pages/suppliers/SuppliersPage';
import PurchaseOrdersPage from './pages/purchaseOrders/PurchaseOrdersPage';
import CustomersPage from './pages/customers/CustomersPage';
import SalesOrdersPage from './pages/salesOrders/SalesOrdersPage';
import QualityControlPage from './pages/qc/QualityControlPage';
import PackingPage from './pages/packing/PackingPage';
import DispatchPage from './pages/dispatch/DispatchPage';
import VehiclesPage from './pages/vehicles/VehiclesPage';
import ExpensesPage from './pages/expenses/ExpensesPage';
import ElectricityPage from './pages/operations/ElectricityPage';
import WaterPage from './pages/operations/WaterPage';
import WorkerProductivityPage from './pages/operations/WorkerProductivityPage';
import WasteManagementPage from './pages/operations/WasteManagementPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import AuditLogsPage from './pages/auditLogs/AuditLogsPage';
import ReportsPage from './pages/reports/ReportsPage';
import UserGuidePage from './pages/UserGuidePage';

export default function App() {
  const fetchPublicSettings = useUIStore((s) => s.fetchPublicSettings);

  useEffect(() => {
    fetchPublicSettings();
  }, [fetchPublicSettings]);

  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3500} theme="colored" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/403" element={<ForbiddenPage />} />

        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/settings" element={<FactorySettingsPage />} />
          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/leave" element={<LeavePage />} />
          <Route path="/payroll" element={<PayrollPage />} />
          <Route path="/machines" element={<MachinesPage />} />
          <Route path="/machines/logs" element={<MachineLogsPage />} />
          <Route path="/machines/breakdowns" element={<MachineBreakdownsPage />} />
          <Route path="/machines/maintenance" element={<MachineMaintenancePage />} />
          <Route path="/beams" element={<BeamsPage />} />
          <Route path="/beams/allocations" element={<BeamAllocationPage />} />
          <Route path="/fabric-designs" element={<FabricDesignsPage />} />
          <Route path="/production/plans" element={<ProductionPlansPage />} />
          <Route path="/production/work-orders" element={<WorkOrdersPage />} />
          <Route path="/production/orders" element={<ProductionOrdersPage />} />
          <Route path="/production/daily-entries" element={<DailyProductionEntryPage />} />
          <Route path="/fabric-rolls" element={<FabricRollsPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/inventory/consumption" element={<RawMaterialConsumptionPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/sales-orders" element={<SalesOrdersPage />} />
          <Route path="/quality-control" element={<QualityControlPage />} />
          <Route path="/packing" element={<PackingPage />} />
          <Route path="/dispatch" element={<DispatchPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/operations/electricity" element={<ElectricityPage />} />
          <Route path="/operations/water" element={<WaterPage />} />
          <Route path="/operations/productivity" element={<WorkerProductivityPage />} />
          <Route path="/operations/waste" element={<WasteManagementPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/reports/:reportType" element={<ReportsPage />} />
          <Route path="/user-guide" element={<UserGuidePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
