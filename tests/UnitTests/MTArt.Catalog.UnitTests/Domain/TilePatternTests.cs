using MTArt.Catalog.Domain.Patterns;

namespace MTArt.Catalog.UnitTests.Domain;

public class TilePatternTests
{
    [Fact]
    public void AddRegion_UpdatesRegionCountDynamically()
    {
        var categoryId = Guid.NewGuid();
        var mould = TilePattern.Create("1072", "garden", categoryId);
        mould.AddRegion("background", "Background", null, 0);
        mould.AddRegion("petalA", "Petal A", null, 1);
        mould.AddRegion("petalB", "Petal B", null, 2);
        mould.AddRegion("center", "Center", null, 3);

        mould.RegionCount.Should().Be(4);
        mould.Regions.Select(r => r.RegionKey).Should().Equal("background", "petalA", "petalB", "center");
    }

    [Fact]
    public void SetSimulatorReady_RequiresExplicitPublish()
    {
        var mould = TilePattern.Create("1999", "draft", Guid.NewGuid());
        mould.IsSimulatorReady.Should().BeFalse();
        mould.SetSimulatorReady(true);
        mould.IsSimulatorReady.Should().BeTrue();
        mould.IsCustomizable.Should().BeTrue();
    }
}
