using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Categories.Commands.UpsertCategoryTranslation;

public sealed record UpsertCategoryTranslationCommand(
    Guid CategoryId, string LanguageCode, string Name, string? ShortDescription,
    string? Description, string? SeoTitle, string? SeoDescription) : IRequest<Result>;
