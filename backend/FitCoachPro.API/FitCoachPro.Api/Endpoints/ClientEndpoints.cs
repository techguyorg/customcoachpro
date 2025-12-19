using System.Security.Claims;
using FitCoachPro.Api.Data;
using FitCoachPro.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace FitCoachPro.Api.Endpoints;

public static class ClientEndpoints
{
    public static void MapClientEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/client")
            .RequireAuthorization()
            .RequireAuthorization(new AuthorizeAttribute { Roles = UserRole.Client });

        group.MapGet("/coach", async (ClaimsPrincipal principal, AppDbContext db) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.FindFirstValue("sub");
            if (userId is null || !Guid.TryParse(userId, out var clientId))
                return Results.Json(new { message = "Invalid token" }, statusCode: StatusCodes.Status401Unauthorized);

            var coachId = await db.CoachClients
                .Where(cc => cc.ClientId == clientId && cc.IsActive)
                .Select(cc => cc.CoachId)
                .FirstOrDefaultAsync();

            if (coachId == Guid.Empty)
                return Results.Ok(null); // solo client, no coach assigned

            var coach = await db.Users
                .Include(u => u.Profile)
                .FirstOrDefaultAsync(u => u.Id == coachId);

            if (coach is null)
                return Results.Ok(null);

            return Results.Ok(new
            {
                id = coach.Id,
                email = coach.Email,
                role = coach.Role,
                profile = new
                {
                    displayName = coach.Profile?.DisplayName ?? "",
                    bio = coach.Profile?.Bio,
                    avatarUrl = coach.Profile?.AvatarUrl
                }
            });
        });
    }
}
