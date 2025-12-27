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

            var totalClientsTask = db.CoachClients.CountAsync(x => x.CoachId == coachId && x.IsActive);
            var pendingCheckInsTask = db.CheckIns.CountAsync(x => x.CoachId == coachId && x.Status == CheckInStatus.Pending);
            var workoutPlansCreatedTask = db.WorkoutPlans.CountAsync(x => x.CoachId == coachId);
            var dietPlansCreatedTask = db.DietPlans.CountAsync(x => x.CoachId == coachId);
            var activeClientIdsTask = db.CoachClients
                .Where(x => x.CoachId == coachId && x.IsActive)
                .Select(x => x.ClientId)
                .ToListAsync();

            await Task.WhenAll(totalClientsTask, pendingCheckInsTask, workoutPlansCreatedTask, dietPlansCreatedTask, activeClientIdsTask);

            var totalClients = await totalClientsTask;
            var activeClients = totalClients;
            var activeClientIds = await activeClientIdsTask;

            var clientNames = await db.Users
                .AsNoTracking()
                .Where(u => activeClientIds.Contains(u.Id))
                .Select(u => new { u.Id, Name = u.Profile!.DisplayName ?? u.Email })
                .ToDictionaryAsync(x => x.Id, x => x.Name);

            var attentionItems = await db.CheckIns
                .AsNoTracking()
                .Where(c => c.CoachId == coachId && c.Status == CheckInStatus.Pending && activeClientIds.Contains(c.ClientId))
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
                .Where(r => r.renewalDate >= nowDate.AddDays(-1))
                .OrderBy(r => r.renewalDate)
                .Take(5)
                .Select(r => new
                {
                    r.planId,
                    r.planName,
                    r.planType,
                    r.renewalDate,
                    clientId = r.ClientId,
                    clientName = clientNames.TryGetValue(r.ClientId, out var name) ? name : "Client",
                    daysRemaining = (int)Math.Ceiling((r.renewalDate - nowDate).TotalDays)
                });

            var complianceSamples = await db.CheckIns
                .AsNoTracking()
                .Where(c => c.CoachId == coachId && c.DietCompliance.HasValue)
                .OrderByDescending(c => c.SubmittedAt)
                .Take(12)
                .Select(c => c.DietCompliance!.Value)
                .ToListAsync();

            var averageCompliance = complianceSamples.Any()
                ? Math.Round(complianceSamples.Average(), 1)
                : 0;

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
                pendingCheckIns = await pendingCheckInsTask,
                workoutPlansCreated = await workoutPlansCreatedTask,
                dietPlansCreated = await dietPlansCreatedTask,
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
            var idStr = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.FindFirstValue("sub");
            if (idStr is null || !Guid.TryParse(idStr, out var uid))
                return Results.Unauthorized();

            var user = await db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == uid);
            if (user is null) return Results.Unauthorized();

            var p = user.Profile;

            var currentWeight = (double)(p?.CurrentWeight ?? 0);
            var startWeight = (double)(p?.StartWeight ?? p?.CurrentWeight ?? 0);
            var weightChange = currentWeight - startWeight;

            var startDate = p?.StartDate ?? DateTime.UtcNow.Date;
            var daysOnPlan = (int)Math.Max(0, (DateTime.UtcNow.Date - startDate.Date).TotalDays);

            return Results.Ok(new
            {
                currentWeight,
                weightChange,
                workoutsCompleted = 0,
                dietComplianceAverage = 0,
                daysOnPlan
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
