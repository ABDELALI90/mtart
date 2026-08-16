using MTArt.Catalog.Application.Products.Queries.GetProductBySlug;
using MTArt.Catalog.Domain;
using MTArt.Catalog.Domain.Categories;
using MTArt.Catalog.Domain.Products;
using MTArt.Catalog.UnitTests.Common;

namespace MTArt.Catalog.UnitTests.Application;

public class GetProductBySlugQueryHandlerTests
{
    [Fact]
    public async Task Handle_WithExistingSlug_ReturnsProductDetail()
    {
        using var context = InMemoryCatalogDbContextFactory.Create();
        var category = ProductCategory.Create("ZELLIGE", "zellige", 0);
        category.UpsertTranslation("en", "Zellige", null, null, null, null);
        context.Categories.Add(category);

        var product = Product.Create("1020", "zellige-1020", category.Id);
        product.UpsertTranslation("en", "Zellige 1020", "Short desc", "Full desc", null, null, null, null, null);
        product.AddImage(Guid.NewGuid(), ProductImageRole.Primary, 0);
        context.Products.Add(product);

        await context.SaveChangesAsync();

        var handler = new GetProductBySlugQueryHandler(context);
        var result = await handler.Handle(new GetProductBySlugQuery("zellige-1020", "en"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Name.Should().Be("Zellige 1020");
        result.Value.CategorySlug.Should().Be("zellige");
    }

    [Fact]
    public async Task Handle_WithUnknownSlug_ReturnsNotFound()
    {
        using var context = InMemoryCatalogDbContextFactory.Create();

        var handler = new GetProductBySlugQueryHandler(context);
        var result = await handler.Handle(new GetProductBySlugQuery("does-not-exist", "en"), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("products.not_found");
    }

    [Fact]
    public async Task Handle_FallsBackToEnglish_WhenTranslationMissingForRequestedLanguage()
    {
        using var context = InMemoryCatalogDbContextFactory.Create();
        var category = ProductCategory.Create("ZELLIGE", "zellige", 0);
        context.Categories.Add(category);

        var product = Product.Create("1020", "zellige-1020", category.Id);
        product.UpsertTranslation("en", "Zellige 1020", null, null, null, null, null, null, null);
        context.Products.Add(product);

        await context.SaveChangesAsync();

        var handler = new GetProductBySlugQueryHandler(context);
        var result = await handler.Handle(new GetProductBySlugQuery("zellige-1020", "fr"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Name.Should().Be("Zellige 1020");
    }
}
