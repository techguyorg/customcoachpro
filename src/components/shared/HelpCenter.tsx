import { useState } from "react";
import { 
  HelpCircle, 
  X, 
  Search,
  Users,
  ClipboardList,
  Utensils,
  CalendarCheck,
  BarChart3,
  Target,
  Dumbbell,
  MessageSquare,
  Heart,
  TrendingUp,
  Camera,
  Scale,
  Settings,
  ChefHat,
  Play,
  UserPlus,
  ChevronRight,
  Sparkles,
  BookOpen,
  Rocket,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";

interface FeatureGuide {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  steps?: string[];
  tips?: string[];
}

interface FeatureCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  features: FeatureGuide[];
}

// Coach feature guides
const coachFeatures: FeatureCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Rocket,
    features: [
      {
        id: "dashboard",
        icon: BarChart3,
        title: "Your Dashboard",
        description: "Your command center showing client overview, pending check-ins, and quick actions.",
        tips: ["Check your dashboard daily for pending tasks", "Use quick actions to save time"],
      },
      {
        id: "invite-clients",
        icon: UserPlus,
        title: "Inviting Clients",
        description: "Send invitations to new clients via email. They'll receive a link to join and connect with you.",
        steps: [
          "Go to My Clients page",
          "Click 'Invite Client' button",
          "Enter their email and a personal message",
          "They'll receive an email with instructions"
        ],
      },
    ],
  },
  {
    id: "client-management",
    title: "Client Management",
    icon: Users,
    features: [
      {
        id: "manage-clients",
        icon: Users,
        title: "Managing Clients",
        description: "View all your clients, filter by status, and access their detailed profiles.",
        steps: [
          "Navigate to My Clients",
          "Use tabs to filter by Active, Pending, or Paused",
          "Click any client card to see their full details",
          "Update their status or assign plans from the detail view"
        ],
      },
      {
        id: "review-checkins",
        icon: CalendarCheck,
        title: "Reviewing Check-ins",
        description: "Clients submit regular check-ins with progress updates. Review them to provide feedback.",
        steps: [
          "Go to Check-ins page",
          "Click on pending check-ins to review",
          "View their adherence, measurements, and notes",
          "Provide feedback and rate their progress"
        ],
        tips: ["Respond promptly to keep clients engaged", "Use the feedback to adjust their plans"],
      },
    ],
  },
  {
    id: "content-library",
    title: "Content Library",
    icon: ClipboardList,
    features: [
      {
        id: "workout-programs",
        icon: Dumbbell,
        title: "Workout Programs",
        description: "Create multi-week workout programs with structured days, exercises, and progression.",
        steps: [
          "Go to Programs page",
          "Click 'Create Program' to build from scratch",
          "Add weeks and training days",
          "Add exercises with sets, reps, and notes",
          "Assign to clients when ready"
        ],
      },
      {
        id: "diet-plans",
        icon: Utensils,
        title: "Diet Plans",
        description: "Build nutrition plans with macro targets and meal structures.",
        steps: [
          "Navigate to Diet Plans",
          "Create a new plan with calorie and macro targets",
          "Add meals with time suggestions",
          "Add food items to each meal",
          "Assign to clients"
        ],
      },
      {
        id: "recipes",
        icon: ChefHat,
        title: "Recipe Builder",
        description: "Create recipes that auto-calculate nutrition based on ingredients.",
        tips: ["Nutrition is calculated automatically from ingredients", "Recipes can be added to diet plan meals"],
      },
    ],
  },
  {
    id: "business-tools",
    title: "Business Tools",
    icon: BarChart3,
    features: [
      {
        id: "analytics",
        icon: BarChart3,
        title: "Analytics Dashboard",
        description: "Track your coaching business performance, client engagement, and growth metrics.",
        tips: ["Export reports as PDF for record-keeping", "Monitor client leaderboard to identify top performers"],
      },
      {
        id: "messages",
        icon: MessageSquare,
        title: "Messaging",
        description: "Communicate directly with clients through the built-in messaging system.",
      },
    ],
  },
];

