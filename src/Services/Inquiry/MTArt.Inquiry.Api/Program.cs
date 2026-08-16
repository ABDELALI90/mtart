using System.ComponentModel.DataAnnotations;
using System.Net.Mail;
using MTArt.Inquiry.Infrastructure;
using MTArt.Inquiry.Infrastructure.Email;
using MTArt.Observability;

var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsDevelopment())
{
    builder.Configuration.AddUserSecrets(typeof(Program).Assembly, optional: true);
}

builder.AddMtArtServiceDefaults("MTArt.Inquiry.Api");
builder.Services.AddInquiryInfrastructure(builder.Configuration);

builder.Services.AddCors(options =>
{
    options.AddPolicy("Default", policy => policy
        .WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ??
            ["http://localhost:5173", "http://127.0.0.1:5173"])
        .AllowAnyHeader()
        .AllowAnyMethod());
});

var app = builder.Build();

{
    var smtp = app.Services.GetRequiredService<Microsoft.Extensions.Options.IOptions<SmtpOptions>>().Value;
    var contact = app.Services.GetRequiredService<Microsoft.Extensions.Options.IOptions<ContactOptions>>().Value;
    var startupLogger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("SmtpStartup");
    var missing = smtp.MissingSettings();
    startupLogger.LogInformation(
        "SMTP startup: Host={Host} Port={Port} UserSet={UserSet} PasswordSet={PasswordSet} From={From} To={To} Missing={Missing}",
        smtp.Host,
        smtp.Port,
        !string.IsNullOrWhiteSpace(smtp.ResolvedUser),
        !string.IsNullOrWhiteSpace(smtp.Password),
        smtp.ResolvedFromAddress,
        contact.ToEmail,
        missing.Count == 0 ? "(none)" : string.Join(", ", missing));
}

app.UseMtArtServiceDefaults();
app.UseCors("Default");

app.MapGet("/", () => Results.Ok(new { service = "MTArt.Inquiry.Api", status = "ready" }));

