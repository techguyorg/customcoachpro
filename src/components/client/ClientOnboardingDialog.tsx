import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { 
  User, Scale, Target, Heart, Utensils, ChevronRight, ChevronLeft, 
  Check, Loader2, CalendarIcon
} from "lucide-react";
import { toast } from "sonner";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";

interface ClientOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const FITNESS_GOALS = [
  "Weight Loss",
  "Muscle Building", 
  "Strength Training",
  "Improve Endurance",
  "Flexibility & Mobility",
  "General Fitness",
  "Sports Performance",
  "Rehabilitation",
  "Body Recomposition",
  "Maintain Current Fitness",
];

const FITNESS_LEVELS = [
  { value: "beginner", label: "Beginner", description: "New to fitness or returning after a long break" },
  { value: "intermediate", label: "Intermediate", description: "Regular exercise for 6+ months" },
  { value: "advanced", label: "Advanced", description: "Consistent training for 2+ years" },
];

const DIETARY_RESTRICTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Keto",
  "Paleo",
  "Halal",
  "Kosher",
  "No Restrictions",
];

const MEALS_PER_DAY = ["2", "3", "4", "5", "6+"];

export function ClientOnboardingDialog({ open, onOpenChange, onComplete }: ClientOnboardingDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Form state
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    dateOfBirth: "",
    gender: "",
    heightCm: "",
    
    // Step 2: Weight
    currentWeightKg: "",
    targetWeightKg: "",
    
    // Step 3: Goals
    fitnessGoals: [] as string[],
    fitnessLevel: "",
    
    // Step 4: Health
    medicalConditions: "",
    injuries: "",
    
    // Step 5: Nutrition
    dietaryRestrictions: [] as string[],
    mealsPerDay: "3",
    foodPreferences: "",
    foodDislikes: "",
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: "fitnessGoals" | "dietaryRestrictions", item: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      return api.post('/api/users/onboarding', {
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        heightCm: formData.heightCm ? parseFloat(formData.heightCm) : null,
        currentWeightKg: formData.currentWeightKg ? parseFloat(formData.currentWeightKg) : null,
        targetWeightKg: formData.targetWeightKg ? parseFloat(formData.targetWeightKg) : null,
        fitnessGoals: formData.fitnessGoals.length > 0 ? formData.fitnessGoals : null,
        fitnessLevel: formData.fitnessLevel || null,
        medicalConditions: [formData.medicalConditions, formData.injuries].filter(Boolean).join(". ") || null,
        dietaryRestrictions: formData.dietaryRestrictions.filter(r => r !== "No Restrictions"),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-profile"] });
      queryClient.invalidateQueries({ queryKey: ["client-measurements"] });
      toast.success("Profile completed successfully!");
      onComplete?.();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to save profile");
      console.error(error);
    },
  });

  const canProceed = () => {
    switch (step) {
      case 1: return true; // Optional fields
      case 2: return true; // Optional fields
      case 3: return formData.fitnessLevel !== "";
      case 4: return true; // Optional fields
      case 5: return true; // Optional fields
      default: return false;
    }
  };

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
    else saveMutation.mutate();
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const progressPercent = (step / totalSteps) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Complete Your Profile</DialogTitle>
          <DialogDescription className="text-sm">
            Step {step} of {totalSteps}
          </DialogDescription>
        </DialogHeader>

        <Progress value={progressPercent} className="h-1.5" />

        <div className="py-4 min-h-[280px]">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary mb-4">
                <User className="w-5 h-5" />
                <h3 className="font-semibold">Basic Information</h3>
              </div>
              
              <div>
                <Label htmlFor="dob" className="text-sm">Date of Birth</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="dob"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateField("dateOfBirth", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm">Gender</Label>
                <RadioGroup
                  value={formData.gender}
                  onValueChange={(v) => updateField("gender", v)}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male" className="text-sm font-normal cursor-pointer">Male</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female" className="text-sm font-normal cursor-pointer">Female</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other" className="text-sm font-normal cursor-pointer">Other</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="height" className="text-sm">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="e.g., 175"
                  value={formData.heightCm}
                  onChange={(e) => updateField("heightCm", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Step 2: Weight */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary mb-4">
                <Scale className="w-5 h-5" />
                <h3 className="font-semibold">Weight Information</h3>
              </div>
              
              <div>
                <Label htmlFor="currentWeight" className="text-sm">Current Weight (kg)</Label>
                <Input
                  id="currentWeight"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 75.5"
                  value={formData.currentWeightKg}
                  onChange={(e) => updateField("currentWeightKg", e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="targetWeight" className="text-sm">Target Weight (kg)</Label>
                <Input
                  id="targetWeight"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 70"
                  value={formData.targetWeightKg}
                  onChange={(e) => updateField("targetWeightKg", e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">Leave blank if you don't have a specific target</p>
              </div>
            </div>
          )}

          {/* Step 3: Goals */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary mb-4">
                <Target className="w-5 h-5" />
                <h3 className="font-semibold">Fitness Goals</h3>
              </div>

              <div>
                <Label className="text-sm">What are your goals? (Select all that apply)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {FITNESS_GOALS.map((goal) => (
                    <Badge
                      key={goal}
                      variant={formData.fitnessGoals.includes(goal) ? "default" : "outline"}
                      className="cursor-pointer text-xs py-1"
                      onClick={() => toggleArrayItem("fitnessGoals", goal)}
                    >
                      {goal}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm">Current Fitness Level *</Label>
                <RadioGroup
                  value={formData.fitnessLevel}
                  onValueChange={(v) => updateField("fitnessLevel", v)}
                  className="mt-2 space-y-2"
                >
                  {FITNESS_LEVELS.map((level) => (
                    <div key={level.value} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => updateField("fitnessLevel", level.value)}
                    >
                      <RadioGroupItem value={level.value} id={level.value} className="mt-0.5" />
                      <div>
                        <Label htmlFor={level.value} className="text-sm font-medium cursor-pointer">{level.label}</Label>
                        <p className="text-xs text-muted-foreground">{level.description}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Step 4: Health */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary mb-4">
                <Heart className="w-5 h-5" />
                <h3 className="font-semibold">Health Information</h3>
              </div>
              
              <div>
                <Label htmlFor="medical" className="text-sm">Medical Conditions (if any)</Label>
                <Textarea
                  id="medical"
                  placeholder="e.g., Diabetes, High blood pressure, Asthma..."
                  value={formData.medicalConditions}
                  onChange={(e) => updateField("medicalConditions", e.target.value)}
                  rows={3}
                  className="mt-1 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="injuries" className="text-sm">Current or Past Injuries</Label>
                <Textarea
                  id="injuries"
                  placeholder="e.g., Lower back issues, Knee surgery in 2020..."
                  value={formData.injuries}
                  onChange={(e) => updateField("injuries", e.target.value)}
                  rows={3}
                  className="mt-1 text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">This helps create safe workout plans</p>
              </div>
            </div>
          )}

          {/* Step 5: Nutrition */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary mb-4">
                <Utensils className="w-5 h-5" />
                <h3 className="font-semibold">Nutrition Preferences</h3>
              </div>

              <div>
                <Label className="text-sm">Dietary Restrictions</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {DIETARY_RESTRICTIONS.map((diet) => (
                    <Badge
                      key={diet}
                      variant={formData.dietaryRestrictions.includes(diet) ? "default" : "outline"}
                      className="cursor-pointer text-xs py-1"
                      onClick={() => toggleArrayItem("dietaryRestrictions", diet)}
                    >
                      {diet}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm">Meals per day</Label>
                <Select value={formData.mealsPerDay} onValueChange={(v) => updateField("mealsPerDay", v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEALS_PER_DAY.map((n) => (
                      <SelectItem key={n} value={n}>{n} meals</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="foodPrefs" className="text-sm">Foods You Enjoy</Label>
                <Input
                  id="foodPrefs"
                  placeholder="e.g., Chicken, Rice, Eggs, Broccoli..."
                  value={formData.foodPreferences}
                  onChange={(e) => updateField("foodPreferences", e.target.value)}
                  className="mt-1 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="foodDislikes" className="text-sm">Foods to Avoid</Label>
                <Input
                  id="foodDislikes"
                  placeholder="e.g., Mushrooms, Seafood..."
                  value={formData.foodDislikes}
                  onChange={(e) => updateField("foodDislikes", e.target.value)}
                  className="mt-1 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 1}
            size="sm"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          
          <Button
            onClick={nextStep}
            disabled={!canProceed() || saveMutation.isPending}
            size="sm"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Saving...
              </>
            ) : step === totalSteps ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Complete
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
