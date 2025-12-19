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

            var totalClientsTask = db.CoachClients.CountAsync(x => x.CoachId == coachId && x.IsActive);
            var pendingCheckInsTask = db.CheckIns.CountAsync(x => x.CoachId == coachId && x.Status == CheckInStatus.Pending);
            var workoutPlansCreatedTask = db.WorkoutPlans.CountAsync(x => x.CoachId == coachId);
            var dietPlansCreatedTask = db.DietPlans.CountAsync(x => x.CoachId == coachId);

            await Task.WhenAll(totalClientsTask, pendingCheckInsTask, workoutPlansCreatedTask, dietPlansCreatedTask);

            var totalClients = await totalClientsTask;
            var activeClients = totalClients;

            return Results.Ok(new
            {
                totalClients,
                activeClients,
                pendingCheckIns = await pendingCheckInsTask,
                workoutPlansCreated = await workoutPlansCreatedTask,
                dietPlansCreated = await dietPlansCreatedTask
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
}
