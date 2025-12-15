import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Calendar, Target, Scale, TrendingDown, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

// Mock client data
const mockClient = {
  id: '1',
  email: 'sarah.johnson@email.com',
  firstName: 'Sarah',
  lastName: 'Johnson',
  role: 'client' as const,
  coachId: 'coach1',
  goals: 'Lose 20 lbs, build strength, improve overall fitness and energy levels',
  startDate: '2024-01-15',
  currentWeight: 165,
  targetWeight: 145,
  height: 65, // inches
  notes: 'Prefers morning workouts. Has a minor knee injury - avoid high impact exercises.',
  createdAt: '2024-01-15T00:00:00Z',
  updatedAt: '2024-03-01T00:00:00Z',
};

const mockWeightHistory = [
  { date: '2024-01-15', weight: 175 },
  { date: '2024-02-01', weight: 172 },
  { date: '2024-02-15', weight: 169 },
  { date: '2024-03-01', weight: 167 },
  { date: '2024-03-15', weight: 165 },
];

const mockCheckIns = [
  { id: '1', type: 'Weight', date: '2024-03-15', status: 'reviewed' },
  { id: '2', type: 'Workout', date: '2024-03-14', status: 'reviewed' },
  { id: '3', type: 'Diet', date: '2024-03-14', status: 'pending' },
  { id: '4', type: 'Photos', date: '2024-03-10', status: 'reviewed' },
];

export function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // In a real app, fetch client data based on id
  const client = mockClient;
  
  const weightLost = mockWeightHistory[0].weight - mockWeightHistory[mockWeightHistory.length - 1].weight;
  const progressPercentage = Math.round((weightLost / (mockWeightHistory[0].weight - client.targetWeight)) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {client.firstName[0]}{client.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-display font-bold">
                {client.firstName} {client.lastName}
              </h1>
              <p className="text-muted-foreground">{client.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate(`/clients/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Scale className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Weight</p>
                <p className="text-xl font-bold">{client.currentWeight} lbs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Target className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Target Weight</p>
                <p className="text-xl font-bold">{client.targetWeight} lbs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-vitality/10">
                <TrendingDown className="h-5 w-5 text-vitality" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Weight Lost</p>
                <p className="text-xl font-bold">{weightLost} lbs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Calendar className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Days on Plan</p>
                <p className="text-xl font-bold">60</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Goal Progress</CardTitle>
          <CardDescription>
            {weightLost} of {mockWeightHistory[0].weight - client.targetWeight} lbs to goal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercentage} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">{progressPercentage}% complete</p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="checkins">Check-ins</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{client.goals}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{client.notes || 'No notes'}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                {client.email}
              </Button>
              <Button variant="outline">
                <Phone className="h-4 w-4 mr-2" />
                Contact
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checkins">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Check-ins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockCheckIns.map((checkIn) => (
                  <div
                    key={checkIn.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{checkIn.type} Check-in</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(checkIn.date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      className={
                        checkIn.status === 'reviewed'
                          ? 'bg-vitality/20 text-vitality border-0'
                          : 'bg-energy/20 text-energy border-0'
                      }
                    >
                      {checkIn.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assigned Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No plans assigned yet.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No photos uploaded yet.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ClientDetailPage;
