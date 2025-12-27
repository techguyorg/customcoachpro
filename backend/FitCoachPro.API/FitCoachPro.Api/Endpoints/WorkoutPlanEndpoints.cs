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

        group.MapGet("/", async (ClaimsPrincipal principal, AppDbContext db, string? search, string? muscle, string? equipment, string? difficulty, string? tag, string? goal) =>
        {
            var (userId, role) = GetUser(principal);
            if (userId is null) return Results.Unauthorized();
            if (role is not ("coach" or "client")) return Results.Forbid();

            var plans = await GetScopedPlans(db, userId.Value, role)
                .ToListAsync();

            var filtered = FilterWorkoutPlans(plans, search, muscle, equipment, difficulty, tag, goal);

            return Results.Ok(new { data = filtered.Select(ToDto), success = true });
        });

        group.MapGet("/{id:guid}", async (ClaimsPrincipal principal, AppDbContext db, Guid id) =>
        {
            var (userId, role) = GetUser(principal);
            if (userId is null) return Results.Unauthorized();
            if (role is not ("coach" or "client")) return Results.Forbid();

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
                .ThenInclude(e => e.Exercise)
                .Where(p => p.CoachId == coachId || p.IsPublished)
                .ToListAsync();

            return Results.Ok(new { data = plans.Select(ToDto), success = true });
        });

        group.MapGet("/client/{clientId:guid}", async (ClaimsPrincipal principal, AppDbContext db, Guid clientId) =>
        {
            var (userId, role) = GetUser(principal);
            if (userId is null) return Results.Unauthorized();

            if (role == "client" && userId != clientId) return Results.Forbid();
            if (role is not ("coach" or "client")) return Results.Forbid();
            if (role == "coach")
            {
                var mapped = await db.CoachClients.AnyAsync(cc => cc.CoachId == userId && cc.ClientId == clientId && cc.IsActive);
                if (!mapped) return Results.Forbid();
            }

            var assignments = await db.ClientWorkoutPlans
                .Include(c => c.WorkoutPlan)!.ThenInclude(p => p!.Days)!.ThenInclude(d => d.Exercises)!.ThenInclude(e => e.Exercise)
                .Where(c => c.ClientId == clientId && c.IsActive)
                .ToListAsync();

            return Results.Ok(new { data = assignments.Select(ToAssignmentDto), success = true });
        });

        var templateGroup = group.MapGroup("/templates").RequireAuthorization();

        templateGroup.MapGet("/", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db, string? search, string? muscle, string? equipment, string? difficulty, string? tag, string? goal) =>
        {
            var (coachId, role) = GetUser(principal);
            if (coachId is null || role != "coach") return Results.Forbid();

            var plans = await db.WorkoutPlans
                .Include(p => p.Days)!.ThenInclude(d => d.Exercises)!.ThenInclude(e => e.Exercise)
                .Where(p => p.IsPublished)
                .ToListAsync();

            var filtered = FilterWorkoutPlans(plans, search, muscle, equipment, difficulty, tag, goal);

            return Results.Ok(new { data = filtered.Select(ToDto), success = true });
        });

        templateGroup.MapGet("/{id:guid}", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db, Guid id) =>
        {
            var (coachId, role) = GetUser(principal);
            if (coachId is null || role != "coach") return Results.Forbid();

            var plan = await db.WorkoutPlans
                .Include(p => p.Days)!.ThenInclude(d => d.Exercises)!.ThenInclude(e => e.Exercise)
                .FirstOrDefaultAsync(p => p.Id == id && p.IsPublished);

            if (plan is null) return Results.NotFound();

            return Results.Ok(new { data = ToDto(plan), success = true });
        });

        templateGroup.MapPost("/{id:guid}/clone", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db, Guid id) =>
        {
            var (coachId, role) = GetUser(principal);
            if (coachId is null || role != "coach") return Results.Forbid();

            var plan = await db.WorkoutPlans
                .Include(p => p.Days)!.ThenInclude(d => d.Exercises)
                .FirstOrDefaultAsync(p => p.Id == id && p.IsPublished);

            if (plan is null) return Results.NotFound();

            var duplicate = DuplicatePlan(plan, coachId.Value);

            db.WorkoutPlans.Add(duplicate);
            await db.SaveChangesAsync();

            return Results.Ok(new { data = ToDto(duplicate), success = true });
        });

        group.MapPost("/", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db, CreateWorkoutPlanRequest req) =>
        {
            var (coachId, role) = GetUser(principal);
            if (coachId is null || role != "coach") return Results.Forbid();

            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest(new { message = "Name is required" });

            if (req.DurationWeeks <= 0)
                return Results.BadRequest(new { message = "Duration must be at least 1 week" });

            var (exerciseLookup, validationError) = await ValidateExercises(db, coachId.Value, req.Days ?? new List<WorkoutDayRequest>());
            if (validationError is not null) return validationError;

            var plan = new WorkoutPlan
            {
                Id = Guid.NewGuid(),
                CoachId = coachId.Value,
                CreatedBy = coachId.Value,
                Name = req.Name.Trim(),
                Description = req.Description?.Trim(),
                DurationWeeks = req.DurationWeeks,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsPublished = req.IsPublished ?? false,
                Days = (req.Days ?? new List<WorkoutDayRequest>())
                    .OrderBy(d => d.DayNumber)
                    .Select(d => ToEntity(d, exerciseLookup))
                    .ToList()
            };

            db.AuditLogs.Add(new AuditLog
            {
                CoachId = coachId.Value,
                ActorId = coachId.Value,
                EntityId = plan.Id,
                EntityType = "workout-plan",
                Action = "created",
                Details = $"Created workout plan '{plan.Name}'"
            });

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
                var (exerciseLookup, validationError) = await ValidateExercises(db, coachId.Value, req.Days);
                if (validationError is not null) return validationError;

                db.WorkoutExercises.RemoveRange(plan.Days.SelectMany(d => d.Exercises));
                db.WorkoutDays.RemoveRange(plan.Days);

                plan.Days = req.Days
                    .OrderBy(d => d.DayNumber)
                    .Select(d => ToEntity(d, exerciseLookup))
                    .ToList();
            }

            plan.UpdatedAt = DateTime.UtcNow;
            if (req.IsPublished.HasValue)
            {
                plan.IsPublished = req.IsPublished.Value;
            }
            db.AuditLogs.Add(new AuditLog
            {
                CoachId = coachId.Value,
                ActorId = coachId.Value,
                EntityId = plan.Id,
                EntityType = "workout-plan",
                Action = "updated",
                Details = $"Updated workout plan '{plan.Name}'"
            });
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

            var plan = await db.WorkoutPlans.FirstOrDefaultAsync(p => p.Id == req.WorkoutPlanId && (p.CoachId == coachId || p.IsPublished));
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

        group.MapPost("/{id:guid}/duplicate", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db, Guid id) =>
        {
            var (coachId, role) = GetUser(principal);
            if (coachId is null || role != "coach") return Results.Forbid();

            var plan = await db.WorkoutPlans
                .Include(p => p.Days)
                .ThenInclude(d => d.Exercises)
                .FirstOrDefaultAsync(p => p.Id == id && (p.CoachId == coachId || p.IsPublished));

            if (plan is null) return Results.NotFound();

            var duplicate = DuplicatePlan(plan, coachId.Value);

            db.WorkoutPlans.Add(duplicate);
            await db.SaveChangesAsync();

            return Results.Ok(new { data = ToDto(duplicate), success = true });
        });
    }

    private static IEnumerable<WorkoutPlan> FilterWorkoutPlans(IEnumerable<WorkoutPlan> plans, string? search, string? muscle, string? equipment, string? difficulty, string? tag, string? goal)
    {
        var filtered = plans.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            filtered = filtered.Where(p =>
                p.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                (!string.IsNullOrWhiteSpace(p.Description) && p.Description.Contains(search, StringComparison.OrdinalIgnoreCase)));
        }

        if (!string.IsNullOrWhiteSpace(muscle))
        {
            filtered = filtered.Where(p => PlanExercises(p).Any(e =>
                e.PrimaryMuscleGroup.Equals(muscle, StringComparison.OrdinalIgnoreCase) ||
                SplitCsv(e.MuscleGroups).Any(m => m.Equals(muscle, StringComparison.OrdinalIgnoreCase))));
        }

        if (!string.IsNullOrWhiteSpace(equipment))
        {
            filtered = filtered.Where(p => PlanExercises(p).Any(e => !string.IsNullOrWhiteSpace(e.Equipment) && e.Equipment.Contains(equipment, StringComparison.OrdinalIgnoreCase)));
        }

        if (!string.IsNullOrWhiteSpace(difficulty))
        {
            filtered = filtered.Where(p => ExtractDifficultyTags(p).Any(d => d.Equals(difficulty, StringComparison.OrdinalIgnoreCase)));
        }

        if (!string.IsNullOrWhiteSpace(tag))
        {
            filtered = filtered.Where(p => ExtractPlanTags(p).Any(t => t.Equals(tag, StringComparison.OrdinalIgnoreCase)));
        }

        if (!string.IsNullOrWhiteSpace(goal))
        {
            filtered = filtered.Where(p => InferWorkoutGoal(p).Equals(goal, StringComparison.OrdinalIgnoreCase));
        }

        return filtered;
    }

    private static WorkoutPlanDto ToDto(WorkoutPlan plan) => new(
        plan.Id,
        plan.CoachId,
        plan.CreatedBy,
        plan.Name,
        plan.Description,
        InferWorkoutGoal(plan),
        plan.DurationWeeks,
        plan.IsPublished,
        plan.CreatedAt,
        plan.UpdatedAt,
        plan.Days.OrderBy(d => d.DayNumber).Select(d => new WorkoutDayDto(
            d.Id,
            d.Name,
            d.DayNumber,
            d.Exercises.OrderBy(e => e.Order).Select(e => new WorkoutExerciseDto(
                e.Id,
                e.ExerciseId,
                e.ExerciseName ?? e.Exercise?.Name,
                e.Sets,
                e.Reps,
                e.RestSeconds,
                e.Tempo,
                e.Notes,
                e.Order,
                ToExerciseDto(e.Exercise)
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

    private static IQueryable<WorkoutPlan> GetScopedPlans(AppDbContext db, Guid userId, string role)
    {
        var query = db.WorkoutPlans
            .Include(p => p.Days)
            .ThenInclude(d => d.Exercises)
            .ThenInclude(e => e.Exercise)
            .AsQueryable();

        if (role == "coach")
        {
            query = query.Where(p => p.CoachId == userId || p.IsPublished);
        }
        else if (role == "client")
        {
            var planIds = db.ClientWorkoutPlans
                .Where(c => c.ClientId == userId && c.IsActive)
                .Select(c => c.WorkoutPlanId);

            query = query.Where(p => planIds.Contains(p.Id));
        }

        return query.Where(p => p.IsPublished || p.CoachId != Guid.Empty);
    }

    private static (Guid? userId, string role) GetUser(ClaimsPrincipal principal)
    {
        var idStr = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.FindFirstValue("sub");
        var role = principal.FindFirstValue(ClaimTypes.Role) ?? principal.FindFirstValue("role") ?? string.Empty;
        return (Guid.TryParse(idStr, out var uid) ? uid : null, role.ToLowerInvariant());
    }

    private static WorkoutPlan DuplicatePlan(WorkoutPlan plan, Guid coachId)
    {
        var now = DateTime.UtcNow;

        return new WorkoutPlan
        {
            Id = Guid.NewGuid(),
            CoachId = coachId,
            CreatedBy = coachId,
            Name = $"{plan.Name} (Copy)",
            Description = plan.Description,
            DurationWeeks = plan.DurationWeeks,
            CreatedAt = now,
            UpdatedAt = now,
            IsPublished = false,
            Days = plan.Days
                .OrderBy(d => d.DayNumber)
                .Select(d => new WorkoutDay
                {
                    Id = Guid.NewGuid(),
                    Name = d.Name,
                    DayNumber = d.DayNumber,
                    Exercises = d.Exercises
                        .OrderBy(e => e.Order)
                        .Select(e => new WorkoutExercise
                        {
                            Id = Guid.NewGuid(),
                            ExerciseId = e.ExerciseId,
                            ExerciseName = e.ExerciseName,
                            Sets = e.Sets,
                            Reps = e.Reps,
                            RestSeconds = e.RestSeconds,
                            Tempo = e.Tempo,
                            Notes = e.Notes,
                            Order = e.Order
                        })
                        .ToList()
                })
                .ToList()
        };
    }

    private static WorkoutDay ToEntity(WorkoutDayRequest req, IReadOnlyDictionary<Guid, Exercise>? exerciseLookup = null) => new()
    {
        Id = Guid.NewGuid(),
        Name = string.IsNullOrWhiteSpace(req.Name) ? $"Day {req.DayNumber}" : req.Name.Trim(),
        DayNumber = req.DayNumber,
        Exercises = (req.Exercises ?? new List<WorkoutExerciseRequest>())
            .OrderBy(e => e.Order)
            .Select(e =>
            {
                Exercise? linkedExercise = null;
                if (e.ExerciseId.HasValue && exerciseLookup is not null)
                {
                    exerciseLookup.TryGetValue(e.ExerciseId.Value, out linkedExercise);
                }

                return new WorkoutExercise
                {
                    Id = Guid.NewGuid(),
                    ExerciseId = linkedExercise?.Id,
                    ExerciseName = linkedExercise?.Name ?? e.ExerciseName?.Trim(),
                    Sets = e.Sets,
                    Reps = e.Reps,
                    RestSeconds = e.RestSeconds,
                    Tempo = e.Tempo,
                    Notes = e.Notes,
                    Order = e.Order
                };
            })
            .ToList()
    };

    private static ExerciseDto? ToExerciseDto(Exercise? exercise) =>
        exercise is null
            ? null
            : new ExerciseDto(
                exercise.Id,
                exercise.CoachId,
                exercise.Name,
                exercise.PrimaryMuscleGroup,
                exercise.Description,
                SplitCsv(exercise.MuscleGroups),
                SplitCsv(exercise.Tags),
                exercise.Equipment,
                exercise.VideoUrl,
                exercise.IsPublished,
                exercise.CreatedAt,
                exercise.UpdatedAt);

    private static IEnumerable<Exercise> PlanExercises(WorkoutPlan plan) =>
        plan.Days
            .SelectMany(d => d.Exercises)
            .Where(e => e.Exercise is not null)
            .Select(e => e.Exercise!);

    private static IEnumerable<string> ExtractPlanTags(WorkoutPlan plan) =>
        PlanExercises(plan)
            .SelectMany(e => SplitCsv(e.Tags))
            .Distinct(StringComparer.OrdinalIgnoreCase);

    private static IEnumerable<string> ExtractDifficultyTags(WorkoutPlan plan) =>
        PlanExercises(plan)
            .SelectMany(GetDifficultyTags)
            .Distinct(StringComparer.OrdinalIgnoreCase);

    private static IEnumerable<string> GetDifficultyTags(Exercise exercise)
    {
        var knownLevels = new[] { "beginner", "intermediate", "advanced" };
        return SplitCsv(exercise.Tags).Where(t => knownLevels.Contains(t, StringComparer.OrdinalIgnoreCase));
    }

    private static string InferWorkoutGoal(WorkoutPlan plan)
    {
        var tags = ExtractPlanTags(plan);
        var description = plan.Description ?? string.Empty;
        if (tags.Any(t => t.Contains("gain", StringComparison.OrdinalIgnoreCase)) || description.Contains("gain", StringComparison.OrdinalIgnoreCase))
            return "muscle-gain";
        if (tags.Any(t => t.Contains("loss", StringComparison.OrdinalIgnoreCase) || t.Contains("cut", StringComparison.OrdinalIgnoreCase)) ||
            description.Contains("loss", StringComparison.OrdinalIgnoreCase) ||
            description.Contains("cut", StringComparison.OrdinalIgnoreCase))
            return "fat-loss";
        return "general";
    }

    private static async Task<(Dictionary<Guid, Exercise> Lookup, IResult? Error)> ValidateExercises(
        AppDbContext db,
        Guid coachId,
        IEnumerable<WorkoutDayRequest> days)
    {
        var exerciseIds = days
            .SelectMany(d => d.Exercises ?? new List<WorkoutExerciseRequest>())
            .Where(e => e.ExerciseId.HasValue)
            .Select(e => e.ExerciseId!.Value)
            .Distinct()
            .ToList();

        if (!exerciseIds.Any())
        {
            return (new Dictionary<Guid, Exercise>(), null);
        }

        var exercises = await db.Exercises
            .Where(e => exerciseIds.Contains(e.Id) && (e.CoachId == coachId || e.IsPublished))
            .ToDictionaryAsync(e => e.Id);

        if (exercises.Count != exerciseIds.Count)
        {
            return (new Dictionary<Guid, Exercise>(), Results.BadRequest(new { message = "One or more exercises are invalid or unavailable." }));
        }

        return (exercises, null);
    }

    private static List<string> SplitCsv(string? value) =>
        (value ?? string.Empty)
            .Split(",", StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();
}

public record WorkoutExerciseRequest(Guid? ExerciseId, string? ExerciseName, int Sets, string Reps, int RestSeconds, string? Tempo, string? Notes, int Order);
public record WorkoutDayRequest(string Name, int DayNumber, List<WorkoutExerciseRequest> Exercises);
public record CreateWorkoutPlanRequest(string Name, string? Description, int DurationWeeks, List<WorkoutDayRequest> Days, bool? IsPublished);
public record UpdateWorkoutPlanRequest(string? Name, string? Description, int? DurationWeeks, List<WorkoutDayRequest>? Days, bool? IsPublished);
public record AssignWorkoutPlanRequest(Guid ClientId, Guid WorkoutPlanId, DateTime StartDate);

public record WorkoutExerciseDto(Guid Id, Guid? ExerciseId, string? ExerciseName, int Sets, string Reps, int RestSeconds, string? Tempo, string? Notes, int Order, ExerciseDto? Exercise);
public record WorkoutDayDto(Guid Id, string Name, int DayNumber, List<WorkoutExerciseDto> Exercises);
public record WorkoutPlanDto(Guid Id, Guid CoachId, Guid CreatedBy, string Name, string? Description, string Goal, int DurationWeeks, bool IsPublished, DateTime CreatedAt, DateTime UpdatedAt, List<WorkoutDayDto> Days);
public record ClientWorkoutPlanDto(Guid Id, Guid ClientId, Guid WorkoutPlanId, DateTime StartDate, DateTime? EndDate, bool IsActive);
