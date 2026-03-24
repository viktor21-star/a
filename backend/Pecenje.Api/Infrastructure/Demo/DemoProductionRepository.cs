using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.Common;
using Pecenje.Api.Contracts.Production;
using Pecenje.Api.Contracts.Waste;
using Pecenje.Api.Services;

namespace Pecenje.Api.Infrastructure.Demo;

public sealed class DemoProductionRepository(
    DemoDataService demoDataService,
    InMemoryOperatorEntryStore operatorEntryStore,
    InMemoryWasteStore wasteStore) : IProductionRepository
{
    public Task<IReadOnlyList<BatchDetailDto>> GetActiveBatchesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var localEntries = operatorEntryStore.GetAll();
            if (localEntries.Count > 0)
            {
                var mapped = localEntries
                    .SelectMany(entry => entry.Items.Select((item, index) => new BatchDetailDto(
                        Math.Abs(HashCode.Combine(entry.Id, index)),
                        entry.LocationId,
                        item.ItemName,
                        entry.LocationName,
                        entry.Mode == "pecenjara" ? "Печењара" : entry.Mode == "pijara" ? "Пијара" : "Пекара",
                        entry.CreatedAt,
                        item.Quantity,
                        "снимено",
                        entry.OperatorName,
                        entry.CreatedAt,
                        null)))
                    .OrderByDescending(entry => entry.StartTime)
                    .ToArray();

                return Task.FromResult<IReadOnlyList<BatchDetailDto>>(mapped);
            }
        }
        catch
        {
        }

        return Task.FromResult(demoDataService.GetBatches());
    }

    public Task<IReadOnlyList<WasteSummaryDto>> GetRecentWasteAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var local = wasteStore.GetAll();
            if (local.Count > 0)
            {
                return Task.FromResult<IReadOnlyList<WasteSummaryDto>>(local);
            }
        }
        catch
        {
            // Fall back to demo rows if local persistence is unavailable.
        }

        return Task.FromResult(demoDataService.GetWasteEntries());
    }

    public Task<WasteSummaryDto> CreateWasteEntryAsync(CreateWasteEntryRequest request, string operatorName, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(wasteStore.Add(request, operatorName));
    }

    public Task<IReadOnlyList<OperatorEntryDto>> GetOperatorEntriesAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IReadOnlyList<OperatorEntryDto>>(operatorEntryStore.GetAll());
    }

    public Task<OperatorEntryDto> CreateOperatorEntryAsync(CreateOperatorEntryRequest request, long userId, string operatorName, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(operatorEntryStore.Add(request, userId, operatorName));
    }

    public Task<PhotoAssetDto?> GetOperatorEntryPhotoAsync(string entryId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(operatorEntryStore.GetPhoto(entryId));
    }

    public Task<PhotoAssetDto?> GetWastePhotoAsync(long wasteEntryId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(wasteStore.GetPhoto(wasteEntryId));
    }
}
