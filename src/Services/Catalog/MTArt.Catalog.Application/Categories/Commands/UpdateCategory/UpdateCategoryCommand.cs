using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Categories.Commands.UpdateCategory;

public sealed record UpdateCategoryCommand(Guid CategoryId, string Code, string Slug, int DisplayOrder, Guid? ImageId, bool IsActive) : IRequest<Result>;
