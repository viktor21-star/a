using Pecenje.Api.Contracts.MasterData;
using Pecenje.Api.Infrastructure.Sqlite;
using Dapper;

namespace Pecenje.Api.Infrastructure.Demo;

public sealed class InMemoryReasonStore
{
    private readonly LocalAppDb localAppDb;

    public InMemoryReasonStore(LocalAppDb localAppDb)
    {
        this.localAppDb = localAppDb;
        SeedDefaults();
    }

    public IReadOnlyList<ReasonEntryDto> GetAll()
    {
        using var connection = localAppDb.CreateConnection();
        connection.Open();
        return connection.Query<ReasonEntryDto>(
            """
            SELECT Id, Code, Name, Category, IsActive
            FROM Reasons
            ORDER BY Code
            """).ToArray();
    }

    public IReadOnlyList<ReasonEntryDto> ReplaceAll(IReadOnlyList<ReasonEntryDto> entries)
    {
        using var connection = localAppDb.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        connection.Execute("DELETE FROM Reasons", transaction: transaction);
        foreach (var entry in entries.OrderBy(entry => entry.Code))
        {
            connection.Execute(
                "INSERT INTO Reasons (Id, Code, Name, Category, IsActive) VALUES (@Id, @Code, @Name, @Category, @IsActive)",
                new { entry.Id, entry.Code, entry.Name, entry.Category, IsActive = entry.IsActive ? 1 : 0 },
                transaction);
        }

        transaction.Commit();
        return GetAll();
    }

    private void SeedDefaults()
    {
        using var connection = localAppDb.CreateConnection();
        connection.Open();
        var count = connection.ExecuteScalar<long>("SELECT COUNT(1) FROM Reasons");
        if (count > 0)
        {
            return;
        }

        connection.Execute(
            """
            INSERT INTO Reasons (Id, Code, Name, Category, IsActive) VALUES
            ('reason-shortage', 'R001', 'Недоволна количина', 'разлика', 1),
            ('reason-waste', 'R002', 'Технолошки отпад', 'отпад', 1),
            ('reason-delay', 'R003', 'Доцнење на печење', 'доцнење', 1)
            """);
    }
}
