using Dapper;
using Microsoft.Data.Sqlite;

namespace Pecenje.Api.Infrastructure.Sqlite;

public sealed class LocalAppDb
{
    private readonly string connectionString;

    public LocalAppDb(IHostEnvironment environment)
    {
        var dataDirectory = Path.Combine(environment.ContentRootPath, "App_Data");
        Directory.CreateDirectory(dataDirectory);

        var databasePath = Path.Combine(dataDirectory, "pecenje-local.db");
        connectionString = new SqliteConnectionStringBuilder
        {
            DataSource = databasePath,
            ForeignKeys = true
        }.ToString();

        EnsureCreated();
    }

    public SqliteConnection CreateConnection() => new(connectionString);

    private void EnsureCreated()
    {
        using var connection = CreateConnection();
        connection.Open();
        connection.Execute(
            """
            CREATE TABLE IF NOT EXISTS ManualPlans (
                PlanHeaderId INTEGER PRIMARY KEY AUTOINCREMENT,
                PlanDate TEXT NOT NULL,
                LocationId INTEGER NOT NULL,
                LocationName TEXT NOT NULL,
                ShiftName TEXT NOT NULL,
                TermLabel TEXT NOT NULL,
                ItemName TEXT NOT NULL,
                SuggestedQty REAL NOT NULL,
                CorrectedQty REAL NOT NULL,
                Mode TEXT NOT NULL,
                Status TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS OperatorEntries (
                Id TEXT PRIMARY KEY,
                Mode TEXT NOT NULL,
                LocationId INTEGER NOT NULL,
                LocationName TEXT NOT NULL,
                Note TEXT NOT NULL,
                PhotoDataUrl TEXT NOT NULL,
                PhotoName TEXT NOT NULL,
                CreatedAt TEXT NOT NULL,
                UserId INTEGER NOT NULL,
                OperatorName TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS OperatorEntryItems (
                EntryId TEXT NOT NULL,
                ItemIndex INTEGER NOT NULL,
                ItemName TEXT NOT NULL,
                Quantity REAL NOT NULL,
                ClassB INTEGER NOT NULL,
                ClassBQuantity REAL NOT NULL,
                PRIMARY KEY (EntryId, ItemIndex)
            );

            CREATE TABLE IF NOT EXISTS WasteEntries (
                WasteEntryId INTEGER PRIMARY KEY AUTOINCREMENT,
                LocationId INTEGER NOT NULL,
                ItemName TEXT NOT NULL,
                Quantity REAL NOT NULL,
                Reason TEXT NOT NULL,
                LocationName TEXT NOT NULL,
                SourceMode TEXT NOT NULL,
                Note TEXT NOT NULL,
                PhotoDataUrl TEXT NOT NULL,
                PhotoName TEXT NOT NULL,
                CreatedAt TEXT NOT NULL,
                OperatorName TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS LocationOvens (
                LocationId INTEGER PRIMARY KEY,
                PekaraOvenType TEXT NOT NULL,
                PekaraOvenCount INTEGER NOT NULL,
                PekaraOvenCapacity INTEGER NOT NULL,
                PecenjaraOvenType TEXT NOT NULL,
                PecenjaraOvenCount INTEGER NOT NULL,
                PecenjaraOvenCapacity INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS Terms (
                Id TEXT PRIMARY KEY,
                Label TEXT NOT NULL,
                Time TEXT NOT NULL,
                IsActive INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS Reasons (
                Id TEXT PRIMARY KEY,
                Code TEXT NOT NULL,
                Name TEXT NOT NULL,
                Category TEXT NOT NULL,
                IsActive INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS LocalUsers (
                UserId INTEGER PRIMARY KEY,
                Username TEXT NOT NULL UNIQUE,
                FullName TEXT NOT NULL,
                PasswordHash TEXT NOT NULL,
                RoleCode TEXT NOT NULL,
                DefaultLocationId INTEGER NULL,
                IsActive INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS LocalUserLocations (
                UserId INTEGER NOT NULL,
                LocationId INTEGER NOT NULL,
                LocationName TEXT NOT NULL,
                CanPlan INTEGER NOT NULL,
                CanBake INTEGER NOT NULL,
                CanRecordWaste INTEGER NOT NULL,
                CanViewReports INTEGER NOT NULL,
                CanApprovePlan INTEGER NOT NULL,
                CanUsePekara INTEGER NOT NULL,
                CanUsePecenjara INTEGER NOT NULL,
                CanUsePijara INTEGER NOT NULL,
                PekaraOvenType TEXT NULL,
                PecenjaraOvenType TEXT NULL,
                PRIMARY KEY (UserId, LocationId)
            );
            """);

        EnsureColumn(connection, "LocalUsers", "DefaultLocationId", "INTEGER NULL");
        EnsureColumn(connection, "LocalUserLocations", "CanRecordWaste", "INTEGER NOT NULL DEFAULT 0");
        EnsureColumn(connection, "LocalUserLocations", "CanUsePekara", "INTEGER NOT NULL DEFAULT 0");
        EnsureColumn(connection, "LocalUserLocations", "CanUsePecenjara", "INTEGER NOT NULL DEFAULT 0");
        EnsureColumn(connection, "LocalUserLocations", "CanUsePijara", "INTEGER NOT NULL DEFAULT 0");
        EnsureColumn(connection, "LocalUserLocations", "PekaraOvenType", "TEXT NULL");
        EnsureColumn(connection, "LocalUserLocations", "PecenjaraOvenType", "TEXT NULL");
        EnsureColumn(connection, "WasteEntries", "SourceMode", "TEXT NOT NULL DEFAULT 'pekara'");
        EnsureColumn(connection, "WasteEntries", "Note", "TEXT NOT NULL DEFAULT ''");
        EnsureColumn(connection, "WasteEntries", "PhotoDataUrl", "TEXT NOT NULL DEFAULT ''");
        EnsureColumn(connection, "WasteEntries", "PhotoName", "TEXT NOT NULL DEFAULT ''");
        EnsureColumn(connection, "WasteEntries", "CreatedAt", "TEXT NOT NULL DEFAULT ''");
        EnsureColumn(connection, "WasteEntries", "OperatorName", "TEXT NOT NULL DEFAULT ''");
    }

    private static void EnsureColumn(SqliteConnection connection, string tableName, string columnName, string columnDefinition)
    {
        using var command = connection.CreateCommand();
        command.CommandText = $"PRAGMA table_info({tableName})";

        var columns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        using (var reader = command.ExecuteReader())
        {
            while (reader.Read())
            {
                var ordinal = reader.GetOrdinal("name");
                columns.Add(reader.GetString(ordinal));
            }
        }

        if (columns.Contains(columnName))
        {
            return;
        }

        connection.Execute($"ALTER TABLE {tableName} ADD COLUMN {columnName} {columnDefinition}");
    }
}
