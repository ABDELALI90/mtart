using MTArt.Catalog.Domain;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Products.Commands.AddProductImage;

/// <summary>MediaId must already exist in the Media service - Catalog trusts but does not re-validate file existence synchronously (kept eventually consistent via MediaDeleted events).</summary>
public sealed record AddProductImageCommand(Guid ProductId, Guid MediaId, ProductImageRole Role, int DisplayOrder) : IRequest<Result<Guid>>;
