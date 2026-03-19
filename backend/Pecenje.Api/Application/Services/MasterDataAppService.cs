using Pecenje.Api.Application.Validation;
using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.MasterData;
using Pecenje.Api.Services;

namespace Pecenje.Api.Application.Services;

public sealed class MasterDataAppService(
    IMasterDataRepository repository,
    ISourceMasterDataReader sourceReader,
    IAuditService auditService)
{
    public async Task<IReadOnlyList<LocationDto>> GetLocationsAsync(CancellationToken cancellationToken = default)
    {
        if (sourceReader is null)
        {
            return await repository.GetLocationsAsync(cancellationToken);
        }

        var sourceRows = await sourceReader.ReadLocationsAsync(cancellationToken);
        return sourceRows
            .Select((row, index) => new LocationDto(
                ParseId(row.SourceLocationId, index + 1),
                row.Code,
                NormalizeDisplayText(row.NameMk),
                NormalizeDisplayText(row.RegionCode),
                row.IsActive))
            .ToArray();
    }

    public async Task<IReadOnlyList<ItemDto>> GetItemsAsync(CancellationToken cancellationToken = default)
    {
        if (sourceReader is null)
        {
            return await repository.GetItemsAsync(cancellationToken);
        }

        var sourceRows = await sourceReader.ReadItemsAsync(cancellationToken);
        return sourceRows
            .Select((row, index) => new ItemDto(
                ParseId(row.SourceItemId, index + 1),
                row.Code,
                NormalizeDisplayText(row.NameMk),
                row.GroupCode,
                NormalizeGroupName(row.GroupCode, row.GroupName),
                row.SalesPrice,
                5,
                row.IsActive))
            .ToArray();
    }

    public async Task<LocationDto> CreateLocationAsync(UpsertLocationRequest request, CancellationToken cancellationToken = default)
    {
        ValidateOrThrow(request);
        var result = await repository.CreateLocationAsync(request, cancellationToken);
        await auditService.LogAsync("Location", "create", result.LocationId.ToString(), request, cancellationToken);
        return result;
    }

    public async Task<LocationDto> UpdateLocationAsync(int locationId, UpsertLocationRequest request, CancellationToken cancellationToken = default)
    {
        ValidateOrThrow(request);
        var result = await repository.UpdateLocationAsync(locationId, request, cancellationToken);
        await auditService.LogAsync("Location", "update", result.LocationId.ToString(), request, cancellationToken);
        return result;
    }

    public async Task<ItemDto> CreateItemAsync(UpsertItemRequest request, CancellationToken cancellationToken = default)
    {
        ValidateOrThrow(request);
        var result = await repository.CreateItemAsync(request, cancellationToken);
        await auditService.LogAsync("Item", "create", result.ItemId.ToString(), request, cancellationToken);
        return result;
    }

    public async Task<ItemDto> UpdateItemAsync(int itemId, UpsertItemRequest request, CancellationToken cancellationToken = default)
    {
        ValidateOrThrow(request);
        var result = await repository.UpdateItemAsync(itemId, request, cancellationToken);
        await auditService.LogAsync("Item", "update", result.ItemId.ToString(), request, cancellationToken);
        return result;
    }

    private static void ValidateOrThrow(UpsertLocationRequest request)
    {
        var error = MasterDataValidator.Validate(request);
        if (error is not null)
        {
            throw new ArgumentException(error);
        }
    }

    private static void ValidateOrThrow(UpsertItemRequest request)
    {
        var error = MasterDataValidator.Validate(request);
        if (error is not null)
        {
            throw new ArgumentException(error);
        }
    }

    private static int ParseId(string value, int fallback)
        => int.TryParse(value, out var parsed) ? parsed : fallback;

    private static string NormalizeGroupName(string? groupCode, string? groupName)
    {
        var normalized = NormalizeDisplayText(groupName).Trim();
        if (!string.IsNullOrWhiteSpace(normalized) && !IsUnreadable(normalized))
        {
            return normalized;
        }

        return (groupCode ?? string.Empty).Trim() switch
        {
            "260" => "Пекара",
            "251" => "Печењара",
            "220" => "Пијара 220",
            "221" => "Пијара 221",
            var code when !string.IsNullOrWhiteSpace(code) => $"Група {code}",
            _ => "Некатегоризирано"
        };
    }

    private static bool IsUnreadable(string value)
    {
        var punctuationCount = value.Count(character => character is '?' or '^');
        return punctuationCount >= Math.Max(3, value.Length / 3);
    }

    private static string NormalizeDisplayText(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return value ?? string.Empty;
        }

        var repaired = value
            .Replace('^', 'Ч')
            .Replace('@', 'Ж')
            .Replace('[', 'Ш')
            .Replace(']', 'Ѓ')
            .Replace('\\', 'Ќ')
            .Replace('{', 'ш')
            .Replace('}', 'ѓ')
            .Replace('|', 'ќ');

        return ToCyrillic(repaired).Trim();
    }

    private static string ToCyrillic(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return value ?? string.Empty;
        }

        var result = value
            .Replace("Dzh", "Џ").Replace("DZh", "Џ").Replace("dzh", "џ")
            .Replace("Lj", "Љ").Replace("LJ", "Љ").Replace("lj", "љ")
            .Replace("Nj", "Њ").Replace("NJ", "Њ").Replace("nj", "њ")
            .Replace("Zh", "Ж").Replace("ZH", "Ж").Replace("zh", "ж")
            .Replace("Ch", "Ч").Replace("CH", "Ч").Replace("ch", "ч")
            .Replace("Sh", "Ш").Replace("SH", "Ш").Replace("sh", "ш")
            .Replace("Gj", "Ѓ").Replace("GJ", "Ѓ").Replace("gj", "ѓ")
            .Replace("Kj", "Ќ").Replace("KJ", "Ќ").Replace("kj", "ќ")
            .Replace("Dz", "Ѕ").Replace("DZ", "Ѕ").Replace("dz", "ѕ");

        return string.Concat(result.Select(MapCharacter));
    }

    private static string MapCharacter(char value) => value switch
    {
        'A' => "А",
        'B' => "Б",
        'V' => "В",
        'G' => "Г",
        'D' => "Д",
        'E' => "Е",
        'Z' => "З",
        'I' => "И",
        'J' => "Ј",
        'K' => "К",
        'L' => "Л",
        'M' => "М",
        'N' => "Н",
        'O' => "О",
        'P' => "П",
        'R' => "Р",
        'S' => "С",
        'T' => "Т",
        'U' => "У",
        'F' => "Ф",
        'H' => "Х",
        'C' => "Ц",
        'a' => "а",
        'b' => "б",
        'v' => "в",
        'g' => "г",
        'd' => "д",
        'e' => "е",
        'z' => "з",
        'i' => "и",
        'j' => "ј",
        'k' => "к",
        'l' => "л",
        'm' => "м",
        'n' => "н",
        'o' => "о",
        'p' => "п",
        'r' => "р",
        's' => "с",
        't' => "т",
        'u' => "у",
        'f' => "ф",
        'h' => "х",
        'c' => "ц",
        'Q' => "Љ",
        'q' => "љ",
        'W' => "Њ",
        'w' => "њ",
        'X' => "Џ",
        'x' => "џ",
        'Y' => "У",
        'y' => "у",
        _ => value.ToString()
    };
}
