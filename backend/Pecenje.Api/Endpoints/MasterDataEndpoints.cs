using Pecenje.Api.Application.Services;
using Pecenje.Api.Contracts.Common;
using Pecenje.Api.Contracts.MasterData;
using System.Net;

namespace Pecenje.Api.Endpoints;

public static class MasterDataEndpoints
{
    public static IEndpointRouteBuilder MapMasterDataEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/master-data").WithTags("MasterData");

        group.MapGet("/locations", async (MasterDataAppService appService, CancellationToken cancellationToken) => Results.Ok(
            new ApiEnvelope<IReadOnlyList<LocationDto>>(await appService.GetLocationsAsync(cancellationToken))));

        group.MapGet("/items", async (MasterDataAppService appService, CancellationToken cancellationToken) => Results.Ok(
            new ApiEnvelope<IReadOnlyList<ItemDto>>(await appService.GetItemsAsync(cancellationToken))));

        group.MapPost("/locations", async (UpsertLocationRequest request, MasterDataAppService appService, CancellationToken cancellationToken) =>
        {
            try
            {
                var result = await appService.CreateLocationAsync(request, cancellationToken);
                return Results.Created($"/api/v1/master-data/locations/{result.LocationId}", new ApiEnvelope<LocationDto>(result));
            }
            catch (ArgumentException ex)
            {
                return Results.Json(
                    new ApiEnvelope<object>(
                        new { },
                        Errors: new[] { new ApiError("VALIDATION_ERROR", ex.Message) }),
                    statusCode: (int)HttpStatusCode.BadRequest);
            }
        });

        group.MapPut("/locations/{locationId:int}", async (int locationId, UpsertLocationRequest request, MasterDataAppService appService, CancellationToken cancellationToken) =>
        {
            try
            {
                return Results.Ok(new ApiEnvelope<LocationDto>(await appService.UpdateLocationAsync(locationId, request, cancellationToken)));
            }
            catch (ArgumentException ex)
            {
                return Results.Json(
                    new ApiEnvelope<object>(
                        new { },
                        Errors: new[] { new ApiError("VALIDATION_ERROR", ex.Message) }),
                    statusCode: (int)HttpStatusCode.BadRequest);
            }
        });

        group.MapPost("/items", async (UpsertItemRequest request, MasterDataAppService appService, CancellationToken cancellationToken) =>
        {
            try
            {
                var result = await appService.CreateItemAsync(request, cancellationToken);
                return Results.Created($"/api/v1/master-data/items/{result.ItemId}", new ApiEnvelope<ItemDto>(result));
            }
            catch (ArgumentException ex)
            {
                return Results.Json(
                    new ApiEnvelope<object>(
                        new { },
                        Errors: new[] { new ApiError("VALIDATION_ERROR", ex.Message) }),
                    statusCode: (int)HttpStatusCode.BadRequest);
            }
        });

        group.MapPut("/items/{itemId:int}", async (int itemId, UpsertItemRequest request, MasterDataAppService appService, CancellationToken cancellationToken) =>
        {
            try
            {
                return Results.Ok(new ApiEnvelope<ItemDto>(await appService.UpdateItemAsync(itemId, request, cancellationToken)));
            }
            catch (ArgumentException ex)
            {
                return Results.Json(
                    new ApiEnvelope<object>(
                        new { },
                        Errors: new[] { new ApiError("VALIDATION_ERROR", ex.Message) }),
                    statusCode: (int)HttpStatusCode.BadRequest);
            }
        });

        return app;
    }
}
