using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.MasterData;
using Pecenje.Api.Infrastructure.Demo;
using Pecenje.Api.Infrastructure.SqlServer;

namespace Pecenje.Api.Infrastructure.Sqlite;

public sealed class HybridMasterDataRepository(
    SqliteLocationRepository sqliteLocationRepository,
    SqlServerMasterDataRepository sqlServerRepository,
    DemoMasterDataRepository demoRepository) : IMasterDataRepository
{
    public Task<IReadOnlyList<LocationDto>> GetLocationsAsync(CancellationToken cancellationToken = default)
        => sqliteLocationRepository.GetLocationsAsync(cancellationToken);

    public Task<LocationDto> CreateLocationAsync(UpsertLocationRequest request, CancellationToken cancellationToken = default)
        => sqliteLocationRepository.CreateLocationAsync(request, cancellationToken);

    public Task<LocationDto> UpdateLocationAsync(int locationId, UpsertLocationRequest request, CancellationToken cancellationToken = default)
        => sqliteLocationRepository.UpsertLocationAsync(locationId, request, cancellationToken);

    public async Task<IReadOnlyList<ItemDto>> GetItemsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await sqlServerRepository.GetItemsAsync(cancellationToken);
        }
        catch
        {
            return await demoRepository.GetItemsAsync(cancellationToken);
        }
    }

    public async Task<ItemDto> CreateItemAsync(UpsertItemRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            return await sqlServerRepository.CreateItemAsync(request, cancellationToken);
        }
        catch
        {
            return await demoRepository.CreateItemAsync(request, cancellationToken);
        }
    }

    public async Task<ItemDto> UpdateItemAsync(int itemId, UpsertItemRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            return await sqlServerRepository.UpdateItemAsync(itemId, request, cancellationToken);
        }
        catch
        {
            return await demoRepository.UpdateItemAsync(itemId, request, cancellationToken);
        }
    }
}
