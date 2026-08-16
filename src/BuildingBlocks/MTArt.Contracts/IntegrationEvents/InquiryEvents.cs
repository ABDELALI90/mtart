using MTArt.EventBus;

namespace MTArt.Contracts.IntegrationEvents;

/// <summary>Published by the Inquiry service when a customer submits the quote request form.</summary>
public sealed record QuotationRequested : IntegrationEvent
{
    public required string LeadReference { get; init; } // e.g. MTQ-2026-000123
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
    public required string Email { get; init; }
    public string? Phone { get; init; }
    public string? Company { get; init; }
    public required string Country { get; init; }
    public required string CustomerType { get; init; }
    public required string ProjectType { get; init; }
    public string? ProductReference { get; init; }
    public string? ProductName { get; init; }
    public decimal? QuantityM2 { get; init; }
    public required string LanguageCode { get; init; }
}

/// <summary>Published by the Inquiry service when a customer requests physical samples.</summary>
public sealed record SampleRequested : IntegrationEvent
{
    public required string LeadReference { get; init; }
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
    public required string Email { get; init; }
    public required string Country { get; init; }
    public required IReadOnlyList<string> ProductReferences { get; init; }
    public required string LanguageCode { get; init; }
}

/// <summary>Published by the Inquiry service for general contact-form submissions.</summary>
public sealed record ContactRequestSubmitted : IntegrationEvent
{
    public required string LeadReference { get; init; }
    public required string Name { get; init; }
    public required string Email { get; init; }
    public required string Message { get; init; }
    public required string LanguageCode { get; init; }
}
