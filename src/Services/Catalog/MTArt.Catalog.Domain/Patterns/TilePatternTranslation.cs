using MTArt.Catalog.Domain.Common;

namespace MTArt.Catalog.Domain.Patterns;

public sealed class TilePatternTranslation : TranslationEntity
{
    public Guid PatternId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }

    private TilePatternTranslation()
    {
    }

    private TilePatternTranslation(Guid id, Guid patternId, string languageCode, string name, string? description)
        : base(id, languageCode)
    {
        PatternId = patternId;
        Name = name;
        Description = description;
    }

    internal static TilePatternTranslation Create(Guid patternId, string languageCode, string name, string? description) =>
        new(Guid.NewGuid(), patternId, languageCode, name, description);

    internal void Update(string name, string? description)
    {
        Name = name;
        Description = description;
    }
}
