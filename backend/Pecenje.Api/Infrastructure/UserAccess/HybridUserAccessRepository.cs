using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.Users;
using Pecenje.Api.Infrastructure.Demo;
using Pecenje.Api.Infrastructure.Sqlite;

namespace Pecenje.Api.Infrastructure.UserAccess;

public sealed class HybridUserAccessRepository(
    SqliteUserAccessRepository sqliteRepository,
    DemoUserAccessRepository demoRepository) : IUserAccessRepository
{
    public async Task<IReadOnlyList<UserSummaryDto>> GetUsersAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var users = await sqliteRepository.GetUsersAsync(cancellationToken);
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
        => await sqliteRepository.CreateUserAsync(request, cancellationToken);

    public async Task<UserSummaryDto> UpdateUserAccountAsync(long userId, UpdateUserAccountRequest request, CancellationToken cancellationToken = default)
        => await sqliteRepository.UpdateUserAccountAsync(userId, request, cancellationToken);

    public async Task<IReadOnlyList<UserLocationPermissionDto>> GetUserLocationsAsync(long userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var locations = await sqliteRepository.GetUserLocationsAsync(userId, cancellationToken);
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
        => await sqliteRepository.UpdateUserLocationsAsync(userId, request, cancellationToken);

    public async Task<UserAuthenticationResultDto?> AuthenticateAsync(string username, string password, CancellationToken cancellationToken = default)
    {
        try
        {
            var authenticated = await sqliteRepository.AuthenticateAsync(username, password, cancellationToken);
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
