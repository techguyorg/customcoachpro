namespace FitCoachPro.Api.Models;

public static class CheckInType
{
    public const string Weight = "weight";
    public const string Workout = "workout";
    public const string Diet = "diet";
    public const string Photos = "photos";

    public static readonly string[] All =
    {
        Weight,
        Workout,
        Diet,
        Photos
    };
}

public static class CheckInStatus
{
    public const string Pending = "pending";
    public const string Reviewed = "reviewed";
}

public class CheckIn
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ClientId { get; set; }
    public Guid CoachId { get; set; }

    public string Type { get; set; } = CheckInType.Weight;
    public string Status { get; set; } = CheckInStatus.Pending;

    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }

    // Weight/measurements
    public decimal? Weight { get; set; }
    public decimal? BodyFat { get; set; }
    public decimal? Waist { get; set; }
    public decimal? Chest { get; set; }
    public decimal? Arms { get; set; }
    public decimal? Thighs { get; set; }

    // Workout
    public bool? WorkoutCompleted { get; set; }
    public string? WorkoutNotes { get; set; }

    // Diet
    public int? DietCompliance { get; set; }
    public string? DietDeviations { get; set; }

    // Photos
    public string? FrontPhotoUrl { get; set; }
    public string? SidePhotoUrl { get; set; }
    public string? BackPhotoUrl { get; set; }
}
