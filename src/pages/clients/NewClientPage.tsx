import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import coachService from "@/services/coachService";

type UnitSystem = "imperial" | "metric";

const clientSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  goals: z.string().optional(),
  currentWeight: z.number().positive("Weight must be positive").optional(),
  targetWeight: z.number().positive("Weight must be positive").optional(),
  startWeight: z.number().positive("Weight must be positive").optional(),
  height: z.number().positive("Height must be positive").optional(), // inches/cm in UI
  neck: z.number().positive("Neck must be positive").optional(),
  arms: z.number().positive("Arms must be positive").optional(),
  quads: z.number().positive("Quads must be positive").optional(),
  hips: z.number().positive("Hips must be positive").optional(),
  notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

const INCH_TO_CM = 2.54;
const LB_TO_KG = 0.45359237;

const convertLength = (value: number | undefined, from: UnitSystem, to: UnitSystem) => {
  if (value === undefined || Number.isNaN(value)) return undefined;
  if (from === to) return value;
  return from === "imperial" ? Number((value * INCH_TO_CM).toFixed(1)) : Number((value / INCH_TO_CM).toFixed(1));
};

const convertWeight = (value: number | undefined, from: UnitSystem, to: UnitSystem) => {
  if (value === undefined || Number.isNaN(value)) return undefined;
  if (from === to) return value;
  return from === "imperial" ? Number((value * LB_TO_KG).toFixed(1)) : Number((value / LB_TO_KG).toFixed(1));
};

export function NewClientPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  const weightLabel = useMemo(() => (unitSystem === "imperial" ? "lbs" : "kg"), [unitSystem]);
  const lengthLabel = useMemo(() => (unitSystem === "imperial" ? "inches" : "cm"), [unitSystem]);

  const handleUnitToggle = (next: UnitSystem) => {
    if (next === unitSystem) return;
    const currentValues = getValues();

    // Convert weights
    setValue("startWeight", convertWeight(currentValues.startWeight, unitSystem, next));
    setValue("currentWeight", convertWeight(currentValues.currentWeight, unitSystem, next));
    setValue("targetWeight", convertWeight(currentValues.targetWeight, unitSystem, next));

    // Convert lengths
    setValue("height", convertLength(currentValues.height, unitSystem, next));
    setValue("neck", convertLength(currentValues.neck, unitSystem, next));
    setValue("arms", convertLength(currentValues.arms, unitSystem, next));
    setValue("quads", convertLength(currentValues.quads, unitSystem, next));
    setValue("hips", convertLength(currentValues.hips, unitSystem, next));

    setUnitSystem(next);
  };

  const onSubmit = async (data: ClientFormData) => {
    try {
      setIsLoading(true);

      const res = await coachService.createClient({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        goals: data.goals,
        notes: data.notes,
        startDate: new Date().toISOString(),
        preferredUnitSystem: unitSystem,
        heightCm: convertLength(data.height, unitSystem, "metric"),
        neckCm: convertLength(data.neck, unitSystem, "metric"),
        armsCm: convertLength(data.arms, unitSystem, "metric"),
        quadsCm: convertLength(data.quads, unitSystem, "metric"),
        hipsCm: convertLength(data.hips, unitSystem, "metric"),
        startWeight: data.startWeight ?? data.currentWeight,
        currentWeight: data.currentWeight,
        targetWeight: data.targetWeight,
      });

      toast({
        title: "Client created",
        description: `${data.firstName} ${data.lastName} added. Temporary password: ${res.tempPassword}`,
      });

      navigate("/clients");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create client. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold">Add New Client</h1>
          <p className="text-muted-foreground">Enter your new client's information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Client's personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" placeholder="John" {...register("firstName")} className={errors.firstName ? "border-destructive" : ""} />
                {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" placeholder="Doe" {...register("lastName")} className={errors.lastName ? "border-destructive" : ""} />
                {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" placeholder="john@example.com" {...register("email")} className={errors.email ? "border-destructive" : ""} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Physical Stats</CardTitle>
            <CardDescription>Current measurements and goals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button type="button" variant={unitSystem === "imperial" ? "default" : "outline"} onClick={() => handleUnitToggle("imperial")}>
                Imperial (lbs/in)
              </Button>
              <Button type="button" variant={unitSystem === "metric" ? "default" : "outline"} onClick={() => handleUnitToggle("metric")}>
                Metric (kg/cm)
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startWeight">Start Weight ({weightLabel})</Label>
                <Input id="startWeight" type="number" placeholder={unitSystem === "imperial" ? "185" : "84"} {...register("startWeight", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentWeight">Current Weight ({weightLabel})</Label>
                <Input id="currentWeight" type="number" placeholder={unitSystem === "imperial" ? "185" : "84"} {...register("currentWeight", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetWeight">Target Weight ({weightLabel})</Label>
                <Input id="targetWeight" type="number" placeholder={unitSystem === "imperial" ? "165" : "75"} {...register("targetWeight", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height ({lengthLabel})</Label>
                <Input id="height" type="number" placeholder={unitSystem === "imperial" ? "70" : "178"} {...register("height", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neck">Neck ({lengthLabel})</Label>
                <Input id="neck" type="number" placeholder={unitSystem === "imperial" ? "15" : "38"} {...register("neck", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arms">Arms ({lengthLabel})</Label>
                <Input id="arms" type="number" placeholder={unitSystem === "imperial" ? "14" : "36"} {...register("arms", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quads">Quads ({lengthLabel})</Label>
                <Input id="quads" type="number" placeholder={unitSystem === "imperial" ? "22" : "56"} {...register("quads", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hips">Hips ({lengthLabel})</Label>
                <Input id="hips" type="number" placeholder={unitSystem === "imperial" ? "36" : "91"} {...register("hips", { valueAsNumber: true })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Goals & Notes</CardTitle>
            <CardDescription>What does the client want to achieve?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goals">Goals</Label>
              <Textarea id="goals" placeholder="e.g., Lose 20 lbs, build muscle, improve endurance..." rows={3} {...register("goals")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Any additional notes, injuries, preferences..." rows={3} {...register("notes")} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/clients")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="shadow-energy">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Client"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default NewClientPage;