app.MapPost("/api/v1/contact", async (
    ContactFormRequest body,
    IContactEmailSender emailSender,
    IHostEnvironment environment,
    ILoggerFactory loggerFactory,
    CancellationToken cancellationToken) =>
{
    var logger = loggerFactory.CreateLogger("ContactEndpoint");
    logger.LogInformation(
        "POST /api/v1/contact received. Environment={Environment} Name={Name} Email={Email} Language={Language} MessageLength={MessageLength}",
        environment.EnvironmentName,
        body.Name,
        body.Email,
        body.Language,
        body.Message?.Length ?? 0);

    var errors = new Dictionary<string, string[]>();
    if (string.IsNullOrWhiteSpace(body.Name))
    {
        errors["name"] = ["Name is required."];
    }

    if (string.IsNullOrWhiteSpace(body.Email) || !IsValidEmail(body.Email))
    {
        errors["email"] = ["A valid email is required."];
    }

    if (string.IsNullOrWhiteSpace(body.Message))
    {
        errors["message"] = ["Message is required."];
    }

    if (errors.Count > 0)
    {
        logger.LogWarning("POST /api/v1/contact validation failed: {Errors}", string.Join(", ", errors.Keys));
        return Results.ValidationProblem(errors);
    }

    try
    {
        await emailSender.SendAsync(
            new ContactMessage(
                body.Name.Trim(),
                body.Email.Trim(),
                body.Message!.Trim(),
                string.IsNullOrWhiteSpace(body.Language) ? "en" : body.Language.Trim(),
                DateTimeOffset.UtcNow),
            cancellationToken);

        logger.LogInformation("POST /api/v1/contact succeeded for {Email}", body.Email);
        return Results.Ok(new { sent = true });
    }
    catch (SmtpNotConfiguredException exception)
    {
        logger.LogError(
            "POST /api/v1/contact blocked. Environment={Environment} Message={Message}",
            environment.EnvironmentName,
            exception.Message);
        var missing = string.Join(", ", exception.Missing);
        return Results.Problem(
            title: environment.IsDevelopment() ? $"SMTP configuration missing: {missing}" : "Unable to send the message.",
            detail: environment.IsDevelopment() ? exception.Message : "Unable to send the message.",
            statusCode: StatusCodes.Status503ServiceUnavailable,
            extensions: environment.IsDevelopment()
                ? new Dictionary<string, object?> { ["missing"] = exception.Missing }
                : null);
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
            Environment: {Environment}
            Exception type: {ExceptionType}
            Exception message: {Error}
            """,
            environment.EnvironmentName,
            exception.GetType().FullName,
            error);

        var developmentDetail = IsSmtpAuthenticationFailure(exception)
            ? "SMTP authentication failed"
            : error;
        return Results.Problem(
            title: environment.IsDevelopment() ? developmentDetail : "Unable to send the message.",
            detail: environment.IsDevelopment() ? developmentDetail : "Unable to send the message.",
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }
});

app.MapPost("/api/v1/inquiries/quotes", async (QuoteFormRequest body, IContactEmailSender emailSender, CancellationToken cancellationToken) =>
{
    var fullName = FirstNonEmpty(body.FullName, JoinNames(body.FirstName, body.LastName));
    var errors = new Dictionary<string, string[]>();
    if (string.IsNullOrWhiteSpace(fullName))
    {
        errors["fullName"] = ["Full name is required."];
    }

    if (string.IsNullOrWhiteSpace(body.Email) || !IsValidEmail(body.Email))
    {
        errors["email"] = ["A valid email is required."];
    }

    if (string.IsNullOrWhiteSpace(body.Phone))
    {
        errors["phone"] = ["Phone is required."];
    }

    if (string.IsNullOrWhiteSpace(body.Country))
    {
        errors["country"] = ["Country is required."];
    }

    if (string.IsNullOrWhiteSpace(body.City))
    {
        errors["city"] = ["City is required."];
    }

    if (errors.Count > 0)
    {
        return Results.ValidationProblem(errors);
    }

    var referenceNumber = $"MTQ-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}";
    var message = body.Message;
    if (!string.IsNullOrWhiteSpace(body.Mould) || !string.IsNullOrWhiteSpace(body.ShareUrl))
    {
        message = string.Join('\n', new[]
        {
            body.Message,
            string.IsNullOrWhiteSpace(body.Mould) ? null : $"Mould: {body.Mould}",
            string.IsNullOrWhiteSpace(body.ShareUrl) ? null : $"Configuration: {body.ShareUrl}",
        }.Where(part => !string.IsNullOrWhiteSpace(part)));
    }

    try
    {
        await emailSender.SendQuoteAsync(
            new QuoteMessage(
                fullName!.Trim(),
                body.Company?.Trim(),
                body.Email!.Trim(),
                body.Phone!.Trim(),
                body.WhatsApp?.Trim(),
                body.Country!.Trim(),
                body.City!.Trim(),
                body.QuantityM2,
                message,
                FirstNonEmpty(body.ProductName, body.Product),
                body.Reference,
                body.ProductUrl,
                FirstNonEmpty(body.Price, body.PriceEstimate),
                body.Category,
                string.IsNullOrWhiteSpace(body.Language) ? "en" : body.Language.Trim(),
                DateTimeOffset.UtcNow),
            cancellationToken);

        return Results.Ok(new { sent = true, referenceNumber });
    }
    catch (Exception exception)
    {
        return Results.Problem(
            title: "Unable to send the quote request.",
            detail: exception.Message,
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }
});

app.Run();

static bool IsSmtpAuthenticationFailure(Exception exception)
{
    for (var current = exception; current is not null; current = current.InnerException)
    {
        if (current is System.Security.Authentication.AuthenticationException)
        {
            return true;
        }

        var name = current.GetType().Name;
        var message = current.Message;
        if (name.Contains("Authentication", StringComparison.OrdinalIgnoreCase)
            || message.Contains("535", StringComparison.Ordinal)
            || message.Contains("5.7.8", StringComparison.Ordinal)
            || message.Contains("Invalid credentials", StringComparison.OrdinalIgnoreCase)
            || (name.Contains("Smtp", StringComparison.OrdinalIgnoreCase)
                && message.Contains("auth", StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }
    }

    return false;
}

static bool IsValidEmail(string email)
{
    try
    {
        _ = new MailAddress(email);
        return email.Contains('@', StringComparison.Ordinal);
    }
    catch
    {
        return false;
    }
}

static string? JoinNames(string? first, string? last) =>
    string.Join(' ', new[] { first, last }.Where(part => !string.IsNullOrWhiteSpace(part))).Trim();

static string? FirstNonEmpty(params string?[] values) =>
    values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value))?.Trim();

public sealed record ContactFormRequest(
    [property: Required] string Name,
    [property: Required] string Email,
    [property: Required] string Message,
    string? Language);

public sealed record QuoteFormRequest(
    string? FullName,
    string? FirstName,
    string? LastName,
    string? Company,
    string? Email,
    string? Phone,
    string? WhatsApp,
    string? Country,
    string? City,
    decimal? QuantityM2,
    string? Message,
    string? ProductName,
    string? Product,
    string? Reference,
    string? ProductId,
    string? Slug,
    string? ProductUrl,
    string? Price,
    string? PriceEstimate,
    string? Category,
    string? Language,
    string? Mould,
    string? ShareUrl);

public partial class Program;
