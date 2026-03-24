using Dapper;
using Pecenje.Api.Contracts.Common;
using Pecenje.Api.Contracts.Waste;
using Pecenje.Api.Infrastructure.Sqlite;

namespace Pecenje.Api.Infrastructure.Demo;

public sealed class InMemoryWasteStore(LocalAppDb localAppDb)
{
    public IReadOnlyList<WasteSummaryDto> GetAll()
    {
        using var connection = localAppDb.CreateConnection();
        connection.Open();

        var rows = connection.Query<WasteEntryRow>(
            """
            SELECT WasteEntryId, LocationId, ItemName, Quantity, Reason, LocationName, SourceMode, Note, PhotoName, CreatedAt, OperatorName
            FROM WasteEntries
            ORDER BY datetime(CreatedAt) DESC, WasteEntryId DESC
            """).ToArray();

        return rows.Select(row => new WasteSummaryDto(
            row.WasteEntryId,
            row.LocationId,
            row.ItemName,
            row.Quantity,
            row.Reason,
            row.LocationName,
            row.SourceMode,
            row.Note,
            string.Empty,
            row.PhotoName,
            row.CreatedAt,
            row.OperatorName)).ToArray();
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

    public PhotoAssetDto? GetPhoto(long wasteEntryId)
    {
        using var connection = localAppDb.CreateConnection();
        connection.Open();

        var row = connection.QuerySingleOrDefault<WastePhotoRow>(
            """
            SELECT PhotoDataUrl, PhotoName
            FROM WasteEntries
            WHERE WasteEntryId = @WasteEntryId
            """,
            new { WasteEntryId = wasteEntryId });

        return row is null ? null : new PhotoAssetDto(row.PhotoDataUrl, row.PhotoName);
    }

    private sealed class WasteEntryRow
    {
        public long WasteEntryId { get; init; }
        public int LocationId { get; init; }
        public string ItemName { get; init; } = string.Empty;
        public decimal Quantity { get; init; }
        public string Reason { get; init; } = string.Empty;
        public string LocationName { get; init; } = string.Empty;
        public string SourceMode { get; init; } = string.Empty;
        public string Note { get; init; } = string.Empty;
        public string PhotoName { get; init; } = string.Empty;
        public string CreatedAt { get; init; } = string.Empty;
        public string OperatorName { get; init; } = string.Empty;
    }

    private sealed class WastePhotoRow
    {
        public string PhotoDataUrl { get; init; } = string.Empty;
        public string PhotoName { get; init; } = string.Empty;
    }
}
