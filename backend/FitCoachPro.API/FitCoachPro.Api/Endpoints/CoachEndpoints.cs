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
                    (cc, u) => new
                    {
                        id = u.Id,
                        email = u.Email,
                        displayName = u.Profile!.DisplayName,
                        startDate = u.Profile!.StartDate,
                        currentWeight = u.Profile!.CurrentWeight,
                        targetWeight = u.Profile!.TargetWeight
                    })
                .ToListAsync();

            return Results.Ok(clients);
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
                        preferredUnitSystem = client.Profile?.PreferredUnitSystem ?? "imperial",
                        startDate = client.Profile?.StartDate,
                        heightCm = client.Profile?.HeightCm,
                        neckCm = client.Profile?.NeckCm,
                        armsCm = client.Profile?.ArmsCm,
                        quadsCm = client.Profile?.QuadsCm,
                        hipsCm = client.Profile?.HipsCm,
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
                    PreferredUnitSystem = string.IsNullOrWhiteSpace(req.PreferredUnitSystem) ? "imperial" : req.PreferredUnitSystem.Trim().ToLowerInvariant(),
                    StartDate = req.StartDate ?? DateTime.UtcNow.Date,
                    HeightCm = req.HeightCm,
                    NeckCm = req.NeckCm,
                    ArmsCm = req.ArmsCm,
                    QuadsCm = req.QuadsCm,
                    HipsCm = req.HipsCm,
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
                        preferredUnitSystem = user.Profile.PreferredUnitSystem,
                        heightCm = user.Profile.HeightCm,
                        neckCm = user.Profile.NeckCm,
                        armsCm = user.Profile.ArmsCm,
                        quadsCm = user.Profile.QuadsCm,
                        hipsCm = user.Profile.HipsCm,
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

            if (!string.IsNullOrWhiteSpace(req.PreferredUnitSystem))
                user.Profile.PreferredUnitSystem = req.PreferredUnitSystem.Trim().ToLowerInvariant();

            user.Profile.Bio = req.Bio ?? user.Profile.Bio;
            user.Profile.AvatarUrl = req.AvatarUrl ?? user.Profile.AvatarUrl;
            user.Profile.StartDate = req.StartDate ?? user.Profile.StartDate;
            user.Profile.HeightCm = req.HeightCm ?? user.Profile.HeightCm;
            user.Profile.NeckCm = req.NeckCm ?? user.Profile.NeckCm;
            user.Profile.ArmsCm = req.ArmsCm ?? user.Profile.ArmsCm;
            user.Profile.QuadsCm = req.QuadsCm ?? user.Profile.QuadsCm;
            user.Profile.HipsCm = req.HipsCm ?? user.Profile.HipsCm;

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
                        preferredUnitSystem = user.Profile.PreferredUnitSystem,
                        startDate = user.Profile.StartDate,
                        heightCm = user.Profile.HeightCm,
                        neckCm = user.Profile.NeckCm,
                        armsCm = user.Profile.ArmsCm,
                        quadsCm = user.Profile.QuadsCm,
                        hipsCm = user.Profile.HipsCm,
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

    public record CreateClientRequest(
        string FirstName,
        string LastName,
        string Email,
        string? Goals,
        DateTime? StartDate,
        decimal? HeightCm,
        decimal? NeckCm,
        decimal? ArmsCm,
        decimal? QuadsCm,
        decimal? HipsCm,
        decimal? StartWeight,
        decimal? CurrentWeight,
        decimal? TargetWeight,
        string? PreferredUnitSystem,
        string? Notes
    );

    public record UpdateClientRequest(
        string? DisplayName,
        string? Bio,
        string? AvatarUrl,
        DateTime? StartDate,
        decimal? HeightCm,
        decimal? NeckCm,
        decimal? ArmsCm,
        decimal? QuadsCm,
        decimal? HipsCm,
        decimal? StartWeight,
        decimal? CurrentWeight,
        decimal? TargetWeight,
        string? PreferredUnitSystem
    );
}
