namespace MTArt.SharedKernel.Domain;

/// <summary>
/// Marker for something that happened inside a service's domain. Domain events stay
/// in-process (dispatched via the in-process mediator); integration events (published
/// to RabbitMQ) are a separate, explicit concept - see MTArt.EventBus.
/// </summary>
public interface IDomainEvent
{
    DateTimeOffset OccurredOn { get; }
}
