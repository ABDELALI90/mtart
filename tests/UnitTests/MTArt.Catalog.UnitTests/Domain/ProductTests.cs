using MTArt.Catalog.Domain;
using MTArt.Catalog.Domain.Products;

namespace MTArt.Catalog.UnitTests.Domain;

public class ProductTests
{
    [Fact]
    public void Create_SetsCoreFieldsAndDraftStatus()
    {
        var categoryId = Guid.NewGuid();

        var product = Product.Create("1020", "zellige-1020", categoryId, 1);

        product.Reference.Should().Be("1020");
        product.Slug.Value.Should().Be("zellige-1020");
        product.CategoryId.Should().Be(categoryId);
        product.Status.Should().Be(ProductStatus.Draft);
        product.IsDeleted.Should().BeFalse();
    }

    [Fact]
    public void Publish_WithoutDefaultTranslation_Throws()
    {
        var product = Product.Create("1020", "zellige-1020", Guid.NewGuid());
        product.AddImage(Guid.NewGuid(), ProductImageRole.Primary, 0);

        var act = product.Publish;

        act.Should().Throw<InvalidOperationException>().WithMessage("*translation*");
    }

    [Fact]
    public void Publish_WithoutImages_Throws()
    {
        var product = Product.Create("1020", "zellige-1020", Guid.NewGuid());
        product.UpsertTranslation("en", "Zellige 1020", null, null, null, null, null, null, null);

        var act = product.Publish;

        act.Should().Throw<InvalidOperationException>().WithMessage("*image*");
    }

    [Fact]
    public void Publish_WithTranslationAndImage_SetsPublishedStatus()
    {
        var product = Product.Create("1020", "zellige-1020", Guid.NewGuid());
        product.UpsertTranslation("en", "Zellige 1020", null, null, null, null, null, null, null);
        product.AddImage(Guid.NewGuid(), ProductImageRole.Primary, 0);

        product.Publish();

        product.Status.Should().Be(ProductStatus.Published);
    }

    [Fact]
    public void AddVariant_RecomputesStock_ToInStock()
    {
        var product = Product.Create("1020", "zellige-1020", Guid.NewGuid());

        product.AddVariant(Guid.NewGuid(), Guid.NewGuid(), null, "SKU-1", "1020", StockStatus.InStock, 100, 18, 1.2m, 5);

        product.IsInStock.Should().BeTrue();
    }

    [Fact]
    public void AddVariant_WhenAllMadeToOrder_ProductIsNotInStock()
    {
        var product = Product.Create("1020", "zellige-1020", Guid.NewGuid());

        product.AddVariant(Guid.NewGuid(), Guid.NewGuid(), null, "SKU-1", "1020", StockStatus.MadeToOrder, 100, 18, 1.2m, 5);

        product.IsInStock.Should().BeFalse();
    }

    [Fact]
    public void RemoveVariant_ThatDoesNotExist_ThrowsNotFound()
    {
        var product = Product.Create("1020", "zellige-1020", Guid.NewGuid());

        var act = () => product.RemoveVariant(Guid.NewGuid());

        act.Should().Throw<SharedKernel.Exceptions.NotFoundException>();
    }

    [Fact]
    public void Unpublish_ResetsStatusToDraft()
    {
        var product = Product.Create("1020", "zellige-1020", Guid.NewGuid());
        product.UpsertTranslation("en", "Zellige 1020", null, null, null, null, null, null, null);
        product.AddImage(Guid.NewGuid(), ProductImageRole.Primary, 0);
        product.Publish();

        product.Unpublish();

        product.Status.Should().Be(ProductStatus.Draft);
    }

    [Fact]
    public void Delete_MarksAsSoftDeleted()
    {
        var product = Product.Create("1020", "zellige-1020", Guid.NewGuid());

        product.Delete();

        product.IsDeleted.Should().BeTrue();
        product.DeletedAt.Should().NotBeNull();
    }

    [Fact]
    public void TranslationCompleteness_WithOnlyEnglish_IsQuarter()
    {
        var product = Product.Create("1020", "zellige-1020", Guid.NewGuid());
        product.UpsertTranslation("en", "Zellige 1020", null, null, null, null, null, null, null);

        product.TranslationCompleteness().Should().Be(0.25);
    }

    [Fact]
    public void TranslationCompleteness_WithAllLanguages_IsComplete()
    {
        var product = Product.Create("1020", "zellige-1020", Guid.NewGuid());
        foreach (var lang in SharedKernel.Localization.LanguageCode.All)
        {
            product.UpsertTranslation(lang, "Zellige 1020", null, null, null, null, null, null, null);
        }

        product.TranslationCompleteness().Should().Be(1.0);
    }
}
