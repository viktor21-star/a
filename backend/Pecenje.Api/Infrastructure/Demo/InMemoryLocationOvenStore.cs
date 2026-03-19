using Pecenje.Api.Contracts.MasterData;
using Pecenje.Api.Infrastructure.Sqlite;
using Dapper;

namespace Pecenje.Api.Infrastructure.Demo;

public sealed class InMemoryLocationOvenStore(LocalAppDb localAppDb)
{
    public IReadOnlyList<LocationOvenConfigDto> GetAll()
    {
        using var connection = localAppDb.CreateConnection();
        connection.Open();
        return connection.Query<LocationOvenRow>(
            """
            SELECT LocationId, PekaraOvenType, PekaraOvenCount, PekaraOvenCapacity, PecenjaraOvenType, PecenjaraOvenCount, PecenjaraOvenCapacity
            FROM LocationOvens
            ORDER BY LocationId
            """)
            .Select(row => new LocationOvenConfigDto(
                row.LocationId,
                new OvenModeConfigDto(row.PekaraOvenType, row.PekaraOvenCount, row.PekaraOvenCapacity),
                new OvenModeConfigDto(row.PecenjaraOvenType, row.PecenjaraOvenCount, row.PecenjaraOvenCapacity)))
            .ToArray();
    }

    public IReadOnlyList<LocationOvenConfigDto> ReplaceAll(IReadOnlyList<LocationOvenConfigDto> entries)
    {
        using var connection = localAppDb.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        connection.Execute("DELETE FROM LocationOvens", transaction: transaction);

        foreach (var entry in entries.OrderBy(entry => entry.LocationId))
        {
            connection.Execute(
                """
                INSERT INTO LocationOvens (
                    LocationId, PekaraOvenType, PekaraOvenCount, PekaraOvenCapacity, PecenjaraOvenType, PecenjaraOvenCount, PecenjaraOvenCapacity
                ) VALUES (
                    @LocationId, @PekaraOvenType, @PekaraOvenCount, @PekaraOvenCapacity, @PecenjaraOvenType, @PecenjaraOvenCount, @PecenjaraOvenCapacity
                )
                """,
                new
                {
                    entry.LocationId,
                    PekaraOvenType = entry.Pekara.OvenType,
                    PekaraOvenCount = entry.Pekara.OvenCount,
                    PekaraOvenCapacity = entry.Pekara.OvenCapacity,
                    PecenjaraOvenType = entry.Pecenjara.OvenType,
                    PecenjaraOvenCount = entry.Pecenjara.OvenCount,
                    PecenjaraOvenCapacity = entry.Pecenjara.OvenCapacity
                },
                transaction);
        }

        transaction.Commit();
        return GetAll();
    }

    private sealed record LocationOvenRow(
        int LocationId,
        string PekaraOvenType,
        int PekaraOvenCount,
        int PekaraOvenCapacity,
        string PecenjaraOvenType,
        int PecenjaraOvenCount,
        int PecenjaraOvenCapacity);
}
