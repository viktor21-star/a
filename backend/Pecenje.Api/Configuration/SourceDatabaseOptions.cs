namespace Pecenje.Api.Configuration;

public sealed class SourceDatabaseOptions
{
    public const string SectionName = "SourceDatabase";

    public string Server { get; init; } = string.Empty;
    public int Port { get; init; } = 1443;
    public string Database { get; init; } = string.Empty;
    public string Username { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string LocationsTable { get; init; } = "orged";
    public string ItemsTable { get; init; } = "katart";
}
