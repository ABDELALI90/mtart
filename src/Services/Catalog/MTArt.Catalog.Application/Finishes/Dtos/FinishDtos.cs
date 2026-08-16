namespace MTArt.Catalog.Application.Finishes.Dtos;

public sealed record FinishDto(Guid Id, string Code, string Name, int DisplayOrder, bool IsActive);