// Client feature guides
const clientFeatures: FeatureCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Rocket,
    features: [
      {
        id: "dashboard",
        icon: BarChart3,
        title: "Your Dashboard",
        description: "See today's workout, nutrition targets, and your current stats at a glance.",
        tips: ["Check daily for your scheduled activities", "Track your streaks to stay motivated"],
      },
      {
        id: "find-coach",
        icon: Users,
        title: "Finding a Coach",
        description: "Browse the coach marketplace to find a coach that matches your goals.",
        steps: [
          "Go to Coach Marketplace",
          "Browse coaches by specialization",
          "View their profiles and ratings",
          "Send a coaching request with a message"
        ],
      },
    ],
  },
  {
    id: "workouts",
    title: "Workouts & Training",
    icon: Dumbbell,
    features: [
      {
        id: "start-workout",
        icon: Play,
        title: "Starting a Workout",
        description: "Follow your assigned workout plan or browse available programs.",
        steps: [
          "Go to Workouts page",
          "View your assigned plan or browse programs",
          "Click 'Start Workout' to begin tracking",
          "Log your sets, reps, and weights",
          "Complete the workout to log it"
        ],
      },
      {
        id: "browse-exercises",
        icon: Dumbbell,
        title: "Exercise Library",
        description: "Explore the exercise database with instructions and tips.",
        tips: ["Filter by muscle group or equipment", "Favorite exercises for quick access"],
      },
    ],
  },
  {
    id: "nutrition",
    title: "Nutrition",
    icon: Utensils,
    features: [
      {
        id: "nutrition-log",
        icon: Utensils,
        title: "Logging Meals",
        description: "Track your daily food intake to meet your nutrition targets.",
        steps: [
          "Go to Nutrition Log",
          "Click 'Log Food' for the meal type",
          "Search and select foods",
          "Adjust portions and save"
        ],
      },
      {
        id: "diet-plans-client",
        icon: ClipboardList,
        title: "Following Diet Plans",
        description: "View your assigned diet plan with meal structures and targets.",
        tips: ["Check your daily macro targets", "Use the meal suggestions as a guide"],
      },
    ],
  },
  {
    id: "progress",
    title: "Progress Tracking",
    icon: TrendingUp,
    features: [
      {
        id: "measurements",
        icon: Scale,
        title: "Logging Measurements",
        description: "Record your weight, body measurements, and track changes over time.",
        steps: [
          "Go to Progress page",
          "Click 'Log Progress'",
          "Enter your current measurements",
          "View your trends in the charts"
        ],
      },
      {
        id: "progress-photos",
        icon: Camera,
        title: "Progress Photos",
        description: "Upload photos to visually track your transformation.",
        tips: ["Take photos in consistent lighting", "Use the same poses for comparison"],
      },
      {
        id: "goals",
        icon: Target,
        title: "Setting Goals",
        description: "Set specific, measurable goals and track your progress.",
        steps: [
          "Go to Progress > Goals tab",
          "Click 'Add Goal'",
          "Set your target and timeline",
          "Update progress as you go"
        ],
      },
      {
        id: "checkins",
        icon: CalendarCheck,
        title: "Submitting Check-ins",
        description: "Send regular updates to your coach about your progress and challenges.",
        steps: [
          "Go to Check-ins page",
          "Fill in your adherence ratings",
          "Add notes about wins and challenges",
          "Optionally attach progress photos",
          "Submit for coach review"
        ],
      },
    ],
  },
];

// Admin feature guides
const adminFeatures: FeatureCategory[] = [
  {
    id: "platform-management",
    title: "Platform Management",
    icon: Shield,
    features: [
      {
        id: "user-management",
        icon: Users,
        title: "Managing Users",
        description: "View and manage all platform users, including coaches and clients.",
        steps: [
          "Go to Users section",
          "Search or filter users",
          "View user details and activity",
          "Use impersonation to troubleshoot issues"
        ],
      },
      {
        id: "system-content",
        icon: ClipboardList,
        title: "System Content",
        description: "Manage system exercises, plans, and other content available to all users.",
      },
      {
        id: "analytics-admin",
        icon: BarChart3,
        title: "Platform Analytics",
        description: "Monitor platform-wide metrics, user growth, and engagement.",
        tips: ["Export reports for stakeholder meetings", "Track key growth metrics regularly"],
      },
    ],
  },
];

