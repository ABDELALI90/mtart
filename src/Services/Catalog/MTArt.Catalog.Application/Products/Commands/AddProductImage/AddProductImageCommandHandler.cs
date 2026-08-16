using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Domain.Products;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Exceptions;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Products.Commands.AddProductImage;

public sealed class AddProductImageCommandHandler(ICatalogDbContext dbContext)
    : IRequestHandler<AddProductImageCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(AddProductImageCommand request, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken)
            ?? throw new NotFoundException(nameof(Product), request.ProductId);

        var image = product.AddImage(request.MediaId, request.Role, request.DisplayOrder);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success(image.Id);
    }
}
