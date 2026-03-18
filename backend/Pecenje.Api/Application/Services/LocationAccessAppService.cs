using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.Users;

namespace Pecenje.Api.Application.Services;

public sealed class LocationAccessAppService(
    IUserAccessRepository userAccessRepository,
    ICurrentUserProvider currentUserProvider)
{
    public async Task<IReadOnlyList<UserLocationPermissionDto>> GetCurrentUserPermissionsAsync(CancellationToken cancellationToken = default)
    {
        var userId = currentUserProvider.GetCurrentUserId();
        return await userAccessRepository.GetUserLocationsAsync(userId, cancellationToken);
    }

    public async Task<HashSet<int>> GetAllowedLocationIdsAsync(CancellationToken cancellationToken = default)
    {
        var permissions = await GetCurrentUserPermissionsAsync(cancellationToken);
        return permissions.Select(x => x.LocationId).ToHashSet();
    }

    public async Task EnsureLocationAccessAsync(int locationId, Func<UserLocationPermissionDto, bool> rule, string errorMessage, CancellationToken cancellationToken = default)
    {
        var permissions = await GetCurrentUserPermissionsAsync(cancellationToken);
        var allowed = permissions.FirstOrDefault(x => x.LocationId == locationId);

        if (allowed is null || !rule(allowed))
        {
            throw new UnauthorizedAccessException(errorMessage);
        }
    }
}
