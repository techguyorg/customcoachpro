using System.ComponentModel.DataAnnotations;

namespace FitCoachPro.Api.Models;

public class WorkoutPlan
{
    public Guid Id { get; set; }
    public Guid CoachId { get; set; }
    public Guid CreatedBy { get; set; }
    public bool IsPublished { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DurationWeeks { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<WorkoutDay> Days { get; set; } = new List<WorkoutDay>();
    public ICollection<ClientWorkoutPlan> Assignments { get; set; } = new List<ClientWorkoutPlan>();
}

public class WorkoutDay
{
    public Guid Id { get; set; }
    public Guid WorkoutPlanId { get; set; }
    [MaxLength(120)]
    public string Name { get; set; } = string.Empty;
    public int DayNumber { get; set; }

    public WorkoutPlan? WorkoutPlan { get; set; }
    public ICollection<WorkoutExercise> Exercises { get; set; } = new List<WorkoutExercise>();
}

public class WorkoutExercise
{
    public Guid Id { get; set; }
    public Guid WorkoutDayId { get; set; }
    public Guid? ExerciseId { get; set; }
    [MaxLength(160)]
    public string? ExerciseName { get; set; }
    public int Sets { get; set; }
    public string Reps { get; set; } = string.Empty;
    public int RestSeconds { get; set; }
    public string? Tempo { get; set; }
    public string? Notes { get; set; }
    public int Order { get; set; }

    public WorkoutDay? WorkoutDay { get; set; }
    public Exercise? Exercise { get; set; }
}

public class ClientWorkoutPlan
{
    public Guid Id { get; set; }
    public Guid ClientId { get; set; }
    public Guid WorkoutPlanId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? DurationDays { get; set; }
    public bool IsActive { get; set; } = true;

    public WorkoutPlan? WorkoutPlan { get; set; }
}
