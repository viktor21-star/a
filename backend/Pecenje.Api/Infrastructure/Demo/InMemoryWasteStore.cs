using Dapper;
using Pecenje.Api.Contracts.Waste;
using Pecenje.Api.Infrastructure.Sqlite;

namespace Pecenje.Api.Infrastructure.Demo;

public sealed class InMemoryWasteStore(LocalAppDb localAppDb)
{
    public IReadOnlyList<WasteSummaryDto> GetAll()
    {
        using var connection = localAppDb.CreateConnection();
        connection.Open();

        return connection.Query<WasteSummaryDto>(
            """
            SELECT WasteEntryId, LocationId, ItemName, Quantity, Reason, LocationName, SourceMode, Note, PhotoDataUrl, PhotoName, CreatedAt, OperatorName
            FROM WasteEntries
            ORDER BY datetime(CreatedAt) DESC, WasteEntryId DESC
            """).ToArray();
    }

    public WasteSummaryDto Add(CreateWasteEntryRequest request, string operatorName)
    {
        using var connection = localAppDb.CreateConnection();
        connection.Open();

        var wasteEntryId = connection.ExecuteScalar<long>(
            """
            INSERT INTO WasteEntries (
                LocationId, ItemName, Quantity, Reason, LocationName, SourceMode, Note, PhotoDataUrl, PhotoName, CreatedAt, OperatorName
            ) VALUES (
                @LocationId, @ItemName, @Quantity, @Reason, @LocationName, @SourceMode, @Note, @PhotoDataUrl, @PhotoName, @CreatedAt, @OperatorName
            );

            SELECT last_insert_rowid();
            """,
            new
            {
                request.LocationId,
                request.ItemName,
                request.Quantity,
                request.Reason,
                request.LocationName,
                request.SourceMode,
                request.Note,
                request.PhotoDataUrl,
                request.PhotoName,
                request.CreatedAt,
                OperatorName = operatorName
            });

        return new WasteSummaryDto(
            wasteEntryId,
            request.LocationId,
            request.ItemName,
            request.Quantity,
            request.Reason,
            request.LocationName,
            request.SourceMode,
            request.Note,
            request.PhotoDataUrl,
            request.PhotoName,
            request.CreatedAt,
            operatorName);
    }
}
