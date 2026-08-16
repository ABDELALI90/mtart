using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Collections.Commands.UpsertCollectionTranslation;

public sealed record UpsertCollectionTranslationCommand(
    Guid CollectionId, string LanguageCode, string Name, string? Story,
    string? Description, string? SeoTitle, string? SeoDescription) : IRequest<Result>;
