using System.Text.Json;
using FitCoachPro.Api.Models;

namespace FitCoachPro.Api.Data;

public static class CuratedSeedData
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };
    private static readonly Guid SystemOwnerId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    private static readonly string SeedFolder = Path.Combine(AppContext.BaseDirectory, "SeedContent");

    public static void SeedCuratedContent(AppDbContext db)
    {
        SeedExercises(db);
        SeedFoods(db);
        SeedMeals(db);
        SeedWorkoutPlans(db);
        SeedDietPlans(db);
    }

    private static void SeedExercises(AppDbContext db)
    {
        if (db.Exercises.Any()) return;

        var seeds = Load<List<ExerciseSeed>>("exercises.json");
        if (seeds is null) return;

        var now = DateTime.UtcNow;
        var exercises = seeds.Select(s => new Exercise
        {
            Id = Guid.NewGuid(),
            CoachId = SystemOwnerId,
            CreatedBy = SystemOwnerId,
            Name = s.Name.Trim(),
            PrimaryMuscleGroup = s.PrimaryMuscleGroup?.Trim() ?? string.Empty,
            Description = s.Description?.Trim(),
            MuscleGroups = Join(s.MuscleGroups),
            Tags = Join(s.Tags),
            Equipment = s.Equipment?.Trim(),
            VideoUrl = s.VideoUrl?.Trim(),
            IsPublished = true,
            CreatedAt = now,
            UpdatedAt = now
        }).ToList();

        db.Exercises.AddRange(exercises);
        db.SaveChanges();
    }

    private static void SeedFoods(AppDbContext db)
    {
        if (db.Foods.Any()) return;

        var seeds = Load<List<FoodSeed>>("foods.json");
        if (seeds is null) return;

        var now = DateTime.UtcNow;
        var foods = seeds.Select(s => new Food
        {
            Id = Guid.NewGuid(),
            CoachId = SystemOwnerId,
            CreatedBy = SystemOwnerId,
            Name = s.Name.Trim(),
            Calories = Math.Max(s.Calories, 0),
            Protein = Math.Max(s.Protein, 0),
            Carbs = Math.Max(s.Carbs, 0),
            Fat = Math.Max(s.Fat, 0),
            ServingSize = string.IsNullOrWhiteSpace(s.ServingSize) ? "1 serving" : s.ServingSize.Trim(),
            CreatedAt = now,
            IsPublished = true
        }).ToList();

        db.Foods.AddRange(foods);
        db.SaveChanges();
    }

    private static void SeedMeals(AppDbContext db)
    {
        if (db.Meals.Any()) return;

        var seeds = Load<List<MealSeed>>("meals.json");
        if (seeds is null) return;

        var foods = db.Foods.ToDictionary(f => f.Name, StringComparer.OrdinalIgnoreCase);
        var now = DateTime.UtcNow;
        var meals = new List<Meal>();

        foreach (var seed in seeds)
        {
            var mealFoods = new List<MealFood>();
            foreach (var mf in seed.Foods ?? new List<MealFoodSeed>())
            {
                if (!foods.TryGetValue(mf.Food, out var food)) continue;

                mealFoods.Add(new MealFood
                {
                    Id = Guid.NewGuid(),
                    FoodId = food.Id,
                    Quantity = mf.Quantity <= 0 ? 1 : mf.Quantity
                });
            }

            if (!mealFoods.Any()) continue;

            meals.Add(new Meal
            {
                Id = Guid.NewGuid(),
                CoachId = SystemOwnerId,
                CreatedBy = SystemOwnerId,
                Name = seed.Name.Trim(),
                Description = seed.Description?.Trim(),
                Foods = mealFoods,
                CreatedAt = now,
                IsPublished = true
            });
        }

        if (meals.Any())
        {
            db.Meals.AddRange(meals);
            db.SaveChanges();
        }
    }

    private static void SeedWorkoutPlans(AppDbContext db)
    {
        if (db.WorkoutPlans.Any()) return;

        var seeds = Load<List<WorkoutPlanSeed>>("workoutPlans.json");
        if (seeds is null) return;

        var exercises = db.Exercises.ToDictionary(e => e.Name, StringComparer.OrdinalIgnoreCase);
        var now = DateTime.UtcNow;
        var plans = new List<WorkoutPlan>();

        foreach (var seed in seeds)
        {
            var days = new List<WorkoutDay>();
            foreach (var day in seed.Days ?? new List<WorkoutDaySeed>())
            {
                var exercisesForDay = new List<WorkoutExercise>();
                foreach (var ex in day.Exercises ?? new List<WorkoutExerciseSeed>())
                {
                    Guid? exerciseId = null;
                    string? exerciseName = ex.ExerciseName;
                    if (!string.IsNullOrWhiteSpace(ex.Exercise) && exercises.TryGetValue(ex.Exercise, out var match))
                    {
                        exerciseId = match.Id;
                        exerciseName ??= match.Name;
                    }

                    if (exerciseId is null && string.IsNullOrWhiteSpace(exerciseName)) continue;

                    exercisesForDay.Add(new WorkoutExercise
                    {
                        Id = Guid.NewGuid(),
                        ExerciseId = exerciseId,
                        ExerciseName = exerciseName,
                        Sets = ex.Sets,
                        Reps = ex.Reps,
                        RestSeconds = ex.RestSeconds,
                        Tempo = ex.Tempo,
                        Notes = ex.Notes,
                        Order = ex.Order
                    });
                }

                if (!exercisesForDay.Any()) continue;

                days.Add(new WorkoutDay
                {
                    Id = Guid.NewGuid(),
                    Name = day.Name,
                    DayNumber = day.DayNumber,
                    Exercises = exercisesForDay.OrderBy(e => e.Order).ToList()
                });
            }

            if (!days.Any()) continue;

            plans.Add(new WorkoutPlan
            {
                Id = Guid.NewGuid(),
                CoachId = SystemOwnerId,
                CreatedBy = SystemOwnerId,
                Name = seed.Name.Trim(),
                Description = seed.Description?.Trim(),
                DurationWeeks = Math.Max(1, seed.DurationWeeks),
                CreatedAt = now,
                UpdatedAt = now,
                IsPublished = true,
                Days = days.OrderBy(d => d.DayNumber).ToList()
            });
        }

        if (plans.Any())
        {
            db.WorkoutPlans.AddRange(plans);
            db.SaveChanges();
        }
    }

    private static void SeedDietPlans(AppDbContext db)
    {
        if (db.DietPlans.Any()) return;

        var seeds = Load<List<DietPlanSeed>>("dietPlans.json");
        if (seeds is null) return;

        var meals = db.Meals.ToDictionary(m => m.Name, StringComparer.OrdinalIgnoreCase);
        var now = DateTime.UtcNow;
        var plans = new List<DietPlan>();

        foreach (var seed in seeds)
        {
            var days = new List<DietDay>();
            foreach (var day in seed.Days ?? new List<DietDaySeed>())
            {
                var mealsForDay = new List<DietMeal>();
                foreach (var mealSeed in day.Meals ?? new List<DietMealSeed>())
                {
                    if (!meals.TryGetValue(mealSeed.Meal, out var mealEntity)) continue;

                    mealsForDay.Add(new DietMeal
                    {
                        Id = Guid.NewGuid(),
                        MealId = mealEntity.Id,
                        MealTime = string.IsNullOrWhiteSpace(mealSeed.MealTime) ? "Meal" : mealSeed.MealTime.Trim(),
                        Order = mealSeed.Order
                    });
                }

                if (!mealsForDay.Any()) continue;

                days.Add(new DietDay
                {
                    Id = Guid.NewGuid(),
                    DayNumber = day.DayNumber,
                    TargetCalories = day.TargetCalories,
                    TargetProtein = day.TargetProtein,
                    TargetCarbs = day.TargetCarbs,
                    TargetFat = day.TargetFat,
                    Meals = mealsForDay.OrderBy(m => m.Order).ToList()
                });
            }

            if (!days.Any()) continue;

            plans.Add(new DietPlan
            {
                Id = Guid.NewGuid(),
                CoachId = SystemOwnerId,
                CreatedBy = SystemOwnerId,
                Name = seed.Name.Trim(),
                Description = seed.Description?.Trim(),
                CreatedAt = now,
                UpdatedAt = now,
                IsPublished = true,
                Days = days.OrderBy(d => d.DayNumber).ToList()
            });
        }

        if (plans.Any())
        {
            db.DietPlans.AddRange(plans);
            db.SaveChanges();
        }
    }

    private static string Join(IEnumerable<string>? values) =>
        values is null ? string.Empty : string.Join(",", values.Where(v => !string.IsNullOrWhiteSpace(v)).Select(v => v.Trim()));

    private static T? Load<T>(string fileName)
    {
        var path = Path.Combine(SeedFolder, fileName);
        if (!File.Exists(path)) return default;

        var json = File.ReadAllText(path);
        return JsonSerializer.Deserialize<T>(json, JsonOptions);
    }
}

internal record ExerciseSeed(string Name, string PrimaryMuscleGroup, string? Description, List<string>? MuscleGroups, List<string>? Tags, string? Equipment, string? VideoUrl);
internal record FoodSeed(string Name, int Calories, int Protein, int Carbs, int Fat, string ServingSize);
internal record MealFoodSeed(string Food, decimal Quantity);
internal record MealSeed(string Name, string? Description, List<MealFoodSeed> Foods);
internal record WorkoutExerciseSeed(string? Exercise, string? ExerciseName, int Sets, string Reps, int RestSeconds, int Order, string? Tempo, string? Notes);
internal record WorkoutDaySeed(int DayNumber, string Name, List<WorkoutExerciseSeed> Exercises);
internal record WorkoutPlanSeed(string Name, string? Description, int DurationWeeks, List<WorkoutDaySeed> Days);
internal record DietMealSeed(string Meal, string MealTime, int Order);
internal record DietDaySeed(int DayNumber, int TargetCalories, int TargetProtein, int TargetCarbs, int TargetFat, List<DietMealSeed> Meals);
internal record DietPlanSeed(string Name, string? Description, List<DietDaySeed> Days);
