using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.MasterData;

namespace Pecenje.Api.Infrastructure.Demo;

public sealed class DemoMasterDataRepository : IMasterDataRepository
{
    private static readonly List<LocationDto> Locations =
    [
        new LocationDto(1, "AER1", "Аеродром 1", "СКОПЈЕ", true),
        new LocationDto(2, "CEN1", "Центар", "СКОПЈЕ", true),
        new LocationDto(3, "KAR1", "Карпош", "СКОПЈЕ", true),
        new LocationDto(4, "BIT1", "Битола 1", "ЈУГОЗАПАД", false)
    ];

    private static readonly List<ItemDto> Items =
    [
        new ItemDto(101, "BUR-MES", "Бурек со месо", "Буреци", 45, 5, true),
        new ItemDto(102, "BUR-SIR", "Бурек со сирење", "Буреци", 42, 5, true),
        new ItemDto(201, "KIF-STD", "Кифла", "Пецива", 18, 3, true),
        new ItemDto(301, "PIL-CEL", "Печено пиле", "Пилиња", 289, 2, true)
    ];

    public Task<IReadOnlyList<LocationDto>> GetLocationsAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IReadOnlyList<LocationDto>>(Locations.OrderBy((location) => location.NameMk).ToArray());
    }

    public Task<IReadOnlyList<ItemDto>> GetItemsAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IReadOnlyList<ItemDto>>(Items.OrderBy((item) => item.NameMk).ToArray());
    }

    public Task<LocationDto> CreateLocationAsync(UpsertLocationRequest request, CancellationToken cancellationToken = default)
    {
        var nextId = Locations.Count == 0 ? 1 : Locations.Max((location) => location.LocationId) + 1;
        var created = new LocationDto(nextId, request.Code, request.NameMk, request.RegionCode, request.IsActive);
        Locations.Add(created);
        return Task.FromResult(created);
    }

    public Task<LocationDto> UpdateLocationAsync(int locationId, UpsertLocationRequest request, CancellationToken cancellationToken = default)
    {
        var index = Locations.FindIndex((location) => location.LocationId == locationId);
        if (index < 0)
        {
            throw new InvalidOperationException($"Location {locationId} was not found.");
        }

        var updated = new LocationDto(locationId, request.Code, request.NameMk, request.RegionCode, request.IsActive);
        Locations[index] = updated;
        return Task.FromResult(updated);
    }

    public Task<ItemDto> CreateItemAsync(UpsertItemRequest request, CancellationToken cancellationToken = default)
    {
        var nextId = Items.Count == 0 ? 1 : Items.Max((item) => item.ItemId) + 1;
        var created = new ItemDto(nextId, request.Code, request.NameMk, request.GroupName, request.SalesPrice, request.WasteLimitPct, request.IsActive);
        Items.Add(created);
        return Task.FromResult(created);
    }

    public Task<ItemDto> UpdateItemAsync(int itemId, UpsertItemRequest request, CancellationToken cancellationToken = default)
    {
        var index = Items.FindIndex((item) => item.ItemId == itemId);
        if (index < 0)
        {
            throw new InvalidOperationException($"Item {itemId} was not found.");
        }

        var updated = new ItemDto(itemId, request.Code, request.NameMk, request.GroupName, request.SalesPrice, request.WasteLimitPct, request.IsActive);
        Items[index] = updated;
        return Task.FromResult(updated);
    }
}
