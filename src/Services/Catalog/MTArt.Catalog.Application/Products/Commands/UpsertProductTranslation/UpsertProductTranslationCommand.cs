using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Products.Commands.UpsertProductTranslation;

public sealed record UpsertProductTranslationCommand(
    Guid ProductId,
    string LanguageCode,
    string Name,
    string? ShortDescription,
    string? Description,
    string? Craftsmanship,
    string? InstallationAdvice,
    string? MaintenanceAdvice,
    string? SeoTitle,
    string? SeoDescription) : IRequest<Result>;
