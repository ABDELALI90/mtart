using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Domain.Products;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Products.Commands.PublishProduct;

/// <summary>
/// Publishing is where the integration event boundary lives: once a product goes live, other
/// services (cache warmers, sitemap, notification) need to know. For MVP this publishes
/// directly after a successful save; a transactional outbox can be introduced later without
/// changing this handler's public shape (see /docs/architecture.md).
/// </summary>
public sealed class PublishProductCommandHandler(ICatalogDbContext dbContext) : IRequestHandler<PublishProductCommand, Result>
{
    public async Task<Result> Handle(PublishProductCommand request, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products
            .Include(p => p.Translations)
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken);

        if (product is null)
        {
            return Result.Failure(Error.NotFound("products.not_found", $"Product '{request.ProductId}' was not found."));
        }

        try
        {
            product.Publish();
        }
        catch (InvalidOperationException ex)
        {
            return Result.Failure(Error.Validation("products.publish_invalid", ex.Message));
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
