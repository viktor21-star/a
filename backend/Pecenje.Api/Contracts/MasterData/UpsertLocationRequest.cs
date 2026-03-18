namespace Pecenje.Api.Contracts.MasterData;

public sealed record UpsertLocationRequest(
    string Code,
    string NameMk,
    string RegionCode,
    bool IsActive
);
