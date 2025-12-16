import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { Dumbbell, Utensils, Calendar, Target } from 'lucide-react';

export function MyPlanPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Plan"
        description="View your current workout and diet plans"
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Workout Plan Card */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Dumbbell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Workout Plan</CardTitle>
                <CardDescription>Your current training program</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="font-semibold text-foreground">Beginner Strength Program</h4>
              <p className="text-sm text-muted-foreground mt-1">4-week program • 3 days/week</p>
              <div className="mt-3 flex gap-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  Beginner
                </span>
                <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                  Active
                </span>
              </div>
            </div>
            <Button className="w-full">View Full Plan</Button>
          </CardContent>
        </Card>

        {/* Diet Plan Card */}
        <Card className="border-energy/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-energy/10">
                <Utensils className="h-5 w-5 text-energy" />
              </div>
              <div>
                <CardTitle className="text-lg">Diet Plan</CardTitle>
                <CardDescription>Your nutrition program</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="font-semibold text-foreground">Weight Loss Plan</h4>
              <p className="text-sm text-muted-foreground mt-1">1,800 cal target • High protein</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-primary">150g</p>
                  <p className="text-xs text-muted-foreground">Protein</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-energy">150g</p>
                  <p className="text-xs text-muted-foreground">Carbs</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-warning">60g</p>
                  <p className="text-xs text-muted-foreground">Fat</p>
                </div>
              </div>
            </div>
            <Button variant="secondary" className="w-full">View Meal Plan</Button>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>This Week's Schedule</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
              <div
                key={day}
                className={`rounded-lg p-3 text-center ${
                  index < 3 ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                }`}
              >
                <p className="text-xs font-medium text-muted-foreground">{day}</p>
                <p className="text-sm font-semibold mt-1">
                  {index === 0 && 'Push'}
                  {index === 1 && 'Pull'}
                  {index === 2 && 'Legs'}
                  {index > 2 && 'Rest'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MyPlanPage;
