using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Domain.Products;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Exceptions;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Products.Commands.RemoveProductImage;

public sealed class RemoveProductImageCommandHandler(ICatalogDbContext dbContext)
    : IRequestHandler<RemoveProductImageCommand, Result>
{
    public async Task<Result> Handle(RemoveProductImageCommand request, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken)
            ?? throw new NotFoundException(nameof(Product), request.ProductId);

        product.RemoveImage(request.ImageId);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
