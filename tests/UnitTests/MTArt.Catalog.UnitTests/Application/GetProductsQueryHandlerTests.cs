using MTArt.Catalog.Application.Products.Queries.GetProducts;
using MTArt.Catalog.Domain;
using MTArt.Catalog.Domain.Categories;
using MTArt.Catalog.Domain.Products;
using MTArt.Catalog.UnitTests.Common;

namespace MTArt.Catalog.UnitTests.Application;

public class GetProductsQueryHandlerTests
{
    private static async Task<(MTArt.Catalog.Infrastructure.Persistence.CatalogDbContext Context, ProductCategory Category)> SeedAsync()
    {
        var context = InMemoryCatalogDbContextFactory.Create();
        var category = ProductCategory.Create("ZELLIGE", "zellige", 0);
        context.Categories.Add(category);

        for (var i = 0; i < 5; i++)
        {
            var product = Product.Create($"REF-{i}", $"zellige-{i}", category.Id, i);
            product.UpsertTranslation("en", $"Zellige {i}", null, null, null, null, null, null, null);
            product.AddImage(Guid.NewGuid(), ProductImageRole.Primary, 0);
            product.Publish();
            if (i == 0)
            {
                product.SetFeatured(true);
            }

            context.Products.Add(product);
        }

        await context.SaveChangesAsync();
        return (context, category);
    }

    [Fact]
    public async Task Handle_OnlyReturnsPublishedProducts()
    {
        var (context, category) = await SeedAsync();

        var draft = Product.Create("DRAFT-1", "draft-product", category.Id);
        context.Products.Add(draft);
        await context.SaveChangesAsync();

        var handler = new GetProductsQueryHandler(context);
        var result = await handler.Handle(
            new GetProductsQuery("en", null, null, null, null, null, null, null, null, null, ProductSortOrder.Featured, 1, 20),
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.TotalCount.Should().Be(5);
        result.Value.Items.Should().NotContain(p => p.Slug == "draft-product");
    }

    [Fact]
    public async Task Handle_FiltersByCategorySlug()
    {
        var (context, category) = await SeedAsync();

        var handler = new GetProductsQueryHandler(context);
        var result = await handler.Handle(
            new GetProductsQuery("en", category.Slug.Value, null, null, null, null, null, null, null, null, ProductSortOrder.Featured, 1, 20),
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.TotalCount.Should().Be(5);
    }

    [Fact]
    public async Task Handle_PaginatesResults()
    {
        var (context, _) = await SeedAsync();

        var handler = new GetProductsQueryHandler(context);
        var result = await handler.Handle(
            new GetProductsQuery("en", null, null, null, null, null, null, null, null, null, ProductSortOrder.ReferenceAsc, 1, 2),
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Items.Should().HaveCount(2);
        result.Value.TotalCount.Should().Be(5);
        result.Value.TotalPages.Should().Be(3);
    }

    [Fact]
    public async Task Handle_FeaturedSort_PutsFeaturedProductsFirst()
    {
        var (context, _) = await SeedAsync();

        var handler = new GetProductsQueryHandler(context);
        var result = await handler.Handle(
            new GetProductsQuery("en", null, null, null, null, null, null, null, null, null, ProductSortOrder.Featured, 1, 20),
            CancellationToken.None);

        result.Value.Items.First().Slug.Should().Be("zellige-0");
    }
}
