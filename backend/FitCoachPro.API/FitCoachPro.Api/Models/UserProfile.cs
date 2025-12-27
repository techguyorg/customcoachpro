// Models/UserProfile.cs

using System.ComponentModel.DataAnnotations;

namespace FitCoachPro.Api.Models;

public class UserProfile
{
    [Key]
    public Guid UserId { get; set; }

    public User? User { get; set; }

    public string DisplayName { get; set; } = "";
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }

    // Preferred measurement system: "imperial" or "metric"
    public string PreferredUnitSystem { get; set; } = "imperial";

    // Client basics
    public DateTime? StartDate { get; set; }
    public decimal? HeightCm { get; set; }
    public decimal? NeckCm { get; set; }
    public decimal? ArmsCm { get; set; }
    public decimal? QuadsCm { get; set; }
    public decimal? HipsCm { get; set; }

    // We keep both start and current weight so we can compute change easily
    public decimal? StartWeight { get; set; }
    public decimal? CurrentWeight { get; set; }
    public decimal? TargetWeight { get; set; }
}
