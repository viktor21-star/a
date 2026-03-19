namespace Pecenje.Api.Contracts.Users;

public sealed record CreateUserRequest(
    int DefaultLocationId,
    string Username,
    string FullName,
    string Password,
    string RoleCode,
    bool IsActive,
    bool CanUsePekara,
    bool CanUsePecenjara,
    bool CanUsePijara,
    string? PekaraOvenType,
    string? PecenjaraOvenType
);
