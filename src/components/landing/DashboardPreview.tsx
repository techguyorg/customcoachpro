import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dumbbell, 
  Flame, 
  TrendingUp, 
  CalendarCheck, 
  Play,
  Users,
  ClipboardList,
  ChefHat
} from "lucide-react";

export function DashboardPreview() {
  return (
    <div className="p-4 space-y-4 bg-background/95">
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard icon={Dumbbell} label="Workouts" value="12" accent="primary" />
        <StatCard icon={Flame} label="Calories" value="2,340" accent="orange" />
        <StatCard icon={TrendingUp} label="Streak" value="7 days" accent="green" />
        <StatCard icon={CalendarCheck} label="Check-in" value="Tomorrow" accent="blue" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Today's Plan */}
        <Card className="col-span-2 border-border/50">
          <CardContent className="p-3">
            <h3 className="text-xs font-semibold mb-2 text-muted-foreground">TODAY'S PLAN</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center">
                  <Dumbbell className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium">Push Day - Chest & Triceps</p>
                  <p className="text-[10px] text-muted-foreground">Day 3 of 5</p>
                </div>
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                  <Play className="w-3 h-3 text-primary" />
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/5 border border-orange-500/20">
                <div className="w-7 h-7 rounded-md bg-orange-500/20 flex items-center justify-center">
                  <ChefHat className="w-3.5 h-3.5 text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium">High Protein Diet</p>
                  <p className="text-[10px] text-muted-foreground">2,340 kcal • 180g P</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-border/50">
          <CardContent className="p-3">
            <h3 className="text-xs font-semibold mb-2 text-muted-foreground">QUICK ACTIONS</h3>
            <div className="space-y-1.5">
              <ActionButton icon={Dumbbell} label="Start Workout" />
              <ActionButton icon={Flame} label="Log Meal" />
              <ActionButton icon={TrendingUp} label="Update Progress" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Coach View Preview */}
      <Card className="border-border/50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-muted-foreground">COACH VIEW • RECENT CLIENTS</h3>
            <Badge variant="secondary" className="text-[10px] h-4">Pro Feature</Badge>
          </div>
          <div className="flex gap-2">
            <ClientBadge name="Alex M." status="active" />
            <ClientBadge name="Sarah K." status="pending" />
            <ClientBadge name="Mike T." status="active" />
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-[10px] text-muted-foreground">+12</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  accent 
}: { 
  icon: any; 
  label: string; 
  value: string; 
  accent: string;
}) {
  const accentColors: Record<string, string> = {
    primary: "text-primary bg-primary/10",
    orange: "text-orange-500 bg-orange-500/10",
    green: "text-green-500 bg-green-500/10",
    blue: "text-blue-500 bg-blue-500/10",
  };
  
  return (
    <Card className="border-border/50">
      <CardContent className="p-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <div className={`w-5 h-5 rounded flex items-center justify-center ${accentColors[accent]}`}>
            <Icon className="w-3 h-3" />
          </div>
          <span className="text-[10px] text-muted-foreground">{label}</span>
        </div>
        <p className="text-sm font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function ActionButton({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="text-xs">{label}</span>
    </div>
  );
}

function ClientBadge({ name, status }: { name: string; status: "active" | "pending" }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 border border-border/50">
      <div className={`w-1.5 h-1.5 rounded-full ${status === "active" ? "bg-green-500" : "bg-yellow-500"}`} />
      <span className="text-[10px] font-medium">{name}</span>
    </div>
  );
}
