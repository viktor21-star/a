using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.Users;
using Pecenje.Api.Services;

namespace Pecenje.Api.Application.Services;

public sealed class UserAccessAppService(IUserAccessRepository repository, IAuditService auditService)
{
    public Task<IReadOnlyList<UserSummaryDto>> GetUsersAsync(CancellationToken cancellationToken = default)
        => repository.GetUsersAsync(cancellationToken);

    public async Task<UserSummaryDto> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default)
    {
        var result = await repository.CreateUserAsync(request, cancellationToken);
        await auditService.LogAsync("Users", "create", result.UserId.ToString(), request, cancellationToken);
        return result;
    }

    public Task<IReadOnlyList<UserLocationPermissionDto>> GetUserLocationsAsync(long userId, CancellationToken cancellationToken = default)
        => repository.GetUserLocationsAsync(userId, cancellationToken);

    public async Task<IReadOnlyList<UserLocationPermissionDto>> UpdateUserLocationsAsync(
        long userId,
        UpdateUserLocationsRequest request,
        CancellationToken cancellationToken = default)
    {
        var result = await repository.UpdateUserLocationsAsync(userId, request, cancellationToken);
        await auditService.LogAsync("UserLocations", "update", userId.ToString(), request, cancellationToken);
        return result;
    }
}
