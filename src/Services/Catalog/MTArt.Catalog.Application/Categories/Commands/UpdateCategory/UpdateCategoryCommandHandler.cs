using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Domain.Categories;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Exceptions;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Categories.Commands.UpdateCategory;

public sealed class UpdateCategoryCommandHandler(ICatalogDbContext dbContext) : IRequestHandler<UpdateCategoryCommand, Result>
{
    public async Task<Result> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await dbContext.Categories.FirstOrDefaultAsync(c => c.Id == request.CategoryId, cancellationToken)
            ?? throw new NotFoundException(nameof(ProductCategory), request.CategoryId);

        category.UpdateCore(request.Code, request.Slug, request.DisplayOrder, request.ImageId);

        if (request.IsActive) category.Activate(); else category.Deactivate();

        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
