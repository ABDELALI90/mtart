namespace MTArt.SharedKernel.Cqrs;

/// <summary>The application-facing entry point for dispatching commands/queries and notifications.</summary>
public interface ISender
{
    Task<TResponse> Send<TResponse>(IRequest<TResponse> request, CancellationToken cancellationToken = default);

    Task Publish<TNotification>(TNotification notification, CancellationToken cancellationToken = default)
        where TNotification : INotification;
}
