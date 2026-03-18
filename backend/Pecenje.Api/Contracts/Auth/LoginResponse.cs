namespace Pecenje.Api.Contracts.Auth;

public sealed record LoginResponse(
    string AccessToken,
    string RefreshToken,
    UserProfileDto User
);

public sealed record UserProfileDto(
    long Id,
    string FullName,
    string Role,
    int? DefaultLocationId,
    IReadOnlyList<string> Permissions
);
