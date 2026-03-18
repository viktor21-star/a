namespace Pecenje.Api.Infrastructure.SqlServer.SqlQueries;

public static class SyncRunSql
{
    public const string InsertSyncRun = """
        INSERT INTO dbo.MasterDataSyncRuns (
            SyncType,
            SourceSystem,
            StartedAt,
            StatusCode
        )
        OUTPUT INSERTED.SyncRunId
        VALUES (
            @SyncType,
            @SourceSystem,
            SYSUTCDATETIME(),
            'started'
        );
        """;

    public const string FinishSyncRun = """
        UPDATE dbo.MasterDataSyncRuns
        SET
            FinishedAt = SYSUTCDATETIME(),
            StatusCode = @StatusCode,
            ReadCount = @ReadCount,
            InsertedCount = @InsertedCount,
            UpdatedCount = @UpdatedCount,
            DeactivatedCount = @DeactivatedCount,
            ErrorMessage = @ErrorMessage
        WHERE SyncRunId = @SyncRunId;
        """;
}
