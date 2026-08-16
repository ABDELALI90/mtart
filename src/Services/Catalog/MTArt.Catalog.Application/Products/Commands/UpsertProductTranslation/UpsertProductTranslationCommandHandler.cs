using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Domain.Products;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Exceptions;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Products.Commands.UpsertProductTranslation;

public sealed class UpsertProductTranslationCommandHandler(ICatalogDbContext dbContext)
    : IRequestHandler<UpsertProductTranslationCommand, Result>
{
    public async Task<Result> Handle(UpsertProductTranslationCommand request, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products
            .Include(p => p.Translations)
            .FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken)
            ?? throw new NotFoundException(nameof(Product), request.ProductId);

        product.UpsertTranslation(
            request.LanguageCode, request.Name, request.ShortDescription, request.Description,
            request.Craftsmanship, request.InstallationAdvice, request.MaintenanceAdvice,
            request.SeoTitle, request.SeoDescription);

        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
