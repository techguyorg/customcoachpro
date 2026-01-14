import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddMeasurement } from "@/hooks/useClientProgress";
import { toast } from "sonner";
import { Loader2, Scale } from "lucide-react";
import { format } from "date-fns";

interface QuickLogMeasurementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickLogMeasurementDialog({ open, onOpenChange }: QuickLogMeasurementDialogProps) {
  const [weight, setWeight] = useState("");
  const addMeasurement = useAddMeasurement();

  const handleSubmit = async () => {
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum < 20 || weightNum > 500) {
      toast.error("Please enter a valid weight (20-500 kg)");
      return;
    }

    try {
      await addMeasurement.mutateAsync({
        recorded_at: format(new Date(), "yyyy-MM-dd"),
        weight_kg: weightNum,
        body_fat_pct: null,
        muscle_mass_kg: null,
        chest_cm: null,
        waist_cm: null,
        hips_cm: null,
        left_arm_cm: null,
        right_arm_cm: null,
        left_thigh_cm: null,
        right_thigh_cm: null,
        left_calf_cm: null,
        right_calf_cm: null,
        neck_cm: null,
        shoulders_cm: null,
        notes: null,
      });
      toast.success("Weight logged!");
      setWeight("");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to log weight");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Quick Log Weight
          </DialogTitle>
          <DialogDescription>
            Log your current weight
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Today's Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              placeholder="75.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={addMeasurement.isPending || !weight}>
              {addMeasurement.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Log Weight
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
