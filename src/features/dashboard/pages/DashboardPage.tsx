import { useAuthentication } from '@/features/authentication';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

function DashboardPage() {
  const { user } = useAuthentication();

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard — {user?.username ?? 'Usuario'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4">
            <h3 className="font-medium text-blue-900 dark:text-blue-300">Placeholder</h3>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
              Dashboard content will be implemented in a future sprint.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">User Info</h4>
              <dl className="mt-2 space-y-1 text-sm">
                <div>
                  <dt className="inline text-gray-500">Email: </dt>
                  <dd className="inline text-gray-900 dark:text-gray-100">{user?.email}</dd>
                </div>
                <div>
                  <dt className="inline text-gray-500">Username: </dt>
                  <dd className="inline text-gray-900 dark:text-gray-100">{user?.username}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Next Steps</h4>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Connect real API endpoints</li>
                <li>Implement inventory features</li>
                <li>Add product management</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardPage;
