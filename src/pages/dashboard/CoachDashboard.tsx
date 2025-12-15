import { Users, ClipboardCheck, Dumbbell, Utensils, TrendingUp, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { useAuth } from '@/contexts/AuthContext';

// Mock data for demonstration
const mockStats = {
  totalClients: 24,
  activeClients: 18,
  pendingCheckIns: 7,
  workoutPlansCreated: 15,
  dietPlansCreated: 12,
};

const mockRecentClients = [
  { id: '1', firstName: 'Sarah', lastName: 'Johnson', avatarUrl: '', lastCheckIn: '2 hours ago', status: 'on-track' },
  { id: '2', firstName: 'Mike', lastName: 'Williams', avatarUrl: '', lastCheckIn: '5 hours ago', status: 'needs-attention' },
  { id: '3', firstName: 'Emily', lastName: 'Davis', avatarUrl: '', lastCheckIn: '1 day ago', status: 'on-track' },
  { id: '4', firstName: 'James', lastName: 'Brown', avatarUrl: '', lastCheckIn: '2 days ago', status: 'behind' },
];

const mockPendingCheckIns = [
  { id: '1', clientName: 'Sarah Johnson', type: 'Weight', date: 'Today, 10:30 AM' },
  { id: '2', clientName: 'Mike Williams', type: 'Workout', date: 'Today, 9:15 AM' },
  { id: '3', clientName: 'Emily Davis', type: 'Diet', date: 'Yesterday, 8:00 PM' },
];

export function CoachDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'on-track':
        return <Badge className="bg-vitality/20 text-vitality border-0">On Track</Badge>;
      case 'needs-attention':
        return <Badge className="bg-energy/20 text-energy border-0">Needs Attention</Badge>;
      case 'behind':
        return <Badge className="bg-destructive/20 text-destructive border-0">Behind</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Welcome back, ${user?.firstName}!`}
        description="Here's what's happening with your clients today."
        actions={
          <Button onClick={() => navigate('/clients/new')} className="shadow-energy">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clients"
          value={mockStats.totalClients}
          subtitle={`${mockStats.activeClients} active`}
          icon={Users}
          variant="primary"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Pending Check-ins"
          value={mockStats.pendingCheckIns}
          subtitle="Awaiting review"
          icon={ClipboardCheck}
          variant="secondary"
        />
        <StatCard
          title="Workout Plans"
          value={mockStats.workoutPlansCreated}
          subtitle="Created this month"
          icon={Dumbbell}
          variant="accent"
        />
        <StatCard
          title="Diet Plans"
          value={mockStats.dietPlansCreated}
          subtitle="Created this month"
          icon={Utensils}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Clients</CardTitle>
              <CardDescription>Your most recently active clients</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/clients')}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={client.avatarUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {client.firstName[0]}{client.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">
                        {client.firstName} {client.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Last check-in: {client.lastCheckIn}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(client.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Check-ins */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Pending Check-ins</CardTitle>
              <CardDescription>Check-ins awaiting your review</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/check-ins')}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockPendingCheckIns.map((checkIn) => (
                <div
                  key={checkIn.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                      <ClipboardCheck className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{checkIn.clientName}</p>
                      <p className="text-sm text-muted-foreground">{checkIn.date}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{checkIn.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Common tasks to help you get things done faster</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => navigate('/clients/new')}
            >
              <Users className="h-6 w-6 text-primary" />
              <span>Add New Client</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => navigate('/workout-plans/new')}
            >
              <Dumbbell className="h-6 w-6 text-secondary" />
              <span>Create Workout Plan</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => navigate('/diet-plans/new')}
            >
              <Utensils className="h-6 w-6 text-accent" />
              <span>Create Diet Plan</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => navigate('/analytics')}
            >
              <TrendingUp className="h-6 w-6 text-energy" />
              <span>View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CoachDashboard;
