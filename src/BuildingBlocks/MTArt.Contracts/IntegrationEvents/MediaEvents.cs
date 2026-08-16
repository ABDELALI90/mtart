using MTArt.EventBus;

namespace MTArt.Contracts.IntegrationEvents;

/// <summary>Published by the Media service after a file is deleted, so other services can null out dangling references.</summary>
public sealed record MediaDeleted : IntegrationEvent
{
    public required Guid MediaId { get; init; }
    public required string StorageKey { get; init; }
}
