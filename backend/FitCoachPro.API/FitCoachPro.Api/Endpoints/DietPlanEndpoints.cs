using System.Security.Claims;
using FitCoachPro.Api.Data;
using FitCoachPro.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace FitCoachPro.Api.Endpoints;

public static class DietPlanEndpoints
{
    public static void MapDietPlanEndpoints(this IEndpointRouteBuilder app)
    {
        var foodGroup = app.MapGroup("/api/foods").RequireAuthorization();
        var mealGroup = app.MapGroup("/api/meals").RequireAuthorization();
        var planGroup = app.MapGroup("/api/diet-plans").RequireAuthorization();

        MapFoodEndpoints(foodGroup);
        MapMealEndpoints(mealGroup);
        MapPlanEndpoints(planGroup);
    }

    private static void MapFoodEndpoints(RouteGroupBuilder group)
    {
        group.MapGet("/", async (ClaimsPrincipal principal, AppDbContext db) =>
        {
            var (userId, role) = GetUser(principal);
            if (userId is null) return Results.Unauthorized();
            if (role is not ("coach" or "client")) return Results.Forbid();

            var foods = await GetScopedFoods(db, userId.Value, role)
                .OrderBy(f => f.Name)
                .ToListAsync();

            return Results.Ok(new { data = foods.Select(ToFoodDto), success = true });
        });

        group.MapGet("/{id:guid}", async (ClaimsPrincipal principal, AppDbContext db, Guid id) =>
        {
            var (userId, role) = GetUser(principal);
            if (userId is null) return Results.Unauthorized();
            if (role is not ("coach" or "client")) return Results.Forbid();

            var food = await GetScopedFoods(db, userId.Value, role)
                .FirstOrDefaultAsync(f => f.Id == id);

            if (food is null) return Results.NotFound();

            return Results.Ok(new { data = ToFoodDto(food), success = true });
        });

        group.MapGet("/coach/{coachId:guid}", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db, Guid coachId) =>
        {
            var (userId, role) = GetUser(principal);
            if (userId is null || role != "coach" || userId != coachId) return Results.Forbid();

            var foods = await db.Foods
                .Where(f => f.CoachId == coachId)
                .OrderBy(f => f.Name)
                .ToListAsync();

            return Results.Ok(new { data = foods.Select(ToFoodDto), success = true });
        });

        group.MapPost("/", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db, CreateFoodRequest req) =>
        {
            var (coachId, role) = GetUser(principal);
            if (coachId is null || role != "coach") return Results.Forbid();

            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest(new { message = "Name is required" });

            var food = new Food
            {
                Id = Guid.NewGuid(),
                CoachId = coachId.Value,
                Name = req.Name.Trim(),
                Calories = Math.Max(req.Calories, 0),
                Protein = Math.Max(req.Protein, 0),
                Carbs = Math.Max(req.Carbs, 0),
                Fat = Math.Max(req.Fat, 0),
                ServingSize = string.IsNullOrWhiteSpace(req.ServingSize) ? "1 serving" : req.ServingSize.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            db.Foods.Add(food);
            await db.SaveChangesAsync();

            return Results.Ok(new { data = ToFoodDto(food), success = true });
        });

