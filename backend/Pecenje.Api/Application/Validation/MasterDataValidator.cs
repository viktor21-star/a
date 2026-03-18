using Pecenje.Api.Contracts.MasterData;

namespace Pecenje.Api.Application.Validation;

public static class MasterDataValidator
{
    public static string? Validate(UpsertLocationRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Code))
        {
            return "Кодот на локација е задолжителен.";
        }

        if (string.IsNullOrWhiteSpace(request.NameMk))
        {
            return "Името на локација е задолжително.";
        }

        if (string.IsNullOrWhiteSpace(request.RegionCode))
        {
            return "Регионот е задолжителен.";
        }

        return null;
    }

    public static string? Validate(UpsertItemRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Code))
        {
            return "Кодот на артикал е задолжителен.";
        }

        if (string.IsNullOrWhiteSpace(request.NameMk))
        {
            return "Името на артикал е задолжително.";
        }

        if (string.IsNullOrWhiteSpace(request.GroupName))
        {
            return "Групата е задолжителна.";
        }

        if (request.SalesPrice < 0)
        {
            return "Цената не смее да биде негативна.";
        }

        if (request.WasteLimitPct < 0)
        {
            return "Лимитот за отпад не смее да биде негативен.";
        }

        return null;
    }
}
