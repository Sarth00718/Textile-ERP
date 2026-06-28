import { useState } from 'react';
import { useUIStore } from '../store/uiStore';
import { Card, PageHeader } from '../components/common/Shared';
import {
  CommandLineIcon,
  KeyIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  CpuChipIcon,
  CubeIcon,
  BanknotesIcon,
  BriefcaseIcon,
  UserIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';

const TABS = [
  { id: 'getting-started', label: 'Getting Started', icon: CommandLineIcon },
  { id: 'rbac', label: 'RBAC & Security', icon: ShieldCheckIcon },
  { id: 'workflows', label: 'Core Workflows', icon: WrenchScrewdriverIcon },
  { id: 'modules', label: 'Module Catalog', icon: CpuChipIcon },
];

const MODULE_GROUPS = [
  {
    title: 'Group 1: Authentication & Dashboard',
    icon: LockClosedIcon,
    modules: [
      {
        name: '1. Authentication',
        description: 'Secure, JWT-token based user sessions, tracking user role and active state.',
        rbac: 'All Roles: Login, Logout, Token Refresh',
        howItWorks: 'Users input their email and password. Backend validates passwords, generates JWT access & refresh tokens, and serves authorized content. Session details are cached in local storage via authStore.'
      },
      {
        name: '2. Dashboard',
        description: 'The master operational summary screen aggregating factory performance and alerts.',
        rbac: 'All Roles: View Dashboard Summary',
        howItWorks: 'Pulls data from active tables to show Total Production (Meters), Loom Machine Status (Running/Stopped/Idle), pending leaves, low stock alerts, and production/expense trend line charts.'
      }
    ]
  },
  {
    title: 'Group 2: Core Settings & Auditing',
    icon: Cog6ToothIcon,
    modules: [
      {
        name: '3. Factory Settings',
        description: 'System-wide variables, company info, utility unit pricing, and shift definitions.',
        rbac: 'Owner: View & Manage | Manager: View Only | Others: No Access',
        howItWorks: 'Set factory identity (name, logos) which dynamically changes branding everywhere. Enter shift timings (Shift A/B/C) and electricity/water unit rates for utility calculation.'
      },
      {
        name: '4. Audit Logs',
        description: 'An immutable database logging system tracking all record creations, updates, and deletes.',
        rbac: 'Owner & Manager: View Only | Others: No Access',
        howItWorks: 'Automatically intercepts all mutations in the database, logging the timestamp, operator user ID, action type, IP address, and JSON differences (old values vs. new values).'
      },
      {
        name: '5. Notifications',
        description: 'Real-time and static alerts notifying specific workers or roles of operational events.',
        rbac: 'All Roles: Read & Clear own notifications',
        howItWorks: 'Triggered automatically when a raw material falls below safety limits, when a worker logs a loom breakdown, or when a leave request is submitted. Appears on the top navbar.'
      }
    ]
  },
  {
    title: 'Group 3: Workforce & Admin',
    icon: BriefcaseIcon,
    modules: [
      {
        name: '6. Departments',
        description: 'Hierarchical division mapping for factory employees and spaces.',
        rbac: 'Owner/Manager: Manage | Supervisor/Accountant: View | Workers: No Access',
        howItWorks: 'Add department names, code tags (e.g. SIZ-01, WEA-02), and select parent departments for complex hierarchies.'
      },
      {
        name: '7. Employees',
        description: 'Comprehensive directory of factory staff, salary structures, and credentials.',
        rbac: 'Owner/Manager: Manage | Supervisor/Accountant: View | Workers: No Access',
        howItWorks: 'Register personal details, active status, job profiles, user accounts, basic salaries, daily overtime rates, and department links.'
      },
      {
        name: '8. Attendance',
        description: 'Daily clock-in/out tracker computing active hours and overtime durations.',
        rbac: 'Owner/Manager/Supervisor: Manage | Accountant: View | Workers: No Access',
        howItWorks: 'Log check-in, check-out, and attendance status (Present, Absent, Half-Day). Overtime is calculated for hours exceeding the standard 8-hour shift.'
      },
      {
        name: '9. Leave Management',
        description: 'A complete approval pipeline for worker leaves (Sick, Paid, Unpaid).',
        rbac: 'Owner/Manager/Supervisor: Approve/Reject | Workers: Submit Requests',
        howItWorks: 'Workers request leaves with dates and reasons. Authorities receive notifications and approve/reject them. Unpaid leaves trigger automatic salary deductions in Payroll.'
      },
      {
        name: '10. Payroll',
        description: 'Automated monthly salary calculation engine.',
        rbac: 'Owner/Accountant: Manage | Manager: View | Others: No Access',
        howItWorks: 'Click Run Payroll for a month. System reads employee active salary, counts attendance days, adds overtime hours from attendance registers, deducts unpaid leaves, and generates payslips.'
      }
    ]
  },
  {
    title: 'Group 4: Floor & Looms',
    icon: WrenchScrewdriverIcon,
    modules: [
      {
        name: '11. Machine Management',
        description: 'Registers loom machine types, technical capacities, speeds, and status.',
        rbac: 'Owner/Manager/Supervisor: Manage | Worker: View Only',
        howItWorks: 'Add looms (Rapier, Air Jet), logging speed (RPM), max width, and status. Monitored on shop floors in real-time.'
      },
      {
        name: '12. Machine Logs',
        description: 'Tracks state transitions (Running, Idle, Maintenance) of shop floor machinery.',
        rbac: 'Owner/Manager/Supervisor: Manage | Worker: Submit logs',
        howItWorks: 'Create logs when machines stop or start, selecting reason tags (Warp break, Weft break, Beam empty, No operator) to calculate OEE.'
      },
      {
        name: '13. Machine Breakdown',
        description: 'Reports machine faults and logs troubleshooting details.',
        rbac: 'Worker: Submit breakdown requests | Owner/Manager/Supervisor: Assign technician & log resolution',
        howItWorks: 'A worker logs an issue. Loom status updates to "Stopped". Maintenance is assigned. Once fixed, log repair costs, resolution time, and change status back to "Available".'
      },
      {
        name: '14. Machine Maintenance',
        description: 'Schedules preventive checkups and keeps track of loom service costs.',
        rbac: 'Owner/Manager/Supervisor: Manage | Others: No Access',
        howItWorks: 'Schedule servicing dates and types (Routine, Overhaul). Record completion details, oil changes, spare parts, and technician fees.'
      },
      {
        name: '15. Beam Management',
        description: 'Tracks warp and weft beams prepared in the sizing section.',
        rbac: 'Owner/Manager/Supervisor: Manage | Worker: View Only',
        howItWorks: 'Log beam ID, end count, total sized meters, yarn specs, and status (In Stock, Mounted, Empty).'
      },
      {
        name: '16. Beam Allocation',
        description: 'Tracks mounting of warp beams onto looms.',
        rbac: 'Owner/Manager/Supervisor: Manage | Worker: View Only',
        howItWorks: 'Allocate a beam to a loom. When the warp runs out, click Release Beam, record the release date, and mark the beam status as empty.'
      }
    ]
  },
  {
    title: 'Group 5: Design & Production Planning',
    icon: CubeIcon,
    modules: [
      {
        name: '17. Fabric Design',
        description: 'Master specifications of fabrics to be manufactured.',
        rbac: 'Owner/Manager: Manage | Others: View Only',
        howItWorks: 'Define Design Code, GSM weight, width in inches, warp density (ends/inch), weft density (picks/inch), and standard sales price.'
      },
      {
        name: '18. Production Planning',
        description: 'Schedules high-level production targets and dates.',
        rbac: 'Owner/Manager: Manage | Supervisor: View Only',
        howItWorks: 'Create plans matching design codes. Input target meters, starting dates, and estimated completion times.'
      },
      {
        name: '19. Work Orders',
        description: 'Translates high-level production plans into clear shop commands.',
        rbac: 'Owner/Manager: Manage | Supervisor: View Only',
        howItWorks: 'Issue work orders referencing an active plan, setting the precise meters and batch parameters.'
      },
      {
        name: '20. Production Orders',
        description: 'Allocates work orders to specific looms and operators.',
        rbac: 'Owner/Manager/Supervisor: Manage | Worker: View Only',
        howItWorks: 'Assign loom machines and shift operators to fulfill a work order. Changes loom status to "Running".'
      }
    ]
  },
  {
    title: 'Group 6: Daily Operations & Output',
    icon: CheckCircleIcon,
    modules: [
      {
        name: '21. Daily Production Entry',
        description: 'Logs runtime metrics at the end of every shift.',
        rbac: 'All Roles: Create/Log Entries',
        howItWorks: 'Enter shift meters produced, pick counts, and break rates (warp/weft). The system automatically calculates loom operating efficiency.'
      },
      {
        name: '22. Fabric Roll Management',
        description: 'Registers finished rolls cut from looms.',
        rbac: 'Owner/Manager/Supervisor: Manage | Worker: Create/Cut logs',
        howItWorks: 'Enter Roll ID, cut length (meters), and weight. The roll is marked as "Pending QC".'
      },
      {
        name: '23. Quality Control (QC)',
        description: 'Inspects and grades completed fabric rolls.',
        rbac: 'Owner/Manager/Supervisor: Perform inspections | Others: View Only',
        howItWorks: 'Inspect rolls for defects. Log stain counts, warp breaks, weft breaks, and assign Grade A, B, C, or Rejected.'
      },
      {
        name: '24. Worker Productivity',
        description: 'Analyzes individual weaver efficiency.',
        rbac: 'Owner/Manager/Supervisor: View Only',
        howItWorks: 'The dashboard compiles shift entries to compare weaver outputs, target completion metrics, and highlight top performers.'
      },
      {
        name: '25. Waste Management',
        description: 'Tracks yarn scrap and textile wastes.',
        rbac: 'Owner/Manager/Supervisor: Log and view',
        howItWorks: 'Log weight (kg) of yarn waste (chindi, hard waste) at shift end to monitor material loss and shop floor efficiency.'
      }
    ]
  },
  {
    title: 'Group 7: Logistics & Stock',
    icon: BanknotesIcon,
    modules: [
      {
        name: '26. Inventory',
        description: 'Tracks raw material stocks, spare loom parts, and chemical supplies.',
        rbac: 'Owner/Manager: Manage | Supervisor/Accountant: View Only',
        howItWorks: 'Displays current quantities, alert triggers for low stocks, and purchase status.'
      },
      {
        name: '27. Inventory Transactions',
        description: 'Maintains ledger histories of stock movements.',
        rbac: 'Owner/Manager/Supervisor: Manage | Accountant: View Only',
        howItWorks: 'Logs stock changes (IN: Purchase receive, OUT: Weaving run consumption, ADJUST: Manual count corrections).'
      },
      {
        name: '28. Raw Material Consumption',
        description: 'Links loom production logs to inventory depletion.',
        rbac: 'Owner/Manager/Supervisor: Manage | Others: No Access',
        howItWorks: 'Records yarn weights used for production orders, automatically executing OUT inventory transactions.'
      },
      {
        name: '29. Suppliers',
        description: 'Directory of suppliers providing raw yarn or loom parts.',
        rbac: 'Owner/Manager: Manage | Accountant: View Only',
        howItWorks: 'Register supplier details, payment terms, and contact information. Referenced when creating POs.'
      },
      {
        name: '30. Purchase Orders (PO)',
        description: 'Manages procurement contracts for stock purchases.',
        rbac: 'Owner/Manager: Manage | Accountant: View Only',
        howItWorks: 'Draft POs. When the yarn/spare delivery arrives, mark it as received to update inventory automatically.'
      },
      {
        name: '31. Purchase Order Items',
        description: 'Individual line items inside a PO.',
        rbac: 'Owner/Manager: Manage | Accountant: View Only',
        howItWorks: 'Stores specific quantities and price rates of items ordered inside a master purchase order.'
      },
      {
        name: '32. Packing',
        description: 'Consolidates QC-passed fabric rolls into shipping boxes.',
        rbac: 'All Roles: Pack & Close Boxes',
        howItWorks: 'Select rolls and assign them to a Box ID. Calculates box weight and length automatically and sets roll status to "Packed".'
      },
      {
        name: '33. Dispatch',
        description: 'Coordinates product deliveries to clients.',
        rbac: 'Owner/Manager/Supervisor: Manage | Others: No Access',
        howItWorks: 'Select boxes, assign a transport vehicle, and draft delivery slips. Track status from "Shipped" to "Delivered".'
      },
      {
        name: '34. Dispatch Items',
        description: 'Individual box items loaded onto a delivery truck.',
        rbac: 'Owner/Manager/Supervisor: Manage | Others: No Access',
        howItWorks: 'Associates specific packing boxes to a master dispatch manifest.'
      },
      {
        name: '35. Vehicle Management',
        description: 'Registers logistics trucks and driver details.',
        rbac: 'Owner/Manager: Manage | Supervisor: View Only',
        howItWorks: 'Register vehicle numbers, driver details, and status. Used to coordinate dispatches.'
      }
    ]
  },
  {
    title: 'Group 8: Sales & Finance',
    icon: ShieldCheckIcon,
    modules: [
      {
        name: '36. Customers',
        description: 'Directory of clients buying fabrics.',
        rbac: 'Owner/Manager: Manage | Accountant: View Only',
        howItWorks: 'Register client details, credit terms, and delivery locations.'
      },
      {
        name: '37. Sales Orders',
        description: 'Records customer orders and payment milestones.',
        rbac: 'Owner/Manager: Book and edit orders | Accountant: View Only',
        howItWorks: 'Draft fabric sales orders. Monitored by production planning to schedule loom allocations.'
      },
      {
        name: '38. Sales Order Items',
        description: 'Individual items inside a sales order.',
        rbac: 'Owner/Manager: Manage | Accountant: View Only',
        howItWorks: 'Stores quantities and unit prices of specific fabric designs ordered.'
      },
      {
        name: '39. Expense Management',
        description: 'Tracks factory expenditures (fuel, spares, salaries, utilities).',
        rbac: 'Owner/Accountant: Manage | Manager: View/Manage',
        howItWorks: 'Log expenses, upload invoices (via Cloudinary), and classify them by category.'
      },
      {
        name: '40. Electricity Monitoring',
        description: 'Tracks daily electricity meter readings.',
        rbac: 'Owner/Manager/Supervisor/Accountant: Log and view',
        howItWorks: 'Log meter readings at start and end of shifts. System calculates units consumed and cost based on setting rates.'
      },
      {
        name: '41. Water Monitoring',
        description: 'Tracks daily water usage (for sizing processes).',
        rbac: 'Owner/Manager/Supervisor/Accountant: Log and view',
        howItWorks: 'Log daily usage in liters. Calculates cost based on setting rates.'
      },
      {
        name: '42. Reports',
        description: 'Generates Excel, CSV, and PDF data exports.',
        rbac: 'Owner/Manager/Accountant: View and download reports',
        howItWorks: 'Provides bulk export buttons on production, finance, and attendance data grids.'
      }
    ]
  }
];

export default function UserGuidePage() {
  const [activeTab, setActiveTab] = useState('getting-started');
  const [expandedGroup, setExpandedGroup] = useState(null);
  const publicSettings = useUIStore((s) => s.publicSettings);
  const factoryName = publicSettings?.factoryName || 'Shivay Textiles';

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={`User Guide — ${factoryName} ERP`}
        description="Comprehensive documentation of all factory operations, workflows, and access controls."
      />

      {/* Tabs Bar */}
      <div className="flex flex-wrap border-b border-steel-200 dark:border-steel-800 gap-1 font-sans">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                isActive
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5'
                  : 'border-transparent text-steel-500 hover:text-steel-800 dark:hover:text-steel-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Sections */}
      <div className="mt-4">
        {activeTab === 'getting-started' && (
          <div className="space-y-6 animate-fadeIn">
            <Card>
              <h2 className="text-lg font-bold text-steel-900 dark:text-steel-50 mb-3 flex items-center gap-2">
                <CommandLineIcon className="h-5 w-5 text-amber-500" />
                Local Environment Setup
              </h2>
              <p className="text-sm text-steel-600 dark:text-steel-300 mb-4">
                To run the {factoryName} ERP application locally on your computer, ensure you have Node.js (v18+) and PostgreSQL installed.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-steel-50 dark:bg-steel-800 border border-steel-200 dark:border-steel-700">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Backend</span>
                  <pre className="mt-2 text-xs font-mono overflow-x-auto text-steel-800 dark:text-steel-200">
{`cd backend
npm install
# Set DATABASE_URL in .env
npm run migrate
npm run seed
npm run dev`}
                  </pre>
                </div>
                <div className="p-4 rounded-lg bg-steel-50 dark:bg-steel-800 border border-steel-200 dark:border-steel-700">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Frontend</span>
                  <pre className="mt-2 text-xs font-mono overflow-x-auto text-steel-800 dark:text-steel-200">
{`cd frontend
npm install
# Set VITE_API_BASE_URL in .env
npm run dev`}
                  </pre>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-bold text-steel-900 dark:text-steel-50 mb-3 flex items-center gap-2">
                <KeyIcon className="h-5 w-5 text-amber-500" />
                Demo Credentials & Roles
              </h2>
              <p className="text-sm text-steel-600 dark:text-steel-300 mb-4">
                The database seed script provides default accounts to test different roles and capabilities.
              </p>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-steel-200 dark:divide-steel-800 text-sm">
                  <thead>
                    <tr className="bg-steel-50 dark:bg-steel-900/50 text-left text-xs font-semibold text-steel-500 uppercase">
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Email Address</th>
                      <th className="px-4 py-3">Password</th>
                      <th className="px-4 py-3">Scope & Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-steel-100 dark:divide-steel-800">
                    <tr>
                      <td className="px-4 py-3 font-semibold text-steel-900 dark:text-steel-50">Owner</td>
                      <td className="px-4 py-3 font-mono">owner@textileerp.com</td>
                      <td className="px-4 py-3 font-mono">Owner@12345</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 text-xs rounded bg-red-500/10 text-red-500 font-medium">Full Access (All Modules)</span></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-steel-900 dark:text-steel-50">Manager</td>
                      <td className="px-4 py-3 font-mono">manager@textileerp.com</td>
                      <td className="px-4 py-3 font-mono">Demo@12345</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 text-xs rounded bg-orange-500/10 text-orange-500 font-medium">All Operations except Settings</span></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-steel-900 dark:text-steel-50">Supervisor</td>
                      <td className="px-4 py-3 font-mono">supervisor@textileerp.com</td>
                      <td className="px-4 py-3 font-mono">Demo@12345</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 text-xs rounded bg-blue-500/10 text-blue-500 font-medium">Shop Floor & Machines</span></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-steel-900 dark:text-steel-50">Accountant</td>
                      <td className="px-4 py-3 font-mono">accountant@textileerp.com</td>
                      <td className="px-4 py-3 font-mono">Demo@12345</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 text-xs rounded bg-emerald-500/10 text-emerald-500 font-medium">Payroll, Expenses & Read-Only Sales</span></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-steel-900 dark:text-steel-50">Worker</td>
                      <td className="px-4 py-3 font-mono">worker@textileerp.com</td>
                      <td className="px-4 py-3 font-mono">Demo@12345</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 text-xs rounded bg-steel-500/10 text-steel-500 font-medium">Daily Logs & Self-Service</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'rbac' && (
          <div className="space-y-6 animate-fadeIn">
            {/* RBAC Role Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 font-sans">
              <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20 text-center">
                <UserIcon className="h-8 w-8 mx-auto text-red-500 mb-2" />
                <h3 className="font-bold text-red-600 dark:text-red-400">Owner</h3>
                <p className="text-xs text-steel-500 mt-1">Full administrative access. Manages company settings, audit logs, and backups.</p>
              </div>
              <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/20 text-center">
                <UserIcon className="h-8 w-8 mx-auto text-orange-500 mb-2" />
                <h3 className="font-bold text-orange-600 dark:text-orange-400">Manager</h3>
                <p className="text-xs text-steel-500 mt-1">Oversees workforce, designs, production plans, procurement, inventory, and sales.</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 text-center">
                <UserIcon className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <h3 className="font-bold text-blue-600 dark:text-blue-400">Supervisor</h3>
                <p className="text-xs text-steel-500 mt-1">Monitors machines, records loom downtime, manages shifts, and reviews daily logs.</p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-center">
                <UserIcon className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                <h3 className="font-bold text-emerald-600 dark:text-emerald-400">Accountant</h3>
                <p className="text-xs text-steel-500 mt-1">Processes payroll runs, handles invoices, records factory utilities, and reviews expenses.</p>
              </div>
              <div className="p-4 rounded-lg bg-steel-500/5 border border-steel-500/20 text-center">
                <UserIcon className="h-8 w-8 mx-auto text-steel-500 mb-2" />
                <h3 className="font-bold text-steel-600 dark:text-steel-400">Worker</h3>
                <p className="text-xs text-steel-500 mt-1">Logs production units, reports machine breakdowns, and submits leave requests.</p>
              </div>
            </div>

            {/* Permission Matrix */}
            <Card>
              <h2 className="text-lg font-bold text-steel-900 dark:text-steel-50 mb-3 flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5 text-amber-500" />
                Module Access Control Matrix
              </h2>
              
              <div className="overflow-x-auto font-sans">
                <table className="min-w-full divide-y divide-steel-200 dark:divide-steel-800 text-sm">
                  <thead>
                    <tr className="bg-steel-50 dark:bg-steel-900/50 text-left text-xs font-semibold text-steel-500 uppercase">
                      <th className="px-4 py-3">Module Name</th>
                      <th className="px-4 py-3 text-center">Owner</th>
                      <th className="px-4 py-3 text-center">Manager</th>
                      <th className="px-4 py-3 text-center">Supervisor</th>
                      <th className="px-4 py-3 text-center">Accountant</th>
                      <th className="px-4 py-3 text-center">Worker</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-steel-100 dark:divide-steel-800">
                    <tr>
                      <td className="px-4 py-3 font-semibold text-steel-900 dark:text-steel-50">Factory Settings</td>
                      <td className="px-4 py-3 text-center"><span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-bold">Manage</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">View</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-steel-400">—</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-steel-400">—</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-steel-400">—</span></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-steel-900 dark:text-steel-50">Workforce & Departments</td>
                      <td className="px-4 py-3 text-center"><span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-bold">Manage</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-bold">Manage</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">View</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">View</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-steel-400">—</span></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-steel-900 dark:text-steel-50">Machines & Maintenance</td>
                      <td className="px-4 py-3 text-center"><span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-bold">Manage</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-bold">Manage</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-bold">Manage</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-steel-400">—</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">View</span></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-steel-900 dark:text-steel-50">Daily Production Entries</td>
                      <td className="px-4 py-3 text-center"><span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-bold">Manage</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-bold">Manage</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-bold">Manage</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-steel-400">—</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-bold">Manage</span></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-steel-900 dark:text-steel-50">Inventory & Consumption</td>
                      <td className="px-4 py-3 text-center"><span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-bold">Manage</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-bold">Manage</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-bold">Manage</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">View</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-steel-400">—</span></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-steel-900 dark:text-steel-50">Payroll & Finance</td>
                      <td className="px-4 py-3 text-center"><span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-bold">Manage</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">View</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-steel-400">—</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-bold">Manage</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-steel-400">—</span></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-steel-900 dark:text-steel-50">Audit Logs</td>
                      <td className="px-4 py-3 text-center"><span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-bold">Manage</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">View</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-steel-400">—</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-steel-400">—</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-steel-400">—</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'workflows' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Production Pipeline */}
            <Card>
              <h2 className="text-lg font-bold text-steel-900 dark:text-steel-50 mb-4 flex items-center gap-2">
                <CubeIcon className="h-5 w-5 text-amber-500" />
                Production & Weaving Workflow
              </h2>
              
              <div className="relative border-l-2 border-amber-500 ml-4 space-y-6 py-2">
                <div className="relative pl-6">
                  <div className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Step 1: Create Fabric Design</span>
                  <p className="text-sm text-steel-700 dark:text-steel-300 mt-1">
                    Define the design layout code, warp/weft count, gsm weight, width in inches, and baseline price rate.
                  </p>
                </div>
                
                <div className="relative pl-6">
                  <div className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Step 2: Initialize Production Plan</span>
                  <p className="text-sm text-steel-700 dark:text-steel-300 mt-1">
                    Set a target quantity (meters) and schedule starting/ending dates mapping to your fabric design.
                  </p>
                </div>

                <div className="relative pl-6">
                  <div className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Step 3: Generate Work & Production Orders</span>
                  <p className="text-sm text-steel-700 dark:text-steel-300 mt-1">
                    Dispatch work orders mapping to the production plan and assign specific Loom Machines (e.g. Air Jet Loom) to run it.
                  </p>
                </div>

                <div className="relative pl-6">
                  <div className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Step 4: Record Daily Entries & Beam Allocations</span>
                  <p className="text-sm text-steel-700 dark:text-steel-300 mt-1">
                    Allocate Warp/Weft Beams to the running machines. Operators log actual meters produced, runtime minutes, and yarn consumed on each shift.
                  </p>
                </div>

                <div className="relative pl-6">
                  <div className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Step 5: Quality Check (QC) & Packing</span>
                  <p className="text-sm text-steel-700 dark:text-steel-300 mt-1">
                    Inspect the finished fabric rolls. Assign grades (e.g. Grade A/B) and flag defects. Once passed, pack them and prepare dispatch boxes.
                  </p>
                </div>
              </div>
            </Card>

            {/* Procurement and Inventory */}
            <Card>
              <h2 className="text-lg font-bold text-steel-900 dark:text-steel-50 mb-4 flex items-center gap-2">
                <BanknotesIcon className="h-5 w-5 text-amber-500" />
                Procurement & Supply Workflow
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded bg-steel-50 dark:bg-steel-800 border border-steel-200 dark:border-steel-700">
                  <h4 className="font-semibold text-sm mb-1">1. Supplier & PO creation</h4>
                  <p className="text-xs text-steel-500">Register suppliers in the system, then draft Purchase Orders for cotton or polyester yarn specifying rate and quantity.</p>
                </div>
                <div className="p-4 rounded bg-steel-50 dark:bg-steel-800 border border-steel-200 dark:border-steel-700">
                  <h4 className="font-semibold text-sm mb-1">2. Receiving Stock</h4>
                  <p className="text-xs text-steel-500">When the shipment arrives, receive the PO item units. This automatically increments inventory levels and logs transaction histories.</p>
                </div>
                <div className="p-4 rounded bg-steel-50 dark:bg-steel-800 border border-steel-200 dark:border-steel-700">
                  <h4 className="font-semibold text-sm mb-1">3. Consumption Tracking</h4>
                  <p className="text-xs text-steel-500">Log yarn consumptions during machine operations, which decrements yarn stock and tracks actual costs against the order.</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'modules' && (
          <div className="space-y-4 animate-fadeIn font-sans">
            {MODULE_GROUPS.map((group, gIdx) => {
              const GroupIcon = group.icon;
              const isExpanded = expandedGroup === gIdx;
              return (
                <div key={gIdx} className="border border-steel-200 dark:border-steel-800 rounded-lg overflow-hidden bg-white dark:bg-steel-900">
                  <button
                    onClick={() => setExpandedGroup(isExpanded ? null : gIdx)}
                    className="w-full flex items-center justify-between p-4 text-left font-bold text-steel-900 dark:text-steel-100 hover:bg-steel-50 dark:hover:bg-steel-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <GroupIcon className="h-5 w-5 text-amber-500" />
                      <span>{group.title}</span>
                    </div>
                    <span className="text-steel-400 font-mono text-xl">{isExpanded ? '−' : '+'}</span>
                  </button>
                  {isExpanded && (
                    <div className="p-4 border-t border-steel-200 dark:border-steel-800 bg-steel-50/50 dark:bg-steel-950/20 divide-y divide-steel-200 dark:divide-steel-800">
                      {group.modules.map((mod, mIdx) => (
                        <div key={mIdx} className="py-4 first:pt-0 last:pb-0 space-y-2">
                          <h4 className="font-bold text-amber-600 dark:text-amber-400 text-sm">{mod.name}</h4>
                          <p className="text-xs text-steel-600 dark:text-steel-300">{mod.description}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                            <div className="p-2 rounded bg-white dark:bg-steel-800 border border-steel-200 dark:border-steel-700">
                              <span className="font-semibold block text-steel-700 dark:text-steel-400 mb-0.5">RBAC Rules:</span>
                              <span className="text-steel-600 dark:text-steel-300 font-mono">{mod.rbac}</span>
                            </div>
                            <div className="p-2 rounded bg-white dark:bg-steel-800 border border-steel-200 dark:border-steel-700">
                              <span className="font-semibold block text-steel-700 dark:text-steel-400 mb-0.5">How It Works:</span>
                              <span className="text-steel-600 dark:text-steel-300">{mod.howItWorks}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
