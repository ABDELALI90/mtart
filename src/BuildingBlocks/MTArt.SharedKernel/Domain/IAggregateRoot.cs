namespace MTArt.SharedKernel.Domain;

/// <summary>
/// Marks an entity as an aggregate root - the only kind of entity a repository
/// should load or persist directly. Child entities are reached through the root.
/// </summary>
public interface IAggregateRoot
{
}
