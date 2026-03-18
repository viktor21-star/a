using Pecenje.Api.Contracts.Auth;

namespace Pecenje.Api.Services;

public sealed class DemoAuthService : IAuthService
{
    public LoginResponse Login(LoginRequest request)
    {
        return new LoginResponse(
            "demo-token",
            "demo-refresh",
            new UserProfileDto(
                1,
                "Администратор",
                "administrator",
                1,
                new[] { "dashboard.read", "planning.write", "production.write", "reports.export" }
            )
        );
    }
}
