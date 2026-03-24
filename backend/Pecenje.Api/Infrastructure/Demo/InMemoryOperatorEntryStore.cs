using Pecenje.Api.Contracts.Production;
using Pecenje.Api.Contracts.Common;
using Pecenje.Api.Infrastructure.Sqlite;
using Dapper;

namespace Pecenje.Api.Infrastructure.Demo;

public sealed class InMemoryOperatorEntryStore(LocalAppDb localAppDb)
{
    public IReadOnlyList<OperatorEntryDto> GetAll()
    {
        using var connection = localAppDb.CreateConnection();
        connection.Open();

        var entries = connection.Query<OperatorEntryRow>(
            """
            SELECT Id, Mode, LocationId, LocationName, Note, PhotoName, CreatedAt, UserId, OperatorName
            FROM OperatorEntries
            ORDER BY datetime(CreatedAt) DESC, rowid DESC
            """).ToArray();

        var items = connection.Query<OperatorEntryItemRow>(
            """
            SELECT EntryId, ItemIndex, ItemName, Quantity, ClassB, ClassBItemName, ClassBQuantity
            FROM OperatorEntryItems
            ORDER BY EntryId, ItemIndex
            """).ToArray();

        return entries.Select(entry => new OperatorEntryDto(
            entry.Id,
            entry.Mode,
            entry.LocationId,
            entry.LocationName,
            items.Where(item => item.EntryId == entry.Id)
                .OrderBy(item => item.ItemIndex)
                .Select(item => new OperatorEntryLineDto(item.ItemName, item.Quantity, item.ClassB, item.ClassBItemName, item.ClassBQuantity))
                .ToArray(),
            entry.Note,
            string.Empty,
            entry.PhotoName,
            entry.CreatedAt,
            entry.UserId,
            entry.OperatorName)).ToArray();
    }

    public OperatorEntryDto Add(CreateOperatorEntryRequest request, long userId, string operatorName)
    {
        var entry = new OperatorEntryDto(
            Guid.NewGuid().ToString("N"),
            request.Mode,
            request.LocationId,
            request.LocationName,
            request.Items.ToArray(),
            request.Note,
            request.PhotoDataUrl,
            request.PhotoName,
            request.CreatedAt,
            userId,
            operatorName
        );

        using var connection = localAppDb.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        connection.Execute(
            """
            INSERT INTO OperatorEntries (
                Id, Mode, LocationId, LocationName, Note, PhotoDataUrl, PhotoName, CreatedAt, UserId, OperatorName
            ) VALUES (
                @Id, @Mode, @LocationId, @LocationName, @Note, @PhotoDataUrl, @PhotoName, @CreatedAt, @UserId, @OperatorName
            )
            """,
            entry,
            transaction);

        for (var index = 0; index < entry.Items.Count; index++)
        {
            var item = entry.Items[index];
            connection.Execute(
                """
                INSERT INTO OperatorEntryItems (
                    EntryId, ItemIndex, ItemName, Quantity, ClassB, ClassBItemName, ClassBQuantity
                ) VALUES (
                    @EntryId, @ItemIndex, @ItemName, @Quantity, @ClassB, @ClassBItemName, @ClassBQuantity
                )
                """,
                new
                {
                    EntryId = entry.Id,
                    ItemIndex = index,
                    item.ItemName,
                    item.Quantity,
                    ClassB = item.ClassB ? 1 : 0,
                    item.ClassBItemName,
                    item.ClassBQuantity
                },
                transaction);
        }

        transaction.Commit();

        return entry;
    }

    public PhotoAssetDto? GetPhoto(string entryId)
    {
        using var connection = localAppDb.CreateConnection();
        connection.Open();

        var row = connection.QuerySingleOrDefault<OperatorEntryPhotoRow>(
            """
            SELECT PhotoDataUrl, PhotoName
            FROM OperatorEntries
            WHERE Id = @EntryId
            """,
            new { EntryId = entryId });

        return row is null ? null : new PhotoAssetDto(row.PhotoDataUrl, row.PhotoName);
    }

    private sealed class OperatorEntryRow
    {
        public string Id { get; init; } = string.Empty;
        public string Mode { get; init; } = string.Empty;
        public int LocationId { get; init; }
        public string LocationName { get; init; } = string.Empty;
        public string Note { get; init; } = string.Empty;
        public string PhotoName { get; init; } = string.Empty;
        public string CreatedAt { get; init; } = string.Empty;
        public long UserId { get; init; }
        public string OperatorName { get; init; } = string.Empty;
    }

    private sealed class OperatorEntryPhotoRow
    {
        public string PhotoDataUrl { get; init; } = string.Empty;
        public string PhotoName { get; init; } = string.Empty;
    }

    private sealed class OperatorEntryItemRow
    {
        public string EntryId { get; init; } = string.Empty;
        public int ItemIndex { get; init; }
        public string ItemName { get; init; } = string.Empty;
        public decimal Quantity { get; init; }
        public bool ClassB { get; init; }
        public string? ClassBItemName { get; init; }
        public decimal ClassBQuantity { get; init; }
    }
}
