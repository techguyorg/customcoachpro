using System.Security.Claims;
using FitCoachPro.Api.Auth;
using FitCoachPro.Api.Data;
using FitCoachPro.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;


namespace FitCoachPro.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth");

        group.MapPost("/login", async (LoginRequest req, AppDbContext db, JwtTokenService jwt, IConfiguration cfg) =>
        {
            var user = await db.Users
                .Include(u => u.Profile)
                .FirstOrDefaultAsync(x => x.Email == req.Email);

            if (user is null)
                return Results.Json(new { message = "Invalid credentials" }, statusCode: StatusCodes.Status401Unauthorized);

            if (!BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
                return Results.Json(new { message = "Invalid credentials" }, statusCode: StatusCodes.Status401Unauthorized);

            var accessToken = jwt.CreateAccessToken(user);
            var refreshToken = jwt.CreateRefreshToken();

            var refreshDays = cfg.GetSection("Jwt").GetValue<int>("RefreshTokenDays", 14);

            db.RefreshTokens.Add(new RefreshToken
            {
                UserId = user.Id,
                Token = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(refreshDays),
                Revoked = false
            });

            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                token = accessToken,
                refreshToken,
                user = new
                {
                    id = user.Id,
                    email = user.Email,
                    role = user.Role,
                    displayName = user.Profile?.DisplayName ?? user.Email
                }
            });
        });

        group.MapGet("/me", [Authorize] async (ClaimsPrincipal principal, AppDbContext db) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)
                         ?? principal.FindFirstValue(JwtRegisteredClaimNames.Sub)
                         ?? principal.FindFirstValue("sub");

            if (userId is null || !Guid.TryParse(userId, out var uid))
                return Results.Json(new { message = "Invalid token" }, statusCode: StatusCodes.Status401Unauthorized);

            var user = await db.Users
                .Include(u => u.Profile)
                .FirstOrDefaultAsync(u => u.Id == uid);

            if (user is null)
                return Results.Json(new { message = "User not found" }, statusCode: StatusCodes.Status401Unauthorized);

            return Results.Ok(new
            {
                id = user.Id,
                email = user.Email,
                role = user.Role,
                profile = new
                {
                    displayName = user.Profile?.DisplayName ?? "",
                    bio = user.Profile?.Bio,
                    avatarUrl = user.Profile?.AvatarUrl
                }
            });
        });

        group.MapPost("/refresh", async (RefreshRequest req, AppDbContext db, JwtTokenService jwt, IConfiguration cfg) =>
        {
            var tokenRow = await db.RefreshTokens.FirstOrDefaultAsync(x => x.Token == req.RefreshToken);
            if (tokenRow is null || tokenRow.Revoked || tokenRow.ExpiresAt <= DateTime.UtcNow)
                return Results.Json(new { message = "Refresh token invalid/expired" }, statusCode: StatusCodes.Status401Unauthorized);

            var user = await db.Users.Include(u => u.Profile).FirstOrDefaultAsync(x => x.Id == tokenRow.UserId);
            if (user is null)
                return Results.Json(new { message = "User not found" }, statusCode: StatusCodes.Status401Unauthorized);

            // rotate refresh token
            tokenRow.Revoked = true;

            var newRefresh = jwt.CreateRefreshToken();
            var refreshDays = cfg.GetSection("Jwt").GetValue<int>("RefreshTokenDays", 14);

            db.RefreshTokens.Add(new RefreshToken
            {
                UserId = user.Id,
                Token = newRefresh,
                ExpiresAt = DateTime.UtcNow.AddDays(refreshDays),
                Revoked = false
            });

            var accessToken = jwt.CreateAccessToken(user);
            await db.SaveChangesAsync();

            return Results.Ok(new { token = accessToken, refreshToken = newRefresh });
        });

        group.MapPost("/logout", [Authorize] async (AppDbContext db, ClaimsPrincipal principal) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)
                         ?? principal.FindFirstValue(JwtRegisteredClaimNames.Sub)
                         ?? principal.FindFirstValue("sub");

            if (userId is null || !Guid.TryParse(userId, out var uid))
                return Results.Ok(new { ok = true });

            var tokens = await db.RefreshTokens.Where(x => x.UserId == uid && !x.Revoked).ToListAsync();
            foreach (var t in tokens) t.Revoked = true;

            await db.SaveChangesAsync();
            return Results.Ok(new { ok = true });
        });
    }

    public record LoginRequest(string Email, string Password);
    public record RefreshRequest(string RefreshToken);
}
