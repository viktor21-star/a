namespace Pecenje.Api.Contracts.Users;

public sealed record UpdateUserLocationsRequest(
    IReadOnlyList<UserLocationPermissionDto> Locations
);
