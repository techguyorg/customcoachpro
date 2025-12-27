using System.Security.Claims;
using FitCoachPro.Api.Data;
using FitCoachPro.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FitCoachPro.Api.Endpoints;

public static class AnalyticsEndpoints
{
    public static void MapAnalyticsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/analytics").RequireAuthorization();

        group.MapGet("/", async (ClaimsPrincipal principal, AppDbContext db, DateTime? startDate, DateTime? endDate, string? clientIds) =>
        {
            var (userId, role) = GetUser(principal);
            if (userId is null) return Results.Unauthorized();

            var rangeStart = (startDate ?? DateTime.UtcNow.AddDays(-30)).Date;
            var rangeEnd = (endDate ?? DateTime.UtcNow).Date.AddDays(1); // exclusive

            var filteredClients = ParseClientIds(clientIds);
            var scopedClientQuery = GetScopedClients(db, userId.Value, role);

            if (filteredClients.Any())
            {
                scopedClientQuery = scopedClientQuery.Where(id => filteredClients.Contains(id));
            }

            var scopedClientIds = await scopedClientQuery.ToListAsync();
            if (!scopedClientIds.Any())
            {
                return Results.Ok(new AnalyticsResponse(
                    rangeStart,
                    rangeEnd,
                    Array.Empty<Guid>(),
                    new EngagementMetrics(0, 0, new List<EngagementPoint>()),
                    new ComplianceMetrics(0, new List<CompliancePoint>()),
                    new WeightChangeMetrics(new List<WeightChangeSlice>()),
                    new WorkoutAdherenceMetrics(0, 0, 0, new List<WorkoutAdherencePoint>()),
                    new PlanOutcomeMetrics(new PlanSummary(0, 0, 0), new PlanSummary(0, 0, 0))
                ));
            }

            var checkIns = await db.CheckIns
                .Where(c => scopedClientIds.Contains(c.ClientId) && c.SubmittedAt >= rangeStart && c.SubmittedAt < rangeEnd)
                .ToListAsync();

            var engagementTrend = checkIns
                .GroupBy(c => c.SubmittedAt.Date)
                .Select(g => new EngagementPoint(
                    g.Key,
                    g.Count(),
                    g.Count(c => c.Type == CheckInType.Weight),
                    g.Count(c => c.Type == CheckInType.Workout),
                    g.Count(c => c.Type == CheckInType.Diet),
                    g.Count(c => c.Type == CheckInType.Photos)
                ))
                .OrderBy(p => p.Date)
                .ToList();

            var totalCheckIns = checkIns.Count;
            var activeClients = checkIns.Select(c => c.ClientId).Distinct().Count();

            var dietComplianceCheckIns = checkIns
                .Where(c => c.Type == CheckInType.Diet && c.DietCompliance.HasValue)
                .ToList();

            var complianceTrend = dietComplianceCheckIns
                .GroupBy(c => c.SubmittedAt.Date)
                .Select(g => new CompliancePoint(
                    g.Key,
                    Math.Round(g.Average(c => c.DietCompliance!.Value) * 10, 1)
                ))
                .OrderBy(p => p.Date)
                .ToList();

            var averageCompliance = complianceTrend.Any()
                ? Math.Round(complianceTrend.Average(c => c.Average), 1)
                : 0;

            var weightCheckIns = checkIns
                .Where(c => c.Type == CheckInType.Weight && c.Weight.HasValue)
                .GroupBy(c => c.ClientId)
                .ToDictionary(g => g.Key, g => g.OrderBy(c => c.SubmittedAt).ToList());

            var clients = await db.Users.Include(u => u.Profile)
                .Where(u => scopedClientIds.Contains(u.Id))
                .ToListAsync();

            var weightDistribution = clients.Select(client =>
            {
                var hasWeights = weightCheckIns.TryGetValue(client.Id, out var clientWeights) && clientWeights.Any();
                var startWeight = hasWeights
                    ? clientWeights!.First().Weight ?? 0
                    : client.Profile?.StartWeight ?? client.Profile?.CurrentWeight ?? 0m;

                var latestWeight = hasWeights
                    ? clientWeights!.Last().Weight ?? startWeight
                    : client.Profile?.CurrentWeight ?? startWeight;

                return new WeightChangeSlice(
                    client.Id,
                    client.Profile?.DisplayName ?? client.Email,
                    startWeight,
                    latestWeight,
                    latestWeight - startWeight
                );
            }).ToList();

            var workoutCheckIns = checkIns
                .Where(c => c.Type == CheckInType.Workout && c.WorkoutCompleted.HasValue)
                .ToList();

            var workoutTrend = workoutCheckIns
                .GroupBy(c => c.SubmittedAt.Date)
                .Select(g =>
                {
                    var total = g.Count();
                    var completed = g.Count(x => x.WorkoutCompleted == true);
                    var rate = total > 0 ? Math.Round((double)completed / total * 100, 1) : 0;
                    return new WorkoutAdherencePoint(g.Key, rate, completed, total);
                })
                .OrderBy(p => p.Date)
                .ToList();

            var totalWorkoutCheckIns = workoutCheckIns.Count;
            var completedWorkouts = workoutCheckIns.Count(c => c.WorkoutCompleted == true);
            var completionRate = totalWorkoutCheckIns > 0
                ? Math.Round((double)completedWorkouts / totalWorkoutCheckIns * 100, 1)
                : 0;

            var workoutPlans = await db.ClientWorkoutPlans
                .Where(p => scopedClientIds.Contains(p.ClientId) && p.StartDate < rangeEnd && (!p.EndDate.HasValue || p.EndDate.Value >= rangeStart))
                .ToListAsync();

            var dietPlans = await db.ClientDietPlans
                .Where(p => scopedClientIds.Contains(p.ClientId) && p.StartDate < rangeEnd && (!p.EndDate.HasValue || p.EndDate.Value >= rangeStart))
                .ToListAsync();

            var workoutSummary = new PlanSummary(
                Active: workoutPlans.Count(p => p.IsActive && (!p.EndDate.HasValue || p.EndDate.Value >= rangeStart)),
                Completed: workoutPlans.Count(p => p.EndDate.HasValue && p.EndDate.Value < rangeEnd),
                Total: workoutPlans.Count
            );

            var dietSummary = new PlanSummary(
                Active: dietPlans.Count(p => p.IsActive && (!p.EndDate.HasValue || p.EndDate.Value >= rangeStart)),
                Completed: dietPlans.Count(p => p.EndDate.HasValue && p.EndDate.Value < rangeEnd),
                Total: dietPlans.Count
            );

            var response = new AnalyticsResponse(
                rangeStart,
                rangeEnd,
                scopedClientIds,
                new EngagementMetrics(totalCheckIns, activeClients, engagementTrend),
                new ComplianceMetrics(averageCompliance, complianceTrend),
                new WeightChangeMetrics(weightDistribution),
                new WorkoutAdherenceMetrics(completionRate, completedWorkouts, totalWorkoutCheckIns, workoutTrend),
                new PlanOutcomeMetrics(workoutSummary, dietSummary)
            );

            return Results.Ok(response);
        });
    }

    private static (Guid? userId, string role) GetUser(ClaimsPrincipal principal)
    {
        var idStr = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.FindFirstValue("sub");
        var role = principal.FindFirstValue(ClaimTypes.Role) ?? principal.FindFirstValue("role") ?? string.Empty;
        return (Guid.TryParse(idStr, out var uid) ? uid : null, role.ToLowerInvariant());
    }

    private static IQueryable<Guid> GetScopedClients(AppDbContext db, Guid userId, string role)
    {
        if (role == "coach")
        {
            return db.CoachClients.Where(cc => cc.CoachId == userId && cc.IsActive).Select(cc => cc.ClientId);
        }

        if (role == "client")
        {
            return db.Users.Where(u => u.Id == userId).Select(u => u.Id);
        }

        return db.Users.Where(u => u.Role == "client").Select(u => u.Id);
    }

    private static List<Guid> ParseClientIds(string? clientIds)
    {
        if (string.IsNullOrWhiteSpace(clientIds)) return new List<Guid>();

        var ids = clientIds.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(id => Guid.TryParse(id, out var parsed) ? parsed : Guid.Empty)
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToList();

        return ids;
    }

    public record AnalyticsResponse(
        DateTime StartDate,
        DateTime EndDate,
        IReadOnlyList<Guid> ClientIds,
        EngagementMetrics Engagement,
        ComplianceMetrics Compliance,
        WeightChangeMetrics WeightChange,
        WorkoutAdherenceMetrics WorkoutAdherence,
        PlanOutcomeMetrics PlanOutcomes
    );

    public record EngagementMetrics(int TotalCheckIns, int ActiveClients, IReadOnlyList<EngagementPoint> Trend);

    public record EngagementPoint(DateTime Date, int Total, int Weight, int Workout, int Diet, int Photos);

    public record ComplianceMetrics(double AverageCompliance, IReadOnlyList<CompliancePoint> Trend);

    public record CompliancePoint(DateTime Date, double Average);

    public record WeightChangeMetrics(IReadOnlyList<WeightChangeSlice> Distribution);

    public record WeightChangeSlice(Guid ClientId, string ClientName, decimal StartWeight, decimal EndWeight, decimal Change);

    public record WorkoutAdherenceMetrics(double CompletionRate, int CompletedWorkouts, int TotalWorkoutCheckIns, IReadOnlyList<WorkoutAdherencePoint> Trend);

    public record WorkoutAdherencePoint(DateTime Date, double CompletionRate, int Completed, int Total);

    public record PlanOutcomeMetrics(PlanSummary WorkoutPlans, PlanSummary DietPlans);

    public record PlanSummary(int Active, int Completed, int Total);
}
