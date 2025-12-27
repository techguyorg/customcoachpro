namespace FitCoachPro.Api.Notifications;

public record NotificationEvent(
    Guid UserId,
    string Title,
    string Message,
    string Type,
    string? ActionUrl = null,
    string? Email = null
);

public interface INotificationQueue
{
    ValueTask EnqueueAsync(NotificationEvent notificationEvent, CancellationToken cancellationToken = default);
}

public interface IEmailNotificationSender
{
    Task SendAsync(NotificationEvent notificationEvent, CancellationToken cancellationToken = default);
}

public class AzureEmailOptions
{
    public string? ConnectionString { get; set; }
    public string? SenderAddress { get; set; }
}
