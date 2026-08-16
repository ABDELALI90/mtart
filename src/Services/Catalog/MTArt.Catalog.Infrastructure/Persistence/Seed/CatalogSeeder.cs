using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MTArt.Catalog.Domain;
using MTArt.Catalog.Domain.Categories;
using MTArt.Catalog.Domain.Collections;
using MTArt.Catalog.Domain.Colors;
using MTArt.Catalog.Domain.Finishes;
using MTArt.Catalog.Domain.Formats;
using MTArt.Catalog.Domain.Products;
using MTArt.Catalog.Domain.Shapes;

namespace MTArt.Catalog.Infrastructure.Persistence.Seed;

/// <summary>
/// Realistic-looking DEMO/SEED data so the site is never empty on first run. Every record here
/// is clearly fictitious placeholder content (see /import/README.md) and is meant to be
/// replaced or extended with MT ART's real catalog through the admin panel or CSV importer.
/// Images reference random Guids because Catalog never stores/validates media binaries itself
/// (see MTArt.Media service) - replace with the real MediaId once assets are imported.
/// </summary>
public static class CatalogSeeder
{
    public static async Task SeedAsync(CatalogDbContext context, ILogger logger, CancellationToken cancellationToken = default)
    {
        if (await context.Categories.AnyAsync(cancellationToken))
        {
            logger.LogInformation("Catalog already has data - skipping seed.");
            return;
        }

        logger.LogInformation("Seeding demo Catalog data...");

        var categories = SeedCategories();
        var shapes = SeedShapes();
        var finishes = SeedFinishes();
        var formats = SeedFormats(shapes);
        var colors = SeedColors();
        var collections = SeedCollections();
        var products = SeedProducts(categories, collections, shapes, finishes, colors, formats);

        context.Categories.AddRange(categories);
        context.Shapes.AddRange(shapes);
        context.Finishes.AddRange(finishes);
        context.Formats.AddRange(formats);
        context.Colors.AddRange(colors);
        context.Collections.AddRange(collections);
        context.Products.AddRange(products);

        await context.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Seeded {Categories} categories, {Shapes} shapes, {Finishes} finishes, {Formats} formats, {Colors} colors, {Collections} collections, {Products} products.",
            categories.Count, shapes.Count, finishes.Count, formats.Count, colors.Count, collections.Count, products.Count);
    }

    public static async Task SeedWithRealCatalogAsync(CatalogDbContext context, ILogger logger, CancellationToken cancellationToken = default)
    {
        if (!await context.Categories.AnyAsync(cancellationToken))
        {
            await SeedAsync(context, logger, cancellationToken);
        }

        await RealCatalogSeeder.SeedAsync(context, logger, cancellationToken);
        await UnicolorColorSeeder.SeedAsync(context, logger, cancellationToken);
        await BejmatAssetSeeder.SeedAsync(context, logger, cancellationToken);
        await CementMouldSeeder.SeedAsync(context, logger, cancellationToken);
        await MouldLibrarySeeder.SeedAsync(context, logger, cancellationToken);
        await ImportedMouldSeeder.SeedAsync(context, logger, cancellationToken);
    }

    private static List<ProductCategory> SeedCategories()
    {
        var definitions = new[]
        {
            ("zellige", "ZELLIGE", "Zellige", "Zellige", "Zellige", "الزليج"),
            ("bejmat", "BEJMAT", "Bejmat", "Bejmat", "Bejmat", "بجمات"),
            ("cement-tiles", "CEMENT", "Cement Tiles", "Carreaux de Ciment", "Baldosas de Cemento", "بلاط الأسمنت"),
            ("terracotta", "TERRACOTTA", "Terracotta", "Terre Cuite", "Terracota", "الطين المشوي"),
        };

        var categories = new List<ProductCategory>();
        var order = 0;
        foreach (var (slug, code, en, fr, es, ar) in definitions)
        {
            var category = ProductCategory.Create(code, slug, order++);
            category.UpsertTranslation("en", en, $"Handmade {en} tiles from Morocco.", null, $"{en} Tiles | MT ART", $"Discover handmade {en} tiles, crafted in Morocco.");
            category.UpsertTranslation("fr", fr, $"Carreaux {fr} artisanaux du Maroc.", null, null, null);
            category.UpsertTranslation("es", es, $"Azulejos {es} artesanales de Marruecos.", null, null, null);
            category.UpsertTranslation("ar", ar, $"بلاط {ar} يدوي الصنع من المغرب.", null, null, null);
            categories.Add(category);
        }

        return categories;
    }

    private static List<Shape> SeedShapes()
    {
        var definitions = new[]
        {
            ("square", "Square", "Carré", "Cuadrado", "مربع"),
            ("hexagon", "Hexagon", "Hexagone", "Hexágono", "سداسي"),
            ("triangle", "Triangle", "Triangle", "Triángulo", "مثلث"),
            ("diamond", "Diamond", "Losange", "Diamante", "معين"),
            ("star", "Star & Cross", "Étoile & Croix", "Estrella y Cruz", "نجمة وصليب"),
        };

        var shapes = new List<Shape>();
        var order = 0;
        foreach (var (code, en, fr, es, ar) in definitions)
        {
            var shape = Shape.Create(code, order++);
            shape.UpsertTranslation("en", en);
            shape.UpsertTranslation("fr", fr);
            shape.UpsertTranslation("es", es);
            shape.UpsertTranslation("ar", ar);
            shapes.Add(shape);
        }

        return shapes;
    }

    private static List<Finish> SeedFinishes()
    {
        var definitions = new[]
        {
            ("glossy", "Glossy", "Brillant", "Brillante", "لامع"),
            ("matte", "Matte", "Mat", "Mate", "غير لامع"),
            ("natural", "Natural", "Naturel", "Natural", "طبيعي"),
        };

        var finishes = new List<Finish>();
        var order = 0;
        foreach (var (code, en, fr, es, ar) in definitions)
        {
            var finish = Finish.Create(code, order++);
            finish.UpsertTranslation("en", en);
            finish.UpsertTranslation("fr", fr);
            finish.UpsertTranslation("es", es);
            finish.UpsertTranslation("ar", ar);
            finishes.Add(finish);
        }

        return finishes;
    }

    private static List<Format> SeedFormats(List<Shape> shapes)
    {
        var squareShapeId = shapes[0].Id;
        var definitions = new[]
        {
            ("10x10", 10m, 10m, 1.2m, 100m, 0.180m, squareShapeId),
            ("5x5", 5m, 5m, 1.0m, 400m, 0.045m, squareShapeId),
            ("3x3", 3m, 3m, 0.8m, 1111m, 0.018m, squareShapeId),
            ("15x5-bejmat", 15m, 5m, 1.4m, 133m, 0.150m, squareShapeId),
            ("20x10-bejmat", 20m, 10m, 1.4m, 50m, 0.320m, squareShapeId),
        };

        var formats = new List<Format>();
        var order = 0;
        foreach (var (reference, width, height, thickness, unitsPerM2, weightPerUnit, shapeId) in definitions)
        {
            var weightPerM2 = Math.Round(weightPerUnit * unitsPerM2, 2);
            var format = Format.Create(reference, width, height, thickness, unitsPerM2, weightPerUnit, weightPerM2, shapeId, order++);
            format.UpsertTranslation("en", $"{width:0.#} x {height:0.#} cm", null);
            formats.Add(format);
        }

        return formats;
    }

    private static List<Color> SeedColors()
    {
        var definitions = new[]
        {
            ("1001", "Ivory", "Ivoire", "Marfil", "عاجي", "#EFE6D8", ColorFamily.White),
            ("1002", "Snow White", "Blanc Neige", "Blanco Nieve", "أبيض ثلجي", "#F7F5F2", ColorFamily.White),
            ("1003", "Sand", "Sable", "Arena", "رملي", "#D8C3A0", ColorFamily.Beige),
            ("1004", "Sage", "Sauge", "Salvia", "أخضر رمادي", "#9CAA8C", ColorFamily.Green),
            ("1005", "Emerald", "Émeraude", "Esmeralda", "زمردي", "#2F6E5C", ColorFamily.Green),
            ("1006", "Petrol Blue", "Bleu Pétrole", "Azul Petróleo", "أزرق بترولي", "#1F4E5F", ColorFamily.Blue),
            ("1007", "Deep Blue", "Bleu Profond", "Azul Profundo", "أزرق عميق", "#1A3A6B", ColorFamily.Blue),
            ("1008", "Sky Blue", "Bleu Ciel", "Azul Cielo", "أزرق سماوي", "#7FB6D9", ColorFamily.Blue),
            ("1009", "Terracotta", "Terre Cuite", "Terracota", "طيني", "#B5622C", ColorFamily.Orange),
            ("1010", "Black", "Noir", "Negro", "أسود", "#1C1C1C", ColorFamily.Black),
        };

        var colors = new List<Color>();
        var order = 0;
        foreach (var (code, en, fr, es, ar, hex, family) in definitions)
        {
            var color = Color.Create(code, family, order++);
            color.UpdateCore(code, family, hex, null, order);
            color.MarkAsDemo();
            color.UpsertTranslation("en", en, null);
            color.UpsertTranslation("fr", fr, null);
            color.UpsertTranslation("es", es, null);
            color.UpsertTranslation("ar", ar, null);
            colors.Add(color);
        }

        return colors;
    }

    private static List<Collection> SeedCollections()
    {
        var definitions = new[]
        {
            ("classic-zellige", "Classic Zellige", "Zellige Classique", "Zellige Clásico", "الزليج الكلاسيكي"),
            ("bejmat-collection", "Bejmat", "Bejmat", "Bejmat", "بجمات"),
            ("earth-tones", "Earth Tones", "Tons de Terre", "Tonos Tierra", "ألوان ترابية"),
            ("mediterranean", "Mediterranean", "Méditerranéen", "Mediterráneo", "متوسطي"),
            ("atlas", "Atlas", "Atlas", "Atlas", "أطلس"),
        };

        var collections = new List<Collection>();
        var order = 0;
        foreach (var (slug, en, fr, es, ar) in definitions)
        {
            var collection = Collection.Create(slug, order++);
            collection.UpsertTranslation("en", en, $"The {en} collection celebrates traditional Moroccan craftsmanship.", null, $"{en} Collection | MT ART", null);
            collection.UpsertTranslation("fr", fr, null, null, null, null);
            collection.UpsertTranslation("es", es, null, null, null, null);
            collection.UpsertTranslation("ar", ar, null, null, null, null);
            collection.MarkAsDemo();
            collections.Add(collection);
        }

        return collections;
    }

    private static List<Product> SeedProducts(
        List<ProductCategory> categories, List<Collection> collections, List<Shape> shapes,
        List<Finish> finishes, List<Color> colors, List<Format> formats)
    {
        var products = new List<Product>();
        var referenceCounter = 1020;

        for (var i = 0; i < 20; i++)
        {
            var category = categories[i % categories.Count];
            var collection = collections[i % collections.Count];
            var finish = finishes[i % finishes.Count];
            var reference = (referenceCounter++).ToString();
            var slug = $"{category.Code.ToLowerInvariant()}-{reference}";
            var name = $"{CategoryDisplayName(category.Code)} Model {reference}";

            var product = Product.Create(reference, slug, category.Id, i);
            product.UpdateCore(
                reference: reference,
                slug: slug,
                categoryId: category.Id,
                collectionId: collection.Id,
                shapeId: shapes[i % shapes.Count].Id,
                finishId: finish.Id,
                isCustomizable: i % 3 == 0,
                minimumOrderM2: 5m,
                unitsPerSquareMeter: null,
                weightPerSquareMeterKg: null,
                thicknessCm: 1.2m,
                countryOfOrigin: "Morocco",
                material: category.Code == "CEMENT" ? "Cement, sand, marble powder" : "Natural clay, mineral glaze",
                productionLeadTime: "4-6 weeks",
                displayOrder: i);

            product.UpsertTranslation(
                "en", name,
                $"Handmade {name}, crafted by MT ART artisans in Morocco.",
                $"Each {name} tile is individually shaped and glazed by hand, resulting in the natural variation that defines authentic Moroccan {CategoryDisplayName(category.Code)}.",
                "Formed from natural clay, sun-dried, hand-glazed and kiln-fired using traditional techniques passed down through generations of Moroccan artisans.",
                "Recommended for professional installation. Allow for natural size and color variation between pieces when planning layouts.",
                "Clean with a soft cloth and pH-neutral cleaner. Avoid abrasive or acidic products that could damage the glaze.",
                $"{name} | Handmade Moroccan Tile | MT ART",
                $"Discover {name}, a handmade Moroccan tile crafted by MT ART. Request a quote or free sample today.");
            product.UpsertTranslation("fr", $"{name} (FR)", $"{name} artisanal, fabriqué à la main au Maroc.", null, null, null, null, null, null);
            product.UpsertTranslation("es", $"{name} (ES)", $"{name} artesanal, hecho a mano en Marruecos.", null, null, null, null, null, null);
            product.UpsertTranslation("ar", $"{name} (AR)", $"{name} مصنوع يدويًا في المغرب.", null, null, null, null, null, null);

            // TODO: replace with real MediaId once product photography is imported (see /import/README.md).
            product.AddImage(Guid.NewGuid(), ProductImageRole.Primary, 0);
            product.AddImage(Guid.NewGuid(), ProductImageRole.Hover, 1);
            product.AddImage(Guid.NewGuid(), ProductImageRole.Gallery, 2);

            var color1 = colors[i % colors.Count];
            var color2 = colors[(i + 3) % colors.Count];
            var format1 = formats[i % formats.Count];
            var format2 = formats[(i + 1) % formats.Count];

            product.AddVariant(color1.Id, format1.Id, finish.Id, $"SKU-{reference}-1", reference,
                i % 4 == 0 ? StockStatus.MadeToOrder : StockStatus.InStock, format1.UnitsPerM2, format1.WeightPerM2Kg, format1.ThicknessCm, 5m);
            product.AddVariant(color2.Id, format2.Id, finish.Id, $"SKU-{reference}-2", $"{reference}B",
                i % 5 == 0 ? StockStatus.LowStock : StockStatus.InStock, format2.UnitsPerM2, format2.WeightPerM2Kg, format2.ThicknessCm, 5m);

            product.SetFeatured(i % 4 == 0);
            product.SetNew(i % 6 == 0);
            product.MarkAsDemo();
            product.Publish();

            products.Add(product);
        }

        return products;
    }

    private static string CategoryDisplayName(string code) => code switch
    {
        "ZELLIGE" => "Zellige",
        "BEJMAT" => "Bejmat",
        "CEMENT" => "Cement Tile",
        "TERRACOTTA" => "Terracotta",
        _ => code,
    };
}
