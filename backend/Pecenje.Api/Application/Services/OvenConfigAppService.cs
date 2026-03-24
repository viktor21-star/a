using Pecenje.Api.Contracts.MasterData;
using Pecenje.Api.Infrastructure.Demo;

namespace Pecenje.Api.Application.Services;

public sealed class OvenConfigAppService(InMemoryLocationOvenStore store)
{
    public Task<IReadOnlyList<LocationOvenConfigDto>> GetLocationOvensAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return Task.FromResult(store.GetAll());
        }
        catch
        {
            return Task.FromResult<IReadOnlyList<LocationOvenConfigDto>>([]);
        }
    }

    public Task<IReadOnlyList<LocationOvenConfigDto>> SaveLocationOvensAsync(UpdateLocationOvensRequest request, CancellationToken cancellationToken = default)
    {
        var sanitized = (request.Locations ?? [])
            .GroupBy(entry => entry.LocationId)
            .Select(group => group.Last())
            .Select(entry => new LocationOvenConfigDto(
                entry.LocationId,
                SanitizeMode(entry.Pekara),
                SanitizeMode(entry.Pecenjara)))
            .ToArray();

        try
        {
            return Task.FromResult(store.ReplaceAll(sanitized));
        }
        catch
        {
            return Task.FromResult<IReadOnlyList<LocationOvenConfigDto>>(sanitized);
        }
    }

    private static OvenModeConfigDto SanitizeMode(OvenModeConfigDto? mode)
    {
        var ovenType = string.IsNullOrWhiteSpace(mode?.OvenType) ? "Нема" : mode!.OvenType.Trim();
        return new OvenModeConfigDto(
            ovenType,
            Math.Max(0, mode?.OvenCount ?? 0),
            Math.Max(0, mode?.OvenCapacity ?? 0));
    }
}
