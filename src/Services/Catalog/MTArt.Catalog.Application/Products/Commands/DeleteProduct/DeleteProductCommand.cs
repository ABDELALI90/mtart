using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Products.Commands.DeleteProduct;

/// <summary>
/// Archives + soft-deletes a product rather than physically removing it - products may be
/// referenced by historical quote/sample requests in the Inquiry service.
/// </summary>
public sealed record DeleteProductCommand(Guid ProductId) : IRequest<Result>;
