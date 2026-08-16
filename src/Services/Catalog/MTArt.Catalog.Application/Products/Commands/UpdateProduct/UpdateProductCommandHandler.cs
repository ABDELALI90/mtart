using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Domain.Products;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Exceptions;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Products.Commands.UpdateProduct;

public sealed class UpdateProductCommandHandler(ICatalogDbContext dbContext) : IRequestHandler<UpdateProductCommand, Result>
{
    public async Task<Result> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products.FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken)
            ?? throw new NotFoundException(nameof(Product), request.ProductId);

        product.UpdateCore(
            request.Reference, request.Slug, request.CategoryId, request.CollectionId, request.ShapeId, request.FinishId,
            request.IsCustomizable, request.MinimumOrderM2, request.UnitsPerSquareMeter, request.WeightPerSquareMeterKg,
            request.ThicknessCm, request.CountryOfOrigin, request.Material, request.ProductionLeadTime, request.DisplayOrder);

        product.SetFeatured(request.IsFeatured);
        product.SetNew(request.IsNew);

        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
