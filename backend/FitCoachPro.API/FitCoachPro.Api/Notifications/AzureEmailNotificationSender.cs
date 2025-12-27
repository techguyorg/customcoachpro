using Azure;
using Azure.Communication.Email;
using Microsoft.Extensions.Options;

namespace FitCoachPro.Api.Notifications;

public class AzureEmailNotificationSender : IEmailNotificationSender
{
    private readonly AzureEmailOptions _options;
    private readonly EmailClient? _client;
    private readonly ILogger<AzureEmailNotificationSender> _logger;

    public AzureEmailNotificationSender(IOptions<AzureEmailOptions> options, ILogger<AzureEmailNotificationSender> logger)
    {
        _options = options.Value;
        _logger = logger;

        if (!string.IsNullOrWhiteSpace(_options.ConnectionString))
        {
            try
            {
                _client = new EmailClient(_options.ConnectionString);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Unable to initialize Azure Communication Services Email client");
            }
        }
        else
        {
            _logger.LogInformation("Azure Communication Services Email not configured; email delivery is disabled");
        }
    }

    public async Task SendAsync(NotificationEvent notificationEvent, CancellationToken cancellationToken = default)
    {
        if (_client is null || string.IsNullOrWhiteSpace(_options.SenderAddress) || string.IsNullOrWhiteSpace(notificationEvent.Email))
        {
            return;
        }

        var content = new EmailContent(notificationEvent.Title)
        {
            PlainText = BuildPlainText(notificationEvent)
        };

        var message = new EmailMessage(_options.SenderAddress, notificationEvent.Email, content);

        await _client.SendAsync(WaitUntil.Completed, message, cancellationToken);
    }

    private static string BuildPlainText(NotificationEvent notificationEvent)
    {
        if (string.IsNullOrWhiteSpace(notificationEvent.ActionUrl))
        {
            return notificationEvent.Message;
        }

        return $"{notificationEvent.Message}\n\nView: {notificationEvent.ActionUrl}";
    }
}
