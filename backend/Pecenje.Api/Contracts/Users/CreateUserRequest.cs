namespace Pecenje.Api.Contracts.Users;

public sealed record CreateUserRequest(
    string Username,
    string FullName,
    string RoleCode,
    bool IsActive
);
