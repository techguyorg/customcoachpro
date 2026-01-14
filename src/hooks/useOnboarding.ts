import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  action?: {
    label: string;
    path: string;
  };
}

export const CLIENT_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to CustomCoachPro!",
    description: "Your all-in-one fitness companion. Let's take a quick tour of what you can do.",
    icon: "🎉",
  },
  {
    id: "programs",
    title: "Browse Programs",
    description: "Discover workout programs designed by professionals. Find one that matches your goals.",
    icon: "📋",
    action: { label: "Browse Programs", path: "/client/programs" },
  },
  {
    id: "workouts",
    title: "Track Workouts",
    description: "Log your exercises, track sets and reps, and watch your progress over time.",
    icon: "💪",
    action: { label: "Go to Workouts", path: "/client/workouts" },
  },
  {
    id: "nutrition",
    title: "Nutrition Log",
    description: "Track your meals and monitor your macros to fuel your fitness journey.",
    icon: "🥗",
    action: { label: "Log Nutrition", path: "/client/nutrition-log" },
  },
  {
    id: "progress",
    title: "Monitor Progress",
    description: "Track measurements, upload progress photos, and set goals to stay motivated.",
    icon: "📈",
    action: { label: "View Progress", path: "/client/progress" },
  },
  {
    id: "coach",
    title: "Find a Coach",
    description: "Connect with certified coaches for personalized guidance and accountability.",
    icon: "👨‍🏫",
    action: { label: "Find Coach", path: "/client/coaches" },
  },
];

export const COACH_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to Your Coach Portal!",
    description: "Manage your coaching business efficiently. Here's a quick overview.",
    icon: "🎉",
  },
  {
    id: "clients",
    title: "Manage Clients",
    description: "View your clients, track their progress, and manage relationships all in one place.",
    icon: "👥",
    action: { label: "View Clients", path: "/coach/clients" },
  },
  {
    id: "programs",
    title: "Create Programs",
    description: "Build custom workout and diet programs, or use templates from our library.",
    icon: "📋",
    action: { label: "Create Program", path: "/coach/programs" },
  },
  {
    id: "checkins",
    title: "Review Check-ins",
    description: "Stay connected with clients through regular check-ins and feedback.",
    icon: "✅",
    action: { label: "View Check-ins", path: "/coach/checkins" },
  },
  {
    id: "analytics",
    title: "Track Your Business",
    description: "Monitor client engagement, retention, and your coaching performance.",
    icon: "📊",
    action: { label: "View Analytics", path: "/coach/analytics" },
  },
];

export const ADMIN_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome, Super Admin!",
    description: "You have full control over the platform. Here's what you can do.",
    icon: "🛡️",
  },
  {
    id: "users",
    title: "User Management",
    description: "Manage all users, assign roles, and handle access control.",
    icon: "👥",
    action: { label: "Manage Users", path: "/admin/users" },
  },
  {
    id: "content",
    title: "Content Management",
    description: "Manage system exercises, workout templates, diet plans, and recipes.",
    icon: "📚",
    action: { label: "Manage Content", path: "/admin/content" },
  },
  {
    id: "analytics",
    title: "Platform Analytics",
    description: "View platform-wide statistics and monitor overall health.",
    icon: "📈",
    action: { label: "View Analytics", path: "/admin/analytics" },
  },
];

export function useOnboarding() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);

  const { data: onboardingStatus, isLoading } = useQuery({
    queryKey: ["onboarding", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        return await api.get<{ onboarding_completed: boolean; onboarding_step: number }>('/api/users/onboarding');
      } catch {
        return null;
      }
    },
    enabled: !!user?.id,
    staleTime: Infinity, // Don't refetch automatically
  });

  const updateOnboarding = useMutation({
    mutationFn: async ({ completed, step }: { completed?: boolean; step?: number }) => {
      if (!user?.id) throw new Error("Not authenticated");
      return api.put('/api/users/onboarding', { completed, step });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding"] });
    },
  });

  const getTutorialSteps = (): TutorialStep[] => {
    if (!user?.roles) return CLIENT_TUTORIAL_STEPS;
    if (user.roles.includes('super_admin')) return ADMIN_TUTORIAL_STEPS;
    if (user.roles.includes('coach')) return COACH_TUTORIAL_STEPS;
    return CLIENT_TUTORIAL_STEPS;
  };

  const startTutorial = () => setShowTutorial(true);
  
  const closeTutorial = async () => {
    // When user closes tutorial, mark it as completed
    try {
      await updateOnboarding.mutateAsync({ completed: true });
    } catch {
      // Still close even if save fails
    }
    setShowTutorial(false);
  };

  const completeTutorial = async () => {
    try {
      await updateOnboarding.mutateAsync({ completed: true });
    } catch {
      // Still close even if save fails
    }
    setShowTutorial(false);
  };

  const updateStep = async (step: number) => {
    await updateOnboarding.mutateAsync({ step });
  };

  // Auto-show tutorial for new users - only check once per session
  useEffect(() => {
    if (!isLoading && onboardingStatus !== undefined && !hasCheckedOnboarding) {
      setHasCheckedOnboarding(true);
      
      // Only show if explicitly not completed (not null/undefined due to network error)
      if (onboardingStatus && onboardingStatus.onboarding_completed === false) {
        const timer = setTimeout(() => setShowTutorial(true), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [onboardingStatus, isLoading, hasCheckedOnboarding]);

  return {
    showTutorial,
    setShowTutorial,
    startTutorial,
    closeTutorial,
    completeTutorial,
    updateStep,
    currentStep: onboardingStatus?.onboarding_step ?? 0,
    isCompleted: onboardingStatus?.onboarding_completed ?? true, // Default to true to prevent showing on error
    tutorialSteps: getTutorialSteps(),
  };
}
