using System.Security.Claims;
using FitCoachPro.Api.Data;
using FitCoachPro.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace FitCoachPro.Api.Endpoints;

public static class CoachEndpoints
{
    public static void MapCoachEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/coach")
            .RequireAuthorization()
            .RequireAuthorization(new AuthorizeAttribute { Roles = "coach" });

        group.MapGet("/clients", async (ClaimsPrincipal principal, AppDbContext db) =>
        {
            var coachId = GetUserId(principal);
            if (coachId is null) return Results.Unauthorized();

            var clients = await db.CoachClients
                .Where(x => x.CoachId == coachId.Value && x.IsActive)
                .Join(db.Users.Include(u => u.Profile),
                    cc => cc.ClientId,
                    u => u.Id,
                    (cc, u) => new ClientListItem(
                        u.Id,
                        u.Email,
                        u.Profile!.DisplayName,
                        u.Profile!.StartDate,
                        u.Profile!.CurrentWeight,
                        u.Profile!.TargetWeight
                    ))
                .ToListAsync();

            var clientIds = clients.Select(c => c.Id).ToList();
            var checkIns = clientIds.Count == 0
                ? new List<CheckIn>()
                : await db.CheckIns
                    .Where(ci => clientIds.Contains(ci.ClientId))
                    .OrderByDescending(ci => ci.SubmittedAt)
                    .ToListAsync();

            var response = clients
                .Select(client => new
                {
                    id = client.Id,
                    email = client.Email,
                    displayName = client.DisplayName,
                    startDate = client.StartDate,
                    currentWeight = client.CurrentWeight,
                    targetWeight = client.TargetWeight,
                    attentionReason = GetAttentionReason(client, checkIns)
                })
                .ToList();

            return Results.Ok(response);
        });

