namespace Pecenje.Api.Contracts.Versioning;

public sealed record UpdateAppVersionPolicyRequest(
    string MinimumSupportedVersion,
    string LatestVersion,
    string BuildNumber,
    string ReleasedAt,
    bool ForceUpdate,
    string DownloadUrl,
    string MessageMk
);
