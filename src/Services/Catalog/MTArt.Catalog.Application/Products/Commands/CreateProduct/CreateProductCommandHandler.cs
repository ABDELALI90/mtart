using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Domain.Products;
using MTArt.Catalog.Domain.ValueObjects;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Products.Commands.CreateProduct;

public sealed class CreateProductCommandHandler(ICatalogDbContext dbContext)
    : IRequestHandler<CreateProductCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        var requestedSlug = Slug.Create(request.Slug);
        var slugTaken = await dbContext.Products.AnyAsync(p => p.Slug.Value == requestedSlug.Value, cancellationToken);
        if (slugTaken)
        {
            return Result.Failure<Guid>(Error.Conflict("products.slug_taken", $"A product with slug '{request.Slug}' already exists."));
        }

        var referenceTaken = await dbContext.Products.AnyAsync(p => p.Reference == request.Reference, cancellationToken);
        if (referenceTaken)
        {
            return Result.Failure<Guid>(Error.Conflict("products.reference_taken", $"A product with reference '{request.Reference}' already exists."));
        }

        var product = Product.Create(request.Reference, request.Slug, request.CategoryId, request.DisplayOrder);

        product.UpdateCore(
            request.Reference, request.Slug, request.CategoryId, request.CollectionId, request.ShapeId, request.FinishId,
            request.IsCustomizable, request.MinimumOrderM2, request.UnitsPerSquareMeter, request.WeightPerSquareMeterKg,
            request.ThicknessCm, request.CountryOfOrigin, request.Material, request.ProductionLeadTime, request.DisplayOrder);

        dbContext.Products.Add(product);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success(product.Id);
    }
}
