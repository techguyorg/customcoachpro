import { 
  TrendingUp, 
  Dumbbell, 
  UtensilsCrossed, 
  Users,
  Target,
  LineChart,
  BookOpen,
  Bell
} from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "Track Your Progress",
    description: "Log workouts, weight, and measurements. See your transformation over time with visual charts.",
  },
  {
    icon: Dumbbell,
    title: "Exercise Library",
    description: "Access thousands of exercises with proper form guides. Filter by muscle group or equipment.",
  },
  {
    icon: UtensilsCrossed,
    title: "Nutrition Tracking",
    description: "Log meals, track macros, and follow nutrition plans tailored to your goals.",
  },
  {
    icon: BookOpen,
    title: "Workout & Diet Plans",
    description: "Browse free plans or get custom programs from your coach. Everything in one place.",
  },
  {
    icon: Users,
    title: "Coach Integration",
    description: "Work with a coach who can monitor your progress, assign plans, and provide feedback.",
  },
  {
    icon: Target,
    title: "Goal Setting",
    description: "Set specific targets and milestones. Track your journey toward each goal.",
  },
  {
    icon: LineChart,
    title: "Analytics",
    description: "Coaches: get insights on client progress, adherence rates, and business metrics.",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description: "Stay on track with workout reminders, check-in notifications, and progress updates.",
  },
];

const Features = () => {
  return (
    <section className="py-20 relative" id="features">
      <div className="container px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Everything you need
          </h2>
          <p className="text-muted-foreground">
            Whether you're an individual tracking your fitness or a coach managing clients, 
            we have the tools.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-5 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-card transition-all duration-200"
            >
              <div className="inline-flex p-2.5 rounded-lg bg-primary/10 mb-3">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1.5 text-sm">
                {feature.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;