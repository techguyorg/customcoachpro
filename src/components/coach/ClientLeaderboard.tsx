import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Medal, Award, TrendingUp, Target, Calendar } from "lucide-react";

interface Client {
  id: string;
  name: string;
  status: string;
}

interface Checkin {
  client_id: string;
  diet_adherence: number | null;
  workout_adherence: number | null;
  submitted_at: string | null;
}

interface ClientEngagement {
  id: string;
  name: string;
  score: number;
  adherenceScore: number;
  consistencyScore: number;
  goalsCompleted: number;
  lastCheckin: string | null;
}

interface ClientLeaderboardProps {
  clients: Client[];
  checkins: Checkin[];
  clientGoalsMap?: Map<string, { completed: number; active: number }>;
}

export function ClientLeaderboard({ clients, checkins, clientGoalsMap = new Map() }: ClientLeaderboardProps) {
  const leaderboard = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return clients
      .filter(c => c.status === "active")
      .map(client => {
        // Get client's checkins
        const clientCheckins = checkins.filter(c => c.client_id === client.id);
        const recentCheckins = clientCheckins.filter(c => 
          c.submitted_at && new Date(c.submitted_at) >= thirtyDaysAgo
        );

        // Calculate adherence (average of diet + workout adherence)
        const adherenceValues = recentCheckins
          .filter(c => c.diet_adherence !== null || c.workout_adherence !== null)
          .map(c => {
            const diet = c.diet_adherence || 0;
            const workout = c.workout_adherence || 0;
            const count = (c.diet_adherence !== null ? 1 : 0) + (c.workout_adherence !== null ? 1 : 0);
            return count > 0 ? (diet + workout) / count : 0;
          });
        
        const adherenceScore = adherenceValues.length > 0
          ? Math.round(adherenceValues.reduce((a, b) => a + b, 0) / adherenceValues.length)
          : 0;

        // Calculate consistency (how regularly they check in)
        // Assuming weekly checkins expected, calculate % of expected checkins
        const expectedCheckins = 4; // 4 weeks in 30 days
        const consistencyScore = Math.min(100, Math.round((recentCheckins.length / expectedCheckins) * 100));

        // Get goals data
        const goals = clientGoalsMap.get(client.id) || { completed: 0, active: 0 };

        // Calculate composite score (weighted average)
        const score = Math.round(
          (adherenceScore * 0.4) + 
          (consistencyScore * 0.4) + 
          (Math.min(goals.completed * 10, 20)) // Up to 20 points for goals
        );

        // Get last checkin date
        const lastCheckin = clientCheckins
          .filter(c => c.submitted_at)
          .sort((a, b) => new Date(b.submitted_at!).getTime() - new Date(a.submitted_at!).getTime())[0]?.submitted_at || null;

        return {
          id: client.id,
          name: client.name,
          score,
          adherenceScore,
          consistencyScore,
          goalsCompleted: goals.completed,
          lastCheckin,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [clients, checkins, clientGoalsMap]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 1: return <Medal className="w-4 h-4 text-gray-400" />;
      case 2: return <Award className="w-4 h-4 text-amber-600" />;
      default: return <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-muted-foreground";
  };

  if (leaderboard.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Client Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No active clients with engagement data yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          Top Performing Clients
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {leaderboard.map((client, index) => (
          <div 
            key={client.id} 
            className={`flex items-center gap-3 p-2 rounded-lg ${
              index === 0 ? "bg-yellow-500/10 border border-yellow-500/20" :
              index === 1 ? "bg-gray-500/10" :
              index === 2 ? "bg-amber-500/10" :
              "bg-muted/30"
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              {getRankIcon(index)}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{client.name}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {client.adherenceScore}%
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {client.consistencyScore}%
                </span>
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {client.goalsCompleted}
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className={`text-lg font-bold ${getScoreColor(client.score)}`}>
                {client.score}
              </p>
              <p className="text-xs text-muted-foreground">score</p>
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="pt-2 border-t flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Adherence
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Consistency
          </span>
          <span className="flex items-center gap-1">
            <Target className="w-3 h-3" /> Goals Done
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// Export the engagement data for PDF
export function calculateClientEngagement(
  clients: Client[],
  checkins: Checkin[],
  clientGoalsMap: Map<string, { completed: number; active: number }> = new Map()
): ClientEngagement[] {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return clients
    .filter(c => c.status === "active")
    .map(client => {
      const clientCheckins = checkins.filter(c => c.client_id === client.id);
      const recentCheckins = clientCheckins.filter(c => 
        c.submitted_at && new Date(c.submitted_at) >= thirtyDaysAgo
      );

      const adherenceValues = recentCheckins
        .filter(c => c.diet_adherence !== null || c.workout_adherence !== null)
        .map(c => {
          const diet = c.diet_adherence || 0;
          const workout = c.workout_adherence || 0;
          const count = (c.diet_adherence !== null ? 1 : 0) + (c.workout_adherence !== null ? 1 : 0);
          return count > 0 ? (diet + workout) / count : 0;
        });
      
      const adherenceScore = adherenceValues.length > 0
        ? Math.round(adherenceValues.reduce((a, b) => a + b, 0) / adherenceValues.length)
        : 0;

      const expectedCheckins = 4;
      const consistencyScore = Math.min(100, Math.round((recentCheckins.length / expectedCheckins) * 100));

      const goals = clientGoalsMap.get(client.id) || { completed: 0, active: 0 };

      const score = Math.round(
        (adherenceScore * 0.4) + 
        (consistencyScore * 0.4) + 
        (Math.min(goals.completed * 10, 20))
      );

      const lastCheckin = clientCheckins
        .filter(c => c.submitted_at)
        .sort((a, b) => new Date(b.submitted_at!).getTime() - new Date(a.submitted_at!).getTime())[0]?.submitted_at || null;

      return {
        id: client.id,
        name: client.name,
        score,
        adherenceScore,
        consistencyScore,
        goalsCompleted: goals.completed,
        lastCheckin,
      };
    })
    .sort((a, b) => b.score - a.score);
}
