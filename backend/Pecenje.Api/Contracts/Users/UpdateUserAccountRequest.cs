namespace Pecenje.Api.Contracts.Users;

public sealed record UpdateUserAccountRequest(
    bool IsActive,
    string? NewPassword
);
