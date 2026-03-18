using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.Production;
using Pecenje.Api.Contracts.Waste;

namespace Pecenje.Api.Application.Services;

public sealed class ProductionAppService(
    IProductionRepository productionRepository,
    LocationAccessAppService locationAccessAppService)
{
    public async Task<IReadOnlyList<BatchDetailDto>> GetBatchesAsync(CancellationToken cancellationToken = default)
    {
        var allowedLocationIds = await locationAccessAppService.GetAllowedLocationIdsAsync(cancellationToken);
        var batches = await productionRepository.GetActiveBatchesAsync(cancellationToken);
        return batches.Where(x => allowedLocationIds.Contains(x.LocationId)).ToList();
    }

    public async Task<IReadOnlyList<WasteSummaryDto>> GetWasteAsync(CancellationToken cancellationToken = default)
    {
        var allowedLocationIds = await locationAccessAppService.GetAllowedLocationIdsAsync(cancellationToken);
        var waste = await productionRepository.GetRecentWasteAsync(cancellationToken);
        return waste.Where(x => allowedLocationIds.Contains(x.LocationId)).ToList();
    }
}
