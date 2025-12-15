import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Dumbbell, MoreHorizontal, Copy, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import type { WorkoutPlan } from '@/types';

// Mock data
const mockWorkoutPlans: WorkoutPlan[] = [
  {
    id: '1',
    coachId: 'coach1',
    name: 'Beginner Strength Training',
    description: 'A 4-week program designed for beginners to build foundational strength',
    durationWeeks: 4,
    days: [
      { id: 'd1', name: 'Push Day', dayNumber: 1, exercises: [] },
      { id: 'd2', name: 'Pull Day', dayNumber: 2, exercises: [] },
      { id: 'd3', name: 'Leg Day', dayNumber: 3, exercises: [] },
    ],
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z',
  },
  {
    id: '2',
    coachId: 'coach1',
    name: 'Advanced Hypertrophy',
    description: '8-week muscle building program for experienced lifters',
    durationWeeks: 8,
    days: [
      { id: 'd1', name: 'Chest & Triceps', dayNumber: 1, exercises: [] },
      { id: 'd2', name: 'Back & Biceps', dayNumber: 2, exercises: [] },
      { id: 'd3', name: 'Shoulders', dayNumber: 3, exercises: [] },
      { id: 'd4', name: 'Legs', dayNumber: 4, exercises: [] },
    ],
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-02-20T00:00:00Z',
  },
  {
    id: '3',
    coachId: 'coach1',
    name: 'Fat Loss Circuit',
    description: 'High-intensity circuit training for maximum calorie burn',
    durationWeeks: 6,
    days: [
      { id: 'd1', name: 'Full Body Circuit A', dayNumber: 1, exercises: [] },
      { id: 'd2', name: 'Full Body Circuit B', dayNumber: 2, exercises: [] },
      { id: 'd3', name: 'HIIT Cardio', dayNumber: 3, exercises: [] },
    ],
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-10T00:00:00Z',
  },
];

export function WorkoutPlansPage() {
  const navigate = useNavigate();
  const [plans] = useState<WorkoutPlan[]>(mockWorkoutPlans);

  if (plans.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Workout Plans"
          description="Create and manage workout plans for your clients"
        />
        <EmptyState
          icon={Dumbbell}
          title="No workout plans yet"
          description="Create your first workout plan to start assigning programs to your clients."
          actionLabel="Create Workout Plan"
          onAction={() => navigate('/workout-plans/new')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Workout Plans"
        description="Create and manage workout plans for your clients"
        actions={
          <Button onClick={() => navigate('/workout-plans/new')} className="shadow-energy">
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className="cursor-pointer hover:shadow-md transition-all group"
            onClick={() => navigate(`/workout-plans/${plan.id}`)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                    <Dumbbell className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription>{plan.durationWeeks} weeks</CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/workout-plans/${plan.id}/edit`);
                    }}>
                      Edit Plan
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                      <Users className="h-4 w-4 mr-2" />
                      Assign to Client
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => e.stopPropagation()}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {plan.description || 'No description'}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge variant="outline">{plan.days.length} days</Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  Updated {new Date(plan.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default WorkoutPlansPage;
