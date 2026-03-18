namespace Pecenje.Api.Contracts.Sync;

public sealed record SourceItemDto(
    string SourceItemId,
    string Code,
    string NameMk,
    string GroupName,
    decimal SalesPrice,
    bool IsActive
);
