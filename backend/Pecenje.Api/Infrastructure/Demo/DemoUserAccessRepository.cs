using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.Users;

namespace Pecenje.Api.Infrastructure.Demo;

public sealed class DemoUserAccessRepository : IUserAccessRepository
{
    public sealed record DemoAuthMatch(
        long UserId,
        string Username,
        string Password,
        string FullName,
        string RoleCode,
        int? DefaultLocationId,
        IReadOnlyList<UserLocationPermissionDto> Locations);

    private sealed record DemoUserCredential(
        long UserId,
        string Username,
        string Password,
        string FullName,
        string RoleCode,
        int? DefaultLocationId);

    private static readonly List<UserSummaryDto> Users =
    [
        new UserSummaryDto(1, "admin", "Администратор", "administrator", true),
        new UserSummaryDto(2, "pekara.aer1", "Пекар Аеродром 1", "operator", true),
        new UserSummaryDto(3, "sef.centar", "Шеф Центар", "market_manager", true)
    ];

    private static readonly Dictionary<string, DemoUserCredential> CredentialsByUsername = new(StringComparer.OrdinalIgnoreCase)
    {
        ["admin"] = new DemoUserCredential(1, "admin", "1234", "Администратор", "administrator", 1),
        ["operator"] = new DemoUserCredential(2, "operator", "1111", "Оператор Аеродром 1", "operator", 1),
        ["manager"] = new DemoUserCredential(3, "manager", "2222", "Шеф Центар", "market_manager", 2),
        ["pekara.aer1"] = new DemoUserCredential(2, "pekara.aer1", "1111", "Пекар Аеродром 1", "operator", 1),
        ["sef.centar"] = new DemoUserCredential(3, "sef.centar", "2222", "Шеф Центар", "market_manager", 2)
    };

    private static readonly Dictionary<long, List<UserLocationPermissionDto>> PermissionsByUser = new()
    {
        [1] =
        [
            new UserLocationPermissionDto(1, "Аеродром 1", true, true, true, true, true, true, true, true, "Ротациона", "Комбинирана"),
            new UserLocationPermissionDto(2, "Центар", true, true, true, true, true, true, true, true, "Камена", "Ротациона")
        ],
        [2] =
        [
            new UserLocationPermissionDto(1, "Аеродром 1", false, true, true, false, false, true, false, false, "Ротациона", "Нема")
        ],
        [3] =
        [
            new UserLocationPermissionDto(2, "Центар", true, true, true, true, true, true, true, true, "Комбинирана", "Камена")
        ]
    };

    private static readonly Dictionary<int, string> LocationNames = new()
    {
        [1] = "Аеродром 1",
        [2] = "Центар"
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
        CredentialsByUsername[request.Username] = new DemoUserCredential(
            nextId,
            request.Username,
            request.Password,
            request.FullName,
            request.RoleCode,
            request.DefaultLocationId);

        PermissionsByUser[nextId] =
        [
            new UserLocationPermissionDto(
                request.DefaultLocationId,
                GetLocationName(request.DefaultLocationId),
                request.RoleCode is "administrator" or "market_manager",
                request.CanUsePekara || request.CanUsePecenjara || request.CanUsePijara,
                request.RoleCode is "administrator" or "market_manager",
                request.RoleCode is "administrator" or "market_manager",
                request.RoleCode == "administrator",
                request.CanUsePekara,
                request.CanUsePecenjara,
                request.CanUsePijara,
                request.PekaraOvenType,
                request.PecenjaraOvenType)
        ];

        return Task.FromResult(user);
    }

    public Task<UserSummaryDto> UpdateUserAccountAsync(long userId, UpdateUserAccountRequest request, CancellationToken cancellationToken = default)
    {
        var index = Users.FindIndex((entry) => entry.UserId == userId);
        if (index < 0)
        {
            throw new InvalidOperationException("Корисникот не е пронајден.");
        }

        var current = Users[index];
        var updated = current with { IsActive = request.IsActive };
        Users[index] = updated;

        var credential = CredentialsByUsername.Values.FirstOrDefault((entry) => entry.UserId == userId);
        if (credential is not null)
        {
          var nextPassword = string.IsNullOrWhiteSpace(request.NewPassword) ? credential.Password : request.NewPassword;
          var nextCredential = credential with { Password = nextPassword };
          CredentialsByUsername[credential.Username] = nextCredential;
        }

        return Task.FromResult(updated);
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

    public Task<UserAuthenticationResultDto?> AuthenticateAsync(string username, string password, CancellationToken cancellationToken = default)
    {
        if (CredentialsByUsername.TryGetValue(username, out var user) && user.Password == password)
        {
            var summary = Users.FirstOrDefault((entry) => entry.UserId == user.UserId);
            if (summary is null || !summary.IsActive)
            {
                return Task.FromResult<UserAuthenticationResultDto?>(null);
            }

            PermissionsByUser.TryGetValue(user.UserId, out var locations);
            return Task.FromResult<UserAuthenticationResultDto?>(new UserAuthenticationResultDto(
                user.UserId,
                user.Username,
                user.FullName,
                user.RoleCode,
                user.DefaultLocationId,
                summary.IsActive,
                locations?.ToArray() ?? []));
        }

        return Task.FromResult<UserAuthenticationResultDto?>(null);
    }

    private static string GetLocationName(int locationId)
        => LocationNames.TryGetValue(locationId, out var locationName) ? locationName : $"Локација {locationId}";
}
