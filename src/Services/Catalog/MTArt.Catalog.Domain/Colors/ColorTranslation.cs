using MTArt.Catalog.Domain.Common;

namespace MTArt.Catalog.Domain.Colors;

public sealed class ColorTranslation : TranslationEntity
{
    public Guid ColorId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }

    private ColorTranslation()
    {
    }

    private ColorTranslation(Guid id, Guid colorId, string languageCode, string name, string? description)
        : base(id, languageCode)
    {
        ColorId = colorId;
        Name = name;
        Description = description;
    }

    public static ColorTranslation Create(Guid colorId, string languageCode, string name, string? description) =>
        new(Guid.NewGuid(), colorId, languageCode, name, description);

    public void Update(string name, string? description)
    {
        Name = name;
        Description = description;
    }
}
