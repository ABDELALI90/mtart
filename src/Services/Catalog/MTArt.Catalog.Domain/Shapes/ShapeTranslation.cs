using MTArt.Catalog.Domain.Common;

namespace MTArt.Catalog.Domain.Shapes;

public sealed class ShapeTranslation : TranslationEntity
{
    public Guid ShapeId { get; private set; }
    public string Name { get; private set; } = string.Empty;

    private ShapeTranslation()
    {
    }

    private ShapeTranslation(Guid id, Guid shapeId, string languageCode, string name) : base(id, languageCode)
    {
        ShapeId = shapeId;
        Name = name;
    }

    public static ShapeTranslation Create(Guid shapeId, string languageCode, string name) =>
        new(Guid.NewGuid(), shapeId, languageCode, name);

    public void Update(string name) => Name = name;
}
