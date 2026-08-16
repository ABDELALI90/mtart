namespace MTArt.Inquiry.Infrastructure.Email;

public sealed class EmailSettings
{
    public const string SectionName = "Email";

    public string SmtpHost { get; set; } = string.Empty;
    public string Host { get; set; } = string.Empty;
    public int SmtpPort { get; set; }
    public int Port { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
    public bool EnableSsl { get; set; } = true;
}

public sealed class SmtpOptions
{
    public const string SectionName = "Smtp";

    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public string User { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromAddress { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public bool EnableSsl { get; set; } = true;

    public string ResolvedUser => string.IsNullOrWhiteSpace(User) ? Username : User;

    public string ResolvedFromAddress
    {
        get
        {
            if (!string.IsNullOrWhiteSpace(FromEmail))
            {
                return FromEmail.Trim();
            }

            if (!string.IsNullOrWhiteSpace(FromAddress))
            {
                return FromAddress.Trim();
            }

            return ResolvedUser;
        }
    }

    public IReadOnlyList<string> MissingSettings()
    {
        var missing = new List<string>();
        if (string.IsNullOrWhiteSpace(Host))
        {
            missing.Add("Email:SmtpHost");
        }

        if (Port <= 0)
        {
            missing.Add("Email:SmtpPort");
        }

        if (string.IsNullOrWhiteSpace(ResolvedUser))
        {
            missing.Add("Email:Username");
        }

        if (string.IsNullOrWhiteSpace(Password))
        {
            missing.Add("Email:Password");
        }

        return missing;
    }
}

public sealed class ContactOptions
{
    public const string SectionName = "Contact";

    public string ToEmail { get; set; } = "yahyabdelali@gmail.com";
}
