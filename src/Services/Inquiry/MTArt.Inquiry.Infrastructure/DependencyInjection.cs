using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MTArt.Inquiry.Infrastructure.Email;

namespace MTArt.Inquiry.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInquiryInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<SmtpOptions>(configuration.GetSection(SmtpOptions.SectionName));
        services.Configure<ContactOptions>(configuration.GetSection(ContactOptions.SectionName));
        services.PostConfigure<SmtpOptions>(options => ApplyEmailSettings(options, configuration));
        services.PostConfigure<ContactOptions>(options =>
        {
            var email = configuration.GetSection(EmailSettings.SectionName);
            options.ToEmail = FirstNonEmpty(
                email["To"],
                options.ToEmail,
                Env("CONTACT_TO_EMAIL"),
                Env("Email__To"));
            if (string.IsNullOrWhiteSpace(options.ToEmail))
            {
                options.ToEmail = "yahyabdelali@gmail.com";
            }
        });
        services.AddSingleton<IContactEmailSender, SmtpContactEmailSender>();
        return services;
    }

    private static void ApplyEmailSettings(SmtpOptions options, IConfiguration configuration)
    {
        var email = configuration.GetSection(EmailSettings.SectionName);

        options.Host = FirstNonEmpty(
            NonEmpty(Env("SMTP_HOST")),
            NonEmpty(Env("Email__SmtpHost")),
            email["SmtpHost"],
            email["Host"],
            options.Host);
        options.User = FirstNonEmpty(NonEmpty(Env("SMTP_USER")), options.User);
        options.Username = FirstNonEmpty(
            NonEmpty(Env("SMTP_USERNAME")),
            NonEmpty(Env("Email__Username")),
            email["Username"],
            NonEmpty(options.Username),
            NonEmpty(options.User));
        // Do not let empty Docker Smtp__Password / SMTP_PASSWORD wipe User Secrets.
        options.Password = FirstNonEmpty(
            NonEmpty(Env("SMTP_PASSWORD")),
            NonEmpty(Env("Email__Password")),
            email["Password"],
            NonEmpty(options.Password));
        options.FromAddress = FirstNonEmpty(options.FromAddress, Env("SMTP_FROM_ADDRESS"));
        options.FromEmail = FirstNonEmpty(email["From"], options.FromEmail, Env("SMTP_FROM_EMAIL"), Env("Email__From"));
        options.EnableSsl = ParseBool(email["EnableSsl"], options.EnableSsl);

        var port = email["SmtpPort"] ?? email["Port"] ?? Env("SMTP_PORT") ?? Env("Email__SmtpPort");
        if (int.TryParse(port, out var parsedPort) && parsedPort > 0)
        {
            options.Port = parsedPort;
        }
        else if (options.Port <= 0)
        {
            options.Port = 587;
        }
    }

    private static string? Env(string name) => Environment.GetEnvironmentVariable(name);

    private static string? NonEmpty(string? value) => string.IsNullOrWhiteSpace(value) ? null : value;

    private static string FirstNonEmpty(params string?[] values) =>
        values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value))?.Trim() ?? string.Empty;

    private static bool ParseBool(string? value, bool fallback) =>
        bool.TryParse(value, out var parsed) ? parsed : fallback;
}
