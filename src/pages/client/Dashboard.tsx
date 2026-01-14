import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Dumbbell, 
  UtensilsCrossed, 
  TrendingUp,
  CalendarCheck,
  MessageSquare,
  User,
  LogOut,
  Menu,
  X,
  Search,
  Library,
  ClipboardList,
  ChefHat,
  Apple,
  Heart,
  Users,
  AlertCircle,
  Play,
  Scale,
  Flame,
  Clock
} from "lucide-react";
import { useState, useEffect } from "react";
import ExercisesPage from "@/pages/shared/ExercisesPage";
import WorkoutTemplatesPage from "@/pages/shared/WorkoutTemplatesPage";
import WorkoutsPage from "@/pages/client/WorkoutsPage";
import ActiveWorkoutPage from "@/pages/client/ActiveWorkoutPage";
import ProgressPage from "@/pages/client/ProgressPage";
import CheckinsPage from "@/pages/client/CheckinsPage";
import ClientDietPlansPage from "@/pages/client/DietPlansPage";
import RecipesPage from "@/pages/shared/RecipesPage";
import NutritionLogPage from "@/pages/client/NutritionLogPage";
import FavoritesPage from "@/pages/client/FavoritesPage";
import CoachMarketplacePage from "@/pages/client/CoachMarketplacePage";
import ClientProfilePage from "@/pages/client/ProfilePage";
import MessagesPage from "@/pages/shared/MessagesPage";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import { RoleSwitcher } from "@/components/shared/RoleSwitcher";
import { MyCoachCard } from "@/components/client/MyCoachCard";
import { ClientOnboardingDialog } from "@/components/client/ClientOnboardingDialog";
import { QuickLogNutritionDialog } from "@/components/client/QuickLogNutritionDialog";
import { QuickLogMeasurementDialog } from "@/components/client/QuickLogMeasurementDialog";
import { StartWorkoutDialog } from "@/components/workout/StartWorkoutDialog";
import { useClientProfile } from "@/hooks/useClientProfile";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useTotalUnreadCount } from "@/hooks/useMessages";
import { useOnboarding } from "@/hooks/useOnboarding";
import { TutorialOverlay } from "@/components/onboarding/TutorialOverlay";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SidebarItem = {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  section?: string;
};

const sidebarItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/client" },
  { icon: Users, label: "Find a Coach", path: "/client/coaches" },
  // Training section
  { icon: Dumbbell, label: "Workouts", path: "/client/workouts", section: "Training" },
  { icon: ClipboardList, label: "Programs", path: "/client/programs" },
  { icon: Library, label: "Exercises", path: "/client/exercises" },
  // Nutrition section  
  { icon: UtensilsCrossed, label: "Diet Plans", path: "/client/diet-plans", section: "Nutrition" },
  { icon: Apple, label: "Nutrition Log", path: "/client/nutrition-log" },
  { icon: ChefHat, label: "Recipes", path: "/client/recipes" },
  // Tracking section
  { icon: TrendingUp, label: "Progress", path: "/client/progress", section: "Tracking" },
  { icon: CalendarCheck, label: "Check-ins", path: "/client/checkins" },
  { icon: MessageSquare, label: "Messages", path: "/client/messages" },
  // Account section
  { icon: Heart, label: "Favorites", path: "/client/favorites", section: "Account" },
  { icon: User, label: "Profile", path: "/client/profile" },
];

