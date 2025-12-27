using System.ComponentModel.DataAnnotations;

namespace FitCoachPro.Api.Models;

public class Food
{
    public Guid Id { get; set; }
    public Guid CoachId { get; set; }
    public Guid CreatedBy { get; set; }
    public bool IsPublished { get; set; }
    [MaxLength(120)]
    public string Name { get; set; } = string.Empty;
    public int Calories { get; set; }
    public int Protein { get; set; }
    public int Carbs { get; set; }
    public int Fat { get; set; }
    [MaxLength(80)]
    public string ServingSize { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<MealFood> MealFoods { get; set; } = new List<MealFood>();
}

public class Meal
{
    public Guid Id { get; set; }
    public Guid CoachId { get; set; }
    public Guid CreatedBy { get; set; }
    public bool IsPublished { get; set; }
    [MaxLength(160)]
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<MealFood> Foods { get; set; } = new List<MealFood>();
    public ICollection<DietMeal> DietMeals { get; set; } = new List<DietMeal>();
}

public class MealFood
{
    public Guid Id { get; set; }
    public Guid MealId { get; set; }
    public Guid FoodId { get; set; }
    public decimal Quantity { get; set; }

    public Meal? Meal { get; set; }
    public Food? Food { get; set; }
}

public class DietPlan
{
    public Guid Id { get; set; }
    public Guid CoachId { get; set; }
    public Guid CreatedBy { get; set; }
    public bool IsPublished { get; set; }
    [MaxLength(160)]
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<DietDay> Days { get; set; } = new List<DietDay>();
    public ICollection<ClientDietPlan> Assignments { get; set; } = new List<ClientDietPlan>();
}

public class DietDay
{
    public Guid Id { get; set; }
    public Guid DietPlanId { get; set; }
    public int DayNumber { get; set; }
    public int TargetCalories { get; set; }
    public int TargetProtein { get; set; }
    public int TargetCarbs { get; set; }
    public int TargetFat { get; set; }

    public DietPlan? DietPlan { get; set; }
    public ICollection<DietMeal> Meals { get; set; } = new List<DietMeal>();
}

public class DietMeal
{
    public Guid Id { get; set; }
    public Guid DietDayId { get; set; }
    public Guid MealId { get; set; }
    [MaxLength(64)]
    public string MealTime { get; set; } = string.Empty;
    public int Order { get; set; }

    public DietDay? DietDay { get; set; }
    public Meal? Meal { get; set; }
}

public class ClientDietPlan
{
    public Guid Id { get; set; }
    public Guid ClientId { get; set; }
    public Guid DietPlanId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsActive { get; set; } = true;

    public DietPlan? DietPlan { get; set; }
}
