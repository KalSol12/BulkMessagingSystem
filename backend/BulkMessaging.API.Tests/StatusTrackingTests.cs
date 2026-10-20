using BulkMessaging.API.Models;
using BulkMessaging.API.Services;

namespace BulkMessaging.API.Tests;

public class StatusTrackingTests
{
    [Fact]
    public void Normalize_FormatsKenyanLocalNumberForAfricaTalking()
    {
        var normalized = PhoneNormalizer.Normalize("0712345678");

        Assert.Equal("+254712345678", normalized);
    }

    [Fact]
    public void MessageStatus_ContainsDeliveredState()
    {
        var delivered = MessageStatus.Delivered;

        Assert.Equal(MessageStatus.Delivered, delivered);
    }
}
