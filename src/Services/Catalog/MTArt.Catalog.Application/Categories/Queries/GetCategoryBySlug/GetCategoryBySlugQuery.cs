using MTArt.Catalog.Application.Categories.Dtos;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Categories.Queries.GetCategoryBySlug;

public sealed record GetCategoryBySlugQuery(string Slug, string LanguageCode) : IRequest<Result<CategoryDto>>;
