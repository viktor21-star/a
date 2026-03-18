using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.Users;

namespace Pecenje.Api.Infrastructure.Demo;

public sealed class DemoUserAccessRepository : IUserAccessRepository
{
    public Task<IReadOnlyList<UserSummaryDto>> GetUsersAsync(CancellationToken cancellationToken = default)
    {
        IReadOnlyList<UserSummaryDto> data = new[]
        {
            new UserSummaryDto(1, "admin", "Администратор", "administrator", true),
            new UserSummaryDto(2, "pekara.aer1", "Пекар Аеродром 1", "operator", true),
            new UserSummaryDto(3, "sef.centar", "Шеф Центар", "market_manager", true)
        };

        return Task.FromResult(data);
    }

    public Task<IReadOnlyList<UserLocationPermissionDto>> GetUserLocationsAsync(long userId, CancellationToken cancellationToken = default)
    {
        IReadOnlyList<UserLocationPermissionDto> data = userId switch
        {
            1 => new[]
            {
                new UserLocationPermissionDto(1, "Аеродром 1", true, true, true, true, true, true, true),
                new UserLocationPermissionDto(2, "Центар", true, true, true, true, true, true, true)
            },
            2 => new[]
            {
                new UserLocationPermissionDto(1, "Аеродром 1", false, true, true, false, false, true, false)
            },
            _ => new[]
            {
                new UserLocationPermissionDto(2, "Центар", true, true, true, true, true, true, true)
            }
        };

        return Task.FromResult(data);
    }

    public Task<IReadOnlyList<UserLocationPermissionDto>> UpdateUserLocationsAsync(long userId, UpdateUserLocationsRequest request, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(request.Locations);
    }
}
