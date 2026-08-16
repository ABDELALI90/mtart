namespace MTArt.SharedKernel.Localization;

/// <summary>
/// The 4 languages the platform supports. English is the default/fallback language for
/// public content: when a translation is missing in the requested language, services fall
/// back to English rather than returning an empty field.
/// </summary>
public static class LanguageCode
{
    public const string English = "en";
    public const string French = "fr";
    public const string Spanish = "es";
    public const string Arabic = "ar";

    public const string Default = English;

    public static readonly IReadOnlyList<string> All = [English, French, Spanish, Arabic];

    public static readonly IReadOnlyList<string> RtlLanguages = [Arabic];

    public static bool IsSupported(string? code) =>
        code is not null && All.Contains(code, StringComparer.OrdinalIgnoreCase);

    public static bool IsRtl(string code) =>
        RtlLanguages.Contains(code, StringComparer.OrdinalIgnoreCase);

    public static string Normalize(string? code) =>
        IsSupported(code) ? code!.ToLowerInvariant() : Default;
}
