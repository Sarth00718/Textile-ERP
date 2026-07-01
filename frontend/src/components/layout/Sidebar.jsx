import { NavLink } from 'react-router-dom';
import {
  Squares2X2Icon, BuildingOffice2Icon, UsersIcon, ClockIcon, CalendarDaysIcon,
  BanknotesIcon, CogIcon, DocumentTextIcon, ClipboardDocumentListIcon,
  ArchiveBoxIcon, TruckIcon, BuildingStorefrontIcon, ShoppingCartIcon,
  CheckBadgeIcon, CubeIcon, ChartBarIcon, BellIcon, ShieldCheckIcon,
  BoltIcon, BeakerIcon, TrashIcon, WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { usePermission } from '../../hooks/usePermission';
import { useUIStore } from '../../store/uiStore';

const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', to: '/', icon: Squares2X2Icon, module: 'dashboard' }],
  },
  {
    title: 'Workforce',
    items: [
      { label: 'Departments', to: '/departments', icon: BuildingOffice2Icon, module: 'departments' },
      { label: 'Employees', to: '/employees', icon: UsersIcon, module: 'employees' },
      { label: 'Attendance', to: '/attendance', icon: ClockIcon, module: 'attendance' },
      { label: 'Leave', to: '/leave', icon: CalendarDaysIcon, module: 'leave' },
      { label: 'Payroll', to: '/payroll', icon: BanknotesIcon, module: 'payroll' },
    ],
  },
  {
    title: 'Machines',
    items: [
      { label: 'Machines', to: '/machines', icon: CogIcon, module: 'machines' },
      { label: 'Machine Logs', to: '/machines/logs', icon: DocumentTextIcon, module: 'machineLogs' },
      { label: 'Breakdowns', to: '/machines/breakdowns', icon: WrenchScrewdriverIcon, module: 'machineBreakdown' },
      { label: 'Maintenance', to: '/machines/maintenance', icon: WrenchScrewdriverIcon, module: 'machineMaintenance' },
      { label: 'Beams', to: '/beams', icon: ClipboardDocumentListIcon, module: 'beams' },
      { label: 'Beam Allocation', to: '/beams/allocations', icon: ClipboardDocumentListIcon, module: 'beamAllocation' },
    ],
  },
  {
    title: 'Production',
    items: [
      { label: 'Fabric Designs', to: '/fabric-designs', icon: BeakerIcon, module: 'fabricDesign' },
      { label: 'Production Plans', to: '/production/plans', icon: ClipboardDocumentListIcon, module: 'productionPlanning' },
      { label: 'Work Orders', to: '/production/work-orders', icon: ClipboardDocumentListIcon, module: 'workOrders' },
      { label: 'Production Orders', to: '/production/orders', icon: ClipboardDocumentListIcon, module: 'productionOrders' },
      { label: 'Daily Entry', to: '/production/daily-entries', icon: DocumentTextIcon, module: 'dailyProductionEntry' },
      { label: 'Fabric Rolls', to: '/fabric-rolls', icon: CubeIcon, module: 'fabricRolls' },
    ],
  },
  {
    title: 'Inventory & Procurement',
    items: [
      { label: 'Inventory', to: '/inventory', icon: ArchiveBoxIcon, module: 'inventory' },
      { label: 'RM Consumption', to: '/inventory/consumption', icon: ArchiveBoxIcon, module: 'rawMaterialConsumption' },
      { label: 'Suppliers', to: '/suppliers', icon: BuildingStorefrontIcon, module: 'suppliers' },
      { label: 'Purchase Orders', to: '/purchase-orders', icon: ShoppingCartIcon, module: 'purchaseOrders' },
    ],
  },
  {
    title: 'Sales & Fulfillment',
    items: [
      { label: 'Customers', to: '/customers', icon: UsersIcon, module: 'customers' },
      { label: 'Sales Orders', to: '/sales-orders', icon: ShoppingCartIcon, module: 'salesOrders' },
      { label: 'Quality Control', to: '/quality-control', icon: CheckBadgeIcon, module: 'qualityControl' },
      { label: 'Packing', to: '/packing', icon: ArchiveBoxIcon, module: 'packing' },
      { label: 'Dispatch', to: '/dispatch', icon: TruckIcon, module: 'dispatch' },
      { label: 'Vehicles', to: '/vehicles', icon: TruckIcon, module: 'vehicles' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Expenses', to: '/expenses', icon: BanknotesIcon, module: 'expenses' },
      { label: 'Electricity', to: '/operations/electricity', icon: BoltIcon, module: 'electricityMonitoring' },
      { label: 'Water', to: '/operations/water', icon: BeakerIcon, module: 'waterMonitoring' },
      { label: 'Worker Productivity', to: '/operations/productivity', icon: ChartBarIcon, module: 'workerProductivity' },
      { label: 'Waste Management', to: '/operations/waste', icon: TrashIcon, module: 'wasteManagement' },
    ],
  },
  {
    title: 'Reports',
    items: [
      { label: 'Reports Hub', to: '/reports', icon: ChartBarIcon, module: 'reports' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Notifications', to: '/notifications', icon: BellIcon, module: 'notifications' },
      { label: 'Audit Logs', to: '/audit-logs', icon: ShieldCheckIcon, module: 'auditLogs' },
      { label: 'Factory Settings', to: '/settings', icon: CogIcon, module: 'factorySettings' },
    ],
  },
];

export default function Sidebar({ collapsed, mobileOpen = false, onClose = () => {} }) {
  const { can } = usePermission();
  const publicSettings = useUIStore((s) => s.publicSettings);
  const factoryName = publicSettings?.factoryName || 'Shivay Textiles';
  const initialLetter = factoryName.trim()[0]?.toUpperCase() || 'S';
  const widthClass = collapsed ? 'w-16' : 'w-56';
  const mobileTransform = mobileOpen ? 'translate-x-0' : '-translate-x-full';

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-steel-950/50 transition-opacity duration-300 sm:hidden ${
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-steel-200 dark:border-steel-700 bg-white dark:bg-steel-900 transition-all duration-300 ${widthClass} ${mobileTransform} sm:static sm:translate-x-0`}
      >
        <div className="sticky top-0 z-40 flex h-14 min-h-14 min-w-0 items-center gap-2 border-b border-steel-200 dark:border-steel-700 px-3 bg-white dark:bg-steel-900">
          <div className="h-6 w-6 shrink-0 rounded bg-amber-500 flex items-center justify-center font-bold text-steel-950 text-xs">{initialLetter}</div>
          {!collapsed && <span className="font-semibold text-steel-900 dark:text-steel-50 text-sm truncate whitespace-nowrap leading-none">{factoryName}</span>}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-md p-1 text-steel-500 hover:bg-steel-100 dark:hover:bg-steel-800 sm:hidden"
            aria-label="Close sidebar"
          >
            X
          </button>
        </div>

        <nav className="px-2 py-3 overflow-y-auto flex-1 scrollbar-thin">
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter((item) => can(item.module, 'view'));
            if (!visibleItems.length) return null;

            return (
              <div key={section.title} className="mb-4">
                {!collapsed && (
                  <div className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-steel-400">
                    {section.title}
                  </div>
                )}

                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={mobileOpen ? onClose : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium mb-0.5 transition-colors ${
                        isActive
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                          : 'text-steel-600 dark:text-steel-300 hover:bg-steel-100 dark:hover:bg-steel-800'
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
