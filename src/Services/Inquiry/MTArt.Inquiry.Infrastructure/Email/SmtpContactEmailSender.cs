using System.Text;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;

namespace MTArt.Inquiry.Infrastructure.Email;

public sealed class SmtpContactEmailSender(
    IOptions<SmtpOptions> smtpOptions,
    IOptions<ContactOptions> contactOptions,
    ILogger<SmtpContactEmailSender> logger) : IContactEmailSender
{
    public Task SendAsync(ContactMessage message, CancellationToken cancellationToken)
    {
        var body =
            $"""
            A new contact request was submitted from the MT ART website.

            Name: {message.Name}
            Customer email: {message.Email}
            Language: {message.Language}
            Date/time (UTC): {message.SubmittedAt:yyyy-MM-dd HH:mm:ss} UTC

            Message:
            {message.Message}
            """;

        return SendMailAsync(
            $"New MT ART website request - {message.Name}",
            message.Email,
            body,
            cancellationToken);
    }

    public Task SendQuoteAsync(QuoteMessage message, CancellationToken cancellationToken)
    {
        var body = new StringBuilder()
            .AppendLine("A new Request a Quote was submitted from the MT ART website.")
            .AppendLine()
            .AppendLine($"Product name: {OrDash(message.ProductName)}")
            .AppendLine($"Product reference: {OrDash(message.Reference)}")
            .AppendLine($"Product URL: {OrDash(message.ProductUrl)}")
            .AppendLine($"Price: {OrDash(message.Price)}")
            .AppendLine($"Category: {OrDash(message.Category)}")
            .AppendLine($"Quantity: {FormatQuantity(message.QuantityM2)}")
            .AppendLine()
            .AppendLine($"Full name: {message.FullName}")
            .AppendLine($"Company: {OrDash(message.Company)}")
            .AppendLine($"Email: {message.Email}")
            .AppendLine($"Phone: {message.Phone}")
            .AppendLine($"WhatsApp: {OrDash(message.WhatsApp)}")
            .AppendLine($"Country: {message.Country}")
            .AppendLine($"City: {message.City}")
            .AppendLine($"Language: {OrDash(message.Language)}")
            .AppendLine($"Date/time (UTC): {message.SubmittedAt:yyyy-MM-dd HH:mm:ss} UTC")
            .AppendLine()
            .AppendLine("Message:")
            .AppendLine(string.IsNullOrWhiteSpace(message.Message) ? "-" : message.Message)
            .ToString();

        return SendMailAsync(
            $"New MT ART quote request - {message.FullName}",
            message.Email,
            body,
            cancellationToken);
    }

    private async Task SendMailAsync(string subject, string replyTo, string body, CancellationToken cancellationToken)
    {
        var smtp = smtpOptions.Value;
        var toEmail = string.IsNullOrWhiteSpace(contactOptions.Value.ToEmail)
            ? "yahyabdelali@gmail.com"
            : contactOptions.Value.ToEmail.Trim();

        var missing = smtp.MissingSettings();
        logger.LogInformation(
            "Contact email send starting. Environment={Environment} SmtpHost={SmtpHost} SmtpPort={SmtpPort} SmtpUsernamePresent={SmtpUsernamePresent} SmtpPasswordPresent={SmtpPasswordPresent} TlsMode={TlsMode} EnableSsl={EnableSsl} From={From} Recipient={Recipient} ReplyTo={ReplyTo} Subject={Subject}",
            Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT") ?? "Unknown",
            smtp.Host,
            smtp.Port,
            !string.IsNullOrWhiteSpace(smtp.ResolvedUser),
            !string.IsNullOrWhiteSpace(smtp.Password),
            smtp.EnableSsl
                ? (smtp.Port == 465 ? "SslOnConnect" : "StartTls")
                : "None",
            smtp.EnableSsl,
            smtp.ResolvedFromAddress,
            toEmail,
            replyTo,
            subject);

        if (missing.Count > 0)
        {
            logger.LogError(
                """
                Contact email failed:
                SMTP host: {SmtpHost}
                SMTP port: {SmtpPort}
                SMTP username present: {UsernamePresent}
                Recipient: {Recipient}
                SSL/TLS mode: {TlsMode}
                Exception type: {ExceptionType}
                Exception message: Email SMTP configuration is missing: {Missing}
                """,
                smtp.Host,
                smtp.Port,
                !string.IsNullOrWhiteSpace(smtp.ResolvedUser),
                toEmail,
                smtp.EnableSsl ? (smtp.Port == 465 ? "SslOnConnect" : "StartTls") : "None",
                nameof(SmtpNotConfiguredException),
                string.Join(", ", missing));
            throw new SmtpNotConfiguredException(missing);
        }

        var from = smtp.ResolvedFromAddress;
        if (string.IsNullOrWhiteSpace(from))
        {
            from = toEmail;
        }

        var email = new MimeMessage();
        email.From.Add(MailboxAddress.Parse(from));
        email.To.Add(MailboxAddress.Parse(toEmail));
        email.ReplyTo.Add(MailboxAddress.Parse(replyTo));
        email.Subject = subject;
        email.Body = new TextPart("plain") { Text = body };

        using var client = new SmtpClient();
        var secure = smtp.EnableSsl
            ? (smtp.Port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls)
            : SecureSocketOptions.None;

        try
        {
            logger.LogInformation("Connecting to SMTP {Host}:{Port} using {Secure}", smtp.Host, smtp.Port, secure);
            await client.ConnectAsync(smtp.Host, smtp.Port, secure, cancellationToken);
            if (!string.IsNullOrWhiteSpace(smtp.ResolvedUser))
            {
                logger.LogInformation("Authenticating SMTP user {User}", smtp.ResolvedUser);
                await client.AuthenticateAsync(smtp.ResolvedUser, smtp.Password, cancellationToken);
            }

            await client.SendAsync(email, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);
            logger.LogInformation("Contact email sent successfully to {To} from {From} reply-to {ReplyTo}", toEmail, from, replyTo);
        }
        catch (Exception exception)
        {
            var error = exception.InnerException is null
                ? exception.Message
                : $"{exception.Message} | {exception.InnerException.GetType().Name}: {exception.InnerException.Message}";
            logger.LogError(
                exception,
                """
                Contact email failed:
                SMTP host: {SmtpHost}
                SMTP port: {SmtpPort}
                SMTP username present: {UsernamePresent}
                Recipient: {Recipient}
                SSL/TLS mode: {TlsMode}
                Exception type: {ExceptionType}
                Exception message: {Error}
                """,
                smtp.Host,
                smtp.Port,
                !string.IsNullOrWhiteSpace(smtp.ResolvedUser),
                toEmail,
                secure.ToString(),
                exception.GetType().FullName,
                error);
            throw;
        }
    }

    private static string OrDash(string? value) => string.IsNullOrWhiteSpace(value) ? "-" : value.Trim();

    private static string FormatQuantity(decimal? quantity) =>
        quantity is null ? "-" : $"{quantity.Value} m²";
}
