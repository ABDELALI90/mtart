using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Domain.Products;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Exceptions;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Products.Commands.RemoveProductVariant;

public sealed class RemoveProductVariantCommandHandler(ICatalogDbContext dbContext)
    : IRequestHandler<RemoveProductVariantCommand, Result>
{
    public async Task<Result> Handle(RemoveProductVariantCommand request, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken)
            ?? throw new NotFoundException(nameof(Product), request.ProductId);

        product.RemoveVariant(request.VariantId);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
