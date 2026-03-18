using Pecenje.Api.Application.Validation;
using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.MasterData;
using Pecenje.Api.Services;

namespace Pecenje.Api.Application.Services;

public sealed class MasterDataAppService(IMasterDataRepository repository, IAuditService auditService)
{
    public Task<IReadOnlyList<LocationDto>> GetLocationsAsync(CancellationToken cancellationToken = default)
        => repository.GetLocationsAsync(cancellationToken);

    public Task<IReadOnlyList<ItemDto>> GetItemsAsync(CancellationToken cancellationToken = default)
        => repository.GetItemsAsync(cancellationToken);

    public async Task<LocationDto> CreateLocationAsync(UpsertLocationRequest request, CancellationToken cancellationToken = default)
    {
        ValidateOrThrow(request);
        var result = await repository.CreateLocationAsync(request, cancellationToken);
        await auditService.LogAsync("Location", "create", result.LocationId.ToString(), request, cancellationToken);
        return result;
    }

    public async Task<LocationDto> UpdateLocationAsync(int locationId, UpsertLocationRequest request, CancellationToken cancellationToken = default)
    {
        ValidateOrThrow(request);
        var result = await repository.UpdateLocationAsync(locationId, request, cancellationToken);
        await auditService.LogAsync("Location", "update", result.LocationId.ToString(), request, cancellationToken);
        return result;
    }

    public async Task<ItemDto> CreateItemAsync(UpsertItemRequest request, CancellationToken cancellationToken = default)
    {
        ValidateOrThrow(request);
        var result = await repository.CreateItemAsync(request, cancellationToken);
        await auditService.LogAsync("Item", "create", result.ItemId.ToString(), request, cancellationToken);
        return result;
    }

    public async Task<ItemDto> UpdateItemAsync(int itemId, UpsertItemRequest request, CancellationToken cancellationToken = default)
    {
        ValidateOrThrow(request);
        var result = await repository.UpdateItemAsync(itemId, request, cancellationToken);
        await auditService.LogAsync("Item", "update", result.ItemId.ToString(), request, cancellationToken);
        return result;
    }

    private static void ValidateOrThrow(UpsertLocationRequest request)
    {
        var error = MasterDataValidator.Validate(request);
        if (error is not null)
        {
            throw new ArgumentException(error);
        }
    }

    private static void ValidateOrThrow(UpsertItemRequest request)
    {
        var error = MasterDataValidator.Validate(request);
        if (error is not null)
        {
            throw new ArgumentException(error);
        }
    }
}
