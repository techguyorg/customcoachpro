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
        group.MapGet("/", async (ClaimsPrincipal principal, AppDbContext db, string? search, int? minCalories, int? maxCalories, int? minProtein, int? maxProtein) =>
        {
            var (userId, role) = GetUser(principal);
            if (userId is null) return Results.Unauthorized();
            if (role is not ("coach" or "client")) return Results.Forbid();

            var foodsQuery = GetScopedFoods(db, userId.Value, role);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLowerInvariant();
                foodsQuery = foodsQuery.Where(f => f.Name.ToLower().Contains(term));
            }

            if (minCalories.HasValue) foodsQuery = foodsQuery.Where(f => f.Calories >= minCalories.Value);
            if (maxCalories.HasValue) foodsQuery = foodsQuery.Where(f => f.Calories <= maxCalories.Value);
            if (minProtein.HasValue) foodsQuery = foodsQuery.Where(f => f.Protein >= minProtein.Value);
            if (maxProtein.HasValue) foodsQuery = foodsQuery.Where(f => f.Protein <= maxProtein.Value);

            var foods = await foodsQuery
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
                .Where(f => f.CoachId == coachId || f.IsPublished)
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
                CreatedBy = coachId.Value,
                Name = req.Name.Trim(),
                Calories = Math.Max(req.Calories, 0),
                Protein = Math.Max(req.Protein, 0),
                Carbs = Math.Max(req.Carbs, 0),
                Fat = Math.Max(req.Fat, 0),
                ServingSize = string.IsNullOrWhiteSpace(req.ServingSize) ? "1 serving" : req.ServingSize.Trim(),
                CreatedAt = DateTime.UtcNow,
                IsPublished = req.IsPublished ?? false
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
            if (req.IsPublished.HasValue) food.IsPublished = req.IsPublished.Value;

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
        group.MapGet("/", async (ClaimsPrincipal principal, AppDbContext db, string? search, string? mealTime, int? minCalories, int? maxCalories, int? minProtein, int? maxProtein) =>
        {
            var (userId, role) = GetUser(principal);
            if (userId is null) return Results.Unauthorized();
            if (role is not ("coach" or "client")) return Results.Forbid();

            var meals = await GetScopedMeals(db, userId.Value, role)
                .OrderBy(m => m.Name)
                .ToListAsync();

            if (!string.IsNullOrWhiteSpace(mealTime))
            {
                meals = meals.Where(m => m.DietMeals.Any(dm => dm.MealTime.Equals(mealTime, StringComparison.OrdinalIgnoreCase))).ToList();
            }

            var dtos = meals.Select(ToMealDto).ToList();
            var filtered = dtos.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                filtered = filtered.Where(m =>
                    m.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                    (!string.IsNullOrWhiteSpace(m.Description) && m.Description.Contains(search, StringComparison.OrdinalIgnoreCase)));
            }

            if (minCalories.HasValue) filtered = filtered.Where(m => m.TotalCalories >= minCalories.Value);
            if (maxCalories.HasValue) filtered = filtered.Where(m => m.TotalCalories <= maxCalories.Value);
            if (minProtein.HasValue) filtered = filtered.Where(m => m.TotalProtein >= minProtein.Value);
            if (maxProtein.HasValue) filtered = filtered.Where(m => m.TotalProtein <= maxProtein.Value);

            return Results.Ok(new { data = filtered.ToList(), success = true });
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
                .Where(m => m.CoachId == coachId || m.IsPublished)
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

            var foods = await db.Foods.Where(f => foodIds.Contains(f.Id) && (f.CoachId == coachId || f.IsPublished)).ToListAsync();
            if (foods.Count != foodIds.Count)
                return Results.BadRequest(new { message = "One or more foods were not found for this coach" });

            var meal = new Meal
            {
                Id = Guid.NewGuid(),
                CoachId = coachId.Value,
                CreatedBy = coachId.Value,
                Name = req.Name.Trim(),
                Description = req.Description?.Trim(),
                IsPublished = req.IsPublished ?? false,
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
            if (req.IsPublished.HasValue) meal.IsPublished = req.IsPublished.Value;

            if (req.Foods is not null)
            {
                var foodIds = req.Foods.Select(f => f.FoodId).ToList();
                if (!foodIds.Any())
                    return Results.BadRequest(new { message = "At least one food is required" });

                var foods = await db.Foods.Where(f => foodIds.Contains(f.Id) && (f.CoachId == coachId || f.IsPublished)).ToListAsync();
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
        group.MapGet("/", async (ClaimsPrincipal principal, AppDbContext db, string? search, string? goal) =>
        {
            var (userId, role) = GetUser(principal);
            if (userId is null) return Results.Unauthorized();
            if (role is not ("coach" or "client")) return Results.Forbid();

            var plans = await GetScopedPlans(db, userId.Value, role)
                .ToListAsync();

            var dtos = plans.Select(ToDietPlanDto).ToList();
            var filtered = dtos.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                filtered = filtered.Where(p =>
                    p.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                    (!string.IsNullOrWhiteSpace(p.Description) && p.Description.Contains(search, StringComparison.OrdinalIgnoreCase)));
            }

            if (!string.IsNullOrWhiteSpace(goal))
            {
                filtered = filtered.Where(p => p.Goal.Equals(goal, StringComparison.OrdinalIgnoreCase));
            }

            return Results.Ok(new { data = filtered.ToList(), success = true });
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

        group.MapGet("/templates", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db) =>
        {
            var (coachId, role) = GetUser(principal);
            if (coachId is null || role != "coach") return Results.Forbid();

            var meals = await db.Meals
                .Include(m => m.Foods)!.ThenInclude(f => f.Food)
                .Where(m => m.CoachId == coachId || m.IsPublished)
                .OrderBy(m => m.Name)
                .ToListAsync();

            var templates = BuildDietTemplates(meals);

            return Results.Ok(new { data = templates, success = true });
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
            var meals = await db.Meals.Where(m => mealIds.Contains(m.Id) && (m.CoachId == coachId || m.IsPublished)).ToListAsync();
            if (mealIds.Any() && meals.Count != mealIds.Count)
                return Results.BadRequest(new { message = "One or more meals were not found for this coach" });

            var plan = new DietPlan
            {
                Id = Guid.NewGuid(),
                CoachId = coachId.Value,
                CreatedBy = coachId.Value,
                Name = req.Name.Trim(),
                Description = req.Description?.Trim(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsPublished = req.IsPublished ?? false,
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
            if (req.IsPublished.HasValue) plan.IsPublished = req.IsPublished.Value;

            if (req.Days is not null)
            {
                var mealIds = req.Days.SelectMany(d => d.Meals ?? new List<DietMealRequest>()).Select(m => m.MealId).ToList();
                var meals = await db.Meals.Where(m => mealIds.Contains(m.Id) && (m.CoachId == coachId || m.IsPublished)).ToListAsync();
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

        group.MapPost("/{id:guid}/duplicate", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db, Guid id) =>
        {
            var (coachId, role) = GetUser(principal);
            if (coachId is null || role != "coach") return Results.Forbid();

            var plan = await db.DietPlans
                .Include(p => p.Days)!.ThenInclude(d => d.Meals)
                .FirstOrDefaultAsync(p => p.Id == id && (p.CoachId == coachId || p.IsPublished));

            if (plan is null) return Results.NotFound();

            var duplicate = DuplicateDietPlan(plan, coachId.Value);

            db.DietPlans.Add(duplicate);
            await db.SaveChangesAsync();

            var hydrated = await GetScopedPlans(db, coachId.Value, role)
                .FirstAsync(p => p.Id == duplicate.Id);

            return Results.Ok(new { data = ToDietPlanDto(hydrated), success = true });
        });

        group.MapPost("/assign", [Authorize(Roles = "coach")] async (ClaimsPrincipal principal, AppDbContext db, AssignDietPlanRequest req) =>
        {
            var (coachId, role) = GetUser(principal);
            if (coachId is null || role != "coach") return Results.Forbid();

            var plan = await db.DietPlans.FirstOrDefaultAsync(p => p.Id == req.DietPlanId && (p.CoachId == coachId || p.IsPublished));
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
                    DurationDays = req.DurationDays,
                    EndDate = req.DurationDays.HasValue ? req.StartDate.AddDays(req.DurationDays.Value) : null,
                    IsActive = true
                };

                db.ClientDietPlans.Add(existing);
            }
            else
            {
                existing.StartDate = req.StartDate;
                existing.DurationDays = req.DurationDays;
                existing.EndDate = req.DurationDays.HasValue ? req.StartDate.AddDays(req.DurationDays.Value) : null;
                existing.IsActive = true;
            }

            await db.SaveChangesAsync();

            return Results.Ok(new { data = ToClientDietPlanDto(existing), success = true });
        });
    }

    private static DietPlan DuplicateDietPlan(DietPlan plan, Guid coachId)
    {
        var now = DateTime.UtcNow;

        return new DietPlan
        {
            Id = Guid.NewGuid(),
            CoachId = coachId,
            CreatedBy = coachId,
            Name = $"{plan.Name} (Copy)",
            Description = plan.Description,
            CreatedAt = now,
            UpdatedAt = now,
            IsPublished = false,
            Days = plan.Days
                .OrderBy(d => d.DayNumber)
                .Select(d => new DietDay
                {
                    Id = Guid.NewGuid(),
                    DayNumber = d.DayNumber,
                    TargetCalories = d.TargetCalories,
                    TargetProtein = d.TargetProtein,
                    TargetCarbs = d.TargetCarbs,
                    TargetFat = d.TargetFat,
                    Meals = d.Meals
                        .OrderBy(m => m.Order)
                        .Select(m => new DietMeal
                        {
                            Id = Guid.NewGuid(),
                            MealId = m.MealId,
                            MealTime = m.MealTime,
                            Order = m.Order
                        })
                        .ToList()
                })
                .ToList()
        };
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

    private static List<DietPlanTemplateDto> BuildDietTemplates(List<Meal> meals)
    {
        var threeMealSchedule = BuildMealSchedule(meals, new[] { "Breakfast", "Lunch", "Dinner" });
        var fourMealSchedule = BuildMealSchedule(meals, new[] { "Breakfast", "Lunch", "Snack", "Dinner" });

        return
        [
            new DietPlanTemplateDto(
                "Lean loss rotation",
                "Lower carb weekdays with steady protein.",
                new CreateDietPlanRequest(
                    "Lean loss rotation",
                    "Lower carb weekdays with steady protein.",
                    [
                        new DietDayRequest(1, 1800, 160, 150, 60, threeMealSchedule),
                        new DietDayRequest(2, 1900, 160, 180, 65, threeMealSchedule)
                    ],
                    true
                )
            ),
            new DietPlanTemplateDto(
                "Muscle gain push",
                "Higher calories and carbs for training days.",
                new CreateDietPlanRequest(
                    "Muscle gain push",
                    "Higher calories and carbs for training days.",
                    [
                        new DietDayRequest(1, 2800, 190, 320, 85, fourMealSchedule),
                        new DietDayRequest(2, 2600, 185, 260, 80, fourMealSchedule)
                    ],
                    true
                )
            ),
            new DietPlanTemplateDto(
                "Balanced maintenance",
                "Simple daily template for habit building.",
                new CreateDietPlanRequest(
                    "Balanced maintenance",
                    "Simple daily template for habit building.",
                    [
                        new DietDayRequest(1, 2200, 160, 240, 70, threeMealSchedule)
                    ],
                    true
                )
            )
        ];
    }

    private static List<DietMealRequest> BuildMealSchedule(List<Meal> meals, IReadOnlyList<string> labels)
    {
        if (meals.Count == 0) return new List<DietMealRequest>();

        var schedule = new List<DietMealRequest>();
        for (var i = 0; i < labels.Count; i++)
        {
            var meal = meals[i % meals.Count];
            schedule.Add(new DietMealRequest(meal.Id, labels[i], i + 1));
        }

        return schedule;
    }

    private static IQueryable<Food> GetScopedFoods(AppDbContext db, Guid userId, string role)
    {
        var systemOwner = Guid.Empty;
        var query = db.Foods.Where(f => f.CoachId == systemOwner).AsQueryable();

        if (role == "coach")
        {
            query = query.Where(f => f.CoachId == userId || f.IsPublished);
        }
        else if (role == "client")
        {
            var activePlanIds = db.ClientDietPlans
                .Where(c => c.ClientId == userId && c.IsActive)
                .Select(c => c.DietPlanId);

            query = query.Where(f =>
                f.IsPublished ||
                f.MealFoods.Any(mf => mf.Meal!.DietMeals.Any(dm => activePlanIds.Contains(dm.DietDay!.DietPlanId))));
        }

        return query.Where(f => f.IsPublished || f.CoachId != Guid.Empty);
    }

    private static IQueryable<Meal> GetScopedMeals(AppDbContext db, Guid userId, string role)
    {
        var systemOwner = Guid.Empty;

        var query = db.Meals
            .Include(m => m.Foods)!.ThenInclude(f => f.Food)
            .Include(m => m.DietMeals)
            .AsQueryable();

        if (role == "coach")
        {
            query = query.Where(m => m.CoachId == userId || m.IsPublished);
        }
        else if (role == "client")
        {
            var planIds = db.ClientDietPlans
                .Where(c => c.ClientId == userId && c.IsActive)
                .Select(c => c.DietPlanId);

            query = query.Where(m => m.IsPublished || m.DietMeals.Any(dm => planIds.Contains(dm.DietDay!.DietPlanId)));
        }

        return query.Where(m => m.IsPublished || m.CoachId != Guid.Empty);
    }

    private static IQueryable<DietPlan> GetScopedPlans(AppDbContext db, Guid userId, string role)
    {
        var systemOwner = Guid.Empty;

        var query = db.DietPlans
            .Include(p => p.Days)!.ThenInclude(d => d.Meals)!.ThenInclude(m => m.Meal)!.ThenInclude(m => m!.Foods)!.ThenInclude(f => f.Food)
            .Where(p => p.CoachId == systemOwner);

        if (role == "coach")
        {
            query = query.Where(p => p.CoachId == userId || p.IsPublished);
        }
        else if (role == "client")
        {
            var planIds = db.ClientDietPlans
                .Where(c => c.ClientId == userId && c.IsActive)
                .Select(c => c.DietPlanId);

            query = query.Concat(
                db.DietPlans
                    .Include(p => p.Days)!.ThenInclude(d => d.Meals)!.ThenInclude(m => m.Meal)!.ThenInclude(m => m!.Foods)!.ThenInclude(f => f.Food)
                    .Where(p => planIds.Contains(p.Id)));
        }

        return query.Where(p => p.IsPublished || p.CoachId != Guid.Empty);
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

    private static FoodDto ToFoodDto(Food food) => new(food.Id, food.CoachId, food.CreatedBy, food.Name, food.Calories, food.Protein, food.Carbs, food.Fat, food.ServingSize, food.IsPublished, food.CreatedAt);

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
            meal.CreatedBy,
            meal.Name,
            meal.Description,
            foods,
            (int)Math.Round(totals.calories),
            (int)Math.Round(totals.protein),
            (int)Math.Round(totals.carbs),
            (int)Math.Round(totals.fat),
            meal.IsPublished,
            meal.CreatedAt
        );
    }

    private static DietPlanDto ToDietPlanDto(DietPlan plan) => new(
        plan.Id,
        plan.CoachId,
        plan.CreatedBy,
        plan.Name,
        plan.Description,
        InferDietGoal(plan),
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
        plan.IsPublished,
        plan.CreatedAt,
        plan.UpdatedAt
    );

    private static string InferDietGoal(DietPlan plan)
    {
        if (plan.Days.Count == 0) return "general";

        var averageCalories = plan.Days.Average(d => d.TargetCalories);
        if (averageCalories <= 1900) return "fat-loss";
        if (averageCalories >= 2500) return "muscle-gain";
        return "maintenance";
    }

    private static ClientDietPlanDto ToClientDietPlanDto(ClientDietPlan assignment) => new(
        assignment.Id,
        assignment.ClientId,
        assignment.DietPlanId,
        assignment.DietPlan is null ? null : ToDietPlanDto(assignment.DietPlan),
        assignment.StartDate,
        assignment.EndDate,
        assignment.DurationDays,
        assignment.IsActive
    );
}

public record CreateFoodRequest(string Name, int Calories, int Protein, int Carbs, int Fat, string ServingSize, bool? IsPublished);
public record UpdateFoodRequest(string? Name, int? Calories, int? Protein, int? Carbs, int? Fat, string? ServingSize, bool? IsPublished);

public record MealFoodRequest(Guid FoodId, decimal Quantity);
public record CreateMealRequest(string Name, string? Description, List<MealFoodRequest> Foods, bool? IsPublished);
public record UpdateMealRequest(string? Name, string? Description, List<MealFoodRequest>? Foods, bool? IsPublished);

public record DietMealRequest(Guid MealId, string MealTime, int Order);
public record DietDayRequest(int DayNumber, int TargetCalories, int TargetProtein, int TargetCarbs, int TargetFat, List<DietMealRequest> Meals);
public record CreateDietPlanRequest(string Name, string? Description, List<DietDayRequest> Days, bool? IsPublished);
public record UpdateDietPlanRequest(string? Name, string? Description, List<DietDayRequest>? Days, bool? IsPublished);
public record AssignDietPlanRequest(Guid ClientId, Guid DietPlanId, DateTime StartDate, int? DurationDays);
public record DietPlanTemplateDto(string Name, string Description, CreateDietPlanRequest Payload);

public record FoodDto(Guid Id, Guid CoachId, Guid CreatedBy, string Name, int Calories, int Protein, int Carbs, int Fat, string ServingSize, bool IsPublished, DateTime CreatedAt);
public record MealFoodDto(Guid Id, Guid FoodId, FoodDto? Food, decimal Quantity);
public record MealDto(Guid Id, Guid CoachId, Guid CreatedBy, string Name, string? Description, List<MealFoodDto> Foods, int TotalCalories, int TotalProtein, int TotalCarbs, int TotalFat, bool IsPublished, DateTime CreatedAt);
public record DietMealDto(Guid Id, Guid MealId, MealDto? Meal, string MealTime, int Order);
public record DietDayDto(Guid Id, int DayNumber, List<DietMealDto> Meals, int TargetCalories, int TargetProtein, int TargetCarbs, int TargetFat);
public record DietPlanDto(Guid Id, Guid CoachId, Guid CreatedBy, string Name, string? Description, string Goal, List<DietDayDto> Days, bool IsPublished, DateTime CreatedAt, DateTime UpdatedAt);
public record ClientDietPlanDto(Guid Id, Guid ClientId, Guid DietPlanId, DietPlanDto? DietPlan, DateTime StartDate, DateTime? EndDate, int? DurationDays, bool IsActive);
