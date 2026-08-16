using MTArt.Catalog.Domain.Common;

namespace MTArt.Catalog.Domain.Finishes;

public sealed class FinishTranslation : TranslationEntity
{
    public Guid FinishId { get; private set; }
    public string Name { get; private set; } = string.Empty;

    private FinishTranslation()
    {
    }

    private FinishTranslation(Guid id, Guid finishId, string languageCode, string name) : base(id, languageCode)
    {
        FinishId = finishId;
        Name = name;
    }

    public static FinishTranslation Create(Guid finishId, string languageCode, string name) =>
        new(Guid.NewGuid(), finishId, languageCode, name);

    public void Update(string name) => Name = name;
}
