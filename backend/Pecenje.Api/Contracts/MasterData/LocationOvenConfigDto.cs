namespace Pecenje.Api.Contracts.MasterData;

public sealed record OvenModeConfigDto(
    string OvenType,
    int OvenCount,
    int OvenCapacity
);

public sealed record LocationOvenConfigDto(
    int LocationId,
    OvenModeConfigDto Pekara,
    OvenModeConfigDto Pecenjara
);

public sealed record UpdateLocationOvensRequest(
    IReadOnlyList<LocationOvenConfigDto> Locations
);
