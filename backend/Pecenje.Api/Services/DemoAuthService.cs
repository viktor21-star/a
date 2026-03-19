using Pecenje.Api.Infrastructure.Demo;
using Pecenje.Api.Contracts.Auth;
using Pecenje.Api.Application.Abstractions;

namespace Pecenje.Api.Services;

public sealed class DemoAuthService(IUserAccessRepository userAccessRepository) : IAuthService
{
    public LoginResponse Login(LoginRequest request)
    {
        var username = request.Username.Trim().ToLowerInvariant();
        var match = userAccessRepository.AuthenticateAsync(username, request.Password).GetAwaiter().GetResult();
        if (match is null)
        {
            throw new UnauthorizedAccessException("Погрешно корисничко име или лозинка.");
        }

        return BuildResponse(
            match.UserId,
            match.FullName,
            match.RoleCode,
            match.DefaultLocationId,
            BuildPermissions(match.RoleCode, match.Locations)
        );
    }

    private static LoginResponse BuildResponse(long id, string fullName, string role, int? defaultLocationId, IReadOnlyList<string> permissions)
    {
        return new LoginResponse(
            $"demo-token-{id}",
            $"demo-refresh-{id}",
            new UserProfileDto(
                id,
                fullName,
                role,
                defaultLocationId,
                permissions
            )
        );
    }

    private static IReadOnlyList<string> BuildPermissions(string role, IReadOnlyList<Contracts.Users.UserLocationPermissionDto> locations)
    {
        var permissions = new List<string>();

        if (role == "administrator")
        {
            permissions.AddRange(["dashboard.read", "planning.write", "production.write", "reports.export"]);
            return permissions;
        }

        if (locations.Any((entry) => entry.CanPlan))
        {
            permissions.Add("planning.write");
        }

        if (locations.Any((entry) => entry.CanBake || entry.CanUsePekara || entry.CanUsePecenjara || entry.CanUsePijara))
        {
            permissions.Add("production.write");
        }

        if (locations.Any((entry) => entry.CanViewReports))
        {
            permissions.Add("reports.export");
        }

        return permissions;
    }
}
