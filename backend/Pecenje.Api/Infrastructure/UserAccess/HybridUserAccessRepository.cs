using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.Users;
using Pecenje.Api.Infrastructure.Demo;
using Pecenje.Api.Infrastructure.SqlServer;

namespace Pecenje.Api.Infrastructure.UserAccess;

public sealed class HybridUserAccessRepository(
    SqlServerUserAccessRepository sqlRepository,
    DemoUserAccessRepository demoRepository) : IUserAccessRepository
{
    public async Task<IReadOnlyList<UserSummaryDto>> GetUsersAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var users = await sqlRepository.GetUsersAsync(cancellationToken);
            if (users.Count > 0)
            {
                return users;
            }
        }
        catch
        {
        }

        return await demoRepository.GetUsersAsync(cancellationToken);
    }

    public async Task<UserSummaryDto> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            return await sqlRepository.CreateUserAsync(request, cancellationToken);
        }
        catch
        {
            return await demoRepository.CreateUserAsync(request, cancellationToken);
        }
    }

    public async Task<UserSummaryDto> UpdateUserAccountAsync(long userId, UpdateUserAccountRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            return await sqlRepository.UpdateUserAccountAsync(userId, request, cancellationToken);
        }
        catch
        {
            return await demoRepository.UpdateUserAccountAsync(userId, request, cancellationToken);
        }
    }

    public async Task<IReadOnlyList<UserLocationPermissionDto>> GetUserLocationsAsync(long userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var locations = await sqlRepository.GetUserLocationsAsync(userId, cancellationToken);
            if (locations.Count > 0)
            {
                return locations;
            }
        }
        catch
        {
        }

        return await demoRepository.GetUserLocationsAsync(userId, cancellationToken);
    }

    public async Task<IReadOnlyList<UserLocationPermissionDto>> UpdateUserLocationsAsync(long userId, UpdateUserLocationsRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            return await sqlRepository.UpdateUserLocationsAsync(userId, request, cancellationToken);
        }
        catch
        {
            return await demoRepository.UpdateUserLocationsAsync(userId, request, cancellationToken);
        }
    }

    public async Task<UserAuthenticationResultDto?> AuthenticateAsync(string username, string password, CancellationToken cancellationToken = default)
    {
        try
        {
            var authenticated = await sqlRepository.AuthenticateAsync(username, password, cancellationToken);
            if (authenticated is not null)
            {
                return authenticated;
            }
        }
        catch
        {
        }

        return await demoRepository.AuthenticateAsync(username, password, cancellationToken);
    }
}
