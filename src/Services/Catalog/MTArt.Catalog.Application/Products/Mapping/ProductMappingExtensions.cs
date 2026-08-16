using MTArt.Catalog.Application.Products.Dtos;
using MTArt.Catalog.Domain.Colors;
using MTArt.Catalog.Domain.Finishes;
using MTArt.Catalog.Domain.Formats;
using MTArt.Catalog.Domain.Products;
using MTArt.SharedKernel.Localization;

namespace MTArt.Catalog.Application.Products.Mapping;

/// <summary>
/// Explicit mapping from domain entities (already materialized in memory, with the relevant
/// translations loaded) to public DTOs. Kept as plain static methods rather than a mapping
/// library (AutoMapper is intentionally not used, see Directory.Packages.props) so the shape
/// of every response is easy to read and to change.
/// </summary>
public static class ProductMappingExtensions
{
    public static ProductDetailDto ToDetailDto(
        this Product product,
        string languageCode,
        string categorySlug,
        string categoryName,
        string? collectionSlug,
        string? collectionName,
        string? shapeName,
        string? finishName,
        IReadOnlyDictionary<Guid, Color> colorsById,
        IReadOnlyDictionary<Guid, Format> formatsById,
        IReadOnlyDictionary<Guid, Finish> variantFinishesById,
        IReadOnlyList<RelatedProductDto> relatedProducts,
        string? patternSlug = null)
    {
        var translation = product.Translations.ForLanguage(languageCode);

        return new ProductDetailDto(
            product.Id, product.Reference, product.Slug.Value,
            translation?.Name ?? product.Reference,
            translation?.ShortDescription, translation?.Description, translation?.Craftsmanship,
            translation?.InstallationAdvice, translation?.MaintenanceAdvice,
            product.CategoryId, categorySlug, categoryName,
            product.CollectionId, collectionSlug, collectionName,
            product.ShapeId, shapeName,
            product.FinishId, finishName,
            product.IsFeatured, product.IsNew, product.IsCustomizable, product.IsInStock,
            product.MinimumOrderM2, product.UnitsPerSquareMeter, product.WeightPerSquareMeterKg, product.ThicknessCm,
            product.CountryOfOrigin, product.Material, product.ProductionLeadTime,
            product.PricePerM2, product.Currency, product.PriceVisibility.ToString(),
            product.IsSimulatorReady, product.CatalogKind.ToString(), product.PatternId, patternSlug,
            product.Status.ToString(),
            translation?.SeoTitle, translation?.SeoDescription,
            product.Images
                .OrderBy(i => i.DisplayOrder)
                .Select(i => new ProductImageDto(i.Id, i.MediaId, i.ImageUrl, i.Role.ToString(), i.DisplayOrder))
                .ToList(),
            product.Variants
                .Select(v => v.ToDto(languageCode, colorsById, formatsById, variantFinishesById))
                .ToList(),
            relatedProducts);
    }

    public static ProductVariantDto ToDto(
        this ProductVariant variant,
        string languageCode,
        IReadOnlyDictionary<Guid, Color> colorsById,
        IReadOnlyDictionary<Guid, Format> formatsById,
        IReadOnlyDictionary<Guid, Finish> finishesById)
    {
        var color = colorsById.GetValueOrDefault(variant.ColorId);
        var format = formatsById.GetValueOrDefault(variant.FormatId);
        var colorTranslation = color?.Translations.ForLanguage(languageCode);
        var finish = variant.FinishId.HasValue ? finishesById.GetValueOrDefault(variant.FinishId.Value) : null;
        var finishTranslation = finish?.Translations.ForLanguage(languageCode);

        return new ProductVariantDto(
            variant.Id, variant.Sku, variant.Reference,
            variant.ColorId, color?.Code ?? string.Empty, colorTranslation?.Name ?? color?.Code ?? string.Empty,
            color?.HexApproximation,
            variant.FormatId, format?.DisplayLabel() ?? string.Empty,
            variant.FinishId, finishTranslation?.Name,
            variant.StockStatus.ToString(), variant.UnitsPerM2, variant.WeightPerM2Kg, variant.ThicknessCm, variant.MinimumOrder);
    }
}
