using MTArt.Catalog.Application.Products.Commands.CreateProduct;
using MTArt.Catalog.Domain.Categories;
using MTArt.Catalog.UnitTests.Common;

namespace MTArt.Catalog.UnitTests.Application;

public class CreateProductCommandHandlerTests
{
    [Fact]
    public async Task Handle_WithUniqueSlugAndReference_CreatesProduct()
    {
        using var context = InMemoryCatalogDbContextFactory.Create();
        var category = ProductCategory.Create("ZELLIGE", "zellige", 0);
        context.Categories.Add(category);
        await context.SaveChangesAsync();

        var handler = new CreateProductCommandHandler(context);
        var command = new CreateProductCommand(
            "1020", "zellige-1020", category.Id, null, null, null, false, 5m, null, null, 1.2m, "Morocco", null, "4-6 weeks", 0);

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        (await context.Products.FindAsync(result.Value)).Should().NotBeNull();
    }

    [Fact]
    public async Task Handle_WithDuplicateSlug_ReturnsConflict()
    {
        using var context = InMemoryCatalogDbContextFactory.Create();
        var category = ProductCategory.Create("ZELLIGE", "zellige", 0);
        context.Categories.Add(category);
        await context.SaveChangesAsync();

        var handler = new CreateProductCommandHandler(context);
        var command = new CreateProductCommand(
            "1020", "zellige-1020", category.Id, null, null, null, false, null, null, null, null, null, null, null, 0);
        await handler.Handle(command, CancellationToken.None);

        var duplicate = new CreateProductCommand(
            "1021", "zellige-1020", category.Id, null, null, null, false, null, null, null, null, null, null, null, 0);
        var result = await handler.Handle(duplicate, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("products.slug_taken");
    }

    [Fact]
    public async Task Handle_WithDuplicateReference_ReturnsConflict()
    {
        using var context = InMemoryCatalogDbContextFactory.Create();
        var category = ProductCategory.Create("ZELLIGE", "zellige", 0);
        context.Categories.Add(category);
        await context.SaveChangesAsync();

        var handler = new CreateProductCommandHandler(context);
        var command = new CreateProductCommand(
            "1020", "zellige-1020", category.Id, null, null, null, false, null, null, null, null, null, null, null, 0);
        await handler.Handle(command, CancellationToken.None);

        var duplicate = new CreateProductCommand(
            "1020", "zellige-1021", category.Id, null, null, null, false, null, null, null, null, null, null, null, 0);
        var result = await handler.Handle(duplicate, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("products.reference_taken");
    }
}
