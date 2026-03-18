namespace Pecenje.Api.Application.Abstractions;

public interface IMasterDataSyncRunRepository
{
    Task<long> StartAsync(string syncType, string sourceSystem, CancellationToken cancellationToken = default);
    Task FinishAsync(
        long syncRunId,
        string statusCode,
        int readCount,
        int insertedCount,
        int updatedCount,
        int deactivatedCount,
        string? errorMessage,
        CancellationToken cancellationToken = default);
}
