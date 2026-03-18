namespace Pecenje.Api.Contracts.MasterData;

public sealed record ItemDto(
    int ItemId,
    string Code,
    string NameMk,
    string GroupName,
    decimal SalesPrice,
    decimal WasteLimitPct,
    bool IsActive
);
