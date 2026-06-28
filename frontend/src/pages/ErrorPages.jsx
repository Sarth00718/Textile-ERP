import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <ErrorShell
      code="404"
      title="This page doesn't exist"
      message="The page you're looking for may have been moved or never existed."
    />
  );
}

export function ForbiddenPage() {
  return (
    <ErrorShell
      code="403"
      title="You don't have access to this"
      message="Your role doesn't have permission to view this page. Contact your manager if you think this is a mistake."
    />
  );
}

function ErrorShell({ code, title, message }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-steel-50 dark:bg-steel-950 px-4 text-center">
      <div className="font-mono text-5xl font-bold text-amber-500">{code}</div>
      <h1 className="mt-3 text-xl font-semibold text-steel-900 dark:text-steel-50">{title}</h1>
      <p className="mt-2 max-w-sm text-sm text-steel-500 dark:text-steel-400">{message}</p>
      <Link
        to="/"
        className="mt-5 rounded-md bg-steel-900 dark:bg-amber-500 px-4 py-2 text-sm font-medium text-white dark:text-steel-950 hover:bg-steel-800 dark:hover:bg-amber-400"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
