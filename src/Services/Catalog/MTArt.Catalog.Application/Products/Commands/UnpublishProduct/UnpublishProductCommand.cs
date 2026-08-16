using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Products.Commands.UnpublishProduct;

public sealed record UnpublishProductCommand(Guid ProductId) : IRequest<Result>;
