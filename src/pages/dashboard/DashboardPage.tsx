import { useAuth } from '@/contexts/AuthContext';
import { CoachDashboard } from './CoachDashboard';
import { ClientDashboard } from './ClientDashboard';

export function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === 'coach') {
    return <CoachDashboard />;
  }

  return <ClientDashboard />;
}

export default DashboardPage;
