using Pecenje.Api.Contracts.Production;
using Pecenje.Api.Contracts.Waste;

namespace Pecenje.Api.Application.Abstractions;

public interface IProductionRepository
{
    Task<IReadOnlyList<BatchDetailDto>> GetActiveBatchesAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<WasteSummaryDto>> GetRecentWasteAsync(CancellationToken cancellationToken = default);
}
