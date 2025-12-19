using System.Security.Claims;
using FitCoachPro.Api.Data;
using FitCoachPro.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace FitCoachPro.Api.Endpoints;

public static class WorkoutPlanEndpoints
{
    public static void MapWorkoutPlanEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/workout-plans").RequireAuthorization();

        group.MapGet("/", async (ClaimsPrincipal principal, AppDbContext db) =>
        {
            var (userId, role) = GetUser(principal);
            if (userId is null) return Results.Unauthorized();

            var plans = await GetScopedPlans(db, userId.Value, role)
                .ToListAsync();

            return Results.Ok(new { data = plans.Select(ToDto), success = true });
        });

        group.MapGet("/{id:guid}", async (ClaimsPrincipal principal, AppDbContext db, Guid id) =>
        {
            var (userId, role) = GetUser(principal);
            if (userId is null) return Results.Unauthorized();

            var plan = await GetScopedPlans(db, userId.Value, role)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (plan is null) return Results.NotFound();

            return Results.Ok(new { data = ToDto(plan), success = true });
        });

        group.MapGet("/coach/{coachId:guid}", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db, Guid coachId) =>
        {
            var (userId, role) = GetUser(principal);
            if (userId is null) return Results.Unauthorized();
            if (role != "coach" || userId != coachId) return Results.Forbid();

            var plans = await db.WorkoutPlans
                .Include(p => p.Days)
                .ThenInclude(d => d.Exercises)
                .Where(p => p.CoachId == coachId)
                .ToListAsync();

            return Results.Ok(new { data = plans.Select(ToDto), success = true });
        });

        group.MapGet("/client/{clientId:guid}", async (ClaimsPrincipal principal, AppDbContext db, Guid clientId) =>
        {
            var (userId, role) = GetUser(principal);
            if (userId is null) return Results.Unauthorized();

            if (role == "client" && userId != clientId) return Results.Forbid();
            if (role == "coach")
            {
                var mapped = await db.CoachClients.AnyAsync(cc => cc.CoachId == userId && cc.ClientId == clientId && cc.IsActive);
                if (!mapped) return Results.Forbid();
            }

            var assignments = await db.ClientWorkoutPlans
                .Include(c => c.WorkoutPlan)!.ThenInclude(p => p!.Days)!.ThenInclude(d => d.Exercises)
                .Where(c => c.ClientId == clientId && c.IsActive)
                .ToListAsync();

            return Results.Ok(new { data = assignments.Select(ToAssignmentDto), success = true });
        });

        group.MapPost("/", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db, CreateWorkoutPlanRequest req) =>
        {
            var (coachId, role) = GetUser(principal);
            if (coachId is null || role != "coach") return Results.Forbid();

            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest(new { message = "Name is required" });

            if (req.DurationWeeks <= 0)
                return Results.BadRequest(new { message = "Duration must be at least 1 week" });

            var plan = new WorkoutPlan
            {
                Id = Guid.NewGuid(),
                CoachId = coachId.Value,
                Name = req.Name.Trim(),
                Description = req.Description?.Trim(),
                DurationWeeks = req.DurationWeeks,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Days = (req.Days ?? new List<WorkoutDayRequest>())
                    .OrderBy(d => d.DayNumber)
                    .Select(ToEntity)
                    .ToList()
            };

            db.WorkoutPlans.Add(plan);
            await db.SaveChangesAsync();

            return Results.Ok(new { data = ToDto(plan), success = true });
        });

        group.MapPut("/{id:guid}", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db, Guid id, UpdateWorkoutPlanRequest req) =>
        {
            var (coachId, role) = GetUser(principal);
            if (coachId is null || role != "coach") return Results.Forbid();

            var plan = await db.WorkoutPlans
                .Include(p => p.Days)
                .ThenInclude(d => d.Exercises)
                .FirstOrDefaultAsync(p => p.Id == id && p.CoachId == coachId);

            if (plan is null) return Results.NotFound();

            if (!string.IsNullOrWhiteSpace(req.Name))
                plan.Name = req.Name.Trim();

            if (req.Description is not null)
                plan.Description = req.Description.Trim();

            if (req.DurationWeeks.HasValue && req.DurationWeeks.Value > 0)
                plan.DurationWeeks = req.DurationWeeks.Value;

            if (req.Days is not null)
            {
                db.WorkoutExercises.RemoveRange(plan.Days.SelectMany(d => d.Exercises));
                db.WorkoutDays.RemoveRange(plan.Days);

                plan.Days = req.Days
                    .OrderBy(d => d.DayNumber)
                    .Select(ToEntity)
                    .ToList();
            }

            plan.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            return Results.Ok(new { data = ToDto(plan), success = true });
        });

        group.MapDelete("/{id:guid}", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db, Guid id) =>
        {
            var (coachId, role) = GetUser(principal);
            if (coachId is null || role != "coach") return Results.Forbid();

            var plan = await db.WorkoutPlans
                .Include(p => p.Days)
                .ThenInclude(d => d.Exercises)
                .FirstOrDefaultAsync(p => p.Id == id && p.CoachId == coachId);

            if (plan is null) return Results.NotFound();

            db.WorkoutPlans.Remove(plan);
            await db.SaveChangesAsync();

            return Results.Ok(new { success = true });
        });

        group.MapPost("/assign", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db, AssignWorkoutPlanRequest req) =>
        {
            var (coachId, role) = GetUser(principal);
            if (coachId is null || role != "coach") return Results.Forbid();

            var plan = await db.WorkoutPlans.FirstOrDefaultAsync(p => p.Id == req.WorkoutPlanId && p.CoachId == coachId);
            if (plan is null) return Results.BadRequest(new { message = "Workout plan not found" });

            var mapped = await db.CoachClients.AnyAsync(cc => cc.CoachId == coachId && cc.ClientId == req.ClientId && cc.IsActive);
            if (!mapped) return Results.BadRequest(new { message = "Client is not assigned to this coach" });

            var existing = await db.ClientWorkoutPlans.FirstOrDefaultAsync(c => c.ClientId == req.ClientId && c.WorkoutPlanId == req.WorkoutPlanId);
            if (existing is null)
            {
                existing = new ClientWorkoutPlan
                {
                    Id = Guid.NewGuid(),
                    ClientId = req.ClientId,
                    WorkoutPlanId = req.WorkoutPlanId,
                    StartDate = req.StartDate,
                    IsActive = true
                };

                db.ClientWorkoutPlans.Add(existing);
            }
            else
            {
                existing.StartDate = req.StartDate;
                existing.EndDate = null;
                existing.IsActive = true;
            }

            await db.SaveChangesAsync();

            return Results.Ok(new { data = ToAssignmentDto(existing), success = true });
        });
    }

    private static WorkoutPlanDto ToDto(WorkoutPlan plan) => new(
        plan.Id,
        plan.CoachId,
        plan.Name,
        plan.Description,
        plan.DurationWeeks,
        plan.CreatedAt,
        plan.UpdatedAt,
        plan.Days.OrderBy(d => d.DayNumber).Select(d => new WorkoutDayDto(
            d.Id,
            d.Name,
            d.DayNumber,
            d.Exercises.OrderBy(e => e.Order).Select(e => new WorkoutExerciseDto(
                e.Id,
                e.ExerciseId,
                e.ExerciseName,
                e.Sets,
                e.Reps,
                e.RestSeconds,
                e.Tempo,
                e.Notes,
                e.Order
            )).ToList()
        )).ToList()
    );

    private static ClientWorkoutPlanDto ToAssignmentDto(ClientWorkoutPlan assignment) => new(
        assignment.Id,
        assignment.ClientId,
        assignment.WorkoutPlanId,
        assignment.StartDate,
        assignment.EndDate,
        assignment.IsActive
    );

    private static WorkoutDay ToEntity(WorkoutDayRequest req) => new()
    {
        Id = Guid.NewGuid(),
        Name = string.IsNullOrWhiteSpace(req.Name) ? $"Day {req.DayNumber}" : req.Name.Trim(),
        DayNumber = req.DayNumber,
        Exercises = (req.Exercises ?? new List<WorkoutExerciseRequest>())
            .OrderBy(e => e.Order)
            .Select(e => new WorkoutExercise
            {
                Id = Guid.NewGuid(),
                ExerciseId = e.ExerciseId,
                ExerciseName = e.ExerciseName?.Trim(),
                Sets = e.Sets,
                Reps = e.Reps,
                RestSeconds = e.RestSeconds,
                Tempo = e.Tempo,
                Notes = e.Notes,
                Order = e.Order
            })
            .ToList()
    };

    private static IQueryable<WorkoutPlan> GetScopedPlans(AppDbContext db, Guid userId, string role)
    {
        var query = db.WorkoutPlans
            .Include(p => p.Days)
            .ThenInclude(d => d.Exercises)
            .AsQueryable();

        if (role == "coach")
        {
            query = query.Where(p => p.CoachId == userId);
        }
        else if (role == "client")
        {
            var planIds = db.ClientWorkoutPlans
                .Where(c => c.ClientId == userId && c.IsActive)
                .Select(c => c.WorkoutPlanId);

            query = query.Where(p => planIds.Contains(p.Id));
        }

        return query;
    }

    private static (Guid? userId, string role) GetUser(ClaimsPrincipal principal)
    {
        var idStr = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.FindFirstValue("sub");
        var role = principal.FindFirstValue(ClaimTypes.Role) ?? principal.FindFirstValue("role") ?? string.Empty;
        return (Guid.TryParse(idStr, out var uid) ? uid : null, role.ToLowerInvariant());
    }
}

