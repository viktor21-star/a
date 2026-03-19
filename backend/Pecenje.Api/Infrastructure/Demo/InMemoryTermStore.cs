using Pecenje.Api.Contracts.MasterData;
using Pecenje.Api.Infrastructure.Sqlite;
using Dapper;

namespace Pecenje.Api.Infrastructure.Demo;

public sealed class InMemoryTermStore
{
    private readonly LocalAppDb localAppDb;

    public InMemoryTermStore(LocalAppDb localAppDb)
    {
        this.localAppDb = localAppDb;
        SeedDefaults();
    }

    public IReadOnlyList<TermEntryDto> GetAll()
    {
        using var connection = localAppDb.CreateConnection();
        connection.Open();
        return connection.Query<TermEntryDto>(
            """
            SELECT Id, Label, Time, IsActive
            FROM Terms
            ORDER BY Time
            """).ToArray();
    }

    public IReadOnlyList<TermEntryDto> ReplaceAll(IReadOnlyList<TermEntryDto> entries)
    {
        using var connection = localAppDb.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        connection.Execute("DELETE FROM Terms", transaction: transaction);
        foreach (var entry in entries.OrderBy(entry => entry.Time))
        {
            connection.Execute(
                "INSERT INTO Terms (Id, Label, Time, IsActive) VALUES (@Id, @Label, @Time, @IsActive)",
                new { entry.Id, entry.Label, entry.Time, IsActive = entry.IsActive ? 1 : 0 },
                transaction);
        }

        transaction.Commit();
        return GetAll();
    }

    private void SeedDefaults()
    {
        using var connection = localAppDb.CreateConnection();
        connection.Open();
        var count = connection.ExecuteScalar<long>("SELECT COUNT(1) FROM Terms");
        if (count > 0)
        {
            return;
        }

        connection.Execute(
            """
            INSERT INTO Terms (Id, Label, Time, IsActive) VALUES
            ('term-0600', 'Утрински', '06:00', 1),
            ('term-1000', 'Претпладне', '10:00', 1),
            ('term-1400', 'Попладне', '14:00', 1)
            """);
    }
}
