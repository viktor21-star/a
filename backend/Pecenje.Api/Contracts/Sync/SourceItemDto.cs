namespace Pecenje.Api.Contracts.Sync;

public sealed record SourceItemDto(
    string SourceItemId,
    string Code,
    string NameMk,
    string GroupCode,
    string GroupName,
    decimal SalesPrice,
    bool IsActive,
    string? AllowedLocationCode
);
