using Pecenje.Api.Contracts.Production;
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
            SELECT Id, Mode, LocationId, LocationName, Note, PhotoDataUrl, PhotoName, CreatedAt, UserId, OperatorName
            FROM OperatorEntries
            ORDER BY datetime(CreatedAt) DESC, rowid DESC
            """).ToArray();

        var items = connection.Query<OperatorEntryItemRow>(
            """
            SELECT EntryId, ItemIndex, ItemName, Quantity, ClassB, ClassBQuantity
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
                .Select(item => new OperatorEntryLineDto(item.ItemName, item.Quantity, item.ClassB, item.ClassBQuantity))
                .ToArray(),
            entry.Note,
            entry.PhotoDataUrl,
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
                    EntryId, ItemIndex, ItemName, Quantity, ClassB, ClassBQuantity
                ) VALUES (
                    @EntryId, @ItemIndex, @ItemName, @Quantity, @ClassB, @ClassBQuantity
                )
                """,
                new
                {
                    EntryId = entry.Id,
                    ItemIndex = index,
                    item.ItemName,
                    item.Quantity,
                    ClassB = item.ClassB ? 1 : 0,
                    item.ClassBQuantity
                },
                transaction);
        }

        transaction.Commit();

        return entry;
    }

    private sealed record OperatorEntryRow(
        string Id,
        string Mode,
        int LocationId,
        string LocationName,
        string Note,
        string PhotoDataUrl,
        string PhotoName,
        string CreatedAt,
        long UserId,
        string OperatorName);

    private sealed record OperatorEntryItemRow(
        string EntryId,
        int ItemIndex,
        string ItemName,
        decimal Quantity,
        bool ClassB,
        decimal ClassBQuantity);
}
