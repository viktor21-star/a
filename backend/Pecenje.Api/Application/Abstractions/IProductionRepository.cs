using Pecenje.Api.Contracts.Production;
using Pecenje.Api.Contracts.Waste;
using Pecenje.Api.Contracts.Common;

namespace Pecenje.Api.Application.Abstractions;

public interface IProductionRepository
{
    Task<IReadOnlyList<BatchDetailDto>> GetActiveBatchesAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<WasteSummaryDto>> GetRecentWasteAsync(CancellationToken cancellationToken = default);
    Task<WasteSummaryDto> CreateWasteEntryAsync(CreateWasteEntryRequest request, string operatorName, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<OperatorEntryDto>> GetOperatorEntriesAsync(CancellationToken cancellationToken = default);
    Task<OperatorEntryDto> CreateOperatorEntryAsync(CreateOperatorEntryRequest request, long userId, string operatorName, CancellationToken cancellationToken = default);
    Task<PhotoAssetDto?> GetOperatorEntryPhotoAsync(string entryId, CancellationToken cancellationToken = default);
    Task<PhotoAssetDto?> GetWastePhotoAsync(long wasteEntryId, CancellationToken cancellationToken = default);
}
