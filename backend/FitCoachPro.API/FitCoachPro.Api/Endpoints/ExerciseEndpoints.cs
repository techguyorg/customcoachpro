using System.Security.Claims;
using FitCoachPro.Api.Data;
using FitCoachPro.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace FitCoachPro.Api.Endpoints;

public static class ExerciseEndpoints
{
    public static void MapExerciseEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/exercises").RequireAuthorization();

        group.MapGet("/", async (ClaimsPrincipal principal, AppDbContext db, string? search, string? muscle, string? tag) =>
        {
            var (userId, role) = GetUser(principal);
            if (userId is null) return Results.Unauthorized();

            var exercises = await GetScopedExercises(db, userId.Value, role)
                .OrderBy(e => e.Name)
                .ToListAsync();

            var filtered = exercises.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                filtered = filtered.Where(e =>
                    e.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                    (!string.IsNullOrWhiteSpace(e.Description) &&
                     e.Description.Contains(search, StringComparison.OrdinalIgnoreCase)));
            }

            if (!string.IsNullOrWhiteSpace(muscle))
            {
                filtered = filtered.Where(e => Split(e.MuscleGroups).Any(m => m.Equals(muscle, StringComparison.OrdinalIgnoreCase)));
            }

            if (!string.IsNullOrWhiteSpace(tag))
            {
                filtered = filtered.Where(e => Split(e.Tags).Any(t => t.Equals(tag, StringComparison.OrdinalIgnoreCase)));
            }

            var list = filtered.ToList();
            var muscleGroups = exercises.SelectMany(e => Split(e.MuscleGroups)).Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(m => m);
            var tags = exercises.SelectMany(e => Split(e.Tags)).Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(t => t);

            return Results.Ok(new
            {
                data = list.Select(ToDto),
                filters = new { muscleGroups, tags },
                success = true
            });
        });

        group.MapGet("/{id:guid}", async (ClaimsPrincipal principal, AppDbContext db, Guid id) =>
        {
            var (userId, role) = GetUser(principal);
            if (userId is null) return Results.Unauthorized();

            var exercise = await GetScopedExercises(db, userId.Value, role)
                .FirstOrDefaultAsync(e => e.Id == id);

            return exercise is null
                ? Results.NotFound()
                : Results.Ok(new { data = ToDto(exercise), success = true });
        });

        group.MapPost("/", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db, ExerciseRequest req) =>
        {
            var (coachId, role) = GetUser(principal);
            if (coachId is null || role != "coach") return Results.Forbid();

            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest(new { message = "Name is required" });

            var exercise = new Exercise
            {
                Id = Guid.NewGuid(),
                CoachId = coachId.Value,
                Name = req.Name.Trim(),
                Description = req.Description?.Trim(),
                MuscleGroups = Join(req.MuscleGroups),
                Tags = Join(req.Tags),
                Equipment = req.Equipment?.Trim(),
                VideoUrl = req.VideoUrl?.Trim(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            db.Exercises.Add(exercise);
            await db.SaveChangesAsync();

            return Results.Ok(new { data = ToDto(exercise), success = true });
        });

        group.MapPut("/{id:guid}", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db, Guid id, UpdateExerciseRequest req) =>
        {
            var (coachId, role) = GetUser(principal);
            if (coachId is null || role != "coach") return Results.Forbid();

            var exercise = await db.Exercises.FirstOrDefaultAsync(e => e.Id == id && e.CoachId == coachId);
            if (exercise is null) return Results.NotFound();

            if (!string.IsNullOrWhiteSpace(req.Name))
                exercise.Name = req.Name.Trim();

            if (req.Description is not null)
                exercise.Description = req.Description.Trim();

            if (req.MuscleGroups is not null)
                exercise.MuscleGroups = Join(req.MuscleGroups);

            if (req.Tags is not null)
                exercise.Tags = Join(req.Tags);

            if (req.Equipment is not null)
                exercise.Equipment = req.Equipment.Trim();

            if (req.VideoUrl is not null)
                exercise.VideoUrl = req.VideoUrl.Trim();

            exercise.UpdatedAt = DateTime.UtcNow;

            await db.SaveChangesAsync();

            return Results.Ok(new { data = ToDto(exercise), success = true });
        });

        group.MapDelete("/{id:guid}", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db, Guid id) =>
        {
            var (coachId, role) = GetUser(principal);
            if (coachId is null || role != "coach") return Results.Forbid();

            var exercise = await db.Exercises.FirstOrDefaultAsync(e => e.Id == id && e.CoachId == coachId);
            if (exercise is null) return Results.NotFound();

            db.Exercises.Remove(exercise);
            await db.SaveChangesAsync();

            return Results.Ok(new { success = true });
        });
    }

    private static IQueryable<Exercise> GetScopedExercises(AppDbContext db, Guid userId, string role)
    {
        if (role == "coach")
        {
            return db.Exercises.Where(e => e.CoachId == userId);
        }

        if (role == "client")
        {
            var coachId = db.CoachClients
                .Where(cc => cc.ClientId == userId && cc.IsActive)
                .Select(cc => cc.CoachId)
                .FirstOrDefault();

            if (coachId != Guid.Empty)
            {
                return db.Exercises.Where(e => e.CoachId == coachId);
            }
        }

        return db.Exercises.Where(_ => false);
    }

    private static ExerciseDto ToDto(Exercise exercise) => new(
        exercise.Id,
        exercise.CoachId,
        exercise.Name,
        exercise.Description,
        Split(exercise.MuscleGroups),
        Split(exercise.Tags),
        exercise.Equipment,
        exercise.VideoUrl,
        exercise.CreatedAt,
        exercise.UpdatedAt
    );

    private static List<string> Split(string? value) =>
        (value ?? string.Empty)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();

    private static string Join(IEnumerable<string>? values) =>
        values is null ? string.Empty : string.Join(",", values.Where(v => !string.IsNullOrWhiteSpace(v)).Select(v => v.Trim()));

    private static (Guid? userId, string role) GetUser(ClaimsPrincipal principal)
    {
        var idStr = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.FindFirstValue("sub");
        var role = principal.FindFirstValue(ClaimTypes.Role) ?? principal.FindFirstValue("role") ?? string.Empty;
        return (Guid.TryParse(idStr, out var uid) ? uid : null, role.ToLowerInvariant());
    }
}

public record ExerciseRequest(string Name, string? Description, List<string>? MuscleGroups, List<string>? Tags, string? Equipment, string? VideoUrl);
public record UpdateExerciseRequest(string? Name, string? Description, List<string>? MuscleGroups, List<string>? Tags, string? Equipment, string? VideoUrl);
public record ExerciseDto(Guid Id, Guid CoachId, string Name, string? Description, List<string> MuscleGroups, List<string> Tags, string? Equipment, string? VideoUrl, DateTime CreatedAt, DateTime UpdatedAt);
