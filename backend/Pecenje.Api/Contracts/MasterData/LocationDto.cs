namespace Pecenje.Api.Contracts.MasterData;

public sealed record LocationDto(
    int LocationId,
    string Code,
    string NameMk,
    string RegionCode,
    bool IsActive
);
