namespace FitCoachPro.Api.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";

    // Role string kept for simplicity (Admin/Coach/Client)
    public string Role { get; set; } = UserRole.Client;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public UserProfile? Profile { get; set; }
}
