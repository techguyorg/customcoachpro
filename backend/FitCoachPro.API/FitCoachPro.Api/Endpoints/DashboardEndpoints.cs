using System.Security.Claims;
using FitCoachPro.Api.Data;
using FitCoachPro.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace FitCoachPro.Api.Endpoints;

public static class DashboardEndpoints
{
    public static void MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/dashboard").RequireAuthorization();

        group.MapGet("/coach", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db) =>
        {
            var coachIdStr = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.FindFirstValue("sub");
            if (coachIdStr is null || !Guid.TryParse(coachIdStr, out var coachId))
                return Results.Unauthorized();

            var nowDate = DateTime.UtcNow.Date;

            // IMPORTANT: Do NOT run multiple EF queries concurrently on the same DbContext.
            // EF Core DbContext is not thread-safe and does not allow overlapping operations.
            var totalClients = await db.CoachClients.CountAsync(x => x.CoachId == coachId && x.IsActive);
            var pendingCheckIns = await db.CheckIns.CountAsync(x => x.CoachId == coachId && x.Status == CheckInStatus.Pending);
            var workoutPlansCreated = await db.WorkoutPlans.CountAsync(x => x.CoachId == coachId);
            var dietPlansCreated = await db.DietPlans.CountAsync(x => x.CoachId == coachId);

            var activeClientIds = await db.CoachClients
                .Where(x => x.CoachId == coachId && x.IsActive)
                .Select(x => x.ClientId)
                .ToListAsync();

            var activeClients = totalClients;

            var clientNames = await db.Users
                .AsNoTracking()
                .Where(u => activeClientIds.Contains(u.Id))
                .Select(u => new { u.Id, Name = u.Profile!.DisplayName ?? u.Email })
                .ToDictionaryAsync(x => x.Id, x => x.Name);

            var attentionItems = await db.CheckIns
                .AsNoTracking()
                .Where(c => c.CoachId == coachId &&
                            c.Status == CheckInStatus.Pending &&
                            activeClientIds.Contains(c.ClientId))
                .OrderByDescending(c => c.SubmittedAt)
                .Take(5)
                .Select(c => new
                {
                    c.ClientId,
                    c.Type,
                    c.SubmittedAt
                })
                .ToListAsync();

            var workoutRenewals = await db.ClientWorkoutPlans
                .AsNoTracking()
                .Include(cwp => cwp.WorkoutPlan)
                .Where(cwp =>
                    cwp.IsActive &&
                    cwp.WorkoutPlan != null &&
                    cwp.WorkoutPlan.CoachId == coachId &&
                    activeClientIds.Contains(cwp.ClientId))
                .Select(cwp => new
                {
                    cwp.ClientId,
                    planId = cwp.WorkoutPlanId,
                    planName = cwp.WorkoutPlan!.Name,
                    planType = "workout",
                    renewalDate = cwp.EndDate ?? cwp.StartDate.AddDays(Math.Max(1, cwp.WorkoutPlan.DurationWeeks) * 7)
                })
                .ToListAsync();

            var dietRenewals = await db.ClientDietPlans
                .AsNoTracking()
                .Include(cdp => cdp.DietPlan)
                .Where(cdp =>
                    cdp.IsActive &&
                    cdp.DietPlan != null &&
                    cdp.DietPlan.CoachId == coachId &&
                    activeClientIds.Contains(cdp.ClientId))
                .Select(cdp => new
                {
                    cdp.ClientId,
                    planId = cdp.DietPlanId,
                    planName = cdp.DietPlan!.Name,
                    planType = "diet",
                    renewalDate = cdp.EndDate ?? cdp.StartDate.AddDays(28)
                })
                .ToListAsync();

            var upcomingRenewals = workoutRenewals
                .Concat(dietRenewals)
                .Select(x => new
                {
                    x.ClientId,
                    clientName = clientNames.TryGetValue(x.ClientId, out var name) ? name : "Client",
                    x.planId,
                    x.planName,
                    x.planType,
                    x.renewalDate
                })
                .OrderBy(x => x.renewalDate)
                .Take(10)
                .ToList();

            var complianceSamples = await db.CheckIns
                .AsNoTracking()
                .Where(c => c.CoachId == coachId &&
                            c.Type == CheckInType.Diet &&
                            c.DietCompliance != null &&
                            activeClientIds.Contains(c.ClientId))
                .OrderByDescending(c => c.SubmittedAt)
                .Select(c => (double)c.DietCompliance!.Value)
                .Take(12)
                .ToListAsync();

            var averageCompliance = complianceSamples.Any() ? complianceSamples.Average() : 0.0;
            var recentCompliance = complianceSamples.Take(6).ToList();
            var previousCompliance = complianceSamples.Skip(6).ToList();
            var recentAverage = recentCompliance.Any() ? recentCompliance.Average() : averageCompliance;
            var previousAverage = previousCompliance.Any() ? previousCompliance.Average() : averageCompliance;

            var complianceTrend = new
            {
                average = averageCompliance,
                change = Math.Round(recentAverage - previousAverage, 1),
                sampleSize = complianceSamples.Count
            };

            return Results.Ok(new
            {
                totalClients,
                activeClients,
                pendingCheckIns,
                workoutPlansCreated,
                dietPlansCreated,
                attentionItems = attentionItems.Select(c => new
                {
                    c.ClientId,
                    clientName = clientNames.TryGetValue(c.ClientId, out var name) ? name : "Client",
                    c.Type,
                    summary = $"{FormatCheckInType(c.Type)} check-in pending",
                    c.SubmittedAt
                }),
                upcomingRenewals,
                complianceTrend
            });
        });

        group.MapGet("/client", [Authorize(Roles = "client")] async (ClaimsPrincipal principal, AppDbContext db) =>
        {
            var clientIdStr = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.FindFirstValue("sub");
            if (clientIdStr is null || !Guid.TryParse(clientIdStr, out var clientId))
                return Results.Unauthorized();

            var today = DateTime.UtcNow.Date;

            var activeWorkout = await db.ClientWorkoutPlans
                .AsNoTracking()
                .Include(x => x.WorkoutPlan)
                .Where(x => x.ClientId == clientId && x.IsActive)
                .OrderByDescending(x => x.StartDate)
                .FirstOrDefaultAsync();

            var activeDiet = await db.ClientDietPlans
                .AsNoTracking()
                .Include(x => x.DietPlan)
                .Where(x => x.ClientId == clientId && x.IsActive)
                .OrderByDescending(x => x.StartDate)
                .FirstOrDefaultAsync();

            var lastCheckIn = await db.CheckIns
                .AsNoTracking()
                .Where(x => x.ClientId == clientId)
                .OrderByDescending(x => x.SubmittedAt)
                .FirstOrDefaultAsync();

            return Results.Ok(new
            {
                activeWorkout = activeWorkout == null ? null : new
                {
                    planId = activeWorkout.WorkoutPlanId,
                    planName = activeWorkout.WorkoutPlan != null ? activeWorkout.WorkoutPlan.Name : "Workout Plan",
                    startDate = activeWorkout.StartDate,
                    endDate = activeWorkout.EndDate
                },
                activeDiet = activeDiet == null ? null : new
                {
                    planId = activeDiet.DietPlanId,
                    planName = activeDiet.DietPlan != null ? activeDiet.DietPlan.Name : "Diet Plan",
                    startDate = activeDiet.StartDate,
                    endDate = activeDiet.EndDate
                },
                lastCheckIn = lastCheckIn == null ? null : new
                {
                    lastCheckIn.Id,
                    lastCheckIn.Type,
                    lastCheckIn.Status,
                    lastCheckIn.SubmittedAt
                },
                today
            });
        });
    }

    private static string FormatCheckInType(string type) => type switch
    {
        CheckInType.Weight => "Weight",
        CheckInType.Workout => "Workout",
        CheckInType.Diet => "Diet",
        CheckInType.Photos => "Progress photos",
        _ when string.IsNullOrWhiteSpace(type) => "Check-in",
        _ when type.Length == 1 => type.ToUpper(),
        _ => $"{char.ToUpper(type[0])}{type.Substring(1)}"
    };
}
