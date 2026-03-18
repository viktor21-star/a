using Microsoft.Extensions.Options;
using Pecenje.Api.Configuration;
using Pecenje.Api.Contracts.Versioning;
using Pecenje.Api.Services;

namespace Pecenje.Api.Application.Services;

public sealed class AppVersioningService(IOptions<AppVersioningOptions> options, IAuditService auditService)
{
    private readonly object syncRoot = new();
    private AppVersionPolicyDto current = new(
        options.Value.MinimumSupportedVersion,
        options.Value.LatestVersion,
        options.Value.BuildNumber,
        options.Value.ReleasedAt,
        options.Value.ForceUpdate,
        options.Value.DownloadUrl,
        options.Value.MessageMk
    );

    public AppVersionPolicyDto GetPolicy()
    {
        lock (syncRoot)
        {
            return current;
        }
    }

    public async Task<AppVersionPolicyDto> UpdatePolicyAsync(UpdateAppVersionPolicyRequest request, CancellationToken cancellationToken = default)
    {
        var next = new AppVersionPolicyDto(
            request.MinimumSupportedVersion,
            request.LatestVersion,
            request.BuildNumber,
            request.ReleasedAt,
            request.ForceUpdate,
            request.DownloadUrl,
            request.MessageMk
        );

        lock (syncRoot)
        {
            current = next;
        }

        await auditService.LogAsync("AppVersionPolicy", "update", "singleton", request, cancellationToken);
        return next;
    }
}