// Combined features for unauthenticated users
const guestFeatures: FeatureCategory[] = [
  {
    id: "for-clients",
    title: "For Clients",
    icon: Target,
    features: clientFeatures.flatMap(cat => cat.features).slice(0, 4),
  },
  {
    id: "for-coaches",
    title: "For Coaches",
    icon: Users,
    features: coachFeatures.flatMap(cat => cat.features).slice(0, 4),
  },
];

function getFeaturesByRole(role?: string): FeatureCategory[] {
  switch (role) {
    case "coach":
      return coachFeatures;
    case "client":
      return clientFeatures;
    case "super_admin":
      return adminFeatures;
    default:
      // Show both client and coach guides for unauthenticated users
      return guestFeatures;
  }
}

function getRoleLabel(role?: string): string {
  switch (role) {
    case "coach": return "Coach";
    case "client": return "Client";
    case "super_admin": return "Admin";
    default: return "Getting Started";
  }
}

export function HelpCenter() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedFeature, setSelectedFeature] = useState<FeatureGuide | null>(null);
  const { user } = useAuth();

  const features = getFeaturesByRole(user?.role);
  const roleLabel = getRoleLabel(user?.role);

  // Filter features by search
  const filteredFeatures = search
    ? features.map(cat => ({
        ...cat,
        features: cat.features.filter(f =>
          f.title.toLowerCase().includes(search.toLowerCase()) ||
          f.description.toLowerCase().includes(search.toLowerCase())
        )
      })).filter(cat => cat.features.length > 0)
    : features;

  return (
    <>
      {/* Floating Help Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg border-primary/30 bg-background hover:bg-primary hover:text-primary-foreground transition-all"
        onClick={() => setOpen(true)}
      >
        <HelpCircle className="h-5 w-5" />
      </Button>

      {/* Help Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] p-0">
          <DialogHeader className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Help Center
                <Badge variant="secondary" className="ml-2">{roleLabel}</Badge>
              </DialogTitle>
            </div>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search features..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </DialogHeader>

          <ScrollArea className="h-[60vh] px-4 pb-4">
            {selectedFeature ? (
              <div className="space-y-4 py-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedFeature(null)}
                  className="mb-2"
                >
                  ← Back to all features
                </Button>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <selectedFeature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{selectedFeature.title}</h3>
                </div>
                
                <p className="text-muted-foreground">{selectedFeature.description}</p>
                
                {selectedFeature.steps && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      How to use
                    </h4>
                    <ol className="space-y-2 ml-6">
                      {selectedFeature.steps.map((step, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                          <span className="font-semibold text-primary">{i + 1}.</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                
                {selectedFeature.tips && (
                  <div className="bg-primary/5 rounded-lg p-4 space-y-2">
                    <h4 className="font-medium flex items-center gap-2 text-sm">
                      <Heart className="w-4 h-4 text-primary" />
                      Pro Tips
                    </h4>
                    <ul className="space-y-1">
                      {selectedFeature.tips.map((tip, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                          <span className="text-primary">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <Accordion type="single" collapsible className="space-y-2 py-4">
                {filteredFeatures.map((category) => (
                  <AccordionItem key={category.id} value={category.id} className="border rounded-lg px-3">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-2">
                        <category.icon className="w-4 h-4 text-primary" />
                        <span className="font-medium">{category.title}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {category.features.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <div className="space-y-1">
                        {category.features.map((feature) => (
                          <button
                            key={feature.id}
                            onClick={() => setSelectedFeature(feature)}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                          >
                            <feature.icon className="w-4 h-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{feature.title}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {feature.description}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}

            {filteredFeatures.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No features found for "{search}"</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
