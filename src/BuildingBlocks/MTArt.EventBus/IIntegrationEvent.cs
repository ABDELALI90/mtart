namespace MTArt.EventBus;

/// <summary>
/// Marker for something published across service boundaries via RabbitMQ. Keep this list
/// deliberately small (see /docs/architecture.md) - most cross-cutting concerns inside a
/// single service should use the in-process INotification from MTArt.SharedKernel instead.
/// </summary>
public interface IIntegrationEvent
{
    Guid EventId { get; }
    DateTimeOffset OccurredOn { get; }
}

public abstract record IntegrationEvent : IIntegrationEvent
{
    public Guid EventId { get; init; } = Guid.NewGuid();
    public DateTimeOffset OccurredOn { get; init; } = DateTimeOffset.UtcNow;
}
