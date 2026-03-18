namespace Pecenje.Api.Infrastructure.SqlServer.SqlQueries;

public static class SourceSyncSql
{
    public const string ReadLocationsFromOrged = """
        SELECT
            CAST(Sifra_Oe AS nvarchar(100)) AS SourceLocationId,
            CAST(Sifra_Oe AS nvarchar(50)) AS Code,
            CAST(ImeOrg AS nvarchar(200)) AS NameMk,
            CAST('DEFAULT' AS nvarchar(50)) AS RegionCode,
            CAST(1 AS bit) AS IsActive
        FROM dbo.orged
        ORDER BY ImeOrg;
        """;

    public const string ReadItemsFromKatart = """
        SELECT
            CAST(Sifra_Art AS nvarchar(100)) AS SourceItemId,
            CAST(Sifra_Art AS nvarchar(50)) AS Code,
            CAST(ImeArt AS nvarchar(200)) AS NameMk,
            CAST('Некатегоризирано' AS nvarchar(100)) AS GroupName,
            CAST(0 AS decimal(18,2)) AS SalesPrice,
            CAST(1 AS bit) AS IsActive
        FROM dbo.katart
        ORDER BY ImeArt;
        """;
}
