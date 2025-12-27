using System.Security.Claims;
using FitCoachPro.Api.Data;
using FitCoachPro.Api.Models;
using FitCoachPro.Api.Notifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace FitCoachPro.Api.Endpoints;

public static class CheckInEndpoints
{
    public static void MapCheckInEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/checkins").RequireAuthorization();

        group.MapGet("/", (ClaimsPrincipal principal, AppDbContext db, string? status, string? type, Guid? coachId) =>
            GetCheckIns(principal, db, status, type, coachId));
        group.MapGet("/", async (ClaimsPrincipal principal, AppDbContext db) =>
        {
            var (userId, role) = GetUser(principal);
            if (userId is null) return Results.Unauthorized();
            if (role is not ("coach" or "client")) return Results.Forbid();

            var scoped = ApplyScope(db, userId.Value, role);

            var results = await scoped
                .OrderByDescending(c => c.SubmittedAt)
                .Join(db.Users.Include(u => u.Profile),
                    c => c.ClientId,
                    u => u.Id,
                    (c, u) => ToDto(c, u))
                .ToListAsync();

        group.MapGet("/pending", (ClaimsPrincipal principal, AppDbContext db, string? type, Guid? coachId) =>
            GetCheckIns(principal, db, CheckInStatus.Pending, type, coachId));

        group.MapGet("/{id:guid}", async (ClaimsPrincipal principal, AppDbContext db, Guid id) =>
        {
            var (userId, role) = GetUser(principal);
            if (userId is null) return Results.Unauthorized();
            if (role is not ("coach" or "client")) return Results.Forbid();

            var scoped = ApplyScope(db, userId.Value, role);
            var checkIn = await scoped.FirstOrDefaultAsync(c => c.Id == id);
            if (checkIn is null) return Results.NotFound();

            var client = await db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == checkIn.ClientId);
            if (client is null) return Results.NotFound(new { message = "Client not found" });

            return Results.Ok(ToDto(checkIn, client));
        });

        group.MapPost("/", async (ClaimsPrincipal principal, AppDbContext db, CreateCheckInRequest req, INotificationQueue notifications) =>
        {
            var (userId, role) = GetUser(principal);
            if (userId is null) return Results.Unauthorized();
            if (role is not ("coach" or "client")) return Results.Forbid();

            var type = (req.Type ?? string.Empty).Trim().ToLowerInvariant();
            if (!CheckInType.All.Contains(type))
                return Results.BadRequest(new { message = "Invalid check-in type" });

            if (role == "client" && req.ClientId != userId.Value)
                return Results.BadRequest(new { message = "Clients can only create their own check-ins" });

            if (role == "coach")
            {
                var mapped = await db.CoachClients.AnyAsync(cc => cc.CoachId == userId.Value && cc.ClientId == req.ClientId && cc.IsActive);
                if (!mapped)
                    return Results.BadRequest(new { message = "Client is not assigned to this coach" });
            }

            var coachId = role == "coach"
                ? userId.Value
                : await db.CoachClients.Where(cc => cc.ClientId == req.ClientId && cc.IsActive)
                    .Select(cc => cc.CoachId)
                    .FirstOrDefaultAsync();

            var checkIn = new CheckIn
            {
                ClientId = req.ClientId,
                CoachId = coachId != Guid.Empty ? coachId : userId.Value,
                Type = type,
                Status = CheckInStatus.Pending,
                SubmittedAt = req.SubmittedAt ?? DateTime.UtcNow
            };

            ApplyRequest(checkIn, req);

            db.CheckIns.Add(checkIn);
            await db.SaveChangesAsync();

            var client = await db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == checkIn.ClientId);
            if (client is null) return Results.NotFound(new { message = "Client not found" });

            // Notify the coach when a client submits a check-in
            if (checkIn.CoachId != Guid.Empty)
            {
                var coach = await db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == checkIn.CoachId);
                if (coach is not null)
                {
                    var clientName = client.Profile?.DisplayName ?? client.Email;
                    await notifications.EnqueueAsync(new NotificationEvent(
                        coach.Id,
                        "New check-in submitted",
                        $"{clientName} sent a {checkIn.Type} check-in.",
                        "check-in",
                        "/check-ins",
                        coach.Email
                    ));
                }
            }

            return Results.Ok(ToDto(checkIn, client));
        });

        group.MapPut("/{id:guid}", async (ClaimsPrincipal principal, AppDbContext db, Guid id, UpdateCheckInRequest req) =>
        {
            var (userId, role) = GetUser(principal);
            if (userId is null) return Results.Unauthorized();
            if (role is not ("coach" or "client")) return Results.Forbid();

            var scoped = ApplyScope(db, userId.Value, role);
            var checkIn = await scoped.FirstOrDefaultAsync(c => c.Id == id);
            if (checkIn is null) return Results.NotFound();

            if (!string.IsNullOrWhiteSpace(req.Type))
            {
                var type = req.Type.Trim().ToLowerInvariant();
                if (!CheckInType.All.Contains(type))
                    return Results.BadRequest(new { message = "Invalid check-in type" });
                checkIn.Type = type;
            }

            if (!string.IsNullOrWhiteSpace(req.Status))
            {
                var status = req.Status.Trim().ToLowerInvariant();
                if (status is not (CheckInStatus.Pending or CheckInStatus.Reviewed))
                    return Results.BadRequest(new { message = "Invalid status" });
                checkIn.Status = status;
            }

            if (req.SubmittedAt.HasValue)
                checkIn.SubmittedAt = req.SubmittedAt.Value;

            ApplyRequest(checkIn, req);
            await db.SaveChangesAsync();

            var client = await db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == checkIn.ClientId);
            if (client is null) return Results.NotFound(new { message = "Client not found" });

            return Results.Ok(ToDto(checkIn, client));
        });

        group.MapPut("/{id:guid}/review", async (ClaimsPrincipal principal, AppDbContext db, Guid id, INotificationQueue notifications) =>
        {
            var (userId, role) = GetUser(principal);
            if (userId is null) return Results.Unauthorized();
            if (role != "coach") return Results.Forbid();

            var scoped = ApplyScope(db, userId.Value, role);
            var checkIn = await scoped.FirstOrDefaultAsync(c => c.Id == id);
            if (checkIn is null) return Results.NotFound();

            checkIn.Status = CheckInStatus.Reviewed;
            db.AuditLogs.Add(new AuditLog
            {
                CoachId = checkIn.CoachId,
                ActorId = userId.Value,
                ClientId = checkIn.ClientId,
                EntityId = checkIn.Id,
                EntityType = "checkin",
                Action = "reviewed",
                Details = $"Reviewed {checkIn.Type} check-in"
            });

            await db.SaveChangesAsync();

            var client = await db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == checkIn.ClientId);
            if (client is null) return Results.NotFound(new { message = "Client not found" });

            await notifications.EnqueueAsync(new NotificationEvent(
                client.Id,
                "Check-in reviewed",
                "Your coach reviewed your check-in.",
                "check-in",
                "/progress",
                client.Email
            ));

            return Results.Ok(ToDto(checkIn, client));
        });

        group.MapDelete("/{id:guid}", async (ClaimsPrincipal principal, AppDbContext db, Guid id) =>
        {
            var (userId, role) = GetUser(principal);
            if (userId is null) return Results.Unauthorized();
            if (role is not ("coach" or "client")) return Results.Forbid();

            var scoped = ApplyScope(db, userId.Value, role);
            var checkIn = await scoped.FirstOrDefaultAsync(c => c.Id == id);
            if (checkIn is null) return Results.NotFound();

            db.CheckIns.Remove(checkIn);
            await db.SaveChangesAsync();

            return Results.Ok(new { ok = true });
        });
    }

    private static (Guid? userId, string role) GetUser(ClaimsPrincipal principal)
    {
        var idStr = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.FindFirstValue("sub");
        var role = principal.FindFirstValue(ClaimTypes.Role) ?? principal.FindFirstValue("role") ?? string.Empty;
        return (Guid.TryParse(idStr, out var uid) ? uid : null, role.ToLowerInvariant());
    }

    private static IQueryable<CheckIn> ApplyScope(AppDbContext db, Guid userId, string role)
    {
        var query = db.CheckIns.AsQueryable();

        if (role == "coach")
        {
            var clientIds = db.CoachClients.Where(cc => cc.CoachId == userId && cc.IsActive).Select(cc => cc.ClientId);
            query = query.Where(c => c.CoachId == userId || clientIds.Contains(c.ClientId));
        }
        else if (role == "client")
        {
            query = query.Where(c => c.ClientId == userId);
        }

        return query;
    }

    private static async Task<IResult> GetCheckIns(
        ClaimsPrincipal principal,
        AppDbContext db,
        string? status,
        string? type,
        Guid? coachId)
    {
        var (userId, role) = GetUser(principal);
        if (userId is null) return Results.Unauthorized();

        var scoped = ApplyScope(db, userId.Value, role);

        if (coachId.HasValue)
            scoped = scoped.Where(c => c.CoachId == coachId.Value);

        if (!string.IsNullOrWhiteSpace(status))
        {
            var normalized = status.Trim().ToLowerInvariant();
            if (normalized is not (CheckInStatus.Pending or CheckInStatus.Reviewed))
                return Results.BadRequest(new { message = "Invalid status" });

            scoped = scoped.Where(c => c.Status == normalized);
        }

        if (!string.IsNullOrWhiteSpace(type))
        {
            var normalizedType = type.Trim().ToLowerInvariant();
            if (!CheckInType.All.Contains(normalizedType))
                return Results.BadRequest(new { message = "Invalid check-in type" });

            scoped = scoped.Where(c => c.Type == normalizedType);
        }

        var results = await scoped
            .OrderByDescending(c => c.SubmittedAt)
            .Join(db.Users.Include(u => u.Profile),
                c => c.ClientId,
                u => u.Id,
                (c, u) => ToDto(c, u))
            .ToListAsync();

        return Results.Ok(results);
    }

    private static void ApplyRequest(CheckIn checkIn, UpsertCheckInRequest req)
    {
        checkIn.Weight = req.Weight ?? checkIn.Weight;
        checkIn.BodyFat = req.BodyFat ?? checkIn.BodyFat;
        checkIn.Waist = req.Waist ?? checkIn.Waist;
        checkIn.Chest = req.Chest ?? checkIn.Chest;
        checkIn.Arms = req.Arms ?? checkIn.Arms;
        checkIn.Thighs = req.Thighs ?? checkIn.Thighs;
        checkIn.WorkoutCompleted = req.WorkoutCompleted ?? checkIn.WorkoutCompleted;
        checkIn.WorkoutNotes = req.WorkoutNotes ?? checkIn.WorkoutNotes;
        checkIn.DietCompliance = req.DietCompliance ?? checkIn.DietCompliance;
        checkIn.DietDeviations = req.DietDeviations ?? checkIn.DietDeviations;
        checkIn.FrontPhotoUrl = req.FrontPhotoUrl ?? checkIn.FrontPhotoUrl;
        checkIn.SidePhotoUrl = req.SidePhotoUrl ?? checkIn.SidePhotoUrl;
        checkIn.BackPhotoUrl = req.BackPhotoUrl ?? checkIn.BackPhotoUrl;
        checkIn.Notes = req.Notes ?? checkIn.Notes;
    }

    private static object ToDto(CheckIn checkIn, User client) => new
    {
        id = checkIn.Id,
        clientId = checkIn.ClientId,
        coachId = checkIn.CoachId,
        clientName = client.Profile?.DisplayName ?? client.Email,
        clientAvatar = client.Profile?.AvatarUrl,
        type = checkIn.Type,
        status = checkIn.Status,
        submittedAt = checkIn.SubmittedAt,
        notes = checkIn.Notes,
        data = new
        {
            weight = checkIn.Weight,
            bodyFat = checkIn.BodyFat,
            waist = checkIn.Waist,
            chest = checkIn.Chest,
            arms = checkIn.Arms,
            thighs = checkIn.Thighs,
            completed = checkIn.WorkoutCompleted,
            workoutNotes = checkIn.WorkoutNotes,
            complianceRating = checkIn.DietCompliance,
            deviations = checkIn.DietDeviations,
            photos = new
            {
                front = checkIn.FrontPhotoUrl,
                side = checkIn.SidePhotoUrl,
                back = checkIn.BackPhotoUrl
            }
        }
    };

    public record CreateCheckInRequest(
        Guid ClientId,
        string Type,
        DateTime? SubmittedAt,
        decimal? Weight,
        decimal? BodyFat,
        decimal? Waist,
        decimal? Chest,
        decimal? Arms,
        decimal? Thighs,
        bool? WorkoutCompleted,
        string? WorkoutNotes,
        int? DietCompliance,
        string? DietDeviations,
        string? FrontPhotoUrl,
        string? SidePhotoUrl,
        string? BackPhotoUrl,
        string? Notes
    ) : UpsertCheckInRequest(
        Type,
        SubmittedAt,
        Weight,
        BodyFat,
        Waist,
        Chest,
        Arms,
        Thighs,
        WorkoutCompleted,
        WorkoutNotes,
        DietCompliance,
        DietDeviations,
        FrontPhotoUrl,
        SidePhotoUrl,
        BackPhotoUrl,
        Notes,
        null
    );

    public record UpdateCheckInRequest(
        string? Type,
        DateTime? SubmittedAt,
        decimal? Weight,
        decimal? BodyFat,
        decimal? Waist,
        decimal? Chest,
        decimal? Arms,
        decimal? Thighs,
        bool? WorkoutCompleted,
        string? WorkoutNotes,
        int? DietCompliance,
        string? DietDeviations,
        string? FrontPhotoUrl,
        string? SidePhotoUrl,
        string? BackPhotoUrl,
        string? Notes,
        string? Status
    ) : UpsertCheckInRequest(
        Type,
        SubmittedAt,
        Weight,
        BodyFat,
        Waist,
        Chest,
        Arms,
        Thighs,
        WorkoutCompleted,
        WorkoutNotes,
        DietCompliance,
        DietDeviations,
        FrontPhotoUrl,
        SidePhotoUrl,
        BackPhotoUrl,
        Notes,
        Status
    );

    public record UpsertCheckInRequest(
        string? Type,
        DateTime? SubmittedAt,
        decimal? Weight,
        decimal? BodyFat,
        decimal? Waist,
        decimal? Chest,
        decimal? Arms,
        decimal? Thighs,
        bool? WorkoutCompleted,
        string? WorkoutNotes,
        int? DietCompliance,
        string? DietDeviations,
        string? FrontPhotoUrl,
        string? SidePhotoUrl,
        string? BackPhotoUrl,
        string? Notes,
        string? Status
    );
}
