using System.ComponentModel.DataAnnotations;

namespace FitCoachPro.Api.Models;

public class Exercise
{
    public Guid Id { get; set; }
    public Guid CoachId { get; set; }

    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(120)]
    public string PrimaryMuscleGroup { get; set; } = string.Empty;

    /// <summary>
    /// Comma-separated list of muscle groups for simple filtering.
    /// </summary>
    [MaxLength(400)]
    public string MuscleGroups { get; set; } = string.Empty;

    /// <summary>
    /// Comma-separated list of tags (equipment, intent, etc).
    /// </summary>
    [MaxLength(400)]
    public string Tags { get; set; } = string.Empty;

    [MaxLength(160)]
    public string? Equipment { get; set; }

    [MaxLength(320)]
    public string? VideoUrl { get; set; }

    public Guid CreatedBy { get; set; }
    public bool IsPublished { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<WorkoutExercise> WorkoutExercises { get; set; } = new List<WorkoutExercise>();
}
