using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Products.Commands.RemoveProductImage;

public sealed record RemoveProductImageCommand(Guid ProductId, Guid ImageId) : IRequest<Result>;