public record WorkoutExerciseRequest(Guid? ExerciseId, string? ExerciseName, int Sets, string Reps, int RestSeconds, string? Tempo, string? Notes, int Order);
public record WorkoutDayRequest(string Name, int DayNumber, List<WorkoutExerciseRequest> Exercises);
public record CreateWorkoutPlanRequest(string Name, string? Description, int DurationWeeks, List<WorkoutDayRequest> Days);
public record UpdateWorkoutPlanRequest(string? Name, string? Description, int? DurationWeeks, List<WorkoutDayRequest>? Days);
public record AssignWorkoutPlanRequest(Guid ClientId, Guid WorkoutPlanId, DateTime StartDate);

public record WorkoutExerciseDto(Guid Id, Guid? ExerciseId, string? ExerciseName, int Sets, string Reps, int RestSeconds, string? Tempo, string? Notes, int Order);
public record WorkoutDayDto(Guid Id, string Name, int DayNumber, List<WorkoutExerciseDto> Exercises);
public record WorkoutPlanDto(Guid Id, Guid CoachId, string Name, string? Description, int DurationWeeks, DateTime CreatedAt, DateTime UpdatedAt, List<WorkoutDayDto> Days);
public record ClientWorkoutPlanDto(Guid Id, Guid ClientId, Guid WorkoutPlanId, DateTime StartDate, DateTime? EndDate, bool IsActive);
