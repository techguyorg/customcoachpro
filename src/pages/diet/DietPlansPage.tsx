import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Utensils, MoreHorizontal, Copy, Trash2, Users } from 'lucide-react';
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
import type { DietPlan } from '@/types';

// Mock data
const mockDietPlans: DietPlan[] = [
  {
    id: '1',
    coachId: 'coach1',
    name: 'Weight Loss - Low Carb',
    description: 'Moderate calorie deficit with reduced carbohydrate intake',
    days: [
      { id: 'd1', dayNumber: 1, meals: [], targetCalories: 1800, targetProtein: 150, targetCarbs: 100, targetFat: 80 },
      { id: 'd2', dayNumber: 2, meals: [], targetCalories: 1800, targetProtein: 150, targetCarbs: 100, targetFat: 80 },
    ],
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z',
  },
  {
    id: '2',
    coachId: 'coach1',
    name: 'Muscle Building - High Protein',
    description: 'Caloric surplus with high protein for muscle growth',
    days: [
      { id: 'd1', dayNumber: 1, meals: [], targetCalories: 2800, targetProtein: 200, targetCarbs: 300, targetFat: 90 },
    ],
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-02-20T00:00:00Z',
  },
  {
    id: '3',
    coachId: 'coach1',
    name: 'Maintenance - Balanced',
    description: 'Balanced macros for maintaining current weight and energy',
    days: [
      { id: 'd1', dayNumber: 1, meals: [], targetCalories: 2200, targetProtein: 140, targetCarbs: 250, targetFat: 75 },
    ],
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-10T00:00:00Z',
  },
];

export function DietPlansPage() {
  const navigate = useNavigate();
  const [plans] = useState<DietPlan[]>(mockDietPlans);

  if (plans.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Diet Plans"
          description="Create and manage diet plans for your clients"
        />
        <EmptyState
          icon={Utensils}
          title="No diet plans yet"
          description="Create your first diet plan to start managing your clients' nutrition."
          actionLabel="Create Diet Plan"
          onAction={() => navigate('/diet-plans/new')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Diet Plans"
        description="Create and manage diet plans for your clients"
        actions={
          <Button onClick={() => navigate('/diet-plans/new')} className="shadow-energy">
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const avgCalories = plan.days.reduce((sum, d) => sum + d.targetCalories, 0) / plan.days.length;
          const avgProtein = plan.days.reduce((sum, d) => sum + d.targetProtein, 0) / plan.days.length;
          
          return (
            <Card
              key={plan.id}
              className="cursor-pointer hover:shadow-md transition-all group"
              onClick={() => navigate(`/diet-plans/${plan.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                      <Utensils className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription>{plan.days.length} day cycle</CardDescription>
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
                        navigate(`/diet-plans/${plan.id}/edit`);
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
                    <Badge variant="outline">{Math.round(avgCalories)} cal</Badge>
                    <Badge variant="outline">{Math.round(avgProtein)}g protein</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default DietPlansPage;
