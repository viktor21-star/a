using Pecenje.Api.Contracts.Auth;

namespace Pecenje.Api.Services;

public interface IAuthService
{
    LoginResponse Login(LoginRequest request);
}
