using Pecenje.Api.Contracts.Auth;

namespace Pecenje.Api.Services;

public sealed class DemoAuthService : IAuthService
{
    public LoginResponse Login(LoginRequest request)
    {
        return (request.Username.Trim().ToLowerInvariant(), request.Password) switch
        {
            ("admin", "1234") => BuildResponse(1, "Администратор", "administrator", 1, new[] { "dashboard.read", "planning.write", "production.write", "reports.export" }),
            ("operator", "1111") => BuildResponse(2, "Оператор Аеродром 1", "operator", 1, new[] { "production.write" }),
            ("manager", "2222") => BuildResponse(3, "Шеф Центар", "market_manager", 2, new[] { "planning.write", "reports.export" }),
            _ => throw new UnauthorizedAccessException("Погрешно корисничко име или лозинка.")
        };
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
}
