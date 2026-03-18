namespace Pecenje.Api.Configuration;

public sealed class MasterDataSyncOptions
{
    public const string SectionName = "MasterDataSync";

    public bool Enabled { get; init; } = true;
    public string DailyTime { get; init; } = "02:00";
}
