namespace MTArt.EventBus;

public sealed class EventBusOptions
{
    public const string SectionName = "RabbitMq";

    public string Host { get; set; } = "localhost";
    public string VirtualHost { get; set; } = "/";
    public string Username { get; set; } = "guest";
    public string Password { get; set; } = "guest";

    /// <summary>Prefix applied to every exchange/queue name so services never collide (e.g. "mtart").</summary>
    public string TopologyPrefix { get; set; } = "mtart";
}
