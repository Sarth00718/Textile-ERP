const STATUS_STYLES = {
  // Machines
  RUNNING: 'bg-signal-run/15 text-signal-run',
  IDLE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  BREAKDOWN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  MAINTENANCE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  OFFLINE: 'bg-steel-200 text-steel-600 dark:bg-steel-700 dark:text-steel-300',
  // Generic positive/negative/neutral
  ACTIVE: 'bg-signal-run/15 text-signal-run',
  COMPLETED: 'bg-signal-run/15 text-signal-run',
  PASS: 'bg-signal-run/15 text-signal-run',
  QC_PASSED: 'bg-signal-run/15 text-signal-run',
  RECEIVED: 'bg-signal-run/15 text-signal-run',
  DISPATCHED: 'bg-signal-run/15 text-signal-run',
  DELIVERED: 'bg-signal-run/15 text-signal-run',
  PAID: 'bg-signal-run/15 text-signal-run',
  APPROVED: 'bg-signal-run/15 text-signal-run',
  RESOLVED: 'bg-signal-run/15 text-signal-run',
  PACKED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  IN_TRANSIT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  IN_QC: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  DRAFT: 'bg-steel-200 text-steel-700 dark:bg-steel-700 dark:text-steel-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  FAIL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  QC_FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  TERMINATED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  ABSENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  OPEN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  // Notification severities
  INFO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  WARNING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const DEFAULT_STYLE = 'bg-steel-100 text-steel-700 dark:bg-steel-700 dark:text-steel-200';

export default function StatusBadge({ status }) {
  if (!status) return null;
  const style = STATUS_STYLES[status] || DEFAULT_STYLE;
  return <span className={`status-pill ${style}`}>{status.replace(/_/g, ' ')}</span>;
}
