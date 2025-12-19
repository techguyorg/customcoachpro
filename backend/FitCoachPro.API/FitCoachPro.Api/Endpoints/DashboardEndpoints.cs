using System.Security.Claims;
using FitCoachPro.Api.Data;
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

            var totalClients = await db.CoachClients.CountAsync(x => x.CoachId == coachId && x.IsActive);
            var activeClients = totalClients;

            // Sprint 2: check-ins / plans not implemented => 0
            return Results.Ok(new
            {
                totalClients,
                activeClients,
                pendingCheckIns = 0,
                workoutPlansCreated = 0,
                dietPlansCreated = 0
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
