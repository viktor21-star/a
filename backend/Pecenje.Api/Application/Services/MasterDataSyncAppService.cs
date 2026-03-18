using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.MasterData;

namespace Pecenje.Api.Application.Services;

public sealed class MasterDataSyncAppService(
    ISourceMasterDataReader sourceReader,
    IMasterDataRepository masterDataRepository,
    IMasterDataSyncRunRepository syncRunRepository)
{
    public async Task<int> SyncLocationsAsync(CancellationToken cancellationToken = default)
    {
        var syncRunId = await syncRunRepository.StartAsync("locations", "ExternalRetailDb", cancellationToken);
        try
        {
            var sourceRows = await sourceReader.ReadLocationsAsync(cancellationToken);

            foreach (var row in sourceRows)
            {
                await masterDataRepository.CreateLocationAsync(
                    new UpsertLocationRequest(row.Code, row.NameMk, row.RegionCode, row.IsActive),
                    cancellationToken);
            }

            await syncRunRepository.FinishAsync(syncRunId, "completed", sourceRows.Count, sourceRows.Count, 0, 0, null, cancellationToken);
            return sourceRows.Count;
        }
        catch (Exception ex)
        {
            await syncRunRepository.FinishAsync(syncRunId, "failed", 0, 0, 0, 0, ex.Message, cancellationToken);
            throw;
        }
    }

    public async Task<int> SyncItemsAsync(CancellationToken cancellationToken = default)
    {
        var syncRunId = await syncRunRepository.StartAsync("items", "ExternalRetailDb", cancellationToken);
        try
        {
            var sourceRows = await sourceReader.ReadItemsAsync(cancellationToken);

            foreach (var row in sourceRows)
            {
                await masterDataRepository.CreateItemAsync(
                    new UpsertItemRequest(row.Code, row.NameMk, row.GroupName, row.SalesPrice, 5, row.IsActive),
                    cancellationToken);
            }

            await syncRunRepository.FinishAsync(syncRunId, "completed", sourceRows.Count, sourceRows.Count, 0, 0, null, cancellationToken);
            return sourceRows.Count;
        }
        catch (Exception ex)
        {
            await syncRunRepository.FinishAsync(syncRunId, "failed", 0, 0, 0, 0, ex.Message, cancellationToken);
            throw;
        }
    }
}
