import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { X, ChevronLeft, ChevronRight, Check, Sparkles } from "lucide-react";
import { TutorialStep } from "@/hooks/useOnboarding";


interface TutorialOverlayProps {
  steps: TutorialStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete: () => void;
  onClose: () => void;
}

export function TutorialOverlay({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  onClose,
}: TutorialOverlayProps) {
  const navigate = useNavigate();
  const [localStep, setLocalStep] = useState(currentStep);
  const step = steps[localStep];
  const isLastStep = localStep === steps.length - 1;
  const progress = ((localStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      const nextStep = localStep + 1;
      setLocalStep(nextStep);
      onStepChange(nextStep);
    }
  };

  const handlePrev = () => {
    if (localStep > 0) {
      const prevStep = localStep - 1;
      setLocalStep(prevStep);
      onStepChange(prevStep);
    }
  };

  const handleAction = () => {
    if (step?.action) {
      navigate(step.action.path);
      // Complete the tutorial when user navigates away
      onComplete();
    }
  };

  if (!step) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-md mx-4 shadow-2xl border-primary/20">
        <CardHeader className="relative pb-2">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">
              Getting Started • Step {localStep + 1} of {steps.length}
            </span>
          </div>
          
          <Progress value={progress} className="h-1.5 mb-4" />
          
          <div className="flex items-center gap-3">
            <span className="text-3xl">{step.icon}</span>
            <CardTitle className="text-lg">{step.title}</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="pb-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.description}
          </p>
          
          {step.action && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={handleAction}
            >
              {step.action.label}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between pt-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={localStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setLocalStep(i);
                  onStepChange(i);
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === localStep ? "bg-primary" : "bg-muted hover:bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          
          <Button size="sm" onClick={handleNext}>
            {isLastStep ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Done
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
