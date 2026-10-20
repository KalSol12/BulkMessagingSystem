using Microsoft.Extensions.Options;
using System.Net.Http.Json;
using System.Text.Json;

namespace BulkMessaging.API.Services;

public class GeezSmsSender : IMessageSender
{
    private readonly GeezSmsSettings _settings;
    private readonly HttpClient _httpClient;
    private readonly ILogger<GeezSmsSender> _logger;

    public GeezSmsSender(
        IOptions<GeezSmsSettings> settings,
        HttpClient httpClient,
        ILogger<GeezSmsSender> logger)
    {
        _settings = settings.Value;
        _httpClient = httpClient;
        _logger = logger;

        _logger.LogInformation("GeezSmsSender initialized. ApiKey configured: {HasKey}",
            !string.IsNullOrWhiteSpace(_settings.ApiKey));
    }

    public async Task<string> SendAsync(
        string to,
        string? subject,
        string body,
        CancellationToken ct = default)
    {
        try
        {
            _logger.LogInformation("Sending SMS. ApiKey is null/empty: {IsNull}",
                string.IsNullOrWhiteSpace(_settings.ApiKey));

            if (string.IsNullOrWhiteSpace(_settings.ApiKey))
            {
                throw new InvalidOperationException(
                    "GeezSms: ApiKey must be configured before sending SMS.");
            }

            // Normalize phone number - ensure it starts with 2519 for Ethiopia
            var normalizedPhone = NormalizePhoneNumber(to);
            if (!normalizedPhone.StartsWith("2519"))
            {
                throw new InvalidOperationException(
                    "Phone number must be in Ethiopian format starting with 2519...");
            }

            // Try OTP endpoint first (may not require shortcode)
            var otpUrl = "https://api.geezsms.com/api/v1/sms/otp";
            var otpFormData = new Dictionary<string, string>
            {
                { "token", _settings.ApiKey },
                { "phone", normalizedPhone }
            };

            var otpContent = new FormUrlEncodedContent(otpFormData);
            var otpResponse = await _httpClient.PostAsync(otpUrl, otpContent, ct);
            var otpResponseContent = await otpResponse.Content.ReadAsStringAsync(ct);

            // If OTP endpoint works, use it for regular SMS too
            if (otpResponse.IsSuccessStatusCode)
            {
                _logger.LogInformation(
                    "[SMS SENT] To: {To} | Response: {Response}",
                    normalizedPhone,
                    otpResponseContent);
                return $"geez-{Guid.NewGuid():N}";
            }

            // Fall back to regular SMS endpoint
            var url = "https://api.geezsms.com/api/v1/sms/send";
            var formData = new Dictionary<string, string>
            {
                { "token", _settings.ApiKey },
                { "phone", normalizedPhone },
                { "msg", body }
            };

            var content = new FormUrlEncodedContent(formData);
            var response = await _httpClient.PostAsync(url, content, ct);
            var responseContent = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError(
                    "[SMS FAILED] To: {To} | Status: {Status} | Response: {Response}",
                    normalizedPhone,
                    response.StatusCode,
                    responseContent);
                throw new InvalidOperationException(
                    $"Geez SMS API error: {response.StatusCode} - {responseContent}");
            }

            _logger.LogInformation(
                "[SMS SENT] To: {To} | Response: {Response}",
                normalizedPhone,
                responseContent);

            // Try to parse response to get message ID
            try
            {
                using var jsonDoc = JsonDocument.Parse(responseContent);
                if (jsonDoc.RootElement.TryGetProperty("messageId", out var messageIdElement))
                {
                    return messageIdElement.GetString() ?? $"geez-{Guid.NewGuid():N}";
                }
            }
            catch
            {
                // If JSON parsing fails, return a generated ID
            }

            return $"geez-{Guid.NewGuid():N}";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[SMS FAILED] To: {To}", to);
            throw new InvalidOperationException(
                $"Geez SMS send failed: {ex.Message}", ex);
        }
    }

    private string NormalizePhoneNumber(string phone)
    {
        // Remove any non-digit characters
        var digits = new string(phone.Where(char.IsDigit).ToArray());

        // If it starts with 0 (local format), add 251
        if (digits.StartsWith("0"))
        {
            digits = "251" + digits.Substring(1);
        }
        // If it doesn't start with 251, add it
        else if (!digits.StartsWith("251"))
        {
            digits = "251" + digits;
        }

        return digits;
    }
}
