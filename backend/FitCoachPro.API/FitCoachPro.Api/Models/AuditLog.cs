using System.ComponentModel.DataAnnotations;

namespace FitCoachPro.Api.Models;

public class AuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CoachId { get; set; }
    public Guid ActorId { get; set; }
    public Guid? ClientId { get; set; }
    public Guid? EntityId { get; set; }

    [MaxLength(64)]
    public string EntityType { get; set; } = string.Empty;

    [MaxLength(64)]
    public string Action { get; set; } = string.Empty;

    [MaxLength(512)]
    public string? Details { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
