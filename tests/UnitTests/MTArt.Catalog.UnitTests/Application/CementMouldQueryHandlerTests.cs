using MTArt.Catalog.Application.Patterns.Commands.CreateCementMould;
using MTArt.Catalog.Application.Patterns.Queries.GetCementMould;
using MTArt.Catalog.Application.Patterns.Queries.GetCementMouldRegions;
using MTArt.Catalog.Application.Patterns.Queries.GetCementMoulds;
using MTArt.Catalog.Domain;
using MTArt.Catalog.Domain.Colors;
using MTArt.Catalog.Domain.Patterns;
using MTArt.Catalog.Domain.Products;
using MTArt.Catalog.UnitTests.Common;

namespace MTArt.Catalog.UnitTests.Application;

public class CementMouldQueryHandlerTests
{
    private static async Task<(
        MTArt.Catalog.Infrastructure.Persistence.CatalogDbContext Context,
        PatternCategory Floral,
        PatternCategory Geometric,
        Color Cream,
        Color Terracotta)> SeedAsync()
    {
        var context = InMemoryCatalogDbContextFactory.Create();
        var floral = PatternCategory.Create("floral", "floral", 0);
        floral.UpsertTranslation("en", "Floral");
        var geometric = PatternCategory.Create("geometric", "geometric", 1);
        geometric.UpsertTranslation("en", "Geometric");
        context.PatternCategories.AddRange(floral, geometric);

        var cream = Color.Create("MC04", ColorFamily.Cream, 0);
        cream.UpdateCore("MC04", ColorFamily.Cream, "#EFE6D8", null, 0);
        cream.SetMaterial(MaterialType.CementTile);
        var terracotta = Color.Create("MC10", ColorFamily.Orange, 1);
        terracotta.UpdateCore("MC10", ColorFamily.Orange, "#B5623F", null, 1);
        terracotta.SetMaterial(MaterialType.CementTile);
        context.Colors.AddRange(cream, terracotta);

        var garden = TilePattern.Create("1072", "garden", floral.Id, 0);
        garden.UpdateAssets("/images/patterns/garden.svg", "/images/patterns/garden.svg", null, true);
        garden.UpsertTranslation("en", "Garden");
        garden.AddRegion("background", "Background", cream.Id, 0);
        garden.AddRegion("petalA", "Petal A", terracotta.Id, 1);
        garden.AddRegion("petalB", "Petal B", cream.Id, 2);
        garden.AddRegion("center", "Center", terracotta.Id, 3);

        var najma = TilePattern.Create("1025", "najma", geometric.Id, 1);
        najma.UpdateAssets("/images/patterns/najma.svg", "/images/patterns/najma.svg", null, true);
        najma.UpsertTranslation("en", "Najma");
        najma.AddRegion("background", "Background", cream.Id, 0);
        najma.AddRegion("main", "Star", terracotta.Id, 1);

        var draft = TilePattern.Create("1999", "draft-mould", geometric.Id, 2);
        draft.UpdateAssets(null, null, null, false);
        draft.UpsertTranslation("en", "Draft");

        context.TilePatterns.AddRange(garden, najma, draft);

        var product = Product.Create("CT-110", "cement-110", Guid.NewGuid(), 0);
        product.UpsertTranslation("en", "Cement 110", null, null, null, null, null, null, null);
        product.SetPricing(110m, "MAD", PriceVisibility.Public);
        context.Products.Add(product);

        await context.SaveChangesAsync();
        return (context, floral, geometric, cream, terracotta);
    }

    [Fact]
    public async Task Search_FindsMouldByReferenceAndName()
    {
        var (context, _, _, _, _) = await SeedAsync();
        var handler = new GetCementMouldsQueryHandler(context);

        var byRef = await handler.Handle(new GetCementMouldsQuery("en", SearchTerm: "1072", SimulatorReadyOnly: true), CancellationToken.None);
        byRef.IsSuccess.Should().BeTrue();
        byRef.Value.TotalCount.Should().Be(1);
        byRef.Value.Items[0].Reference.Should().Be("1072");

        var byName = await handler.Handle(new GetCementMouldsQuery("en", SearchTerm: "Najma", SimulatorReadyOnly: true), CancellationToken.None);
        byName.Value.Items.Should().ContainSingle(m => m.Reference == "1025");
    }

    [Fact]
    public async Task List_SimulatorReadyOnly_ExcludesUnpublished()
    {
        var (context, _, _, _, _) = await SeedAsync();
        var handler = new GetCementMouldsQueryHandler(context);

        var result = await handler.Handle(new GetCementMouldsQuery("en", SimulatorReadyOnly: true), CancellationToken.None);

        result.Value.TotalCount.Should().Be(2);
        result.Value.Items.Should().NotContain(m => m.Reference == "1999");
    }

