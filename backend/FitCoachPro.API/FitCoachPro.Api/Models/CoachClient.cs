namespace FitCoachPro.Api.Models;

public class CoachClient
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CoachId { get; set; }
    public User Coach { get; set; } = null!;

    public Guid ClientId { get; set; }
    public User Client { get; set; } = null!;

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
}
