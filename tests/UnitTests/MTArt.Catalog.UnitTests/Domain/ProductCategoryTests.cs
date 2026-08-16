using MTArt.Catalog.Domain.Categories;

namespace MTArt.Catalog.UnitTests.Domain;

public class ProductCategoryTests
{
    [Fact]
    public void Create_IsActiveByDefault()
    {
        var category = ProductCategory.Create("ZELLIGE", "zellige", 0);

        category.IsActive.Should().BeTrue();
    }

    [Fact]
    public void Deactivate_SetsIsActiveFalse()
    {
        var category = ProductCategory.Create("ZELLIGE", "zellige", 0);

        category.Deactivate();

        category.IsActive.Should().BeFalse();
    }

    [Fact]
    public void UpsertTranslation_AddsNewTranslation_WhenNoneExists()
    {
        var category = ProductCategory.Create("ZELLIGE", "zellige", 0);

        category.UpsertTranslation("en", "Zellige", "Handmade zellige", null, null, null);

        category.Translations.Should().ContainSingle(t => t.LanguageCode == "en" && t.Name == "Zellige");
    }

    [Fact]
    public void UpsertTranslation_UpdatesExistingTranslation_WhenAlreadyPresent()
    {
        var category = ProductCategory.Create("ZELLIGE", "zellige", 0);
        category.UpsertTranslation("en", "Zellige", null, null, null, null);

        category.UpsertTranslation("en", "Zellige Updated", "New description", null, null, null);

        category.Translations.Should().ContainSingle();
        category.Translations.Single().Name.Should().Be("Zellige Updated");
    }
}
