using System.Text.Json.Serialization;
using BulkMessaging.API.Data;
using BulkMessaging.API.Models;
using BulkMessaging.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BulkMessaging.API.Controllers;

[ApiController]
[Route("api")]
public class WebhooksController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<WebhooksController> _logger;

    public WebhooksController(
        ApplicationDbContext context,
        ILogger<WebhooksController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [AllowAnonymous]
    [HttpPost("sms/status")]
    [HttpPost("webhooks/africastalking")]
    public async Task<IActionResult> AfricaTalkingDeliveryStatus(
        [FromBody] AfricaTalkingStatusCallback? payload,
        CancellationToken cancellationToken)
    {
        if (payload is null)
        {
            return BadRequest(new
            {
                success = false,
                error = "No callback payload was provided."
            });
        }

        var providerMessageId = payload.MessageId ?? payload.Id;
        var phoneNumber = payload.PhoneNumber;

        if (string.IsNullOrWhiteSpace(providerMessageId) &&
            string.IsNullOrWhiteSpace(phoneNumber))
        {
            return BadRequest(new
            {
                success = false,
                error = "A messageId or phoneNumber is required to match the outbound SMS."
            });
        }

        Message? message = null;

        if (!string.IsNullOrWhiteSpace(providerMessageId))
        {
            message = await _context.Messages
                .FirstOrDefaultAsync(m => m.ProviderMessageId == providerMessageId,
                    cancellationToken);
        }

        if (message is null && !string.IsNullOrWhiteSpace(phoneNumber))
        {
            var normalizedPhone = PhoneNormalizer.Normalize(phoneNumber);
            message = await _context.Messages
                .Where(m => m.Phone == phoneNumber || m.Phone == normalizedPhone)
                .OrderByDescending(m => m.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);
        }

        if (message is null)
        {
            _logger.LogWarning(
                "Africa's Talking callback did not match a known message. ProviderMessageId: {ProviderMessageId}; PhoneNumber: {PhoneNumber}; Status: {Status}",
                providerMessageId,
                phoneNumber,
                payload.Status);

            return Ok(new
            {
                success = true,
                matched = false,
                message = "Callback received but no message was matched."
            });
        }

        var mappedStatus = AfricaTalkingStatusMapper.Map(payload.Status);
        message.Status = mappedStatus;

        if (!string.IsNullOrWhiteSpace(payload.FailureReason) &&
            string.IsNullOrWhiteSpace(message.Error))
        {
            message.Error = payload.FailureReason;
        }

        if (mappedStatus == MessageStatus.Failed ||
            mappedStatus == MessageStatus.Rejected)
        {
            message.Error ??= payload.Status ?? "Message failed delivery on the provider.";
        }

        if (mappedStatus == MessageStatus.Delivered && !message.SentAt.HasValue)
        {
            message.SentAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Updated outbound message {MessageId} to status {Status} from Africa's Talking callback.",
            message.Id,
            mappedStatus);

        return Ok(new
        {
            success = true,
            matched = true,
            messageId = message.Id,
            status = mappedStatus.ToString()
        });
    }
}

public class AfricaTalkingStatusCallback
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("messageId")]
    public string? MessageId { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("phoneNumber")]
    public string? PhoneNumber { get; set; }

    [JsonPropertyName("failureReason")]
    public string? FailureReason { get; set; }

    [JsonPropertyName("networkCode")]
    public string? NetworkCode { get; set; }

    [JsonPropertyName("retryCount")]
    public int? RetryCount { get; set; }

    [JsonPropertyName("cost")]
    public string? Cost { get; set; }
}
