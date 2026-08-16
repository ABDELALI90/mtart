using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Categories.Commands.CreateCategory;

public sealed record CreateCategoryCommand(string Code, string Slug, int DisplayOrder, string Name) : IRequest<Result<Guid>>;