function ClientDashboard() {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const unreadCount = useTotalUnreadCount();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg">CustomCoachPro</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {sidebarItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              const showBadge = item.label === "Messages" && unreadCount > 0;
              const showSection = item.section && (index === 0 || sidebarItems[index - 1]?.section !== item.section);
              
              return (
                <div key={item.path}>
                  {showSection && (
                    <div className="px-3 pt-4 pb-1.5 first:pt-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                        {item.section}
                      </span>
                    </div>
                  )}
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-sm ${
                      isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </div>
                    {showBadge && (
                      <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Link>
                </div>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border shrink-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {user?.fullName?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user?.fullName || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full relative z-10" 
              onClick={() => signOut()}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <h1 className="text-lg font-semibold">My Fitness Journey</h1>
            </div>
            <div className="flex items-center gap-2">
              <RoleSwitcher />
              <ThemeSwitcher />
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">
          <Routes>
            <Route index element={<ClientHome />} />
            <Route path="coaches" element={<CoachMarketplacePage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="workouts" element={<WorkoutsPage />} />
            <Route path="workouts/:logId" element={<ActiveWorkoutPage />} />
            <Route path="programs" element={<WorkoutTemplatesPage />} />
            <Route path="exercises" element={<ExercisesPage />} />
            <Route path="diet-plans" element={<ClientDietPlansPage />} />
            <Route path="nutrition-log" element={<NutritionLogPage />} />
            <Route path="recipes" element={<RecipesPage viewOnly />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="checkins" element={<CheckinsPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="profile" element={<ClientProfilePage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function ClientHome() {
  const { user } = useAuth();
  const { data: profileData, isLoading: profileLoading } = useClientProfile();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showNutritionDialog, setShowNutritionDialog] = useState(false);
  const [showMeasurementDialog, setShowMeasurementDialog] = useState(false);
  const [showWorkoutDialog, setShowWorkoutDialog] = useState(false);
  
  const { showTutorial, closeTutorial, completeTutorial, updateStep, currentStep, tutorialSteps } = useOnboarding();

  // Show onboarding if profile is incomplete
  useEffect(() => {
    if (!profileLoading && profileData && !profileData.isComplete) {
      const timer = setTimeout(() => setShowOnboarding(true), 500);
      return () => clearTimeout(timer);
    }
  }, [profileLoading, profileData]);
  
  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* Tutorial Overlay */}
        {showTutorial && (
          <TutorialOverlay
            steps={tutorialSteps}
            currentStep={currentStep}
            onStepChange={updateStep}
            onComplete={completeTutorial}
            onClose={closeTutorial}
          />
        )}
        
        {/* Dialogs */}
        <ClientOnboardingDialog 
          open={!showTutorial && showOnboarding}
          // open={showOnboarding} 
          onOpenChange={setShowOnboarding}
        />
        <QuickLogNutritionDialog 
          open={!showTutorial && showNutritionDialog}
          onOpenChange={setShowNutritionDialog}
        />
        <QuickLogMeasurementDialog 
          open={!showTutorial && showMeasurementDialog}
          onOpenChange={setShowMeasurementDialog}
        />
        <StartWorkoutDialog 
          open={!showTutorial && showWorkoutDialog}
          onOpenChange={setShowWorkoutDialog}
        />

        {/* Incomplete Profile Banner */}
        {profileData && !profileData.isComplete && !showOnboarding && (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-warning" />
              <div>
                <p className="font-medium text-sm">Complete Your Profile</p>
                <p className="text-xs text-muted-foreground">
                  Missing: {profileData.missingFields.join(", ")}
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => setShowOnboarding(true)}>
              Complete Now
            </Button>
          </div>
        )}

        {/* Welcome */}
        <div className="bg-gradient-to-r from-primary/20 to-accent/10 rounded-xl p-5 border border-primary/20">
          <h2 className="text-xl font-bold">Hey {user?.fullName?.split(' ')[0] || 'there'}! 💪</h2>
          <p className="text-sm text-muted-foreground mt-1">Ready to crush your goals today?</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Workouts This Week"
            value={statsLoading ? null : stats?.workoutsThisWeek ?? 0}
            icon={Dumbbell}
            tooltip="Completed workouts from Monday to Sunday this week"
            linkTo="/client/workouts"
          />
          <StatCard
            label="Calories Today"
            value={statsLoading ? null : stats?.caloriesLogged ?? 0}
            icon={Flame}
            tooltip="Total calories logged today across all meals"
            linkTo="/client/nutrition-log"
          />
          <StatCard
            label="Current Streak"
            value={statsLoading ? null : `${stats?.currentStreak ?? 0} days`}
            icon={TrendingUp}
            tooltip="Consecutive days with at least one workout"
            linkTo="/client/workouts"
          />
          <StatCard
            label="Next Check-in"
            value={statsLoading ? null : stats?.nextCheckinDate ?? "Not scheduled"}
            icon={CalendarCheck}
            tooltip="Your next scheduled check-in date based on your coach's template. If you don't have a coach, check-ins are not scheduled."
            linkTo="/client/checkins"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* My Coach Card */}
          <MyCoachCard />

          {/* Today's Plan */}
          <Card className="border-border">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Today's Plan
              </h3>
              
              {statsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Workout */}
                  {stats?.todaysWorkout ? (
                    <Link to="/client/workouts" className="block">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Dumbbell className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{stats.todaysWorkout.name}</p>
                          <p className="text-xs text-muted-foreground">Day {stats.todaysWorkout.dayNumber}</p>
                        </div>
                        <Button size="sm" variant="ghost" className="h-8">
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>
                    </Link>
                  ) : (
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-2">No workout assigned</p>
                      <Link to="/client/programs">
                        <Button variant="outline" size="sm" className="text-xs h-7">
                          <Search className="w-3 h-3 mr-1" />
                          Browse Programs
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Diet */}
                  {stats?.todaysDiet ? (
                    <Link to="/client/diet-plans" className="block">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/5 border border-orange-500/20 hover:bg-orange-500/10 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                          <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{stats.todaysDiet.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {stats.todaysDiet.calories} kcal • {stats.todaysDiet.protein}g P
                          </p>
                        </div>
                      </div>
                    </Link>
                  ) : !stats?.todaysWorkout && (
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-2">No diet plan active</p>
                      <Link to="/client/diet-plans">
                        <Button variant="outline" size="sm" className="text-xs h-7">
                          <Search className="w-3 h-3 mr-1" />
                          Browse Diet Plans
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-xs"
                  onClick={() => setShowWorkoutDialog(true)}
                >
                  <Dumbbell className="w-3 h-3 mr-2" />
                  Log Workout
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-xs"
                  onClick={() => setShowNutritionDialog(true)}
                >
                  <Apple className="w-3 h-3 mr-2" />
                  Log Food
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-xs"
                  onClick={() => setShowMeasurementDialog(true)}
                >
                  <Scale className="w-3 h-3 mr-2" />
                  Log Weight
                </Button>
                <Link to="/client/checkins" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                    <CalendarCheck className="w-3 h-3 mr-2" />
                    Submit Check-in
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}

interface StatCardProps {
  label: string;
  value: string | number | null;
  icon: React.ElementType;
  tooltip: string;
  linkTo: string;
}

function StatCard({ label, value, icon: Icon, tooltip, linkTo }: StatCardProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link to={linkTo}>
          <div className="bg-card border border-border rounded-xl p-4 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{label}</p>
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            {value === null ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-2xl font-bold mt-1">{value}</p>
            )}
          </div>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default ClientDashboard;