        group.MapGet("/clients/{id:guid}", async (ClaimsPrincipal principal, AppDbContext db, Guid id) =>
        {
            var coachId = GetUserId(principal);
            if (coachId is null) return Results.Unauthorized();

            var mapped = await db.CoachClients.AnyAsync(x => x.CoachId == coachId.Value && x.ClientId == id && x.IsActive);
            if (!mapped) return Results.NotFound(new { message = "Client not assigned to you" });

            var client = await db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == id);
            if (client is null) return Results.NotFound();

            return Results.Ok(new
            {
                id = client.Id,
                email = client.Email,
                role = client.Role,
                profile = new
                {
                    displayName = client.Profile?.DisplayName ?? client.Email,
                    bio = client.Profile?.Bio,
                    avatarUrl = client.Profile?.AvatarUrl,
                    startDate = client.Profile?.StartDate,
                    heightCm = client.Profile?.HeightCm,
                    startWeight = client.Profile?.StartWeight,
                    currentWeight = client.Profile?.CurrentWeight,
                    targetWeight = client.Profile?.TargetWeight
                }
            });
        });

        group.MapPost("/clients", async (ClaimsPrincipal principal, AppDbContext db, CreateClientRequest req) =>
        {
            var coachId = GetUserId(principal);
            if (coachId is null) return Results.Unauthorized();

            // basic validation
            if (string.IsNullOrWhiteSpace(req.Email))
                return Results.BadRequest(new { message = "Email is required" });

            var email = req.Email.Trim().ToLowerInvariant();
            var exists = await db.Users.AnyAsync(u => u.Email.ToLower() == email);
            if (exists)
                return Results.BadRequest(new { message = "A user with this email already exists" });

            // For Sprint 2 we generate a temp password (coach can reset later in Sprint 3)
            var tempPassword = "Password123!";

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword),
                Role = "client",
                Profile = new UserProfile
                {
                    UserId = Guid.Empty, // set after we know user.Id
                    DisplayName = $"{req.FirstName} {req.LastName}".Trim(),
                    StartDate = req.StartDate ?? DateTime.UtcNow.Date,
                    HeightCm = req.HeightCm,
                    StartWeight = req.StartWeight ?? req.CurrentWeight,
                    CurrentWeight = req.CurrentWeight,
                    TargetWeight = req.TargetWeight,
                    Bio = req.Goals,
                }
            };

            // ensure profile PK matches
            user.Profile.UserId = user.Id;

            db.Users.Add(user);
            db.CoachClients.Add(new CoachClient
            {
                CoachId = coachId.Value,
                ClientId = user.Id,
                IsActive = true
            });

            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                id = user.Id,
                email = user.Email,
                tempPassword,
                profile = new
                {
                    displayName = user.Profile.DisplayName,
                    startDate = user.Profile.StartDate,
                    heightCm = user.Profile.HeightCm,
                    currentWeight = user.Profile.CurrentWeight,
                    targetWeight = user.Profile.TargetWeight
                }
            });
        });

        group.MapPut("/clients/{id:guid}", async (ClaimsPrincipal principal, AppDbContext db, Guid id, UpdateClientRequest req) =>
        {
            var coachId = GetUserId(principal);
            if (coachId is null) return Results.Unauthorized();

            var mapped = await db.CoachClients.AnyAsync(x => x.CoachId == coachId.Value && x.ClientId == id && x.IsActive);
            if (!mapped) return Results.NotFound(new { message = "Client not assigned to you" });

            var user = await db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == id);
            if (user is null) return Results.NotFound();

            // Update profile fields (email changes not allowed in Sprint 2)
            user.Profile ??= new UserProfile { UserId = user.Id };

            if (!string.IsNullOrWhiteSpace(req.DisplayName))
                user.Profile.DisplayName = req.DisplayName.Trim();

            user.Profile.Bio = req.Bio ?? user.Profile.Bio;
            user.Profile.AvatarUrl = req.AvatarUrl ?? user.Profile.AvatarUrl;
            user.Profile.StartDate = req.StartDate ?? user.Profile.StartDate;
            user.Profile.HeightCm = req.HeightCm ?? user.Profile.HeightCm;

            user.Profile.StartWeight = req.StartWeight ?? user.Profile.StartWeight;
            user.Profile.CurrentWeight = req.CurrentWeight ?? user.Profile.CurrentWeight;
            user.Profile.TargetWeight = req.TargetWeight ?? user.Profile.TargetWeight;

            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                id = user.Id,
                email = user.Email,
                role = user.Role,
                profile = new
                {
                    displayName = user.Profile.DisplayName,
                    bio = user.Profile.Bio,
                    avatarUrl = user.Profile.AvatarUrl,
                    startDate = user.Profile.StartDate,
                    heightCm = user.Profile.HeightCm,
                    startWeight = user.Profile.StartWeight,
                    currentWeight = user.Profile.CurrentWeight,
                    targetWeight = user.Profile.TargetWeight
                }
            });
        });
    }

    private static Guid? GetUserId(ClaimsPrincipal principal)
    {
        var idStr =
            principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? principal.FindFirstValue("sub");

        return Guid.TryParse(idStr, out var id) ? id : null;
    }

    private static string? GetAttentionReason(ClientListItem client, IReadOnlyList<CheckIn> checkIns)
    {
        const decimal WeightRegressionThreshold = 1m;
        const int ComplianceThreshold = 6;

        var clientCheckIns = checkIns
            .Where(ci => ci.ClientId == client.Id)
            .OrderByDescending(ci => ci.SubmittedAt)
            .ToList();

        var weightCheckIns = clientCheckIns
            .Where(ci => ci.Type == CheckInType.Weight && ci.Weight.HasValue)
            .ToList();

        var latestWeightCheckIn = weightCheckIns.FirstOrDefault();
        var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);

        if (latestWeightCheckIn is null || latestWeightCheckIn.SubmittedAt < sevenDaysAgo)
            return "Overdue weight check-in";

        if (weightCheckIns.Count >= 2)
        {
            var latestWeight = weightCheckIns[0].Weight!.Value;
            var previousWeight = weightCheckIns[1].Weight!.Value;

            if (latestWeight - previousWeight >= WeightRegressionThreshold)
                return "Weight regression";
        }
        else if (client.TargetWeight.HasValue
                 && client.CurrentWeight.HasValue
                 && client.CurrentWeight.Value - client.TargetWeight.Value >= WeightRegressionThreshold)
        {
            return "Weight regression";
        }

        var recentCompliance = clientCheckIns
            .Where(ci => ci.Type == CheckInType.Diet && ci.DietCompliance.HasValue)
            .Take(3)
            .Select(ci => ci.DietCompliance!.Value)
            .ToList();

        if (recentCompliance.Any() && recentCompliance.Average() < ComplianceThreshold)
            return "Low diet compliance";

        return null;
    }

    public record CreateClientRequest(
        string FirstName,
        string LastName,
        string Email,
        string? Goals,
        DateTime? StartDate,
        decimal? HeightCm,
        decimal? StartWeight,
        decimal? CurrentWeight,
        decimal? TargetWeight,
        string? Notes
    );

    public record UpdateClientRequest(
        string? DisplayName,
        string? Bio,
        string? AvatarUrl,
        DateTime? StartDate,
        decimal? HeightCm,
        decimal? StartWeight,
        decimal? CurrentWeight,
        decimal? TargetWeight
    );

    private record ClientListItem(
        Guid Id,
        string Email,
        string DisplayName,
        DateTime? StartDate,
        decimal? CurrentWeight,
        decimal? TargetWeight
    );
}
