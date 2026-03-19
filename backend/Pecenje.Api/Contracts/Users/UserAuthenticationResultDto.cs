namespace Pecenje.Api.Contracts.Users;

public sealed record UserAuthenticationResultDto(
    long UserId,
    string Username,
    string FullName,
    string RoleCode,
    int? DefaultLocationId,
    bool IsActive,
    IReadOnlyList<UserLocationPermissionDto> Locations
);
