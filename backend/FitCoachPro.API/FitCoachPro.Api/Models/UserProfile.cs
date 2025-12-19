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

    // Client basics
    public DateTime? StartDate { get; set; }
    public decimal? HeightCm { get; set; }

    // We keep both start and current weight so we can compute change easily
    public decimal? StartWeight { get; set; }
    public decimal? CurrentWeight { get; set; }
    public decimal? TargetWeight { get; set; }
}
