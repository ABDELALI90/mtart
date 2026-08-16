namespace MTArt.SharedKernel.Cqrs;

/// <summary>Marker for a command or query that returns <typeparamref name="TResponse"/>.</summary>
public interface IRequest<TResponse>
{
}

/// <summary>A command/query whose handler returns no data.</summary>
public interface IRequest : IRequest<Unit>
{
}

/// <summary>Void substitute, since C# has no non-generic "no value" type usable as a generic argument.</summary>
public readonly record struct Unit
{
    public static readonly Unit Value = default;
}
