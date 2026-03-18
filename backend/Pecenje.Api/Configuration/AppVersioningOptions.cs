namespace Pecenje.Api.Configuration;

public sealed class AppVersioningOptions
{
    public const string SectionName = "AppVersioning";

    public string MinimumSupportedVersion { get; set; } = "1.0.0";
    public string LatestVersion { get; set; } = "1.0.0";
    public string BuildNumber { get; set; } = "100";
    public string ReleasedAt { get; set; } = "2026-03-18T12:00:00Z";
    public bool ForceUpdate { get; set; }
    public string DownloadUrl { get; set; } = "/downloads/app-debug.apk";
    public string MessageMk { get; set; } = "Достапна е најновата верзија на апликацијата.";
}