        group.MapPut("/{id:guid}", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db, Guid id, UpdateFoodRequest req) =>
        {
            var (coachId, role) = GetUser(principal);
            if (coachId is null || role != "coach") return Results.Forbid();

            var food = await db.Foods.FirstOrDefaultAsync(f => f.Id == id && f.CoachId == coachId);
            if (food is null) return Results.NotFound();

            if (!string.IsNullOrWhiteSpace(req.Name)) food.Name = req.Name.Trim();
            if (req.Calories.HasValue) food.Calories = Math.Max(req.Calories.Value, 0);
            if (req.Protein.HasValue) food.Protein = Math.Max(req.Protein.Value, 0);
            if (req.Carbs.HasValue) food.Carbs = Math.Max(req.Carbs.Value, 0);
            if (req.Fat.HasValue) food.Fat = Math.Max(req.Fat.Value, 0);
            if (req.ServingSize is not null) food.ServingSize = string.IsNullOrWhiteSpace(req.ServingSize) ? "1 serving" : req.ServingSize.Trim();

            await db.SaveChangesAsync();

            return Results.Ok(new { data = ToFoodDto(food), success = true });
        });

        group.MapDelete("/{id:guid}", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db, Guid id) =>
        {
            var (coachId, role) = GetUser(principal);
            if (coachId is null || role != "coach") return Results.Forbid();

            var food = await db.Foods.FirstOrDefaultAsync(f => f.Id == id && f.CoachId == coachId);
            if (food is null) return Results.NotFound();

            db.Foods.Remove(food);
            await db.SaveChangesAsync();

            return Results.Ok(new { success = true });
        });
    }

    private static void MapMealEndpoints(RouteGroupBuilder group)
    {
        group.MapGet("/", async (ClaimsPrincipal principal, AppDbContext db) =>
        {
            var (userId, role) = GetUser(principal);
            if (userId is null) return Results.Unauthorized();
            if (role is not ("coach" or "client")) return Results.Forbid();

            var meals = await GetScopedMeals(db, userId.Value, role)
                .OrderBy(m => m.Name)
                .ToListAsync();

            return Results.Ok(new { data = meals.Select(ToMealDto), success = true });
        });

        group.MapGet("/{id:guid}", async (ClaimsPrincipal principal, AppDbContext db, Guid id) =>
        {
            var (userId, role) = GetUser(principal);
            if (userId is null) return Results.Unauthorized();
            if (role is not ("coach" or "client")) return Results.Forbid();

            var meal = await GetScopedMeals(db, userId.Value, role)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (meal is null) return Results.NotFound();

            return Results.Ok(new { data = ToMealDto(meal), success = true });
        });

        group.MapGet("/coach/{coachId:guid}", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db, Guid coachId) =>
        {
            var (userId, role) = GetUser(principal);
            if (userId is null || role != "coach" || userId != coachId) return Results.Forbid();

            var meals = await db.Meals
                .Include(m => m.Foods).ThenInclude(f => f.Food)
                .Where(m => m.CoachId == coachId)
                .OrderBy(m => m.Name)
                .ToListAsync();

            return Results.Ok(new { data = meals.Select(ToMealDto), success = true });
        });

        group.MapPost("/", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db, CreateMealRequest req) =>
        {
            var (coachId, role) = GetUser(principal);
            if (coachId is null || role != "coach") return Results.Forbid();

            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest(new { message = "Name is required" });

            var foodIds = (req.Foods ?? new List<MealFoodRequest>()).Select(f => f.FoodId).ToList();
            if (!foodIds.Any())
                return Results.BadRequest(new { message = "At least one food is required" });

            var foods = await db.Foods.Where(f => f.CoachId == coachId && foodIds.Contains(f.Id)).ToListAsync();
            if (foods.Count != foodIds.Count)
                return Results.BadRequest(new { message = "One or more foods were not found for this coach" });

            var meal = new Meal
            {
                Id = Guid.NewGuid(),
                CoachId = coachId.Value,
                Name = req.Name.Trim(),
                Description = req.Description?.Trim(),
                Foods = req.Foods!.Select(f => new MealFood
                {
                    Id = Guid.NewGuid(),
                    FoodId = f.FoodId,
                    Quantity = f.Quantity
                }).ToList()
            };

            db.Meals.Add(meal);
            await db.SaveChangesAsync();

            var hydrated = await LoadMealWithFoods(db, meal.Id);
            return Results.Ok(new { data = ToMealDto(hydrated), success = true });
        });

        group.MapPut("/{id:guid}", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db, Guid id, UpdateMealRequest req) =>
        {
            var (coachId, role) = GetUser(principal);
            if (coachId is null || role != "coach") return Results.Forbid();

            var meal = await db.Meals
                .Include(m => m.Foods)
                .FirstOrDefaultAsync(m => m.Id == id && m.CoachId == coachId);

            if (meal is null) return Results.NotFound();

            if (!string.IsNullOrWhiteSpace(req.Name)) meal.Name = req.Name.Trim();
            if (req.Description is not null) meal.Description = req.Description.Trim();

            if (req.Foods is not null)
            {
                var foodIds = req.Foods.Select(f => f.FoodId).ToList();
                if (!foodIds.Any())
                    return Results.BadRequest(new { message = "At least one food is required" });

                var foods = await db.Foods.Where(f => f.CoachId == coachId && foodIds.Contains(f.Id)).ToListAsync();
                if (foods.Count != foodIds.Count)
                    return Results.BadRequest(new { message = "One or more foods were not found for this coach" });

                db.MealFoods.RemoveRange(meal.Foods);
                meal.Foods = req.Foods.Select(f => new MealFood
                {
                    Id = Guid.NewGuid(),
                    FoodId = f.FoodId,
                    Quantity = f.Quantity
                }).ToList();
            }

            await db.SaveChangesAsync();

            var hydrated = await LoadMealWithFoods(db, meal.Id);
            return Results.Ok(new { data = ToMealDto(hydrated), success = true });
        });

        group.MapDelete("/{id:guid}", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db, Guid id) =>
        {
            var (coachId, role) = GetUser(principal);
            if (coachId is null || role != "coach") return Results.Forbid();

            var meal = await db.Meals.FirstOrDefaultAsync(m => m.Id == id && m.CoachId == coachId);
            if (meal is null) return Results.NotFound();

            var usedInPlan = await db.DietMeals.AnyAsync(dm => dm.MealId == id);
            if (usedInPlan)
                return Results.BadRequest(new { message = "Meal is used in a diet plan. Remove it from plans before deleting." });

            db.Meals.Remove(meal);
            await db.SaveChangesAsync();

            return Results.Ok(new { success = true });
        });
    }

    private static void MapPlanEndpoints(RouteGroupBuilder group)
    {
        group.MapGet("/", async (ClaimsPrincipal principal, AppDbContext db) =>
        {
            var (userId, role) = GetUser(principal);
            if (userId is null) return Results.Unauthorized();
            if (role is not ("coach" or "client")) return Results.Forbid();

            var plans = await GetScopedPlans(db, userId.Value, role)
                .ToListAsync();

            return Results.Ok(new { data = plans.Select(ToDietPlanDto), success = true });
        });

        group.MapGet("/{id:guid}", async (ClaimsPrincipal principal, AppDbContext db, Guid id) =>
        {
            var (userId, role) = GetUser(principal);
            if (userId is null) return Results.Unauthorized();
            if (role is not ("coach" or "client")) return Results.Forbid();

            var plan = await GetScopedPlans(db, userId.Value, role)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (plan is null) return Results.NotFound();

            return Results.Ok(new { data = ToDietPlanDto(plan), success = true });
        });

        group.MapGet("/coach/{coachId:guid}", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db, Guid coachId) =>
        {
            var (userId, role) = GetUser(principal);
            if (userId is null || role != "coach" || userId != coachId) return Results.Forbid();

            var plans = await db.DietPlans
                .Include(p => p.Days)!.ThenInclude(d => d.Meals)!.ThenInclude(m => m.Meal)!.ThenInclude(m => m!.Foods)!.ThenInclude(f => f.Food)
                .Where(p => p.CoachId == coachId)
                .ToListAsync();

            return Results.Ok(new { data = plans.Select(ToDietPlanDto), success = true });
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

            var assignments = await db.ClientDietPlans
                .Include(a => a.DietPlan)!.ThenInclude(p => p!.Days)!.ThenInclude(d => d.Meals)!.ThenInclude(m => m.Meal)!.ThenInclude(m => m!.Foods)!.ThenInclude(f => f.Food)
                .Where(a => a.ClientId == clientId && a.IsActive)
                .ToListAsync();

            return Results.Ok(new { data = assignments.Select(ToClientDietPlanDto), success = true });
        });

        group.MapPost("/", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db, CreateDietPlanRequest req) =>
        {
            var (coachId, role) = GetUser(principal);
            if (coachId is null || role != "coach") return Results.Forbid();

            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest(new { message = "Name is required" });

            if (req.Days is null || !req.Days.Any())
                return Results.BadRequest(new { message = "At least one day is required" });

            var mealIds = req.Days.SelectMany(d => d.Meals ?? new List<DietMealRequest>()).Select(m => m.MealId).ToList();
            var meals = await db.Meals.Where(m => m.CoachId == coachId && mealIds.Contains(m.Id)).ToListAsync();
            if (mealIds.Any() && meals.Count != mealIds.Count)
                return Results.BadRequest(new { message = "One or more meals were not found for this coach" });

            var plan = new DietPlan
            {
                Id = Guid.NewGuid(),
                CoachId = coachId.Value,
                Name = req.Name.Trim(),
                Description = req.Description?.Trim(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Days = (req.Days ?? new List<DietDayRequest>())
                    .OrderBy(d => d.DayNumber)
                    .Select(ToDietDayEntity)
                    .ToList()
            };

            db.AuditLogs.Add(new AuditLog
            {
                CoachId = coachId.Value,
                ActorId = coachId.Value,
                EntityId = plan.Id,
                EntityType = "diet-plan",
                Action = "created",
                Details = $"Created diet plan '{plan.Name}'"
            });

            db.DietPlans.Add(plan);
            await db.SaveChangesAsync();

            var hydrated = await GetScopedPlans(db, coachId.Value, role)
                .FirstAsync(p => p.Id == plan.Id);

            return Results.Ok(new { data = ToDietPlanDto(hydrated), success = true });
        });

        group.MapPut("/{id:guid}", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db, Guid id, UpdateDietPlanRequest req) =>
        {
            var (coachId, role) = GetUser(principal);
            if (coachId is null || role != "coach") return Results.Forbid();

            var plan = await db.DietPlans
                .Include(p => p.Days)!.ThenInclude(d => d.Meals)
                .FirstOrDefaultAsync(p => p.Id == id && p.CoachId == coachId);

            if (plan is null) return Results.NotFound();

            if (!string.IsNullOrWhiteSpace(req.Name)) plan.Name = req.Name.Trim();
            if (req.Description is not null) plan.Description = req.Description.Trim();

            if (req.Days is not null)
            {
                var mealIds = req.Days.SelectMany(d => d.Meals ?? new List<DietMealRequest>()).Select(m => m.MealId).ToList();
                var meals = await db.Meals.Where(m => m.CoachId == coachId && mealIds.Contains(m.Id)).ToListAsync();
                if (mealIds.Any() && meals.Count != mealIds.Count)
                    return Results.BadRequest(new { message = "One or more meals were not found for this coach" });

                db.DietMeals.RemoveRange(plan.Days.SelectMany(d => d.Meals));
                db.DietDays.RemoveRange(plan.Days);

                plan.Days = req.Days
                    .OrderBy(d => d.DayNumber)
                    .Select(ToDietDayEntity)
                    .ToList();
            }

            plan.UpdatedAt = DateTime.UtcNow;
            db.AuditLogs.Add(new AuditLog
            {
                CoachId = coachId.Value,
                ActorId = coachId.Value,
                EntityId = plan.Id,
                EntityType = "diet-plan",
                Action = "updated",
                Details = $"Updated diet plan '{plan.Name}'"
            });

            await db.SaveChangesAsync();

            var hydrated = await GetScopedPlans(db, coachId.Value, role)
                .FirstAsync(p => p.Id == plan.Id);

            return Results.Ok(new { data = ToDietPlanDto(hydrated), success = true });
        });

        group.MapDelete("/{id:guid}", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db, Guid id) =>
        {
            var (coachId, role) = GetUser(principal);
            if (coachId is null || role != "coach") return Results.Forbid();

            var plan = await db.DietPlans
                .Include(p => p.Days)!.ThenInclude(d => d.Meals)
                .FirstOrDefaultAsync(p => p.Id == id && p.CoachId == coachId);

            if (plan is null) return Results.NotFound();

            db.DietPlans.Remove(plan);
            await db.SaveChangesAsync();

            return Results.Ok(new { success = true });
        });

        group.MapPost("/assign", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db, AssignDietPlanRequest req) =>
        {
            var (coachId, role) = GetUser(principal);
            if (coachId is null || role != "coach") return Results.Forbid();

            var plan = await db.DietPlans.FirstOrDefaultAsync(p => p.Id == req.DietPlanId && p.CoachId == coachId);
            if (plan is null) return Results.BadRequest(new { message = "Diet plan not found" });

            var mapped = await db.CoachClients.AnyAsync(cc => cc.CoachId == coachId && cc.ClientId == req.ClientId && cc.IsActive);
            if (!mapped) return Results.BadRequest(new { message = "Client is not assigned to this coach" });

            var existing = await db.ClientDietPlans.FirstOrDefaultAsync(c => c.ClientId == req.ClientId && c.DietPlanId == req.DietPlanId);
            if (existing is null)
            {
                existing = new ClientDietPlan
                {
                    Id = Guid.NewGuid(),
                    ClientId = req.ClientId,
                    DietPlanId = req.DietPlanId,
                    StartDate = req.StartDate,
                    IsActive = true
                };

                db.ClientDietPlans.Add(existing);
            }
            else
            {
                existing.StartDate = req.StartDate;
                existing.EndDate = null;
                existing.IsActive = true;
            }

            await db.SaveChangesAsync();

            return Results.Ok(new { data = ToClientDietPlanDto(existing), success = true });
        });
    }

    private static DietDay ToDietDayEntity(DietDayRequest req) => new()
    {
        Id = Guid.NewGuid(),
        DayNumber = req.DayNumber,
        TargetCalories = req.TargetCalories,
        TargetProtein = req.TargetProtein,
        TargetCarbs = req.TargetCarbs,
        TargetFat = req.TargetFat,
        Meals = (req.Meals ?? new List<DietMealRequest>())
            .OrderBy(m => m.Order)
            .Select(m => new DietMeal
            {
                Id = Guid.NewGuid(),
                MealId = m.MealId,
                MealTime = string.IsNullOrWhiteSpace(m.MealTime) ? "Meal" : m.MealTime.Trim(),
                Order = m.Order
            })
            .ToList()
    };

    private static IQueryable<Food> GetScopedFoods(AppDbContext db, Guid userId, string role)
    {
        var query = db.Foods.AsQueryable();

        if (role == "coach")
        {
            query = query.Where(f => f.CoachId == userId);
        }
        else if (role == "client")
        {
            var activePlanIds = db.ClientDietPlans
                .Where(c => c.ClientId == userId && c.IsActive)
                .Select(c => c.DietPlanId);

            query = query.Where(f => f.MealFoods.Any(mf => mf.Meal!.DietMeals.Any(dm => activePlanIds.Contains(dm.DietDay!.DietPlanId))));
        }

        return query;
    }

    private static IQueryable<Meal> GetScopedMeals(AppDbContext db, Guid userId, string role)
    {
        var query = db.Meals
            .Include(m => m.Foods)!.ThenInclude(f => f.Food)
            .AsQueryable();

        if (role == "coach")
        {
            query = query.Where(m => m.CoachId == userId);
        }
        else if (role == "client")
        {
            var planIds = db.ClientDietPlans
                .Where(c => c.ClientId == userId && c.IsActive)
                .Select(c => c.DietPlanId);

            query = query.Where(m => m.DietMeals.Any(dm => planIds.Contains(dm.DietDay!.DietPlanId)));
        }

        return query;
    }

    private static IQueryable<DietPlan> GetScopedPlans(AppDbContext db, Guid userId, string role)
    {
        var query = db.DietPlans
            .Include(p => p.Days)!.ThenInclude(d => d.Meals)!.ThenInclude(m => m.Meal)!.ThenInclude(m => m!.Foods)!.ThenInclude(f => f.Food)
            .AsQueryable();

        if (role == "coach")
        {
            query = query.Where(p => p.CoachId == userId);
        }
        else if (role == "client")
        {
            var planIds = db.ClientDietPlans
                .Where(c => c.ClientId == userId && c.IsActive)
                .Select(c => c.DietPlanId);

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

    private static async Task<Meal> LoadMealWithFoods(AppDbContext db, Guid id)
    {
        return await db.Meals
            .Include(m => m.Foods)!.ThenInclude(f => f.Food)
            .FirstAsync(m => m.Id == id);
    }

    private static FoodDto ToFoodDto(Food food) => new(food.Id, food.CoachId, food.Name, food.Calories, food.Protein, food.Carbs, food.Fat, food.ServingSize, food.CreatedAt);

    private static MealDto ToMealDto(Meal meal)
    {
        var foods = meal.Foods.Select(f => new MealFoodDto(
            f.Id,
            f.FoodId,
            f.Food is null ? null : ToFoodDto(f.Food),
            f.Quantity
        )).ToList();

        var totals = foods.Aggregate((calories: 0m, protein: 0m, carbs: 0m, fat: 0m), (acc, f) =>
        {
            if (f.Food is null) return acc;
            return (
                acc.calories + f.Food.Calories * f.Quantity,
                acc.protein + f.Food.Protein * f.Quantity,
                acc.carbs + f.Food.Carbs * f.Quantity,
                acc.fat + f.Food.Fat * f.Quantity
            );
        });

        return new MealDto(
            meal.Id,
            meal.CoachId,
            meal.Name,
            meal.Description,
            foods,
            (int)Math.Round(totals.calories),
            (int)Math.Round(totals.protein),
            (int)Math.Round(totals.carbs),
            (int)Math.Round(totals.fat),
            meal.CreatedAt
        );
    }

    private static DietPlanDto ToDietPlanDto(DietPlan plan) => new(
        plan.Id,
        plan.CoachId,
        plan.Name,
        plan.Description,
        plan.Days.OrderBy(d => d.DayNumber).Select(d => new DietDayDto(
            d.Id,
            d.DayNumber,
            d.Meals.OrderBy(m => m.Order).Select(m => new DietMealDto(
                m.Id,
                m.MealId,
                m.Meal is null ? null : ToMealDto(m.Meal),
                m.MealTime,
                m.Order
            )).ToList(),
            d.TargetCalories,
            d.TargetProtein,
            d.TargetCarbs,
            d.TargetFat
        )).ToList(),
        plan.CreatedAt,
        plan.UpdatedAt
    );

    private static ClientDietPlanDto ToClientDietPlanDto(ClientDietPlan assignment) => new(
        assignment.Id,
        assignment.ClientId,
        assignment.DietPlanId,
        assignment.DietPlan is null ? null : ToDietPlanDto(assignment.DietPlan),
        assignment.StartDate,
        assignment.EndDate,
        assignment.IsActive
    );
}

public record CreateFoodRequest(string Name, int Calories, int Protein, int Carbs, int Fat, string ServingSize);
public record UpdateFoodRequest(string? Name, int? Calories, int? Protein, int? Carbs, int? Fat, string? ServingSize);

public record MealFoodRequest(Guid FoodId, decimal Quantity);
public record CreateMealRequest(string Name, string? Description, List<MealFoodRequest> Foods);
public record UpdateMealRequest(string? Name, string? Description, List<MealFoodRequest>? Foods);

public record DietMealRequest(Guid MealId, string MealTime, int Order);
public record DietDayRequest(int DayNumber, int TargetCalories, int TargetProtein, int TargetCarbs, int TargetFat, List<DietMealRequest> Meals);
public record CreateDietPlanRequest(string Name, string? Description, List<DietDayRequest> Days);
public record UpdateDietPlanRequest(string? Name, string? Description, List<DietDayRequest>? Days);
public record AssignDietPlanRequest(Guid ClientId, Guid DietPlanId, DateTime StartDate);

public record FoodDto(Guid Id, Guid CoachId, string Name, int Calories, int Protein, int Carbs, int Fat, string ServingSize, DateTime CreatedAt);
public record MealFoodDto(Guid Id, Guid FoodId, FoodDto? Food, decimal Quantity);
public record MealDto(Guid Id, Guid CoachId, string Name, string? Description, List<MealFoodDto> Foods, int TotalCalories, int TotalProtein, int TotalCarbs, int TotalFat, DateTime CreatedAt);
public record DietMealDto(Guid Id, Guid MealId, MealDto? Meal, string MealTime, int Order);
public record DietDayDto(Guid Id, int DayNumber, List<DietMealDto> Meals, int TargetCalories, int TargetProtein, int TargetCarbs, int TargetFat);
public record DietPlanDto(Guid Id, Guid CoachId, string Name, string? Description, List<DietDayDto> Days, DateTime CreatedAt, DateTime UpdatedAt);
public record ClientDietPlanDto(Guid Id, Guid ClientId, Guid DietPlanId, DietPlanDto? DietPlan, DateTime StartDate, DateTime? EndDate, bool IsActive);
