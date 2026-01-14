import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAddMeasurement } from "@/hooks/useClientProgress";
import { toast } from "sonner";
import { Loader2, Scale, Ruler, Activity } from "lucide-react";

const measurementSchema = z.object({
  recorded_at: z.string(),
  weight_kg: z.coerce.number().min(20).max(500),
  body_fat_pct: z.coerce.number().min(1).max(60).optional().nullable(),
  muscle_mass_kg: z.coerce.number().min(10).max(150).optional().nullable(),
  chest_cm: z.coerce.number().min(50).max(200).optional().nullable(),
  waist_cm: z.coerce.number().min(40).max(200).optional().nullable(),
  hips_cm: z.coerce.number().min(50).max(200).optional().nullable(),
  left_arm_cm: z.coerce.number().min(15).max(60).optional().nullable(),
  right_arm_cm: z.coerce.number().min(15).max(60).optional().nullable(),
  left_thigh_cm: z.coerce.number().min(30).max(100).optional().nullable(),
  right_thigh_cm: z.coerce.number().min(30).max(100).optional().nullable(),
  left_calf_cm: z.coerce.number().min(20).max(60).optional().nullable(),
  right_calf_cm: z.coerce.number().min(20).max(60).optional().nullable(),
  neck_cm: z.coerce.number().min(25).max(60).optional().nullable(),
  shoulders_cm: z.coerce.number().min(70).max(170).optional().nullable(),
  notes: z.string().optional().nullable(),
});

type MeasurementFormData = z.infer<typeof measurementSchema>;

interface AddMeasurementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMeasurementDialog({ open, onOpenChange }: AddMeasurementDialogProps) {
  const addMeasurement = useAddMeasurement();

  const form = useForm<MeasurementFormData>({
    resolver: zodResolver(measurementSchema),
    defaultValues: {
      recorded_at: new Date().toISOString().split('T')[0],
      weight_kg: undefined,
    },
  });

  const onSubmit = async (data: MeasurementFormData) => {
    try {
      await addMeasurement.mutateAsync({
        recorded_at: data.recorded_at,
        weight_kg: data.weight_kg,
        body_fat_pct: data.body_fat_pct || null,
        muscle_mass_kg: data.muscle_mass_kg || null,
        chest_cm: data.chest_cm || null,
        waist_cm: data.waist_cm || null,
        hips_cm: data.hips_cm || null,
        left_arm_cm: data.left_arm_cm || null,
        right_arm_cm: data.right_arm_cm || null,
        left_thigh_cm: data.left_thigh_cm || null,
        right_thigh_cm: data.right_thigh_cm || null,
        left_calf_cm: data.left_calf_cm || null,
        right_calf_cm: data.right_calf_cm || null,
        neck_cm: data.neck_cm || null,
        shoulders_cm: data.shoulders_cm || null,
        notes: data.notes || null,
      });
      toast.success("Measurement logged successfully!");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to log measurement");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Log Measurement
          </DialogTitle>
          <DialogDescription>
            Weight is required. All other measurements are optional.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Date & Weight (Required) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recorded_at">Date</Label>
              <Input
                id="recorded_at"
                type="date"
                {...form.register("recorded_at")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight_kg">Weight (kg) *</Label>
              <Input
                id="weight_kg"
                type="number"
                step="0.1"
                placeholder="75.5"
                {...form.register("weight_kg")}
              />
              {form.formState.errors.weight_kg && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.weight_kg.message}
                </p>
              )}
            </div>
          </div>

          <Accordion type="multiple" className="w-full">
            {/* Body Composition */}
            <AccordionItem value="composition">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Body Composition
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="body_fat_pct">Body Fat (%)</Label>
                    <Input
                      id="body_fat_pct"
                      type="number"
                      step="0.1"
                      placeholder="15.0"
                      {...form.register("body_fat_pct")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="muscle_mass_kg">Muscle Mass (kg)</Label>
                    <Input
                      id="muscle_mass_kg"
                      type="number"
                      step="0.1"
                      placeholder="35.0"
                      {...form.register("muscle_mass_kg")}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Upper Body */}
            <AccordionItem value="upper">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <Ruler className="w-4 h-4" />
                  Upper Body Measurements
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="neck_cm">Neck (cm)</Label>
                    <Input
                      id="neck_cm"
                      type="number"
                      step="0.1"
                      placeholder="38.0"
                      {...form.register("neck_cm")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shoulders_cm">Shoulders (cm)</Label>
                    <Input
                      id="shoulders_cm"
                      type="number"
                      step="0.1"
                      placeholder="115.0"
                      {...form.register("shoulders_cm")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chest_cm">Chest (cm)</Label>
                    <Input
                      id="chest_cm"
                      type="number"
                      step="0.1"
                      placeholder="100.0"
                      {...form.register("chest_cm")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="waist_cm">Waist (cm)</Label>
                    <Input
                      id="waist_cm"
                      type="number"
                      step="0.1"
                      placeholder="80.0"
                      {...form.register("waist_cm")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="left_arm_cm">Left Arm (cm)</Label>
                    <Input
                      id="left_arm_cm"
                      type="number"
                      step="0.1"
                      placeholder="35.0"
                      {...form.register("left_arm_cm")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="right_arm_cm">Right Arm (cm)</Label>
                    <Input
                      id="right_arm_cm"
                      type="number"
                      step="0.1"
                      placeholder="35.0"
                      {...form.register("right_arm_cm")}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Lower Body */}
            <AccordionItem value="lower">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <Ruler className="w-4 h-4" />
                  Lower Body Measurements
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="hips_cm">Hips (cm)</Label>
                    <Input
                      id="hips_cm"
                      type="number"
                      step="0.1"
                      placeholder="95.0"
                      {...form.register("hips_cm")}
                    />
                  </div>
                  <div className="col-span-2 grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="left_thigh_cm">Left Thigh (cm)</Label>
                      <Input
                        id="left_thigh_cm"
                        type="number"
                        step="0.1"
                        placeholder="55.0"
                        {...form.register("left_thigh_cm")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="right_thigh_cm">Right Thigh (cm)</Label>
                      <Input
                        id="right_thigh_cm"
                        type="number"
                        step="0.1"
                        placeholder="55.0"
                        {...form.register("right_thigh_cm")}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="left_calf_cm">Left Calf (cm)</Label>
                    <Input
                      id="left_calf_cm"
                      type="number"
                      step="0.1"
                      placeholder="38.0"
                      {...form.register("left_calf_cm")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="right_calf_cm">Right Calf (cm)</Label>
                    <Input
                      id="right_calf_cm"
                      type="number"
                      step="0.1"
                      placeholder="38.0"
                      {...form.register("right_calf_cm")}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="How are you feeling today? Any observations..."
              {...form.register("notes")}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addMeasurement.isPending}>
              {addMeasurement.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Measurement
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
