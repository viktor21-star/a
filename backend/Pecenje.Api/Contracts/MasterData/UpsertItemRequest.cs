namespace Pecenje.Api.Contracts.MasterData;

public sealed record UpsertItemRequest(
    string Code,
    string NameMk,
    string GroupName,
    decimal SalesPrice,
    decimal WasteLimitPct,
    bool IsActive
);
