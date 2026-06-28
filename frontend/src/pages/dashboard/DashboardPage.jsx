import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  CogIcon, ExclamationTriangleIcon, ClipboardDocumentCheckIcon, TruckIcon,
  BanknotesIcon, UsersIcon, ArchiveBoxIcon, BoltIcon,
} from '@heroicons/react/24/outline';
import { dashboardApi } from '../../api/services';
import { PageHeader, Card } from '../../components/common/Shared';

function KpiCard({ label, value, sub, icon: Icon, tone = 'steel' }) {
  const toneClasses = {
    steel: 'text-steel-500',
    run: 'text-signal-run',
    down: 'text-signal-down',
    amber: 'text-amber-500',
  };
  return (
    <Card className="flex items-start gap-3">
      <div className={`rounded-md bg-steel-100 dark:bg-steel-800 p-2 ${toneClasses[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-steel-400">{label}</div>
        <div className="mt-0.5 text-xl font-semibold text-steel-900 dark:text-steel-50 tabular">{value}</div>
        {sub && <div className="text-xs text-steel-400 mt-0.5">{sub}</div>}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardApi.summary(), dashboardApi.charts()])
      .then(([s, c]) => {
        setSummary(s.data);
        setCharts(c.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !summary) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Live factory overview" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-steel-200 dark:bg-steel-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Dashboard" description="Live factory overview, updated in real time" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Today's Production" value={`${summary.todaysProduction.meters.toLocaleString()} m`} sub={`${summary.todaysProduction.rejectedMeters} m rejected`} icon={ClipboardDocumentCheckIcon} tone="run" />
        <KpiCard label="Machines Running" value={summary.machines.running} sub={`${summary.machines.utilizationPercent}% utilization`} icon={CogIcon} tone="run" />
        <KpiCard label="Open Breakdowns" value={summary.breakdowns.open} icon={ExclamationTriangleIcon} tone={summary.breakdowns.open > 0 ? 'down' : 'steel'} />
        <KpiCard label="Pending Dispatch" value={summary.pending.pendingDispatch} sub={`${summary.pending.pendingQC} in QC, ${summary.pending.pendingPacking} to pack`} icon={TruckIcon} tone="amber" />
        <KpiCard label="Revenue (Month)" value={`₹${summary.financials.revenueThisMonth.toLocaleString()}`} sub={`Net ₹${summary.financials.netThisMonth.toLocaleString()}`} icon={BanknotesIcon} tone="run" />
        <KpiCard label="Attendance Today" value={`${summary.attendance.present}/${summary.attendance.totalActiveEmployees}`} sub={`${summary.attendance.onLeave} on leave`} icon={UsersIcon} />
        <KpiCard label="Inventory Alerts" value={summary.inventoryAlerts} sub="items at/below reorder level" icon={ArchiveBoxIcon} tone={summary.inventoryAlerts > 0 ? 'down' : 'steel'} />
        <KpiCard label="Electricity (Month)" value={`${summary.electricityUnitsThisMonth.toLocaleString()} kWh`} sub={`Water: ${summary.waterUnitsThisMonth.toLocaleString()} units`} icon={BoltIcon} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-steel-700 dark:text-steel-200">Production — last 14 days (meters)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={charts.production}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e3e8ed" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d?.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="meters" stroke="#f5ab00" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-steel-700 dark:text-steel-200">Revenue — last 6 months</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts.revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e3e8ed" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(d) => d?.slice(0, 7)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="amount" fill="#3f4f63" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
