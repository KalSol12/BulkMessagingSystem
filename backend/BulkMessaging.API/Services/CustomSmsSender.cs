using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace BulkMessaging.API.Services;

public class CustomSmsSender : IMessageSender
{
    private readonly CustomSmsSettings _settings;
    private readonly HttpClient _httpClient;
    private readonly ILogger<CustomSmsSender> _logger;

    public CustomSmsSender(
        IOptions<CustomSmsSettings> settings,
        HttpClient httpClient,
        ILogger<CustomSmsSender> logger)
    {
        _settings = settings.Value;
        _httpClient = httpClient;
        _logger = logger;

        _logger.LogInformation("CustomSmsSender initialized. BaseUrl: {BaseUrl}", _settings.BaseUrl);
    }

    private async Task<long> AddPhoneToList(string phone, CancellationToken ct)
    {
        var phoneListUrl = $"{_settings.BaseUrl}/api/phone-lists/custom";
        var phoneListPayload = new
        {
            phone = phone,
            groupType = "CONTENT",
            status = true
        };

        var phoneListJson = JsonSerializer.Serialize(phoneListPayload);
        _logger.LogInformation("Adding phone {Phone} to phone list", phone);

        var phoneListContent = new StringContent(phoneListJson, Encoding.UTF8, "application/json");
        var phoneListResponse = await _httpClient.PostAsync(phoneListUrl, phoneListContent, ct);
        var phoneListResult = await phoneListResponse.Content.ReadAsStringAsync(ct);

        if (!phoneListResponse.IsSuccessStatusCode)
        {
            _logger.LogError(
                "[SMS FAILED] Failed to add phone to list. Status: {Status} | Response: {Response}",
                phoneListResponse.StatusCode,
                phoneListResult);
            throw new InvalidOperationException(
                $"Failed to add phone to list: {phoneListResponse.StatusCode} - {phoneListResult}");
        }

        // Parse the phone list ID from response
        var phoneListData = JsonSerializer.Deserialize<JsonElement>(phoneListResult);
        var phoneListId = phoneListData.GetProperty("id").GetInt64();

        _logger.LogInformation("Phone added to list with ID: {PhoneListId}", phoneListId);
        return phoneListId;
    }

    public async Task<string> SendAsync(
        string to,
        string? subject,
        string body,
        CancellationToken ct = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(_settings.JwtToken))
            {
                throw new InvalidOperationException(
                    "CustomSms: JwtToken must be configured before sending SMS.");
            }

            // Normalize phone number
            var normalizedPhone = NormalizePhoneNumber(to);
            if (string.IsNullOrWhiteSpace(normalizedPhone))
            {
                throw new InvalidOperationException("Invalid phone number");
            }

            // Step 1: Check if phone number already exists in phone list
            var phoneListSearchUrl = $"{_settings.BaseUrl}/api/phone-lists?phone.equals={normalizedPhone}";
            _httpClient.DefaultRequestHeaders.Authorization = 
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _settings.JwtToken);

            var searchResponse = await _httpClient.GetAsync(phoneListSearchUrl, ct);
            var searchResult = await searchResponse.Content.ReadAsStringAsync(ct);

            long phoneListId;

            if (searchResponse.IsSuccessStatusCode && !string.IsNullOrWhiteSpace(searchResult))
            {
                var phoneListData = JsonSerializer.Deserialize<JsonElement>(searchResult);
                if (phoneListData.ValueKind == JsonValueKind.Array && phoneListData.GetArrayLength() > 0)
                {
                    // Phone number already exists, use existing ID
                    phoneListId = phoneListData[0].GetProperty("id").GetInt64();
                    _logger.LogInformation("Phone {Phone} already exists in list with ID: {PhoneListId}", normalizedPhone, phoneListId);
                }
                else
                {
                    // Phone number doesn't exist, add it
                    phoneListId = await AddPhoneToList(normalizedPhone, ct);
                }
            }
            else
            {
                // If search fails, try to add it
                phoneListId = await AddPhoneToList(normalizedPhone, ct);
            }

            // Step 2: Send SMS using the phone list ID
            var endpoint = $"{_settings.BaseUrl}/api/bulk-sms";
            var smsPayload = new
            {
                text = body,
                language = "ENGLISH", // Must be "ENGLISH" or "AMHARIC"
                phoneListId = phoneListId,
                groupType = "CONTENT" // Must be "CONTENT" or "ADVERTISEMENT"
            };

            var jsonPayload = JsonSerializer.Serialize(smsPayload);
            _logger.LogInformation("Sending SMS via phone list {PhoneListId}", phoneListId);

            // Send the POST request
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(endpoint, content, ct);

            var result = await response.Content.ReadAsStringAsync(ct);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation(
                    "[SMS SENT] To: {To} | Response: {Response}",
                    normalizedPhone,
                    result);
                return $"custom-{Guid.NewGuid():N}";
            }

            _logger.LogError(
                "[SMS FAILED] To: {To} | Status: {Status} | Response: {Response}",
                normalizedPhone,
                response.StatusCode,
                result);
            throw new InvalidOperationException(
                $"Custom SMS API error: {response.StatusCode} - {result}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[SMS FAILED] To: {To}", to);
            throw new InvalidOperationException(
                $"Custom SMS send failed: {ex.Message}", ex);
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
