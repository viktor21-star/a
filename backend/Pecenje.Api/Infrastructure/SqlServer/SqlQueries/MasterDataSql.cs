namespace Pecenje.Api.Infrastructure.SqlServer.SqlQueries;

public static class MasterDataSql
{
    public const string GetLocations = """
        SELECT
            LocationId,
            Code,
            NameMk,
            RegionCode,
            IsActive
        FROM dbo.Locations
        ORDER BY NameMk;
        """;

    public const string CreateLocation = """
        INSERT INTO dbo.Locations (Code, NameMk, RegionCode, IsActive)
        OUTPUT INSERTED.LocationId, INSERTED.Code, INSERTED.NameMk, INSERTED.RegionCode, INSERTED.IsActive
        VALUES (@Code, @NameMk, @RegionCode, @IsActive);
        """;

    public const string UpdateLocation = """
        UPDATE dbo.Locations
        SET
            Code = @Code,
            NameMk = @NameMk,
            RegionCode = @RegionCode,
            IsActive = @IsActive
        OUTPUT INSERTED.LocationId, INSERTED.Code, INSERTED.NameMk, INSERTED.RegionCode, INSERTED.IsActive
        WHERE LocationId = @LocationId;
        """;

    public const string GetItems = """
        SELECT
            i.ItemId,
            i.Code,
            i.NameMk,
            g.NameMk AS GroupName,
            i.SalesPrice,
            i.WasteLimitPct,
            i.IsActive
        FROM dbo.Items i
        INNER JOIN dbo.ItemGroups g ON g.ItemGroupId = i.ItemGroupId
        ORDER BY i.NameMk;
        """;

    public const string CreateItem = """
        INSERT INTO dbo.Items (Code, NameMk, ItemGroupId, SalesPrice, WasteLimitPct, IsActive)
        OUTPUT
            INSERTED.ItemId,
            INSERTED.Code,
            INSERTED.NameMk,
            @GroupName AS GroupName,
            INSERTED.SalesPrice,
            INSERTED.WasteLimitPct,
            INSERTED.IsActive
        VALUES (@Code, @NameMk, @ItemGroupId, @SalesPrice, @WasteLimitPct, @IsActive);
        """;

    public const string UpdateItem = """
        UPDATE dbo.Items
        SET
            Code = @Code,
            NameMk = @NameMk,
            ItemGroupId = @ItemGroupId,
            SalesPrice = @SalesPrice,
            WasteLimitPct = @WasteLimitPct,
            IsActive = @IsActive
        OUTPUT
            INSERTED.ItemId,
            INSERTED.Code,
            INSERTED.NameMk,
            @GroupName AS GroupName,
            INSERTED.SalesPrice,
            INSERTED.WasteLimitPct,
            INSERTED.IsActive
        WHERE ItemId = @ItemId;
        """;

    public const string ResolveItemGroupId = """
        SELECT TOP (1) ItemGroupId
        FROM dbo.ItemGroups
        WHERE NameMk = @GroupName;
        """;
}