    [Fact]
    public async Task List_Paginates()
    {
        var (context, _, _, _, _) = await SeedAsync();
        var handler = new GetCementMouldsQueryHandler(context);

        var result = await handler.Handle(new GetCementMouldsQuery("en", SimulatorReadyOnly: true, PageNumber: 1, PageSize: 1), CancellationToken.None);

        result.Value.Items.Should().HaveCount(1);
        result.Value.TotalCount.Should().Be(2);
        result.Value.HasNextPage.Should().BeTrue();
    }

    [Fact]
    public async Task GetByReference_LoadsDynamicRegions()
    {
        var (context, _, _, _, _) = await SeedAsync();
        var handler = new GetCementMouldQueryHandler(context);

        var result = await handler.Handle(new GetCementMouldQuery("1072", "en"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.RegionCount.Should().Be(4);
        result.Value.Regions.Select(r => r.RegionKey).Should().Equal("background", "petalA", "petalB", "center");
        result.Value.PricePerM2.Should().Be(110m);
    }

    [Fact]
    public async Task GetBySlug_AlsoResolvesReference()
    {
        var (context, _, _, _, _) = await SeedAsync();
        var handler = new GetCementMouldQueryHandler(context);

        var result = await handler.Handle(new GetCementMouldQuery("garden", "en"), CancellationToken.None);

        result.Value.Reference.Should().Be("1072");
    }

    [Fact]
    public async Task RegionsEndpoint_ReturnsColorCodes()
    {
        var (context, _, _, _, _) = await SeedAsync();
        var handler = new GetCementMouldRegionsQueryHandler(context);

        var result = await handler.Handle(new GetCementMouldRegionsQuery("1072"), CancellationToken.None);

        result.Value.Should().HaveCount(4);
        result.Value[0].DefaultColorCode.Should().Be("MC04");
    }

    [Fact]
    public async Task Create_PersistsIndependentRegions()
    {
        var (context, floral, _, cream, terracotta) = await SeedAsync();
        var handler = new CreateCementMouldCommandHandler(context);

        var result = await handler.Handle(new CreateCementMouldCommand(
            "10549", "star-garden", "Star Garden", floral.Id, null,
            "/images/patterns/garden.svg", "/images/patterns/garden.svg", true, 10,
            [
                new("background", "Background", cream.Id, 0),
                new("petalA", "Petal A", terracotta.Id, 1),
                new("petalB", "Petal B", cream.Id, 2),
                new("center", "Center", terracotta.Id, 3),
            ]), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        var stored = context.TilePatterns.First(p => p.Reference == "10549");
        stored.RegionCount.Should().Be(4);
        stored.IsSimulatorReady.Should().BeTrue();
    }

    [Fact]
    public async Task List_FamilyFilter_SeparatesCementAndZellige()
    {
        var (context, _, geometric, cream, terracotta) = await SeedAsync();
        var stars = PatternCategory.Create("stars", "stars", 8);
        stars.UpsertTranslation("en", "Stars");
        context.PatternCategories.Add(stars);

        var khatem = TilePattern.Create("ZL-001", "khatem", stars.Id, 20);
        khatem.UpdateAssets("/moulds/zellige/stars/ZL-001.svg", "/moulds/zellige/stars/ZL-001.svg", null, true);
        khatem.UpsertTranslation("en", "Khatem");
        khatem.AddRegion("background", "Background", cream.Id, 0);
        khatem.AddRegion("star", "Star", terracotta.Id, 1);
        context.TilePatterns.Add(khatem);
        await context.SaveChangesAsync();

        var handler = new GetCementMouldsQueryHandler(context);

        var zellige = await handler.Handle(
            new GetCementMouldsQuery("en", SimulatorReadyOnly: true, Family: "zellige"),
            CancellationToken.None);
        zellige.Value.Items.Should().ContainSingle(m => m.Reference == "ZL-001");
        zellige.Value.Items.Should().NotContain(m => m.Reference == "1025");

        var cement = await handler.Handle(
            new GetCementMouldsQuery("en", SimulatorReadyOnly: true, Family: "cement"),
            CancellationToken.None);
        cement.Value.Items.Should().NotContain(m => m.Reference == "ZL-001");
        cement.Value.Items.Should().Contain(m => m.Reference == "1025");
    }

    [Fact]
    public async Task Search_MatchesCategoryName()
    {
        var (context, _, _, _, _) = await SeedAsync();
        var handler = new GetCementMouldsQueryHandler(context);

        var result = await handler.Handle(
            new GetCementMouldsQuery("en", SearchTerm: "geometric", SimulatorReadyOnly: true),
            CancellationToken.None);

        result.Value.Items.Should().Contain(m => m.Reference == "1025");
        result.Value.Items.Should().NotContain(m => m.Reference == "1072");
    }
}
