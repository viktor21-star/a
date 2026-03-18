namespace Pecenje.Api.Contracts.Alerts;

public sealed record AlertDto(
    long AlertId,
    int LocationId,
    string Severity,
    string LocationName,
    string ItemName,
    string Message,
    string Status
);
