namespace MTArt.SharedKernel.Cqrs;

/// <summary>An in-process notification that zero or more handlers may react to.</summary>
public interface INotification
{
}

public interface INotificationHandler<in TNotification>
    where TNotification : INotification
{
    Task Handle(TNotification notification, CancellationToken cancellationToken);
}
