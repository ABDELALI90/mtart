using MTArt.Catalog.Domain;
using MTArt.Catalog.Domain.Colors;

namespace MTArt.Catalog.UnitTests.Domain;

public class ColorTests
{
    [Fact]
    public void Create_SetsCodeAndFamily()
    {
        var color = Color.Create("1006", ColorFamily.Blue, 0);

        color.Code.Should().Be("1006");
        color.Family.Should().Be(ColorFamily.Blue);
        color.IsActive.Should().BeTrue();
    }

    [Fact]
    public void UpdateCore_UpdatesHexApproximation()
    {
        var color = Color.Create("1006", ColorFamily.Blue, 0);

        color.UpdateCore("1006", ColorFamily.Blue, "#1F4E5F", null, 0);

        color.HexApproximation.Should().Be("#1F4E5F");
    }

    [Fact]
    public void SetActive_False_DeactivatesColor()
    {
        var color = Color.Create("1006", ColorFamily.Blue, 0);

        color.SetActive(false);

        color.IsActive.Should().BeFalse();
    }
}
