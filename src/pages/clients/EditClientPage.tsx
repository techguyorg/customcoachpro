import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import coachService from "@/services/coachService";

type UnitSystem = "imperial" | "metric";

const schema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  bio: z.string().optional(),
  currentWeight: z.number().positive("Weight must be positive").optional(),
  targetWeight: z.number().positive("Weight must be positive").optional(),
  startWeight: z.number().positive("Weight must be positive").optional(),
  heightCm: z.number().positive("Height must be positive").optional(),
  neckCm: z.number().positive("Neck must be positive").optional(),
  armsCm: z.number().positive("Arms must be positive").optional(),
  quadsCm: z.number().positive("Quads must be positive").optional(),
  hipsCm: z.number().positive("Hips must be positive").optional(),
});

type FormData = z.infer<typeof schema>;

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

export function EditClientPage() {
  const { id } = useParams();
  const clientId = id ?? "";
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");

  const { data, isLoading, error } = useQuery({
    queryKey: ["coach", "client", clientId],
    queryFn: () => coachService.getClient(clientId),
    enabled: !!clientId,
  });

  const { register, handleSubmit, formState: { errors }, reset, getValues, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!data) return;
    const preferred = (data.profile.preferredUnitSystem as UnitSystem | undefined) ?? "imperial";
    setUnitSystem(preferred);

    const profile = data.profile;
    reset({
      displayName: profile.displayName ?? data.email,
      bio: profile.bio ?? "",
      currentWeight: profile.currentWeight ?? undefined,
      targetWeight: profile.targetWeight ?? undefined,
      startWeight: profile.startWeight ?? undefined,
      heightCm: convertLength(profile.heightCm ?? undefined, "metric", preferred),
      neckCm: convertLength(profile.neckCm ?? undefined, "metric", preferred),
      armsCm: convertLength(profile.armsCm ?? undefined, "metric", preferred),
      quadsCm: convertLength(profile.quadsCm ?? undefined, "metric", preferred),
      hipsCm: convertLength(profile.hipsCm ?? undefined, "metric", preferred),
    });
  }, [data, reset]);

  const weightLabel = useMemo(() => (unitSystem === "imperial" ? "lbs" : "kg"), [unitSystem]);
  const lengthLabel = useMemo(() => (unitSystem === "imperial" ? "inches" : "cm"), [unitSystem]);

  const handleUnitChange = (next: UnitSystem) => {
    if (next === unitSystem) return;
    const values = getValues();

    setValue("startWeight", convertWeight(values.startWeight, unitSystem, next));
    setValue("currentWeight", convertWeight(values.currentWeight, unitSystem, next));
    setValue("targetWeight", convertWeight(values.targetWeight, unitSystem, next));

    setValue("heightCm", convertLength(values.heightCm, unitSystem, next));
    setValue("neckCm", convertLength(values.neckCm, unitSystem, next));
    setValue("armsCm", convertLength(values.armsCm, unitSystem, next));
    setValue("quadsCm", convertLength(values.quadsCm, unitSystem, next));
    setValue("hipsCm", convertLength(values.hipsCm, unitSystem, next));

    setUnitSystem(next);
  };

  const onSubmit = async (values: FormData) => {
    try {
      setSaving(true);
      await coachService.updateClient(clientId, {
        displayName: values.displayName,
        bio: values.bio,
        preferredUnitSystem: unitSystem,
        startWeight: values.startWeight,
        currentWeight: values.currentWeight,
        targetWeight: values.targetWeight,
        heightCm: convertLength(values.heightCm, unitSystem, "metric"),
        neckCm: convertLength(values.neckCm, unitSystem, "metric"),
        armsCm: convertLength(values.armsCm, unitSystem, "metric"),
        quadsCm: convertLength(values.quadsCm, unitSystem, "metric"),
        hipsCm: convertLength(values.hipsCm, unitSystem, "metric"),
      });

      await qc.invalidateQueries({ queryKey: ["coach", "client", clientId] });
      await qc.invalidateQueries({ queryKey: ["coach", "clients"] });
      await qc.invalidateQueries({ queryKey: ["dashboard", "coach"] });

      toast({ title: "Saved", description: "Client profile updated successfully." });
      navigate(`/clients/${clientId}`);
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Unable to save changes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-bold">Unable to load client</h1>
        <p className="text-muted-foreground">{error instanceof Error ? error.message : "Unknown error"}</p>
        <Button variant="outline" onClick={() => navigate("/clients")}>Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/clients/${clientId}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold">Edit Client</h1>
          <p className="text-muted-foreground">{data.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Basic client information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" {...register("displayName")} className={errors.displayName ? "border-destructive" : ""} />
              {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Goals</Label>
              <Textarea id="bio" rows={4} {...register("bio")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stats</CardTitle>
            <CardDescription>Weights and measurements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button type="button" variant={unitSystem === "imperial" ? "default" : "outline"} onClick={() => handleUnitChange("imperial")}>
                Imperial (lbs/in)
              </Button>
              <Button type="button" variant={unitSystem === "metric" ? "default" : "outline"} onClick={() => handleUnitChange("metric")}>
                Metric (kg/cm)
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startWeight">Start Weight ({weightLabel})</Label>
                <Input id="startWeight" type="number" {...register("startWeight", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentWeight">Current Weight ({weightLabel})</Label>
                <Input id="currentWeight" type="number" {...register("currentWeight", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetWeight">Target Weight ({weightLabel})</Label>
                <Input id="targetWeight" type="number" {...register("targetWeight", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heightCm">Height ({lengthLabel})</Label>
                <Input id="heightCm" type="number" {...register("heightCm", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neckCm">Neck ({lengthLabel})</Label>
                <Input id="neckCm" type="number" {...register("neckCm", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="armsCm">Arms ({lengthLabel})</Label>
                <Input id="armsCm" type="number" {...register("armsCm", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quadsCm">Quads ({lengthLabel})</Label>
                <Input id="quadsCm" type="number" {...register("quadsCm", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hipsCm">Hips ({lengthLabel})</Label>
                <Input id="hipsCm" type="number" {...register("hipsCm", { valueAsNumber: true })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(`/clients/${clientId}`)}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="shadow-energy">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default EditClientPage;
