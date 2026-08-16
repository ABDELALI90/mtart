using MTArt.Catalog.Application.Colors.Queries.GetColors;
using MTArt.Catalog.Domain;
using MTArt.Catalog.Domain.Colors;
using MTArt.Catalog.UnitTests.Common;

namespace MTArt.Catalog.UnitTests.Application;

public class GetColorsQueryHandlerTests
{
    [Fact]
    public async Task Handle_FiltersCementTileColors()
    {
        var context = InMemoryCatalogDbContextFactory.Create();
        var cement = Color.Create("MC04", ColorFamily.Cream, 0);
        cement.SetMaterial(MaterialType.CementTile);
        cement.UpsertTranslation("en", "Cream", null);
        var zellige = Color.Create("1001", ColorFamily.White, 1);
        zellige.SetMaterial(MaterialType.Zellige);
        zellige.UpsertTranslation("en", "Ivory", null);
        context.Colors.AddRange(cement, zellige);
        await context.SaveChangesAsync();

        var handler = new GetColorsQueryHandler(context);
        var result = await handler.Handle(new GetColorsQuery("en", MaterialType: MaterialType.CementTile), CancellationToken.None);

        result.Value.Should().ContainSingle(c => c.Code == "MC04");
        result.Value.Should().NotContain(c => c.Code == "1001");
    }
}
