using MTArt.Catalog.Domain.Common;

namespace MTArt.Catalog.Domain.Patterns;

public sealed class PatternCategoryTranslation : TranslationEntity
{
    public Guid PatternCategoryId { get; private set; }
    public string Name { get; private set; } = string.Empty;

    private PatternCategoryTranslation()
    {
    }

    private PatternCategoryTranslation(Guid id, Guid patternCategoryId, string languageCode, string name)
        : base(id, languageCode)
    {
        PatternCategoryId = patternCategoryId;
        Name = name;
    }

    internal static PatternCategoryTranslation Create(Guid patternCategoryId, string languageCode, string name) =>
        new(Guid.NewGuid(), patternCategoryId, languageCode, name);

    internal void Update(string name) => Name = name;
}
