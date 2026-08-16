using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Collections.Commands.CreateCollection;

public sealed record CreateCollectionCommand(string Slug, int DisplayOrder, string Name) : IRequest<Result<Guid>>;
