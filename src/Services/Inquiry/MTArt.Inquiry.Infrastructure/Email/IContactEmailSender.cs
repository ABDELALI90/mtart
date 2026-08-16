namespace MTArt.Inquiry.Infrastructure.Email;

public sealed record ContactMessage(
    string Name,
    string Email,
    string Message,
    string Language,
    DateTimeOffset SubmittedAt);

public sealed record QuoteMessage(
    string FullName,
    string? Company,
    string Email,
    string Phone,
    string? WhatsApp,
    string Country,
    string City,
    decimal? QuantityM2,
    string? Message,
    string? ProductName,
    string? Reference,
    string? ProductUrl,
    string? Price,
    string? Category,
    string? Language,
    DateTimeOffset SubmittedAt);

public interface IContactEmailSender
{
    Task SendAsync(ContactMessage message, CancellationToken cancellationToken);

    Task SendQuoteAsync(QuoteMessage message, CancellationToken cancellationToken);
}
