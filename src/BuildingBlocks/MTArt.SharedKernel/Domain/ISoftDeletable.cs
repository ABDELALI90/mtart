namespace MTArt.SharedKernel.Domain;

/// <summary>
/// Entities that should be archived rather than physically deleted (e.g. Products,
/// which may be referenced by historical inquiries/orders).
/// </summary>
public interface ISoftDeletable
{
    bool IsDeleted { get; set; }
    DateTimeOffset? DeletedAt { get; set; }
}
