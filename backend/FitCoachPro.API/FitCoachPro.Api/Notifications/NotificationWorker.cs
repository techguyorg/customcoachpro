using System.Threading.Channels;
using FitCoachPro.Api.Data;
using FitCoachPro.Api.Models;
using Microsoft.Extensions.DependencyInjection;

namespace FitCoachPro.Api.Notifications;

public class NotificationWorker : BackgroundService
{
    private readonly ChannelReader<NotificationEvent> _reader;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<NotificationWorker> _logger;

    public NotificationWorker(Channel<NotificationEvent> channel, IServiceScopeFactory scopeFactory, ILogger<NotificationWorker> logger)
    {
        _reader = channel.Reader;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var notificationEvent in _reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var emailSender = scope.ServiceProvider.GetService<IEmailNotificationSender>();

                var notification = new Notification
                {
                    UserId = notificationEvent.UserId,
                    Title = notificationEvent.Title,
                    Message = notificationEvent.Message,
                    Type = notificationEvent.Type,
                    ActionUrl = notificationEvent.ActionUrl,
                    CreatedAt = DateTime.UtcNow
                };

                db.Notifications.Add(notification);
                await db.SaveChangesAsync(stoppingToken);

                if (emailSender is not null && !string.IsNullOrWhiteSpace(notificationEvent.Email))
                {
                    try
                    {
                        await emailSender.SendAsync(notificationEvent, stoppingToken);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to deliver email notification to {Email}", notificationEvent.Email);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process notification for user {UserId}", notificationEvent.UserId);
            }
        }
    }
}
