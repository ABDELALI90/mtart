using MTArt.Catalog.Domain;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Colors.Commands.CreateColor;

public sealed record CreateColorCommand(string Code, ColorFamily Family, string Name, string? HexApproximation, int DisplayOrder) : IRequest<Result<Guid>>;
