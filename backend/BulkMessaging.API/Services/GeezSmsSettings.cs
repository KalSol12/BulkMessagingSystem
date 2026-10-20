namespace BulkMessaging.API.Services;

public class GeezSmsSettings
{
    public const string SectionName = "GeezSms";
    public string ApiKey { get; set; } = string.Empty;
    public string DefaultCountryCode { get; set; } = "251";
}
