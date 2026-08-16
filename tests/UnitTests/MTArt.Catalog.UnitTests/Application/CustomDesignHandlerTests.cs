using MTArt.Catalog.Application.Common.Options;
using MTArt.Catalog.Application.CustomDesigns.Commands.SaveCustomDesign;
using MTArt.Catalog.Application.CustomDesigns.Queries.GetCustomDesign;
using MTArt.Catalog.Application.CustomDesigns.Queries.GetManufacturingSettings;
using MTArt.Catalog.UnitTests.Common;

namespace MTArt.Catalog.UnitTests.Application;

public class CustomDesignHandlerTests
{
    [Fact]
    public async Task Save_AssignsIncrementingCustomReferences()
    {
        var context = InMemoryCatalogDbContextFactory.Create();
        var handler = new SaveCustomDesignCommandHandler(context);

        var first = await handler.Handle(NewSave("Star"), CancellationToken.None);
        var second = await handler.Handle(NewSave("Rosette"), CancellationToken.None);

        first.IsSuccess.Should().BeTrue();
        first.Value.Reference.Should().Be("CUSTOM-0001");
        second.Value.Reference.Should().Be("CUSTOM-0002");
        second.Value.GeometryJson.Should().Contain("elements");
        second.Value.SvgMarkup.Should().Contain("svg");
    }

    [Fact]
    public async Task Get_FindsDesignByReference()
    {
        var context = InMemoryCatalogDbContextFactory.Create();
        var saved = await new SaveCustomDesignCommandHandler(context).Handle(NewSave("Khatem"), CancellationToken.None);
        var handler = new GetCustomDesignQueryHandler(context);

        var result = await handler.Handle(new GetCustomDesignQuery("CUSTOM-0001"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Id.Should().Be(saved.Value.Id);
        result.Value.Name.Should().Be("Khatem");
    }

    [Fact]
    public async Task ManufacturingSettings_ComeFromConfiguration()
    {
        var options = new ManufacturingOptions
        {
            MinRegionAreaMm2 = 120,
            MinRegionWidthMm = 5,
            MaxOverlapRatio = 0.1,
            MinGapMm = 2,
        };
        var handler = new GetManufacturingSettingsQueryHandler(options);
        var result = await handler.Handle(new GetManufacturingSettingsQuery(), CancellationToken.None);
        result.Value.MinRegionAreaMm2.Should().Be(120);
        result.Value.MinRegionWidthMm.Should().Be(5);
    }

    private static SaveCustomDesignCommand NewSave(string name) => new(
        name,
        20,
        20,
        """{"elements":[],"regions":[{"id":"zone-bg"}]}""",
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect data-region='zone-bg' width='200' height='200'/></svg>",
        "<svg viewBox='0 0 200 200'/>",
        "straight",
        """{"zone-bg":"MC04"}""",
        null);
}
