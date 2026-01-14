import { useMemo } from "react";
import { differenceInDays, differenceInHours, subDays } from "date-fns";

interface Checkin {
  id: string;
  status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  diet_adherence: number | null;
  workout_adherence: number | null;
  client_id: string;
}

interface Client {
  relationshipId: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
}

export function useCoachAnalytics(
  clients: Client[] = [],
  checkins: Checkin[] = []
) {
  return useMemo(() => {
    // Calculate average response time (hours between submitted_at and reviewed_at)
    const reviewedCheckins = checkins.filter(
      (c) => c.status === "reviewed" && c.submitted_at && c.reviewed_at
    );
    
    let avgResponseHours = 0;
    if (reviewedCheckins.length > 0) {
      const totalHours = reviewedCheckins.reduce((sum, c) => {
        const submitted = new Date(c.submitted_at!);
        const reviewed = new Date(c.reviewed_at!);
        return sum + differenceInHours(reviewed, submitted);
      }, 0);
      avgResponseHours = Math.round(totalHours / reviewedCheckins.length);
    }

    // Calculate check-in rate (% of active clients who submitted in last 7 days)
    const activeClients = clients.filter((c) => c.status === "active");
    const sevenDaysAgo = subDays(new Date(), 7);
    const recentSubmitters = new Set(
      checkins
        .filter(
          (c) =>
            c.submitted_at && new Date(c.submitted_at) >= sevenDaysAgo
        )
        .map((c) => c.client_id)
    );
    const checkinRate =
      activeClients.length > 0
        ? Math.round((recentSubmitters.size / activeClients.length) * 100)
        : 0;

    // Calculate client retention (average months active)
    const clientsWithDuration = clients.filter((c) => c.started_at);
    let avgRetentionDays = 0;
    if (clientsWithDuration.length > 0) {
      const totalDays = clientsWithDuration.reduce((sum, c) => {
        const start = new Date(c.started_at!);
        const end = c.ended_at ? new Date(c.ended_at) : new Date();
        return sum + differenceInDays(end, start);
      }, 0);
      avgRetentionDays = Math.round(totalDays / clientsWithDuration.length);
    }
    const avgRetentionMonths = Math.round(avgRetentionDays / 30);

    // Calculate average adherence scores
    const checkinsWithAdherence = checkins.filter(
      (c) => c.diet_adherence !== null || c.workout_adherence !== null
    );
    
    let avgDietAdherence = 0;
    let avgWorkoutAdherence = 0;
    
    const dietCheckins = checkins.filter((c) => c.diet_adherence !== null);
    const workoutCheckins = checkins.filter((c) => c.workout_adherence !== null);
    
    if (dietCheckins.length > 0) {
      avgDietAdherence = Math.round(
        dietCheckins.reduce((sum, c) => sum + (c.diet_adherence || 0), 0) /
          dietCheckins.length
      );
    }
    
    if (workoutCheckins.length > 0) {
      avgWorkoutAdherence = Math.round(
        workoutCheckins.reduce((sum, c) => sum + (c.workout_adherence || 0), 0) /
          workoutCheckins.length
      );
    }

    // Format response time
    const formatResponseTime = () => {
      if (avgResponseHours === 0) return "—";
      if (avgResponseHours < 24) return `${avgResponseHours}h`;
      const days = Math.round(avgResponseHours / 24);
      return `${days}d`;
    };

    // Format retention
    const formatRetention = () => {
      if (avgRetentionMonths === 0 && avgRetentionDays === 0) return "—";
      if (avgRetentionMonths < 1) return `${avgRetentionDays}d`;
      return `${avgRetentionMonths}mo`;
    };

    return {
      avgResponseTime: formatResponseTime(),
      checkinRate: activeClients.length > 0 ? `${checkinRate}%` : "—",
      clientRetention: formatRetention(),
      avgDietAdherence,
      avgWorkoutAdherence,
      activeClientsCount: activeClients.length,
      totalCheckinsReviewed: reviewedCheckins.length,
    };
  }, [clients, checkins]);
}
