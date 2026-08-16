namespace MTArt.SharedKernel.Domain;

/// <summary>
/// Adds creation/modification tracking. <see cref="IAuditableEntity"/> lets infrastructure
/// interceptors (e.g. EF Core SaveChanges interceptor) stamp these fields without every
/// service having to duplicate the plumbing.
/// </summary>
public interface IAuditableEntity
{
    DateTimeOffset CreatedAt { get; set; }
    DateTimeOffset? UpdatedAt { get; set; }
}

public abstract class AuditableEntity<TId> : Entity<TId>, IAuditableEntity
    where TId : notnull
{
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }

    protected AuditableEntity()
    {
    }

    protected AuditableEntity(TId id) : base(id)
    {
    }
}
