using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.MasterData;

namespace Pecenje.Api.Infrastructure.Demo;

public sealed class DemoMasterDataRepository : IMasterDataRepository
{
    public Task<IReadOnlyList<LocationDto>> GetLocationsAsync(CancellationToken cancellationToken = default)
    {
        IReadOnlyList<LocationDto> data = new[]
        {
            new LocationDto(1, "AER1", "Аеродром 1", "СКОПЈЕ", true),
            new LocationDto(2, "CEN1", "Центар", "СКОПЈЕ", true),
            new LocationDto(3, "KAR1", "Карпош", "СКОПЈЕ", true),
            new LocationDto(4, "BIT1", "Битола 1", "ЈУГОЗАПАД", false)
        };

        return Task.FromResult(data);
    }

    public Task<IReadOnlyList<ItemDto>> GetItemsAsync(CancellationToken cancellationToken = default)
    {
        IReadOnlyList<ItemDto> data = new[]
        {
            new ItemDto(101, "BUR-MES", "Бурек со месо", "Буреци", 45, 5, true),
            new ItemDto(102, "BUR-SIR", "Бурек со сирење", "Буреци", 42, 5, true),
            new ItemDto(201, "KIF-STD", "Кифла", "Пецива", 18, 3, true),
            new ItemDto(301, "PIL-CEL", "Печено пиле", "Пилиња", 289, 2, true)
        };

        return Task.FromResult(data);
    }

    public Task<LocationDto> CreateLocationAsync(UpsertLocationRequest request, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new LocationDto(999, request.Code, request.NameMk, request.RegionCode, request.IsActive));
    }

    public Task<LocationDto> UpdateLocationAsync(int locationId, UpsertLocationRequest request, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new LocationDto(locationId, request.Code, request.NameMk, request.RegionCode, request.IsActive));
    }

    public Task<ItemDto> CreateItemAsync(UpsertItemRequest request, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new ItemDto(999, request.Code, request.NameMk, request.GroupName, request.SalesPrice, request.WasteLimitPct, request.IsActive));
    }

    public Task<ItemDto> UpdateItemAsync(int itemId, UpsertItemRequest request, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new ItemDto(itemId, request.Code, request.NameMk, request.GroupName, request.SalesPrice, request.WasteLimitPct, request.IsActive));
    }
}
