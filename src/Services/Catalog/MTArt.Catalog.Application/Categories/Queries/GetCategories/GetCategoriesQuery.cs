using MTArt.Catalog.Application.Categories.Dtos;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Categories.Queries.GetCategories;

public sealed record GetCategoriesQuery(string LanguageCode, bool ActiveOnly = true) : IRequest<Result<IReadOnlyList<CategoryDto>>>;
