namespace Pecenje.Api.Contracts.Versioning;

public sealed record AppVersionPolicyDto(
    string MinimumSupportedVersion,
    string LatestVersion,
    string BuildNumber,
    string ReleasedAt,
    bool ForceUpdate,
    string DownloadUrl,
    string MessageMk
);
