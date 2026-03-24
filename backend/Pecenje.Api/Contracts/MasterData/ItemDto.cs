namespace Pecenje.Api.Contracts.MasterData;

public sealed record ItemDto(
    int ItemId,
    string Code,
    string NameMk,
    string GroupCode,
    string GroupName,
    decimal SalesPrice,
    decimal WasteLimitPct,
    bool IsActive,
    string? ClassBCode,
    string? ClassBName
);
