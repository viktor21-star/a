using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.Users;

namespace Pecenje.Api.Infrastructure.Demo;

public sealed class DemoUserAccessRepository : IUserAccessRepository
{
    private static readonly List<UserSummaryDto> Users =
    [
        new UserSummaryDto(1, "admin", "Администратор", "administrator", true),
        new UserSummaryDto(2, "pekara.aer1", "Пекар Аеродром 1", "operator", true),
        new UserSummaryDto(3, "sef.centar", "Шеф Центар", "market_manager", true)
    ];

    private static readonly Dictionary<long, List<UserLocationPermissionDto>> PermissionsByUser = new()
    {
        [1] =
        [
            new UserLocationPermissionDto(1, "Аеродром 1", true, true, true, true, true, true, true),
            new UserLocationPermissionDto(2, "Центар", true, true, true, true, true, true, true)
        ],
        [2] =
        [
            new UserLocationPermissionDto(1, "Аеродром 1", false, true, true, false, false, true, false)
        ],
        [3] =
        [
            new UserLocationPermissionDto(2, "Центар", true, true, true, true, true, true, true)
        ]
    };

    public Task<IReadOnlyList<UserSummaryDto>> GetUsersAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IReadOnlyList<UserSummaryDto>>(Users.ToArray());
    }

    public Task<UserSummaryDto> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default)
    {
        var nextId = Users.Count == 0 ? 1 : Users.Max((user) => user.UserId) + 1;
        var user = new UserSummaryDto(nextId, request.Username, request.FullName, request.RoleCode, request.IsActive);

        Users.Add(user);
        PermissionsByUser[nextId] =
        [
            new UserLocationPermissionDto(1, "Аеродром 1", false, false, false, false, false, false, false),
            new UserLocationPermissionDto(2, "Центар", false, false, false, false, false, false, false)
        ];

        return Task.FromResult(user);
    }

    public Task<IReadOnlyList<UserLocationPermissionDto>> GetUserLocationsAsync(long userId, CancellationToken cancellationToken = default)
    {
        PermissionsByUser.TryGetValue(userId, out var data);
        return Task.FromResult<IReadOnlyList<UserLocationPermissionDto>>(data?.ToArray() ?? []);
    }

    public Task<IReadOnlyList<UserLocationPermissionDto>> UpdateUserLocationsAsync(long userId, UpdateUserLocationsRequest request, CancellationToken cancellationToken = default)
    {
        PermissionsByUser[userId] = request.Locations.ToList();
        return Task.FromResult<IReadOnlyList<UserLocationPermissionDto>>(request.Locations);
    }
}
