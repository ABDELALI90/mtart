namespace MTArt.Inquiry.Infrastructure.Email;

public sealed class SmtpNotConfiguredException(IReadOnlyList<string> missing) : InvalidOperationException(
    $"Email SMTP configuration is missing: {string.Join(", ", missing)}")
{
    public IReadOnlyList<string> Missing { get; } = missing;
}
