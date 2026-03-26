import { useAuthentication } from '@/features/authentication';

function DashboardPage() {
  const { user } = useAuthentication();

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-neutral-900">
        Dashboard — {user?.username ?? 'Usuario'}
      </h1>

      <div className="rounded-xl border border-border divide-y divide-border">
        {/* Placeholder banner */}
        <div className="bg-info-bg px-4 py-3 rounded-t-xl">
          <p className="font-medium text-info text-sm">Placeholder</p>
          <p className="mt-0.5 text-sm text-info/80">
            Dashboard content will be implemented in a future sprint.
          </p>
        </div>

        {/* Info grid — divided by a line, not by margins */}
        <div className="grid sm:grid-cols-2 sm:divide-x divide-border divide-y sm:divide-y-0">
          <div className="px-4 py-4">
            <h4 className="text-sm font-semibold text-neutral-700">User Info</h4>
            <dl className="mt-2 space-y-1 text-sm">
              <div>
                <dt className="inline text-neutral-500">Email: </dt>
                <dd className="inline text-neutral-900">{user?.email}</dd>
              </div>
              <div>
                <dt className="inline text-neutral-500">Username: </dt>
                <dd className="inline text-neutral-900">{user?.username}</dd>
              </div>
            </dl>
          </div>

          <div className="px-4 py-4">
            <h4 className="text-sm font-semibold text-neutral-700">Next Steps</h4>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-neutral-500">
              <li>Connect real API endpoints</li>
              <li>Implement inventory features</li>
              <li>Add product management</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
