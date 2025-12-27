using System.Security.Claims;
using FitCoachPro.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace FitCoachPro.Api.Endpoints;

public static class ProfileEndpoints
{
    public static void MapProfileEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/profile").RequireAuthorization();

        group.MapGet("/me", async (ClaimsPrincipal principal, AppDbContext db) =>
        {
            var uid = GetUserId(principal);
            if (uid is null) return Results.Unauthorized();

            var user = await db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == uid.Value);
            if (user is null) return Results.Unauthorized();

            return Results.Ok(new
            {
                id = user.Id,
                email = user.Email,
                role = user.Role,
                profile = new
                {
                    displayName = user.Profile?.DisplayName ?? user.Email,
                    bio = user.Profile?.Bio,
                    avatarUrl = user.Profile?.AvatarUrl,

                    preferredUnitSystem = user.Profile?.PreferredUnitSystem ?? "imperial",
                    startDate = user.Profile?.StartDate,
                    heightCm = user.Profile?.HeightCm,
                    neckCm = user.Profile?.NeckCm,
                    armsCm = user.Profile?.ArmsCm,
                    quadsCm = user.Profile?.QuadsCm,
                    hipsCm = user.Profile?.HipsCm,
                    currentWeight = user.Profile?.CurrentWeight,
                    targetWeight = user.Profile?.TargetWeight
                }
            });
        });

        group.MapPut("/me", async (ClaimsPrincipal principal, AppDbContext db, UpdateProfileRequest req) =>
        {
            var uid = GetUserId(principal);
            if (uid is null) return Results.Unauthorized();

            var user = await db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == uid.Value);
            if (user is null) return Results.Unauthorized();

            if (user.Profile is null)
            {
                user.Profile = new FitCoachPro.Api.Models.UserProfile { UserId = user.Id, DisplayName = req.DisplayName };
            }

            user.Profile.DisplayName = req.DisplayName;
            user.Profile.Bio = req.Bio;
            user.Profile.AvatarUrl = req.AvatarUrl;

            user.Profile.PreferredUnitSystem = string.IsNullOrWhiteSpace(req.PreferredUnitSystem)
                ? user.Profile.PreferredUnitSystem
                : req.PreferredUnitSystem.Trim().ToLowerInvariant();

            // Client fields (safe even if coach)
            user.Profile.StartDate = req.StartDate;
            user.Profile.HeightCm = req.HeightCm;
            user.Profile.NeckCm = req.NeckCm;
            user.Profile.ArmsCm = req.ArmsCm;
            user.Profile.QuadsCm = req.QuadsCm;
            user.Profile.HipsCm = req.HipsCm;
            user.Profile.CurrentWeight = req.CurrentWeight;
            user.Profile.TargetWeight = req.TargetWeight;

            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                id = user.Id,
                email = user.Email,
                role = user.Role,
                profile = new
                {
                    displayName = user.Profile?.DisplayName ?? user.Email,
                    bio = user.Profile?.Bio,
                    avatarUrl = user.Profile?.AvatarUrl,
                    preferredUnitSystem = user.Profile?.PreferredUnitSystem ?? "imperial",
                    startDate = user.Profile?.StartDate,
                    heightCm = user.Profile?.HeightCm,
                    neckCm = user.Profile?.NeckCm,
                    armsCm = user.Profile?.ArmsCm,
                    quadsCm = user.Profile?.QuadsCm,
                    hipsCm = user.Profile?.HipsCm,
                    currentWeight = user.Profile?.CurrentWeight,
                    targetWeight = user.Profile?.TargetWeight
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

    public record UpdateProfileRequest(
        string DisplayName,
        string? Bio,
        string? AvatarUrl,
        string? PreferredUnitSystem,
        DateTime? StartDate,
        decimal? HeightCm,
        decimal? NeckCm,
        decimal? ArmsCm,
        decimal? QuadsCm,
        decimal? HipsCm,
        decimal? CurrentWeight,
        decimal? TargetWeight
    );
}
