using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Products.Commands.PublishProduct;

public sealed record PublishProductCommand(Guid ProductId) : IRequest<Result>;
