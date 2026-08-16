using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Products.Commands.RemoveProductVariant;

public sealed record RemoveProductVariantCommand(Guid ProductId, Guid VariantId) : IRequest<Result>;
