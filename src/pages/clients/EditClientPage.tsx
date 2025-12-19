import { useMemo, useState } from "react";
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

const schema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  bio: z.string().optional(),
  currentWeight: z.number().positive("Weight must be positive").optional(),
  targetWeight: z.number().positive("Weight must be positive").optional(),
  startWeight: z.number().positive("Weight must be positive").optional(),
  heightCm: z.number().positive("Height must be positive").optional(),
});

type FormData = z.infer<typeof schema>;

export function EditClientPage() {
  const { id } = useParams();
  const clientId = id ?? "";
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["coach", "client", clientId],
    queryFn: () => coachService.getClient(clientId),
    enabled: !!clientId,
  });

  const defaultValues = useMemo<FormData | undefined>(() => {
    if (!data) return undefined;
    const p = data.profile;
    return {
      displayName: p.displayName ?? data.email,
      bio: p.bio ?? "",
      currentWeight: p.currentWeight ?? undefined,
      targetWeight: p.targetWeight ?? undefined,
      startWeight: p.startWeight ?? undefined,
      heightCm: p.heightCm ?? undefined,
    };
  }, [data]);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: defaultValues,
  });

  // ensure form updates once data loads
  if (defaultValues && !saving) {
    // react-hook-form already uses "values"; no need to reset
  }

  const onSubmit = async (values: FormData) => {
    try {
      setSaving(true);
      await coachService.updateClient(clientId, {
        displayName: values.displayName,
        bio: values.bio,
        startWeight: values.startWeight,
        currentWeight: values.currentWeight,
        targetWeight: values.targetWeight,
        heightCm: values.heightCm,
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startWeight">Start Weight</Label>
                <Input id="startWeight" type="number" {...register("startWeight", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentWeight">Current Weight</Label>
                <Input id="currentWeight" type="number" {...register("currentWeight", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetWeight">Target Weight</Label>
                <Input id="targetWeight" type="number" {...register("targetWeight", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heightCm">Height (cm)</Label>
                <Input id="heightCm" type="number" {...register("heightCm", { valueAsNumber: true })} />
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
