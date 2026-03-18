namespace Pecenje.Api.Contracts.Auth;

public sealed record LoginRequest(
    string Username,
    string Password
);
