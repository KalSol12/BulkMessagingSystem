namespace BulkMessaging.API.Services;

public static class PhoneNormalizer
{
    /// <summary>
    /// Normalizes outbound phone numbers for African providers.
    /// Converts local numbers such as 0712345678 or 0912345678 to a standard
    /// international format such as +254712345678 or +251912345678.
    /// </summary>
    public static string Normalize(string? input, string defaultCountryCode = "251")
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return string.Empty;
        }

        var trimmed = input.Trim();
        var digitsOnly = new string(trimmed.Where(char.IsDigit).ToArray());

        if (string.IsNullOrEmpty(digitsOnly))
        {
            return string.Empty;
        }

        if (trimmed.StartsWith("00", StringComparison.Ordinal))
        {
            var noCountryPrefix = digitsOnly[2..];
            return string.IsNullOrEmpty(noCountryPrefix)
                ? string.Empty
                : "+" + noCountryPrefix;
        }

        if (trimmed.StartsWith("+", StringComparison.Ordinal))
        {
            return "+" + digitsOnly;
        }

        if (digitsOnly.StartsWith("0", StringComparison.Ordinal))
        {
            var localNumber = digitsOnly[1..];
            if (string.IsNullOrEmpty(localNumber))
            {
                return string.Empty;
            }

            if (localNumber.StartsWith("7", StringComparison.Ordinal))
            {
                return "+254" + localNumber;
            }

            if (localNumber.StartsWith("9", StringComparison.Ordinal))
            {
                return "+251" + localNumber;
            }

            return "+" + defaultCountryCode + localNumber;
        }

        if (digitsOnly.StartsWith("254", StringComparison.Ordinal) ||
            digitsOnly.StartsWith("251", StringComparison.Ordinal))
        {
            return "+" + digitsOnly;
        }

        if (digitsOnly.Length == 9 &&
            (digitsOnly.StartsWith("7", StringComparison.Ordinal) ||
             digitsOnly.StartsWith("9", StringComparison.Ordinal)))
        {
            return digitsOnly.StartsWith("7", StringComparison.Ordinal)
                ? "+254" + digitsOnly
                : "+251" + digitsOnly;
        }

        return "+" + digitsOnly;
    }
}