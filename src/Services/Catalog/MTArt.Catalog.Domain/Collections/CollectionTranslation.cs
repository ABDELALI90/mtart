using MTArt.Catalog.Domain.Common;

namespace MTArt.Catalog.Domain.Collections;

public sealed class CollectionTranslation : TranslationEntity
{
    public Guid CollectionId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Story { get; private set; }
    public string? Description { get; private set; }
    public string? SeoTitle { get; private set; }
    public string? SeoDescription { get; private set; }

    private CollectionTranslation()
    {
    }

    private CollectionTranslation(
        Guid id, Guid collectionId, string languageCode, string name,
        string? story, string? description, string? seoTitle, string? seoDescription)
        : base(id, languageCode)
    {
        CollectionId = collectionId;
        Name = name;
        Story = story;
        Description = description;
        SeoTitle = seoTitle;
        SeoDescription = seoDescription;
    }

    public static CollectionTranslation Create(
        Guid collectionId, string languageCode, string name,
        string? story, string? description, string? seoTitle, string? seoDescription) =>
        new(Guid.NewGuid(), collectionId, languageCode, name, story, description, seoTitle, seoDescription);

    public void Update(string name, string? story, string? description, string? seoTitle, string? seoDescription)
    {
        Name = name;
        Story = story;
        Description = description;
        SeoTitle = seoTitle;
        SeoDescription = seoDescription;
    }
}
