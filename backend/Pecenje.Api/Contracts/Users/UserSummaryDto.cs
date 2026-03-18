namespace Pecenje.Api.Contracts.Users;

public sealed record UserSummaryDto(
    long UserId,
    string Username,
    string FullName,
    string RoleCode,
    bool IsActive
);
