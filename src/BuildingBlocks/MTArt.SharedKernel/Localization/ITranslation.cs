namespace MTArt.SharedKernel.Localization;

/// <summary>
/// Implemented by every "*Translation" child entity (ProductTranslation, CategoryTranslation,
/// ProjectTranslation, ...). Lets shared query helpers pick the right row for a requested
/// language, with a fallback to <see cref="LanguageCode.Default"/>.
/// </summary>
public interface ITranslation
{
    string LanguageCode { get; }
}

public static class TranslationExtensions
{
    /// <summary>Picks the translation matching <paramref name="languageCode"/>, falling back to English, then any.</summary>
    public static T? ForLanguage<T>(this IEnumerable<T> translations, string languageCode)
        where T : ITranslation
    {
        var normalized = LanguageCode.Normalize(languageCode);
        var list = translations as IReadOnlyCollection<T> ?? translations.ToList();

        return list.FirstOrDefault(t => string.Equals(t.LanguageCode, normalized, StringComparison.OrdinalIgnoreCase))
            ?? list.FirstOrDefault(t => string.Equals(t.LanguageCode, LanguageCode.Default, StringComparison.OrdinalIgnoreCase))
            ?? list.FirstOrDefault();
    }
}
