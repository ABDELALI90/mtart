using MTArt.Catalog.Domain.CustomDesigns;

namespace MTArt.Catalog.UnitTests.Domain;

public class CustomTileDesignTests
{
    [Fact]
    public void FormatReference_UsesFourDigitSequence()
    {
        CustomTileDesign.FormatReference(1).Should().Be("CUSTOM-0001");
        CustomTileDesign.FormatReference(12).Should().Be("CUSTOM-0012");
        CustomTileDesign.ParseSequence("CUSTOM-0003").Should().Be(3);
        CustomTileDesign.ParseSequence("not-custom").Should().Be(0);
    }

    [Fact]
    public void Create_StoresGeometryAndSvgNotAScreenshot()
    {
        var design = CustomTileDesign.Create(
            "CUSTOM-0001",
            "My Moroccan Design",
            20,
            20,
            """{"elements":[],"regions":[]}""",
            "<svg viewBox='0 0 200 200'></svg>",
            "<svg viewBox='0 0 200 200'></svg>",
            "rotate90",
            """{"zone-1":"MC04"}""",
            null);

        design.Reference.Should().Be("CUSTOM-0001");
        design.Unit.Should().Be("cm");
        design.GeometryJson.Should().Contain("elements");
        design.SvgMarkup.Should().Contain("svg");
        design.IsEditable.Should().BeTrue();
        design.RepeatMode.Should().Be("rotate90");
    }

    [Fact]
    public void UpdateContent_KeepsTheSameReference()
    {
        var design = CustomTileDesign.Create(
            "CUSTOM-0002", "Draft", 20, 20, "{}", "<svg/>", null, "straight", null, null);
        design.UpdateContent("Updated", 20, 20, """{"v":1}""", "<svg id='n'/>", null, "checker", null);
        design.Reference.Should().Be("CUSTOM-0002");
        design.Name.Should().Be("Updated");
        design.RepeatMode.Should().Be("checker");
    }
}
