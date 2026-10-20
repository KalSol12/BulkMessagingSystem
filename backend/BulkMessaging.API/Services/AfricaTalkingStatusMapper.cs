using BulkMessaging.API.Models;

namespace BulkMessaging.API.Services;

public static class AfricaTalkingStatusMapper
{
    public static MessageStatus Map(string? providerStatus)
    {
        if (string.IsNullOrWhiteSpace(providerStatus))
        {
            return MessageStatus.Pending;
        }

        var normalizedStatus = providerStatus.Trim();

        return normalizedStatus switch
        {
            "Submitted" => MessageStatus.Pending,
            "Queued" => MessageStatus.Pending,
            "Sending" => MessageStatus.Pending,
            "Sent" => MessageStatus.Sent,
            "Delivered" => MessageStatus.Delivered,
            "Failed" => MessageStatus.Failed,
            "Rejected" => MessageStatus.Rejected,
            _ => normalizedStatus.Contains("delivered", StringComparison.OrdinalIgnoreCase)
                ? MessageStatus.Delivered
                : normalizedStatus.Contains("failed", StringComparison.OrdinalIgnoreCase)
                    ? MessageStatus.Failed
                    : normalizedStatus.Contains("rejected", StringComparison.OrdinalIgnoreCase)
                        ? MessageStatus.Rejected
                        : MessageStatus.Pending
        };
    }
}
