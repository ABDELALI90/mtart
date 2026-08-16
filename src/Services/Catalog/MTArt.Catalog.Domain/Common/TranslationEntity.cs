using MTArt.SharedKernel.Domain;
using MTArt.SharedKernel.Localization;

namespace MTArt.Catalog.Domain.Common;

/// <summary>Base for every "*Translation" child entity, guaranteeing a valid, normalized language code.</summary>
public abstract class TranslationEntity : Entity<Guid>, ITranslation
{
    public string LanguageCode { get; private set; } = SharedKernel.Localization.LanguageCode.Default;

    protected TranslationEntity()
    {
    }

    protected TranslationEntity(Guid id, string languageCode) : base(id)
    {
        SetLanguage(languageCode);
    }

    protected void SetLanguage(string languageCode)
    {
        if (!SharedKernel.Localization.LanguageCode.IsSupported(languageCode))
        {
            throw new ArgumentException($"'{languageCode}' is not a supported language code.", nameof(languageCode));
        }

        LanguageCode = languageCode.ToLowerInvariant();
    }
}
