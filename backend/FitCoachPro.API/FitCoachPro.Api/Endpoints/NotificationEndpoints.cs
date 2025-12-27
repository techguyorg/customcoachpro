using System.Security.Claims;
using FitCoachPro.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace FitCoachPro.Api.Endpoints;

public static class NotificationEndpoints
{
    public static void MapNotificationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/notifications").RequireAuthorization();

        group.MapGet("/", async (ClaimsPrincipal principal, AppDbContext db, int? limit) =>
        {
            var userId = GetUserId(principal);
            if (userId is null) return Results.Unauthorized();

            var take = Math.Clamp(limit ?? 50, 1, 200);

            var notifications = await db.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(take)
                .Select(n => new
                {
                    id = n.Id,
                    title = n.Title,
                    message = n.Message,
                    type = n.Type,
                    createdAt = n.CreatedAt,
                    readAt = n.ReadAt,
                    isRead = n.ReadAt != null,
                    actionUrl = n.ActionUrl
                })
                .ToListAsync();

            return Results.Ok(notifications);
        });

        group.MapPost("/{id:guid}/read", async (ClaimsPrincipal principal, AppDbContext db, Guid id) =>
        {
            var userId = GetUserId(principal);
            if (userId is null) return Results.Unauthorized();

            var notification = await db.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
            if (notification is null) return Results.NotFound();

            if (!notification.IsRead)
            {
                notification.ReadAt = DateTime.UtcNow;
                await db.SaveChangesAsync();
            }

            return Results.Ok(new { ok = true });
        });

        group.MapPost("/read-all", async (ClaimsPrincipal principal, AppDbContext db) =>
        {
            var userId = GetUserId(principal);
            if (userId is null) return Results.Unauthorized();

            var unread = await db.Notifications
                .Where(n => n.UserId == userId && n.ReadAt == null)
                .ToListAsync();

            if (unread.Count == 0) return Results.Ok(new { updated = 0 });

            var now = DateTime.UtcNow;
            foreach (var notification in unread)
            {
                notification.ReadAt = now;
            }

            await db.SaveChangesAsync();
            return Results.Ok(new { updated = unread.Count });
        });
    }

    private static Guid? GetUserId(ClaimsPrincipal principal)
    {
        var idStr = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.FindFirstValue("sub");
        return Guid.TryParse(idStr, out var uid) ? uid : null;
    }
}
