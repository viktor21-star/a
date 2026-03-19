using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.Production;
using Pecenje.Api.Contracts.Waste;
using Pecenje.Api.Contracts.Users;

namespace Pecenje.Api.Application.Services;

public sealed class ProductionAppService(
    IProductionRepository productionRepository,
    LocationAccessAppService locationAccessAppService,
    ICurrentUserProvider currentUserProvider,
    IUserAccessRepository userAccessRepository)
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

    public async Task<WasteSummaryDto> CreateWasteAsync(CreateWasteEntryRequest request, CancellationToken cancellationToken = default)
    {
        await locationAccessAppService.EnsureLocationAccessAsync(
            request.LocationId,
            permission => (permission.CanRecordWaste || HasAnyWasteModuleAccess(permission)) && HasWasteModePermission(permission, request.SourceMode),
            "Корисникот нема дозвола да пријавува отпад за оваа локација и модул.",
            cancellationToken);

        var userId = currentUserProvider.GetCurrentUserId();
        var users = await userAccessRepository.GetUsersAsync(cancellationToken);
        var operatorName = users.FirstOrDefault((entry) => entry.UserId == userId)?.FullName ?? $"Корисник {userId}";
        return await productionRepository.CreateWasteEntryAsync(request, operatorName, cancellationToken);
    }

    public async Task<IReadOnlyList<OperatorEntryDto>> GetOperatorEntriesAsync(CancellationToken cancellationToken = default)
    {
        var allowedLocationIds = await locationAccessAppService.GetAllowedLocationIdsAsync(cancellationToken);
        var entries = await productionRepository.GetOperatorEntriesAsync(cancellationToken);
        return entries.Where((entry) => allowedLocationIds.Contains(entry.LocationId)).ToList();
    }

    public async Task<OperatorEntryDto> CreateOperatorEntryAsync(CreateOperatorEntryRequest request, CancellationToken cancellationToken = default)
    {
        await locationAccessAppService.EnsureLocationAccessAsync(
            request.LocationId,
            permission => HasModePermission(permission, request.Mode),
            "Корисникот нема дозвола да внесува за оваа локација и модул.",
            cancellationToken);

        var userId = currentUserProvider.GetCurrentUserId();
        var users = await userAccessRepository.GetUsersAsync(cancellationToken);
        var operatorName = users.FirstOrDefault((entry) => entry.UserId == userId)?.FullName ?? $"Корисник {userId}";
        return await productionRepository.CreateOperatorEntryAsync(request, userId, operatorName, cancellationToken);
    }

    private static bool HasModePermission(UserLocationPermissionDto permission, string mode)
    {
        return mode switch
        {
            "pekara" => permission.CanBake && permission.CanUsePekara,
            "pecenjara" => permission.CanBake && permission.CanUsePecenjara,
            "pijara" => permission.CanBake && permission.CanUsePijara,
            _ => false
        };
    }

    private static bool HasWasteModePermission(UserLocationPermissionDto permission, string mode)
    {
        return mode switch
        {
            "pekara" => permission.CanUsePekara,
            "pecenjara" => permission.CanUsePecenjara,
            "pijara" => permission.CanUsePijara,
            _ => false
        };
    }

    private static bool HasAnyWasteModuleAccess(UserLocationPermissionDto permission)
        => permission.CanUsePekara || permission.CanUsePecenjara || permission.CanUsePijara;
}
