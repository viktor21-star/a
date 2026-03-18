using Pecenje.Api.Contracts.MasterData;

namespace Pecenje.Api.Application.Abstractions;

public interface IMasterDataRepository
{
    Task<IReadOnlyList<LocationDto>> GetLocationsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ItemDto>> GetItemsAsync(CancellationToken cancellationToken = default);
    Task<LocationDto> CreateLocationAsync(UpsertLocationRequest request, CancellationToken cancellationToken = default);
    Task<LocationDto> UpdateLocationAsync(int locationId, UpsertLocationRequest request, CancellationToken cancellationToken = default);
    Task<ItemDto> CreateItemAsync(UpsertItemRequest request, CancellationToken cancellationToken = default);
    Task<ItemDto> UpdateItemAsync(int itemId, UpsertItemRequest request, CancellationToken cancellationToken = default);
}
