using MTArt.EventBus;

namespace MTArt.Contracts.IntegrationEvents;

/// <summary>Published by the Catalog service when a product is published, so caches can be invalidated and the sitemap regenerated.</summary>
public sealed record ProductPublished : IntegrationEvent
{
    public required Guid ProductId { get; init; }
    public required string Slug { get; init; }
    public required string CategorySlug { get; init; }
}

/// <summary>Published by the Catalog service whenever a published product changes (for cache invalidation).</summary>
public sealed record ProductUpdated : IntegrationEvent
{
    public required Guid ProductId { get; init; }
    public required string Slug { get; init; }
}

/// <summary>Published by the Content service when a new/updated PDF catalog is published.</summary>
public sealed record CatalogPublished : IntegrationEvent
{
    public required Guid CatalogId { get; init; }
    public required string Title { get; init; }
}
