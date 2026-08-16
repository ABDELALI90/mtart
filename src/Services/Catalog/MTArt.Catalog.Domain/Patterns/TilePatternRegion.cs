using MTArt.SharedKernel.Domain;

namespace MTArt.Catalog.Domain.Patterns;

public sealed class TilePatternRegion : Entity<Guid>
{
    public Guid PatternId { get; private set; }
    public string RegionKey { get; private set; } = string.Empty;
    public string DisplayName { get; private set; } = string.Empty;
    public Guid? DefaultColorId { get; private set; }
    public int DisplayOrder { get; private set; }

    private TilePatternRegion()
    {
    }

    private TilePatternRegion(Guid id, Guid patternId, string regionKey, string displayName, Guid? defaultColorId, int displayOrder)
        : base(id)
    {
        PatternId = patternId;
        RegionKey = regionKey;
        DisplayName = displayName;
        DefaultColorId = defaultColorId;
        DisplayOrder = displayOrder;
    }

    internal static TilePatternRegion Create(Guid patternId, string regionKey, string displayName, Guid? defaultColorId, int displayOrder) =>
        new(Guid.NewGuid(), patternId, regionKey, displayName, defaultColorId, displayOrder);

    public void AssignDefaultColor(Guid? colorId) => DefaultColorId = colorId;

    public void Update(string displayName, Guid? defaultColorId, int displayOrder)
    {
        DisplayName = displayName;
        DefaultColorId = defaultColorId;
        DisplayOrder = displayOrder;
    }
}
