import { useState } from 'react';
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
import { Scale, Camera, Dumbbell, Utensils, Loader2, CheckCircle } from 'lucide-react';

const weightSchema = z.object({
  weight: z.number().min(20).max(500),
  bodyFatPercentage: z.number().min(1).max(60).optional(),
  waist: z.number().min(20).max(200).optional(),
  chest: z.number().min(20).max(200).optional(),
  arms: z.number().min(10).max(100).optional(),
  notes: z.string().max(500).optional(),
});

const workoutSchema = z.object({
  completed: z.boolean(),
  durationMinutes: z.number().min(1).max(300).optional(),
  notes: z.string().max(500).optional(),
});

const dietSchema = z.object({
  adherenceRating: z.number().min(1).max(10),
  caloriesConsumed: z.number().min(0).max(10000).optional(),
  proteinGrams: z.number().min(0).max(1000).optional(),
  waterLiters: z.number().min(0).max(10).optional(),
  notes: z.string().max(500).optional(),
});

export function CheckInPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adherenceRating, setAdherenceRating] = useState([7]);

  const weightForm = useForm({
    resolver: zodResolver(weightSchema),
    defaultValues: {
      weight: 0,
      bodyFatPercentage: undefined,
      waist: undefined,
      chest: undefined,
      arms: undefined,
      notes: '',
    },
  });

  const handleWeightSubmit = async (data: z.infer<typeof weightSchema>) => {
    setIsSubmitting(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
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
    } finally {
      setIsSubmitting(false);
    }
  };

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

        {/* Weight Check-in */}
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
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Submit Check-in
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Photo Check-in */}
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
                        <p className="mt-2 text-sm text-muted-foreground">Click to upload</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-2">
                <Label htmlFor="photoNotes">Notes</Label>
                <Textarea id="photoNotes" placeholder="Any comments about your photos?" />
              </div>
              <Button className="mt-4 w-full sm:w-auto">
                <CheckCircle className="mr-2 h-4 w-4" />
                Submit Photos
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workout Check-in */}
        <TabsContent value="workout">
          <Card>
            <CardHeader>
              <CardTitle>Workout Check-in</CardTitle>
              <CardDescription>Log today's workout completion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-muted/50 p-4">
                <h4 className="font-semibold">Today's Workout: Push Day</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Bench Press, Overhead Press, Dips, Lateral Raises
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input id="duration" type="number" placeholder="45" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workoutNotes">Notes</Label>
                <Textarea
                  id="workoutNotes"
                  placeholder="How did the workout go? Any PRs or issues?"
                />
              </div>
              <div className="flex gap-4">
                <Button className="flex-1" variant="outline">
                  Skip Workout
                </Button>
                <Button className="flex-1">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete Workout
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Diet Check-in */}
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
                  <span>Didn't follow plan</span>
                  <span>Perfect adherence</span>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="calories">Calories</Label>
                  <Input id="calories" type="number" placeholder="1800" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input id="protein" type="number" placeholder="150" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="water">Water (L)</Label>
                  <Input id="water" type="number" step="0.1" placeholder="2.5" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dietNotes">Notes</Label>
                <Textarea
                  id="dietNotes"
                  placeholder="Any deviations from the plan? How did you feel?"
                />
              </div>
              <Button className="w-full sm:w-auto">
                <CheckCircle className="mr-2 h-4 w-4" />
                Submit Diet Check-in
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CheckInPage;
