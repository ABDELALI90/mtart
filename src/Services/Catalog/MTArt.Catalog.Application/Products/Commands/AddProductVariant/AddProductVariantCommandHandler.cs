using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Domain.Products;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Exceptions;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Products.Commands.AddProductVariant;

public sealed class AddProductVariantCommandHandler(ICatalogDbContext dbContext)
    : IRequestHandler<AddProductVariantCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(AddProductVariantCommand request, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken)
            ?? throw new NotFoundException(nameof(Product), request.ProductId);

        var variant = product.AddVariant(
            request.ColorId, request.FormatId, request.FinishId, request.Sku, request.Reference,
            request.StockStatus, request.UnitsPerM2, request.WeightPerM2Kg, request.ThicknessCm, request.MinimumOrder);

        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success(variant.Id);
    }
}
