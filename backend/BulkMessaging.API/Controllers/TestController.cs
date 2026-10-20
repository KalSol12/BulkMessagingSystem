using BulkMessaging.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BulkMessaging.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    private readonly CustomSmsSender _smsSender;
    private readonly SmtpMessageSender _emailSender;
    private readonly ILogger<TestController> _logger;

    public TestController(
        CustomSmsSender smsSender,
        SmtpMessageSender emailSender,
        ILogger<TestController> logger)
    {
        _smsSender = smsSender;
        _emailSender = emailSender;
        _logger = logger;
    }

    [HttpPost("sms")]
    [AllowAnonymous]
    public async Task<IActionResult> TestSms([FromBody] TestSmsRequest request)
    {
        try
        {
            _logger.LogInformation("Testing SMS to: {PhoneNumber}", request.PhoneNumber);

            var messageId = await _smsSender.SendAsync(
                request.PhoneNumber,
                null,
                request.Message);

            return Ok(new
            {
                success = true,
                messageId,
                message = "SMS sent successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SMS test failed");
            return BadRequest(new
            {
                success = false,
                error = ex.Message
            });
        }
    }

    [HttpPost("email")]
    [AllowAnonymous]
    public async Task<IActionResult> TestEmail([FromBody] TestEmailRequest request)
    {
        try
        {
            _logger.LogInformation("Testing Email to: {EmailAddress}", request.Email);

            var messageId = await _emailSender.SendAsync(
                request.Email,
                request.Subject,
                request.Message);

            return Ok(new
            {
                success = true,
                messageId,
                message = "Email sent successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Email test failed");
            return BadRequest(new
            {
                success = false,
                error = ex.Message
            });
        }
    }
}

public class TestSmsRequest
{
    public string PhoneNumber { get; set; } = string.Empty;
    public string Message { get; set; } = "Test message from Bulk Messaging System";
}

public class TestEmailRequest
{
    public string Email { get; set; } = string.Empty;
    public string Subject { get; set; } = "Test Email";
    public string Message { get; set; } = "Test message from Bulk Messaging System";
}
