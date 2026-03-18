using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.MasterData;
using Pecenje.Api.Infrastructure.SqlServer.SqlQueries;
using Dapper;

namespace Pecenje.Api.Infrastructure.SqlServer;

public sealed class SqlServerMasterDataRepository(IAppSqlConnectionFactory connectionFactory) : IMasterDataRepository
{
    public async Task<IReadOnlyList<LocationDto>> GetLocationsAsync(CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();
        var rows = await connection.QueryAsync<LocationDto>(new CommandDefinition(
            MasterDataSql.GetLocations,
            cancellationToken: cancellationToken));
        return rows.AsList();
    }

    public async Task<IReadOnlyList<ItemDto>> GetItemsAsync(CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();
        var rows = await connection.QueryAsync<ItemDto>(new CommandDefinition(
            MasterDataSql.GetItems,
            cancellationToken: cancellationToken));
        return rows.AsList();
    }

    public Task<LocationDto> CreateLocationAsync(UpsertLocationRequest request, CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();
        return connection.QuerySingleAsync<LocationDto>(new CommandDefinition(
            MasterDataSql.CreateLocation,
            request,
            cancellationToken: cancellationToken));
    }

    public Task<LocationDto> UpdateLocationAsync(int locationId, UpsertLocationRequest request, CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();
        return connection.QuerySingleAsync<LocationDto>(new CommandDefinition(
            MasterDataSql.UpdateLocation,
            new
            {
                LocationId = locationId,
                request.Code,
                request.NameMk,
                request.RegionCode,
                request.IsActive
            },
            cancellationToken: cancellationToken));
    }

    public async Task<ItemDto> CreateItemAsync(UpsertItemRequest request, CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();
        var itemGroupId = await ResolveItemGroupIdAsync(connection, request.GroupName, cancellationToken);

        return await connection.QuerySingleAsync<ItemDto>(new CommandDefinition(
            MasterDataSql.CreateItem,
            new
            {
                request.Code,
                request.NameMk,
                ItemGroupId = itemGroupId,
                request.GroupName,
                request.SalesPrice,
                request.WasteLimitPct,
                request.IsActive
            },
            cancellationToken: cancellationToken));
    }

    public async Task<ItemDto> UpdateItemAsync(int itemId, UpsertItemRequest request, CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();
        var itemGroupId = await ResolveItemGroupIdAsync(connection, request.GroupName, cancellationToken);

        return await connection.QuerySingleAsync<ItemDto>(new CommandDefinition(
            MasterDataSql.UpdateItem,
            new
            {
                ItemId = itemId,
                request.Code,
                request.NameMk,
                ItemGroupId = itemGroupId,
                request.GroupName,
                request.SalesPrice,
                request.WasteLimitPct,
                request.IsActive
            },
            cancellationToken: cancellationToken));
    }

    private static async Task<int> ResolveItemGroupIdAsync(
        System.Data.IDbConnection connection,
        string groupName,
        CancellationToken cancellationToken)
    {
        var itemGroupId = await connection.ExecuteScalarAsync<int?>(new CommandDefinition(
            MasterDataSql.ResolveItemGroupId,
            new { GroupName = groupName },
            cancellationToken: cancellationToken));

        if (itemGroupId is null)
        {
            throw new InvalidOperationException($"Missing ItemGroup for '{groupName}'.");
        }

        return itemGroupId.Value;
    }
}
