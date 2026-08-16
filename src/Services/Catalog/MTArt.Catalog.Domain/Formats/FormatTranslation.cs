using MTArt.Catalog.Domain.Common;

namespace MTArt.Catalog.Domain.Formats;

public sealed class FormatTranslation : TranslationEntity
{
    public Guid FormatId { get; private set; }
    public string? Name { get; private set; }
    public string? Description { get; private set; }

    private FormatTranslation()
    {
    }

    private FormatTranslation(Guid id, Guid formatId, string languageCode, string? name, string? description)
        : base(id, languageCode)
    {
        FormatId = formatId;
        Name = name;
        Description = description;
    }

    public static FormatTranslation Create(Guid formatId, string languageCode, string? name, string? description) =>
        new(Guid.NewGuid(), formatId, languageCode, name, description);

    public void Update(string? name, string? description)
    {
        Name = name;
        Description = description;
    }
}
