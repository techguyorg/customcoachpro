using System.Threading.Channels;

namespace FitCoachPro.Api.Notifications;

public class NotificationQueue(Channel<NotificationEvent> channel, ILogger<NotificationQueue> logger) : INotificationQueue
{
    private readonly Channel<NotificationEvent> _channel = channel;
    private readonly ILogger<NotificationQueue> _logger = logger;

    public ValueTask EnqueueAsync(NotificationEvent notificationEvent, CancellationToken cancellationToken = default)
    {
        if (!_channel.Writer.TryWrite(notificationEvent))
        {
            _logger.LogWarning("Notification channel is full; dropping notification for user {UserId}", notificationEvent.UserId);
        }

        return ValueTask.CompletedTask;
    }
}
