using Dapper;
using Pecenje.Api.Contracts.MasterData;

namespace Pecenje.Api.Infrastructure.Sqlite;

public sealed class SqliteLocationRepository(LocalAppDb localAppDb)
{
    public async Task<IReadOnlyList<LocationDto>> GetLocationsAsync(CancellationToken cancellationToken = default)
    {
        using var connection = localAppDb.CreateConnection();
        await connection.OpenAsync(cancellationToken);

        var rows = await connection.QueryAsync<LocationRow>(
            new CommandDefinition(
                """
                SELECT l.LocationId, l.Code, l.NameMk, l.RegionCode, COALESCE(s.IsActive, 0) AS IsActive
                FROM LocalLocations l
                LEFT JOIN LocalLocationStatuses s ON lower(trim(s.Code)) = lower(trim(l.Code))
                ORDER BY NameMk
                """,
                cancellationToken: cancellationToken));

        return rows
            .GroupBy(row => NormalizeLocationCode(row.Code), StringComparer.OrdinalIgnoreCase)
            .Select(group =>
                group
                    .OrderByDescending(row => row.IsActive == 1)
                    .ThenByDescending(row => row.LocationId)
                    .First())
            .Select(row => new LocationDto(row.LocationId, NormalizeLocationCode(row.Code), row.NameMk, row.RegionCode, row.IsActive == 1))
            .OrderBy(row => row.NameMk)
            .ToArray();
    }

    public async Task<LocationDto> CreateLocationAsync(UpsertLocationRequest request, CancellationToken cancellationToken = default)
    {
        using var connection = localAppDb.CreateConnection();
        await connection.OpenAsync(cancellationToken);

        var nextId = await connection.ExecuteScalarAsync<long?>(
            new CommandDefinition("SELECT COALESCE(MAX(LocationId), 0) + 1 FROM LocalLocations", cancellationToken: cancellationToken));

        return await UpsertLocationAsync((int)(nextId ?? 1), request, cancellationToken);
    }

    public async Task<LocationDto> UpsertLocationAsync(int locationId, UpsertLocationRequest request, CancellationToken cancellationToken = default)
    {
        using var connection = localAppDb.CreateConnection();
        await connection.OpenAsync(cancellationToken);

        var normalizedCode = NormalizeLocationCode(request.Code);
        var existingRow = await connection.QueryFirstOrDefaultAsync<LocationRow>(
            new CommandDefinition(
                """
                SELECT LocationId, Code, NameMk, RegionCode, IsActive
                FROM LocalLocations
                WHERE LocationId = @LocationId OR lower(trim(Code)) = lower(trim(@Code))
                ORDER BY CASE WHEN LocationId = @LocationId THEN 0 ELSE 1 END, LocationId DESC
                LIMIT 1
                """,
                new
                {
                    LocationId = locationId,
                    Code = normalizedCode
                },
                cancellationToken: cancellationToken));

        var persistedLocationId = existingRow?.LocationId ?? locationId;

        await connection.ExecuteAsync(
            new CommandDefinition(
                """
                DELETE FROM LocalLocations
                WHERE lower(trim(Code)) = lower(trim(@Code))
                  AND LocationId <> @LocationId
                """,
                new
                {
                    Code = normalizedCode,
                    LocationId = persistedLocationId
                },
                cancellationToken: cancellationToken));

        await connection.ExecuteAsync(
            new CommandDefinition(
                """
                INSERT OR REPLACE INTO LocalLocations (LocationId, Code, NameMk, RegionCode, IsActive)
                VALUES (@LocationId, @Code, @NameMk, @RegionCode, @IsActive)
                """,
                new
                {
                    LocationId = persistedLocationId,
                    Code = normalizedCode,
                    request.NameMk,
                    request.RegionCode,
                    IsActive = request.IsActive ? 1 : 0
                },
                cancellationToken: cancellationToken));

        await connection.ExecuteAsync(
            new CommandDefinition(
                """
                INSERT OR REPLACE INTO LocalLocationStatuses (Code, IsActive)
                VALUES (@Code, @IsActive)
                """,
                new
                {
                    Code = normalizedCode,
                    IsActive = request.IsActive ? 1 : 0
                },
                cancellationToken: cancellationToken));

        return new LocationDto(persistedLocationId, normalizedCode, request.NameMk, request.RegionCode, request.IsActive);
    }

    private static string NormalizeLocationCode(string? value)
    {
        var trimmed = (value ?? string.Empty).Trim();
        return int.TryParse(trimmed, out var parsed) ? parsed.ToString() : trimmed;
    }

    private sealed class LocationRow
    {
        public int LocationId { get; init; }
        public string Code { get; init; } = string.Empty;
        public string NameMk { get; init; } = string.Empty;
        public string RegionCode { get; init; } = string.Empty;
        public int IsActive { get; init; }
    }
}
