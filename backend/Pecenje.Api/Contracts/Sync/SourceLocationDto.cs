namespace Pecenje.Api.Contracts.Sync;

public sealed record SourceLocationDto(
    string SourceLocationId,
    string Code,
    string NameMk,
    string RegionCode,
    bool IsActive
);
