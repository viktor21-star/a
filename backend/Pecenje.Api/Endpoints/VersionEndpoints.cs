using Pecenje.Api.Contracts.Common;
using Pecenje.Api.Contracts.Versioning;
using Pecenje.Api.Application.Services;

namespace Pecenje.Api.Endpoints;

public static class VersionEndpoints
{
    public static IEndpointRouteBuilder MapVersionEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/version-policy", (HttpContext httpContext, AppVersioningService service) =>
        {
            var config = service.GetPolicy();
            var downloadUrl = config.DownloadUrl;

            if (Uri.TryCreate(downloadUrl, UriKind.Relative, out var relativeUri))
            {
                downloadUrl = $"{httpContext.Request.Scheme}://{httpContext.Request.Host}{relativeUri}";
            }

            return Results.Ok(new ApiEnvelope<AppVersionPolicyDto>(
                new AppVersionPolicyDto(
                    config.MinimumSupportedVersion,
                    config.LatestVersion,
                    config.BuildNumber,
                    config.ReleasedAt,
                    config.ForceUpdate,
                    downloadUrl,
                    config.MessageMk
                )));
        })
            .WithTags("Versioning");

        app.MapPut("/api/v1/version-policy", async (UpdateAppVersionPolicyRequest request, HttpContext httpContext, AppVersioningService service, CancellationToken cancellationToken) =>
        {
            var config = await service.UpdatePolicyAsync(request, cancellationToken);
            var downloadUrl = config.DownloadUrl;

            if (Uri.TryCreate(downloadUrl, UriKind.Relative, out var relativeUri))
            {
                downloadUrl = $"{httpContext.Request.Scheme}://{httpContext.Request.Host}{relativeUri}";
            }

            return Results.Ok(new ApiEnvelope<AppVersionPolicyDto>(
                config with { DownloadUrl = downloadUrl }));
        })
            .WithTags("Versioning");

        return app;
    }
}
