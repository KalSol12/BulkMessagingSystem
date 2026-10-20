namespace BulkMessaging.API.Services;

public class CustomSmsSettings
{
    public const string SectionName = "CustomSms";
    public string BaseUrl { get; set; } = "http://172.16.109.10:8000";
    public string JwtToken { get; set; } = string.Empty;
    public int DefaultPhoneGroupId { get; set; } = 1;
}
