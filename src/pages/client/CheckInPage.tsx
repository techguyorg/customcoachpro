import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Scale, Camera, Dumbbell, Utensils, Loader2, CheckCircle } from 'lucide-react';
import clientPortalService from '@/services/clientPortalService';

const weightSchema = z.object({
  weight: z.number().min(20).max(500),
  bodyFatPercentage: z.number().min(1).max(60).optional(),
  waist: z.number().min(20).max(200).optional(),
  chest: z.number().min(20).max(200).optional(),
  arms: z.number().min(10).max(100).optional(),
  notes: z.string().max(500).optional(),
});

export function CheckInPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [adherenceRating, setAdherenceRating] = useState([7]);
  const [photoNotes, setPhotoNotes] = useState('');
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [dietNotes, setDietNotes] = useState('');
  const [dietCalories, setDietCalories] = useState('');
  const [dietProtein, setDietProtein] = useState('');
  const [dietWater, setDietWater] = useState('');

  const createCheckIn = useMutation({
    mutationFn: clientPortalService.submitCheckIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['check-ins', 'client'] });
    },
  });

  const weightForm = useForm({
    resolver: zodResolver(weightSchema),
    defaultValues: {
      weight: 70,
      bodyFatPercentage: undefined,
      waist: undefined,
      chest: undefined,
      arms: undefined,
      notes: '',
    },
  });

  const isSubmitting = createCheckIn.isPending;

  const ensureClient = () => {
    if (!user?.id) {
      toast({
        title: 'Unable to submit',
        description: 'Please sign in again to submit a check-in.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleWeightSubmit = async (data: z.infer<typeof weightSchema>) => {
    if (!ensureClient()) return;

    try {
      await createCheckIn.mutateAsync({
        clientId: user!.id,
        type: 'weight',
        weight: data.weight,
        bodyFat: data.bodyFatPercentage,
        waist: data.waist,
        chest: data.chest,
        arms: data.arms,
        notes: data.notes,
      });

      toast({
        title: 'Check-in submitted!',
        description: 'Your weight check-in has been recorded.',
      });
      weightForm.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit check-in. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleWorkoutSubmit = async (completed: boolean) => {
    if (!ensureClient()) return;

    const durationNote = workoutDuration ? `Duration: ${workoutDuration} minutes.` : '';
    const notes = [durationNote, workoutNotes].filter(Boolean).join(' ');

    try {
      await createCheckIn.mutateAsync({
        clientId: user!.id,
        type: 'workout',
        workoutCompleted: completed,
        workoutNotes: notes || undefined,
      });
      toast({
        title: completed ? 'Workout logged' : 'Workout skipped',
        description: completed
          ? 'Nice work completing your session!'
          : 'We recorded this workout as skipped.',
      });
      setWorkoutNotes('');
      setWorkoutDuration('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Unable to log workout check-in.',
        variant: 'destructive',
      });
    }
  };

  const handleDietSubmit = async () => {
    if (!ensureClient()) return;

    const macrosSummary = [
      dietCalories ? `Calories: ${dietCalories}` : null,
      dietProtein ? `Protein: ${dietProtein}g` : null,
      dietWater ? `Water: ${dietWater}L` : null,
    ]
      .filter(Boolean)
      .join(' | ');

    const combinedNotes = [macrosSummary, dietNotes].filter(Boolean).join('\n');

    try {
      await createCheckIn.mutateAsync({
        clientId: user!.id,
        type: 'diet',
        dietCompliance: adherenceRating[0],
        dietDeviations: dietNotes || undefined,
        notes: combinedNotes || undefined,
      });
      toast({
        title: 'Diet check-in saved',
        description: 'Your diet adherence has been logged.',
      });
      setDietNotes('');
      setDietCalories('');
      setDietProtein('');
      setDietWater('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Unable to log diet check-in.',
        variant: 'destructive',
      });
    }
  };

  const handlePhotoSubmit = async () => {
    if (!ensureClient()) return;

    try {
      await createCheckIn.mutateAsync({
        clientId: user!.id,
        type: 'photos',
        notes: photoNotes || undefined,
      });
      toast({
        title: 'Photos logged',
        description: 'We recorded your photo check-in.',
      });
      setPhotoNotes('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Unable to log progress photos.',
        variant: 'destructive',
      });
    }
  };

  const primaryActionLabel = useMemo(() =>
    createCheckIn.isPending ? (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Submitting...
      </>
    ) : (
      <>
        <CheckCircle className="mr-2 h-4 w-4" />
        Submit Check-in
      </>
    ), [createCheckIn.isPending]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Check-in"
        description="Log your progress and keep your coach updated"
      />

      <Tabs defaultValue="weight" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="weight" className="gap-2">
            <Scale className="h-4 w-4" />
            <span className="hidden sm:inline">Weight</span>
          </TabsTrigger>
          <TabsTrigger value="photos" className="gap-2">
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">Photos</span>
          </TabsTrigger>
          <TabsTrigger value="workout" className="gap-2">
            <Dumbbell className="h-4 w-4" />
            <span className="hidden sm:inline">Workout</span>
          </TabsTrigger>
          <TabsTrigger value="diet" className="gap-2">
            <Utensils className="h-4 w-4" />
            <span className="hidden sm:inline">Diet</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weight">
          <Card>
            <CardHeader>
              <CardTitle>Weight & Measurements</CardTitle>
              <CardDescription>Log your weight and body measurements</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={weightForm.handleSubmit(handleWeightSubmit)} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg) *</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder="70.5"
                      {...weightForm.register('weight', { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bodyFat">Body Fat %</Label>
                    <Input
                      id="bodyFat"
                      type="number"
                      step="0.1"
                      placeholder="20.0"
                      {...weightForm.register('bodyFatPercentage', { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="waist">Waist (cm)</Label>
                    <Input
                      id="waist"
                      type="number"
                      step="0.1"
                      placeholder="80.0"
                      {...weightForm.register('waist', { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chest">Chest (cm)</Label>
                    <Input
                      id="chest"
                      type="number"
                      step="0.1"
                      placeholder="95.0"
                      {...weightForm.register('chest', { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="arms">Arms (cm)</Label>
                    <Input
                      id="arms"
                      type="number"
                      step="0.1"
                      placeholder="35.0"
                      {...weightForm.register('arms', { valueAsNumber: true })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="How are you feeling today?"
                    {...weightForm.register('notes')}
                  />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  {primaryActionLabel}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <CardTitle>Progress Photos</CardTitle>
              <CardDescription>Upload your front, side, and back progress photos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {['Front', 'Side', 'Back'].map((angle) => (
                  <div key={angle} className="space-y-2">
                    <Label>{angle} View</Label>
                    <div className="flex aspect-[3/4] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 hover:bg-muted transition-colors">
                      <div className="text-center">
                        <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Tap to attach</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-2">
                <Label htmlFor="photoNotes">Notes</Label>
                <Textarea
                  id="photoNotes"
                  placeholder="Any comments about your photos?"
                  value={photoNotes}
                  onChange={(event) => setPhotoNotes(event.target.value)}
                />
              </div>
              <Button className="mt-4 w-full sm:w-auto" onClick={handlePhotoSubmit} disabled={isSubmitting}>
                {primaryActionLabel}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workout">
          <Card>
            <CardHeader>
              <CardTitle>Workout Check-in</CardTitle>
              <CardDescription>Log today&apos;s workout completion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-muted/50 p-4">
                <h4 className="font-semibold">Today&apos;s Workout</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Mark complete once you finish your session.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="45"
                  value={workoutDuration}
                  onChange={(event) => setWorkoutDuration(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workoutNotes">Notes</Label>
                <Textarea
                  id="workoutNotes"
                  placeholder="How did the workout go? Any PRs or issues?"
                  value={workoutNotes}
                  onChange={(event) => setWorkoutNotes(event.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <Button className="flex-1" variant="outline" onClick={() => handleWorkoutSubmit(false)} disabled={isSubmitting}>
                  Skip Workout
                </Button>
                <Button className="flex-1" onClick={() => handleWorkoutSubmit(true)} disabled={isSubmitting}>
                  {primaryActionLabel}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diet">
          <Card>
            <CardHeader>
              <CardTitle>Diet Check-in</CardTitle>
              <CardDescription>Log your nutrition for today</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Diet Adherence Rating: {adherenceRating[0]}/10</Label>
                <Slider
                  value={adherenceRating}
                  onValueChange={setAdherenceRating}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Didn&apos;t follow plan</span>
                  <span>Perfect adherence</span>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="calories">Calories</Label>
                  <Input
                    id="calories"
                    type="number"
                    placeholder="1800"
                    value={dietCalories}
                    onChange={(event) => setDietCalories(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    placeholder="150"
                    value={dietProtein}
                    onChange={(event) => setDietProtein(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="water">Water (L)</Label>
                  <Input
                    id="water"
                    type="number"
                    step="0.1"
                    placeholder="2.5"
                    value={dietWater}
                    onChange={(event) => setDietWater(event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dietNotes">Notes</Label>
                <Textarea
                  id="dietNotes"
                  placeholder="Any deviations from the plan? How did you feel?"
                  value={dietNotes}
                  onChange={(event) => setDietNotes(event.target.value)}
                />
              </div>
              <Button className="w-full sm:w-auto" onClick={handleDietSubmit} disabled={isSubmitting}>
                {primaryActionLabel}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CheckInPage;
