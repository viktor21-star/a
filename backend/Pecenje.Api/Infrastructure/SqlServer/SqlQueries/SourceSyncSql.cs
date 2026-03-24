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
        DECLARE @subgroupColumn nvarchar(128) = NULL;

        IF COL_LENGTH('dbo.katart', 'Sifra_Podg') IS NOT NULL SET @subgroupColumn = 'Sifra_Podg';
        ELSE IF COL_LENGTH('dbo.katart', 'SifPodg') IS NOT NULL SET @subgroupColumn = 'SifPodg';
        ELSE IF COL_LENGTH('dbo.katart', 'Podgrupa') IS NOT NULL SET @subgroupColumn = 'Podgrupa';

        DECLARE @podgrupiSubgroupColumn nvarchar(128) = NULL;

        IF COL_LENGTH('dbo.podgrupi', 'Sifra_Podg') IS NOT NULL SET @podgrupiSubgroupColumn = 'Sifra_Podg';
        ELSE IF COL_LENGTH('dbo.podgrupi', 'SifPodg') IS NOT NULL SET @podgrupiSubgroupColumn = 'SifPodg';
        ELSE IF COL_LENGTH('dbo.podgrupi', 'Podgrupa') IS NOT NULL SET @podgrupiSubgroupColumn = 'Podgrupa';

        DECLARE @podgrupiGroupColumn nvarchar(128) = NULL;

        IF COL_LENGTH('dbo.podgrupi', 'Sifra_Gr') IS NOT NULL SET @podgrupiGroupColumn = 'Sifra_Gr';
        ELSE IF COL_LENGTH('dbo.podgrupi', 'SifGrupa') IS NOT NULL SET @podgrupiGroupColumn = 'SifGrupa';
        ELSE IF COL_LENGTH('dbo.podgrupi', 'Grupa') IS NOT NULL SET @podgrupiGroupColumn = 'Grupa';

        DECLARE @podgrupiNameColumn nvarchar(128) = NULL;

        IF COL_LENGTH('dbo.podgrupi', 'ImePodg') IS NOT NULL SET @podgrupiNameColumn = 'ImePodg';
        ELSE IF COL_LENGTH('dbo.podgrupi', 'NazivPodg') IS NOT NULL SET @podgrupiNameColumn = 'NazivPodg';
        ELSE IF COL_LENGTH('dbo.podgrupi', 'PodgrupaNaziv') IS NOT NULL SET @podgrupiNameColumn = 'PodgrupaNaziv';

        DECLARE @fallbackGroupColumn nvarchar(128) = NULL;

        IF COL_LENGTH('dbo.katart', 'Sifra_Gr') IS NOT NULL SET @fallbackGroupColumn = 'Sifra_Gr';
        ELSE IF COL_LENGTH('dbo.katart', 'Grupa') IS NOT NULL SET @fallbackGroupColumn = 'Grupa';
        ELSE IF COL_LENGTH('dbo.katart', 'Grupa_Art') IS NOT NULL SET @fallbackGroupColumn = 'Grupa_Art';
        ELSE IF COL_LENGTH('dbo.katart', 'SifGrupa') IS NOT NULL SET @fallbackGroupColumn = 'SifGrupa';

        DECLARE @fallbackGroupNameColumn nvarchar(128) = NULL;

        IF COL_LENGTH('dbo.katart', 'ImeGrupa') IS NOT NULL SET @fallbackGroupNameColumn = 'ImeGrupa';
        ELSE IF COL_LENGTH('dbo.katart', 'NazivGrupa') IS NOT NULL SET @fallbackGroupNameColumn = 'NazivGrupa';
        ELSE IF COL_LENGTH('dbo.katart', 'GrupaNaziv') IS NOT NULL SET @fallbackGroupNameColumn = 'GrupaNaziv';

        DECLARE @optItemColumn nvarchar(128) = NULL;
        DECLARE @optLocationColumn nvarchar(128) = NULL;
        DECLARE @optAllowedColumn nvarchar(128) = NULL;

        IF OBJECT_ID('dbo.optzalpooe') IS NOT NULL
        BEGIN
            IF COL_LENGTH('dbo.optzalpooe', 'Sifra_Art') IS NOT NULL SET @optItemColumn = 'Sifra_Art';
            ELSE IF COL_LENGTH('dbo.optzalpooe', 'SifArt') IS NOT NULL SET @optItemColumn = 'SifArt';
            ELSE IF COL_LENGTH('dbo.optzalpooe', 'Artikal') IS NOT NULL SET @optItemColumn = 'Artikal';

            IF COL_LENGTH('dbo.optzalpooe', 'Sifra_Oe') IS NOT NULL SET @optLocationColumn = 'Sifra_Oe';
            ELSE IF COL_LENGTH('dbo.optzalpooe', 'SifOe') IS NOT NULL SET @optLocationColumn = 'SifOe';
            ELSE IF COL_LENGTH('dbo.optzalpooe', 'OrgEd') IS NOT NULL SET @optLocationColumn = 'OrgEd';
            ELSE IF COL_LENGTH('dbo.optzalpooe', 'Sifra_Org') IS NOT NULL SET @optLocationColumn = 'Sifra_Org';

            IF COL_LENGTH('dbo.optzalpooe', 'Dozvoleno') IS NOT NULL SET @optAllowedColumn = 'Dozvoleno';
            ELSE IF COL_LENGTH('dbo.optzalpooe', 'Dozvolen') IS NOT NULL SET @optAllowedColumn = 'Dozvolen';
            ELSE IF COL_LENGTH('dbo.optzalpooe', 'Allowed') IS NOT NULL SET @optAllowedColumn = 'Allowed';
        END

        DECLARE @sql nvarchar(max) = N'
            SELECT
                CAST(k.Sifra_Art AS nvarchar(100)) AS SourceItemId,
                CAST(k.Sifra_Art AS nvarchar(50)) AS Code,
                CAST(k.ImeArt AS nvarchar(200)) AS NameMk,
                ' + CASE
                    WHEN @subgroupColumn IS NOT NULL AND @podgrupiSubgroupColumn IS NOT NULL AND @podgrupiGroupColumn IS NOT NULL
                      THEN N'CAST(p.' + QUOTENAME(@podgrupiGroupColumn) + N' AS nvarchar(50))'
                    WHEN @fallbackGroupColumn IS NOT NULL
                      THEN N'CAST(k.' + QUOTENAME(@fallbackGroupColumn) + N' AS nvarchar(50))'
                    ELSE N'CAST('''' AS nvarchar(50))'
                  END + N' AS GroupCode,
                ' + CASE
                    WHEN @subgroupColumn IS NOT NULL AND @podgrupiSubgroupColumn IS NOT NULL AND @podgrupiNameColumn IS NOT NULL
                      THEN N'CAST(p.' + QUOTENAME(@podgrupiNameColumn) + N' AS nvarchar(100))'
                    WHEN @fallbackGroupNameColumn IS NOT NULL
                      THEN N'CAST(k.' + QUOTENAME(@fallbackGroupNameColumn) + N' AS nvarchar(100))'
                    ELSE N'CAST(''Некатегоризирано'' AS nvarchar(100))'
                  END + N' AS GroupName,
                CAST(0 AS decimal(18,2)) AS SalesPrice,
                CAST(1 AS bit) AS IsActive,
                CAST(cb.ClassBCode AS nvarchar(50)) AS ClassBCode,
                CAST(cb.ClassBName AS nvarchar(200)) AS ClassBName,
                ' + CASE
                    WHEN @optItemColumn IS NOT NULL AND @optLocationColumn IS NOT NULL
                      THEN N'CAST(o.' + QUOTENAME(@optLocationColumn) + N' AS nvarchar(50))'
                    ELSE N'CAST(NULL AS nvarchar(50))'
                  END + N' AS AllowedLocationCode,
                ' + CASE
                    WHEN @optItemColumn IS NOT NULL AND @optAllowedColumn IS NOT NULL
                      THEN N'CAST(o.' + QUOTENAME(@optAllowedColumn) + N' AS nvarchar(10))'
                    ELSE N'CAST(NULL AS nvarchar(10))'
                  END + N' AS AllowedFlag
            FROM dbo.katart k ' +
            CASE
              WHEN @subgroupColumn IS NOT NULL AND @podgrupiSubgroupColumn IS NOT NULL
                THEN N'LEFT JOIN dbo.podgrupi p ON CAST(k.' + QUOTENAME(@subgroupColumn) + N' AS nvarchar(50)) = CAST(p.' + QUOTENAME(@podgrupiSubgroupColumn) + N' AS nvarchar(50)) '
              ELSE N''
            END +
            CASE
              WHEN @optItemColumn IS NOT NULL AND @optLocationColumn IS NOT NULL
                THEN N'LEFT JOIN dbo.optzalpooe o ON CAST(k.Sifra_Art AS nvarchar(50)) = CAST(o.' + QUOTENAME(@optItemColumn) + N' AS nvarchar(50)) '
              ELSE N''
            END +
            N'OUTER APPLY (
                SELECT TOP (1)
                    CAST(s.Sifra_Art AS nvarchar(50)) AS ClassBCode,
                    CAST(kb.ImeArt AS nvarchar(200)) AS ClassBName
                FROM dbo.sostav s
                LEFT JOIN dbo.katart kb ON CAST(kb.Sifra_Art AS nvarchar(50)) = CAST(s.Sifra_Art AS nvarchar(50))
                WHERE CAST(s.Sifra_Sur AS nvarchar(50)) = CAST(k.Sifra_Art AS nvarchar(50))
                ORDER BY CAST(s.Sifra_Art AS nvarchar(50))
            ) cb ' +
            N'WHERE ' + CASE
              WHEN @subgroupColumn IS NOT NULL AND @podgrupiSubgroupColumn IS NOT NULL AND @podgrupiGroupColumn IS NOT NULL
                THEN N'CAST(p.' + QUOTENAME(@podgrupiGroupColumn) + N' AS nvarchar(50))'
              WHEN @fallbackGroupColumn IS NOT NULL
                THEN N'CAST(k.' + QUOTENAME(@fallbackGroupColumn) + N' AS nvarchar(50))'
              ELSE N'CAST('''' AS nvarchar(50))'
            END + N' IN (''260'', ''251'', ''220'', ''221'') ' +
            N'ORDER BY k.ImeArt;';

        EXEC sp_executesql @sql;
        """;
}
