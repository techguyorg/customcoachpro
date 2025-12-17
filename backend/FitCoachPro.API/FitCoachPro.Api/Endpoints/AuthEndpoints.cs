using System.Security.Claims;
using FitCoachPro.Api.Auth;
using FitCoachPro.Api.Data;
using FitCoachPro.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace FitCoachPro.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth");

        group.MapPost("/login", async (LoginRequest req, AppDbContext db, JwtTokenService jwt, IConfiguration cfg) =>
        {
            var user = await db.Users.FirstOrDefaultAsync(x => x.Email == req.Email);
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
                user = new { id = user.Id, email = user.Email, fullName = user.FullName, role = user.Role }
            });
        });

        group.MapPost("/register", async (RegisterRequest req, AppDbContext db, JwtTokenService jwt, IConfiguration cfg) =>
        {
            var exists = await db.Users.AnyAsync(x => x.Email == req.Email);
            if (exists) return Results.BadRequest(new { message = "Email already exists" });

            var user = new User
            {
                Email = req.Email,
                FullName = req.FullName ?? "",
                Role = string.IsNullOrWhiteSpace(req.Role) ? "Client" : req.Role!,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password)
            };

            db.Users.Add(user);
            await db.SaveChangesAsync();

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
                user = new { id = user.Id, email = user.Email, fullName = user.FullName, role = user.Role }
            });
        });

        group.MapPost("/refresh", async (RefreshRequest req, AppDbContext db, JwtTokenService jwt, IConfiguration cfg) =>
        {
            var tokenRow = await db.RefreshTokens.FirstOrDefaultAsync(x => x.Token == req.RefreshToken);
            if (tokenRow is null || tokenRow.Revoked || tokenRow.ExpiresAt <= DateTime.UtcNow)
                return Results.Json(new { message = "Refresh token invalid/expired" }, statusCode: StatusCodes.Status401Unauthorized);

            var user = await db.Users.FirstAsync(x => x.Id == tokenRow.UserId);

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
            var sub = principal.FindFirstValue("sub") ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (sub is null || !Guid.TryParse(sub, out var uid))
                return Results.Ok(new { ok = true });

            var tokens = await db.RefreshTokens.Where(x => x.UserId == uid && !x.Revoked).ToListAsync();
            foreach (var t in tokens) t.Revoked = true;

            await db.SaveChangesAsync();
            return Results.Ok(new { ok = true });
        });

        group.MapGet("/me", [Authorize] async (ClaimsPrincipal principal, AppDbContext db) =>
        {
            var sub = principal.FindFirstValue("sub") ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (sub is null || !Guid.TryParse(sub, out var uid))
                return Results.Json(new { message = "Invalid token" }, statusCode: StatusCodes.Status401Unauthorized);

            var user = await db.Users.FirstOrDefaultAsync(x => x.Id == uid);
            if (user is null)
                return Results.Json(new { message = "User not found" }, statusCode: StatusCodes.Status401Unauthorized);

            return Results.Ok(new { id = user.Id, email = user.Email, fullName = user.FullName, role = user.Role });
        });
    }

    public record LoginRequest(string Email, string Password);
    public record RegisterRequest(string Email, string Password, string? FullName, string? Role);
    public record RefreshRequest(string RefreshToken);
}
