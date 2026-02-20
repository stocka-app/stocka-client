import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, Package } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useAuth } from '@/features/auth';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';

function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary">Stocka</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>
              {t('common:success')}! {t('auth:welcome')} {user?.username || 'Usuario'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <h3 className="font-medium text-blue-900">Mock Authentication</h3>
              <p className="mt-1 text-sm text-blue-700">
                This is a placeholder dashboard. Authentication is working with mock data.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <h4 className="font-medium text-gray-900">User Info</h4>
                <dl className="mt-2 space-y-1 text-sm">
                  <div>
                    <dt className="inline text-gray-500">Email: </dt>
                    <dd className="inline text-gray-900">{user?.email}</dd>
                  </div>
                  <div>
                    <dt className="inline text-gray-500">Username: </dt>
                    <dd className="inline text-gray-900">{user?.username}</dd>
                  </div>
                  <div>
                    <dt className="inline text-gray-500">ID: </dt>
                    <dd className="inline text-gray-900">{user?.id}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="font-medium text-gray-900">Next Steps</h4>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-600">
                  <li>Connect real API endpoints</li>
                  <li>Implement inventory features</li>
                  <li>Add product management</li>
                  <li>Create reports dashboard</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default DashboardPage;
