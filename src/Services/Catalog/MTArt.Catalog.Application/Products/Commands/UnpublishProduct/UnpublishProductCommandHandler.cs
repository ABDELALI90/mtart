using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Domain.Products;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Exceptions;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Products.Commands.UnpublishProduct;

public sealed class UnpublishProductCommandHandler(ICatalogDbContext dbContext) : IRequestHandler<UnpublishProductCommand, Result>
{
    public async Task<Result> Handle(UnpublishProductCommand request, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products.FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken)
            ?? throw new NotFoundException(nameof(Product), request.ProductId);

        product.Unpublish();
        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
